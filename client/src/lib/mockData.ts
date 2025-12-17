import { addDays, subDays, startOfMonth, endOfMonth, format } from "date-fns";

// Types matching the user's requested schema roughly
export type User = {
  id: string;
  username: string;
  email: string;
  avatar: string;
};

export type Family = {
  id: string;
  name: string;
  members: User[];
};

export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  familyId: string;
  color: string;
};

export type CategoryType = "expense" | "income";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  budgetLimit?: number;
};

export type TransactionType = "expense" | "income" | "transfer";

export type Transaction = {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  createdById: string;
};

// Mock Data
export const currentUser: User = {
  id: "u1",
  username: "alex_doe",
  email: "alex@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
};

export const familyMembers: User[] = [
  currentUser,
  { id: "u2", username: "sarah_doe", email: "sarah@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }
];

export const currentFamily: Family = {
  id: "f1",
  name: "The Doe Family",
  members: familyMembers
};

export const accounts: Account[] = [
  { id: "a1", name: "Main Checking", type: "checking", balance: 4520.50, currency: "USD", familyId: "f1", color: "#3b82f6" }, // Blue
  { id: "a2", name: "High Yield Savings", type: "savings", balance: 12500.00, currency: "USD", familyId: "f1", color: "#10b981" }, // Emerald
  { id: "a3", name: "Amex Gold", type: "credit", balance: -840.20, currency: "USD", familyId: "f1", color: "#f59e0b" }, // Amber
  { id: "a4", name: "Wallet Cash", type: "cash", balance: 120.00, currency: "USD", familyId: "f1", color: "#64748b" }, // Slate
];

export const categories: Category[] = [
  { id: "c1", name: "Groceries", type: "expense", color: "#ef4444", icon: "shopping-cart", budgetLimit: 600 },
  { id: "c2", name: "Dining Out", type: "expense", color: "#f97316", icon: "utensils", budgetLimit: 300 },
  { id: "c3", name: "Housing", type: "expense", color: "#8b5cf6", icon: "home", budgetLimit: 1500 },
  { id: "c4", name: "Transport", type: "expense", color: "#06b6d4", icon: "car", budgetLimit: 200 },
  { id: "c5", name: "Entertainment", type: "expense", color: "#ec4899", icon: "film", budgetLimit: 150 },
  { id: "c6", name: "Salary", type: "income", color: "#10b981", icon: "briefcase" },
  { id: "c7", name: "Freelance", type: "income", color: "#34d399", icon: "laptop" },
  { id: "c8", name: "Utilities", type: "expense", color: "#6366f1", icon: "zap", budgetLimit: 200 },
];

const today = new Date();

export const transactions: Transaction[] = [
  { id: "t1", amount: 125.50, date: format(today, "yyyy-MM-dd"), description: "Whole Foods Market", type: "expense", categoryId: "c1", accountId: "a1", createdById: "u1" },
  { id: "t2", amount: 4500.00, date: format(subDays(today, 2), "yyyy-MM-dd"), description: "Monthly Salary", type: "income", categoryId: "c6", accountId: "a1", createdById: "u1" },
  { id: "t3", amount: 55.00, date: format(subDays(today, 1), "yyyy-MM-dd"), description: "Shell Gas Station", type: "expense", categoryId: "c4", accountId: "a3", createdById: "u2" },
  { id: "t4", amount: 89.99, date: format(subDays(today, 3), "yyyy-MM-dd"), description: "Internet Bill", type: "expense", categoryId: "c8", accountId: "a3", createdById: "u1" },
  { id: "t5", amount: 1200.00, date: format(startOfMonth(today), "yyyy-MM-dd"), description: "Rent Payment", type: "expense", categoryId: "c3", accountId: "a1", createdById: "u1" },
  { id: "t6", amount: 65.20, date: format(subDays(today, 5), "yyyy-MM-dd"), description: "Dinner at Mario's", type: "expense", categoryId: "c2", accountId: "a3", createdById: "u2" },
  { id: "t7", amount: 15.00, date: format(subDays(today, 6), "yyyy-MM-dd"), description: "Netflix Subscription", type: "expense", categoryId: "c5", accountId: "a3", createdById: "u1" },
  { id: "t8", amount: 200.00, date: format(subDays(today, 10), "yyyy-MM-dd"), description: "ATM Withdrawal", type: "transfer", accountId: "a1", createdById: "u1" }, // Transfer to cash impl later
  { id: "t9", amount: 850.00, date: format(subDays(today, 12), "yyyy-MM-dd"), description: "Freelance Project", type: "income", categoryId: "c7", accountId: "a2", createdById: "u1" },
  { id: "t10", amount: 230.45, date: format(subDays(today, 4), "yyyy-MM-dd"), description: "Costco Wholesale", type: "expense", categoryId: "c1", accountId: "a1", createdById: "u2" },
];

// Helper to get category details
export const getCategory = (id?: string) => categories.find(c => c.id === id);
export const getAccount = (id: string) => accounts.find(a => a.id === id);
export const getUser = (id: string) => familyMembers.find(u => u.id === id);
