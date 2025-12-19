import { addDays, subDays, startOfMonth, endOfMonth, format } from "date-fns";

// Types matching the user's requested schema roughly
export type User = {
  id: string;
  username: string;
  avatar: string;
  familyId?: string | null;
  role?: "admin" | "member";
  firstName?: string | null;
  lastName?: string | null;
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

export type Frequency = "monthly" | "semi_annual" | "annual";

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  type: "payment" | "debt" | "loan";
  color?: string;
};

// Mock Data - Cleared default data as requested
export const currentUser: User = {
  id: "u1",
  username: "",
  avatar: "",
  familyId: null,
  role: "member"
};

export let familyMembers: User[] = [];

export let currentFamily: Family = {
  id: "f1",
  name: "",
  members: []
};

export const accounts: Account[] = [];

export const categories: Category[] = [
  { id: "c1", name: "Продукты", type: "expense", color: "#ef4444", icon: "shopping-cart", budgetLimit: 600 },
  { id: "c2", name: "Кафе и рестораны", type: "expense", color: "#f97316", icon: "utensils", budgetLimit: 300 },
  { id: "c3", name: "Жилье", type: "expense", color: "#8b5cf6", icon: "home", budgetLimit: 1500 },
  { id: "c4", name: "Транспорт", type: "expense", color: "#06b6d4", icon: "car", budgetLimit: 200 },
  { id: "c5", name: "Развлечения", type: "expense", color: "#ec4899", icon: "film", budgetLimit: 150 },
  { id: "c6", name: "Зарплата", type: "income", color: "#10b981", icon: "briefcase" },
  { id: "c7", name: "Фриланс", type: "income", color: "#34d399", icon: "laptop" },
  { id: "c8", name: "Коммуналка", type: "expense", color: "#6366f1", icon: "zap", budgetLimit: 200 },
];

export const recurringPayments: RecurringPayment[] = [];

export const transactions: Transaction[] = [];

// Helper to get category details
export const getCategory = (id?: string) => categories.find(c => c.id === id);
export const getAccount = (id: string) => accounts.find(a => a.id === id);
export const getUser = (id: string) => familyMembers.find(u => u.id === id);
