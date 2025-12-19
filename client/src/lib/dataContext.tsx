import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { fetchApi } from './api';
import {
  Transaction,
  Account,
  Category,
  RecurringPayment,
  User
} from './mockData';

// Smart categorization rules based on transaction descriptions
const getSmartCategory = (description: string, amount: number, categories: Category[]): string | undefined => {
  const desc = description.toLowerCase();

  // Find category by name patterns
  for (const category of categories) {
    const categoryName = category.name.toLowerCase();

    // Expense categories
    if (category.type === 'expense') {
      if (desc.includes('кафе') || desc.includes('ресторан') || desc.includes('макдоналд') || desc.includes('бургер') || desc.includes('пицца')) {
        return category.id; // Кафе и рестораны
      }
      if (desc.includes('жкх') || desc.includes('коммунал') || desc.includes('электричество') || desc.includes('вода') || desc.includes('газ')) {
        return category.id; // Коммуналка
      }
      if (desc.includes('транспорт') || desc.includes('метро') || desc.includes('автобус') || desc.includes('такси') || desc.includes('бензин') || desc.includes('заправка') || desc.includes('азс')) {
        return category.id; // Транспорт
      }
      if (desc.includes('развлечени') || desc.includes('кино') || desc.includes('концерт') || desc.includes('театр')) {
        return category.id; // Развлечения
      }
      if (desc.includes('жилье') || desc.includes('аренда') || desc.includes('ипотека')) {
        return category.id; // Жилье
      }
      if (desc.includes('продукт') || desc.includes('магазин') || desc.includes('покупк')) {
        return category.id; // Продукты
      }
    }

    // Income categories
    if (category.type === 'income') {
      if (desc.includes('зарплат') || desc.includes('salary')) {
        return category.id; // Зарплата
      }
      if (desc.includes('фриланс') || desc.includes('freelance')) {
        return category.id; // Фриланс
      }
    }
  }

  // Default fallback based on amount
  return undefined; // Let user select category manually if no match
};

type DataContextType = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  recurringPayments: RecurringPayment[];
  currentUser: User | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdById'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'familyId'>) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'familyId'>) => Promise<void>;
  updateCategoryLimit: (id: string, limit: number) => Promise<void>;
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => Promise<void>;
  updateRecurringPayment: (id: string, updates: Partial<RecurringPayment>) => Promise<void>;
  deleteRecurringPayment: (id: string) => Promise<void>;
  login: (userData: { id: string; username: string; firstName?: string | null; lastName?: string | null; familyId?: string | null; role?: "admin" | "member" }) => Promise<void>;
  logout: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Try to restore user from localStorage
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Failed to restore user from localStorage:', error);
      return null;
    }
  });

  const login = async (userData: { id: string; username: string; firstName?: string | null; lastName?: string | null; familyId?: string | null; role?: "admin" | "member" }) => {
    console.log('=== LOGIN FUNCTION CALLED ===');
    console.log('userData:', userData);
    console.log('userData.familyId:', userData.familyId);
    console.log('Boolean(userData.familyId):', Boolean(userData.familyId));

    const user = {
      id: userData.id,
      username: userData.username,
      avatar: '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      familyId: userData.familyId,
      role: userData.role || 'member',
    };

    console.log('Created user object:', user);

    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));

    // Load data from API if user has family
    if (userData.familyId) {
      console.log('User has family, loading data for familyId:', userData.familyId);
      await loadData(userData.familyId);
    } else {
      console.log('User has NO family, skipping data load');
    }
  };

  const loadData = async (familyId: string) => {
    try {
      const [transactionsRes, accountsRes, categoriesRes, paymentsRes] = await Promise.all([
        fetchApi(`/api/transactions/${familyId}`),
        fetchApi(`/api/accounts/${familyId}`),
        fetchApi(`/api/categories/${familyId}`),
        fetchApi(`/api/recurring-payments/${familyId}`)
      ]);

      setTransactions(transactionsRes);
      setAccounts(accountsRes);
      setCategories(categoriesRes);
      setRecurringPayments(paymentsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setTransactions([]);
    setAccounts([]);
    setCategories([]);
    setRecurringPayments([]);
  };

  // Load data when user is restored from localStorage
  useEffect(() => {
    console.log('=== USEEFFECT: checking currentUser for data loading ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser?.familyId:', currentUser?.familyId);

    if (currentUser?.familyId) {
      console.log('Loading data for restored user with familyId:', currentUser.familyId);
      loadData(currentUser.familyId);
    } else {
      console.log('No familyId for restored user, skipping data load');
    }
  }, []);

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdById'>) => {
    if (!currentUser?.familyId) return;

    // Smart categorization: automatically assign category if not provided
    const categoryId = txData.categoryId || getSmartCategory(txData.description, txData.amount, categories);

    const payload = {
      ...txData,
      categoryId,
      familyId: currentUser.familyId,
      createdById: currentUser.id,
    };

    try {
      const newTx = await fetchApi('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Add createdByName to the transaction for immediate display
      const transactionWithUser = {
        ...newTx,
        createdByName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username : 'Неизвестный'
      };

      setTransactions(prev => [transactionWithUser, ...prev]);

      // Update account balance locally
      setAccounts(prev => prev.map(acc => {
        if (acc.id === newTx.accountId) {
          let newBalance = Number(acc.balance);
          if (newTx.type === 'expense') newBalance -= Number(newTx.amount);
          if (newTx.type === 'income') newBalance += Number(newTx.amount);
          return { ...acc, balance: newBalance };
        }
        return acc;
      }));
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAcc = await fetchApi(`/api/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAcc : acc));
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id' | 'familyId'>) => {
    if (!currentUser?.familyId) return;

    const payload = {
      ...accountData,
      familyId: currentUser.familyId,
    };

    try {
      const newAcc = await fetchApi('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAccounts(prev => [...prev, newAcc]);
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'familyId'>) => {
    if (!currentUser?.familyId) return;

    const payload = {
      ...categoryData,
      familyId: currentUser.familyId,
    };

    try {
      const newCategory = await fetchApi('/api/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  const updateCategoryLimit = async (id: string, limit: number) => {
    try {
      await fetchApi(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ budgetLimit: limit.toString() }),
      });
      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, budgetLimit: limit } : cat));
    } catch (error) {
      console.error('Failed to update category limit:', error);
      throw error;
    }
  };

  const addRecurringPayment = async (paymentData: Omit<RecurringPayment, 'id' | 'createdById'>) => {
    if (!currentUser?.familyId) return;

    const payload = {
      ...paymentData,
      familyId: currentUser.familyId,
      createdById: currentUser.id,
    };

    try {
      const newPayment = await fetchApi('/api/recurring-payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Add createdByName to the payment for immediate display
      const paymentWithUser = {
        ...newPayment,
        createdByName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username : 'Неизвестный'
      };

      setRecurringPayments(prev => [...prev, paymentWithUser]);
    } catch (error) {
      console.error('Failed to add recurring payment:', error);
      throw error;
    }
  };

  const updateRecurringPayment = async (id: string, updates: Partial<RecurringPayment>) => {
    try {
      const updatedPayment = await fetchApi(`/api/recurring-payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setRecurringPayments(prev => prev.map(rp => rp.id === id ? updatedPayment : rp));
    } catch (error) {
      console.error('Failed to update recurring payment:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTx = await fetchApi(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setTransactions(prev => prev.map(tx => tx.id === id ? updatedTx : tx));
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await fetchApi(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await fetchApi(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const deleteRecurringPayment = async (id: string) => {
    try {
      await fetchApi(`/api/recurring-payments/${id}`, {
        method: 'DELETE',
      });
      setRecurringPayments(prev => prev.filter(rp => rp.id !== id));
    } catch (error) {
      console.error('Failed to delete recurring payment:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      transactions,
      accounts,
      categories,
      recurringPayments,
      currentUser,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateAccount,
      deleteAccount,
      addAccount,
      addCategory,
      updateCategoryLimit,
      addRecurringPayment,
      updateRecurringPayment,
      deleteRecurringPayment,
      login,
      logout
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
