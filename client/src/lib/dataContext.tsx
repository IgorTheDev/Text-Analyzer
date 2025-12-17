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

type DataContextType = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  recurringPayments: RecurringPayment[];
  currentUser: User | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdById'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateCategoryLimit: (id: string, limit: number) => void;
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
  updateRecurringPayment: (id: string, updates: Partial<RecurringPayment>) => void;
  login: (username: string) => void;
  logout: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(initialRecurringPayments);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Start logged out for demo, or initialUser for dev

  const login = (username: string) => {
    // Mock login
    setCurrentUser({ ...initialUser, username });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdById'>) => {
    const newTx: Transaction = {
      ...txData,
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

  return (
    <DataContext.Provider value={{
      transactions,
      accounts,
      categories,
      recurringPayments,
      currentUser,
      addTransaction,
      updateAccount,
      addAccount,
      updateCategoryLimit,
      addRecurringPayment,
      updateRecurringPayment,
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
