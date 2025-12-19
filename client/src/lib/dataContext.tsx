import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Transaction,
  Account,
  Category,
  RecurringPayment,
  transactions as initialTransactions,
  accounts as initialAccounts,
  categories as initialCategories,
  recurringPayments as initialRecurringPayments,
  currentUser as initialUser,
  User
} from './mockData';

// Smart categorization rules based on transaction descriptions
const getSmartCategory = (description: string, amount: number): string => {
  const desc = description.toLowerCase();

  // Expense categories
  if (desc.includes('кафе') || desc.includes('ресторан') || desc.includes('макдоналд') || desc.includes('бургер') || desc.includes('пицца')) {
    return 'c2'; // Кафе и рестораны
  }
  if (desc.includes('продукт') || desc.includes('магазин') || desc.includes('супермаркет') || desc.includes('пятерочка') || desc.includes('магнит')) {
    return 'c1'; // Продукты
  }
  if (desc.includes('жкх') || desc.includes('коммунал') || desc.includes('электричество') || desc.includes('вода') || desc.includes('газ')) {
    return 'c8'; // Коммуналка
  }
  if (desc.includes('транспорт') || desc.includes('метро') || desc.includes('автобус') || desc.includes('такси') || desc.includes('бензин')) {
    return 'c4'; // Транспорт
  }
  if (desc.includes('развлечени') || desc.includes('кино') || desc.includes('концерт') || desc.includes('театр')) {
    return 'c5'; // Развлечения
  }
  if (desc.includes('жилье') || desc.includes('аренда') || desc.includes('ипотека')) {
    return 'c3'; // Жилье
  }

  // Income categories
  if (desc.includes('зарплат') || desc.includes('salary')) {
    return 'c6'; // Зарплата
  }
  if (desc.includes('фриланс') || desc.includes('freelance')) {
    return 'c7'; // Фриланс
  }

  // Default fallback based on amount
  return amount > 0 ? 'c6' : 'c1'; // Default to salary for income, products for expenses
};

type DataContextType = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  recurringPayments: RecurringPayment[];
  currentUser: User | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdById'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateCategoryLimit: (id: string, limit: number) => void;
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
  updateRecurringPayment: (id: string, updates: Partial<RecurringPayment>) => void;
  deleteRecurringPayment: (id: string) => void;
  login: (userData: { username: string; firstName?: string; lastName?: string; familyId?: string | null; role?: "admin" | "member" }) => void;
  logout: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(initialRecurringPayments);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Start with no user to show auth page

  const login = (userData: { username: string; firstName?: string; lastName?: string; familyId?: string | null; role?: "admin" | "member" }) => {
    // Mock login with full user data
    // Preserve existing data for the same user, but allow role and family updates
    if (userData.username === currentUser?.username) {
      // Same user logging in again, preserve their data but update role/family if changed
      setCurrentUser({
        ...currentUser,
        familyId: userData.familyId || currentUser.familyId,
        role: userData.role || currentUser.role,
        firstName: userData.firstName || currentUser.firstName,
        lastName: userData.lastName || currentUser.lastName,
      });
    } else {
      // New user logging in
      setCurrentUser({
        ...initialUser,
        username: userData.username,
        firstName: userData.firstName || initialUser.firstName,
        lastName: userData.lastName || initialUser.lastName,
        familyId: userData.familyId || initialUser.familyId,
        role: userData.role || initialUser.role,
      });
      // For new users, keep existing demo data instead of clearing everything
      // This maintains a consistent experience for testing
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdById'>) => {
    // Smart categorization: automatically assign category if not provided
    const categoryId = txData.categoryId || getSmartCategory(txData.description, txData.amount);

    const newTx: Transaction = {
      ...txData,
      categoryId,
      id: Math.random().toString(36).substr(2, 9),
      createdById: currentUser?.id || 'u1',
    };
    setTransactions(prev => [newTx, ...prev]);

    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === newTx.accountId) {
        let newBalance = acc.balance;
        if (newTx.type === 'expense') newBalance -= newTx.amount;
        if (newTx.type === 'income') newBalance += newTx.amount;
        // Transfer logic simplified for prototype
        return { ...acc, balance: newBalance };
      }
      return acc;
    }));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateCategoryLimit = (id: string, limit: number) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, budgetLimit: limit } : cat));
  };

  const addRecurringPayment = (paymentData: Omit<RecurringPayment, 'id'>) => {
    const newPayment: RecurringPayment = {
      ...paymentData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setRecurringPayments(prev => [...prev, newPayment]);
  };

  const updateRecurringPayment = (id: string, updates: Partial<RecurringPayment>) => {
    setRecurringPayments(prev => prev.map(rp => rp.id === id ? { ...rp, ...updates } : rp));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const deleteRecurringPayment = (id: string) => {
    setRecurringPayments(prev => prev.filter(rp => rp.id !== id));
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
