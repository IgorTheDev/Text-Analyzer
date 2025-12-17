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
  name: "Семья Ивановых",
  members: familyMembers
};

export const accounts: Account[] = [
  { id: "a1", name: "Основной счет", type: "checking", balance: 4520.50, currency: "RUB", familyId: "f1", color: "#3b82f6" }, // Blue
  { id: "a2", name: "Сберегательный", type: "savings", balance: 12500.00, currency: "RUB", familyId: "f1", color: "#10b981" }, // Emerald
  { id: "a3", name: "Кредитная карта", type: "credit", balance: -840.20, currency: "RUB", familyId: "f1", color: "#f59e0b" }, // Amber
  { id: "a4", name: "Наличные", type: "cash", balance: 120.00, currency: "RUB", familyId: "f1", color: "#64748b" }, // Slate
];

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

export const recurringPayments: RecurringPayment[] = [
  { id: "rp1", name: "Аренда", amount: 1200, frequency: "monthly", startDate: "2024-01-01", type: "payment", color: "#8b5cf6" },
  { id: "rp2", name: "Netflix", amount: 15, frequency: "monthly", startDate: "2024-01-15", type: "payment", color: "#ec4899" },
  { id: "rp3", name: "Интернет", amount: 90, frequency: "monthly", startDate: "2024-01-25", type: "payment", color: "#6366f1" },
  { id: "rp4", name: "Кредит за авто", amount: 350, frequency: "monthly", startDate: "2024-02-10", type: "loan", color: "#f59e0b" },
  { id: "rp5", name: "Страховка авто", amount: 1200, frequency: "annual", startDate: "2024-05-20", type: "payment", color: "#10b981" },
  { id: "rp6", name: "Долг другу", amount: 5000, frequency: "semi_annual", startDate: "2024-03-01", type: "debt", color: "#ef4444" },
];

const today = new Date();

export const transactions: Transaction[] = [
  { id: "t1", amount: 125.50, date: format(today, "yyyy-MM-dd"), description: "Супермаркет 'Лента'", type: "expense", categoryId: "c1", accountId: "a1", createdById: "u1" },
  { id: "t2", amount: 4500.00, date: format(subDays(today, 2), "yyyy-MM-dd"), description: "Зарплата", type: "income", categoryId: "c6", accountId: "a1", createdById: "u1" },
  { id: "t3", amount: 55.00, date: format(subDays(today, 1), "yyyy-MM-dd"), description: "АЗС Газпромнефть", type: "expense", categoryId: "c4", accountId: "a3", createdById: "u2" },
  { id: "t4", amount: 89.99, date: format(subDays(today, 3), "yyyy-MM-dd"), description: "Интернет Дом.ру", type: "expense", categoryId: "c8", accountId: "a3", createdById: "u1" },
  { id: "t5", amount: 1200.00, date: format(startOfMonth(today), "yyyy-MM-dd"), description: "Аренда квартиры", type: "expense", categoryId: "c3", accountId: "a1", createdById: "u1" },
  { id: "t6", amount: 65.20, date: format(subDays(today, 5), "yyyy-MM-dd"), description: "Ужин в ресторане", type: "expense", categoryId: "c2", accountId: "a3", createdById: "u2" },
  { id: "t7", amount: 15.00, date: format(subDays(today, 6), "yyyy-MM-dd"), description: "Подписка Netflix", type: "expense", categoryId: "c5", accountId: "a3", createdById: "u1" },
  { id: "t8", amount: 200.00, date: format(subDays(today, 10), "yyyy-MM-dd"), description: "Снятие наличных", type: "transfer", accountId: "a1", createdById: "u1" }, // Transfer to cash impl later
  { id: "t9", amount: 850.00, date: format(subDays(today, 12), "yyyy-MM-dd"), description: "Проект на фрилансе", type: "income", categoryId: "c7", accountId: "a2", createdById: "u1" },
  { id: "t10", amount: 230.45, date: format(subDays(today, 4), "yyyy-MM-dd"), description: "Покупки в Ашане", type: "expense", categoryId: "c1", accountId: "a1", createdById: "u2" },
];

// Helper to get category details
export const getCategory = (id?: string) => categories.find(c => c.id === id);
export const getAccount = (id: string) => accounts.find(a => a.id === id);
export const getUser = (id: string) => familyMembers.find(u => u.id === id);
