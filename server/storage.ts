import { type User, type InsertUser, type Family, type InsertFamily, type FamilyInvitation, type InsertFamilyInvitation, type Category, type InsertCategory, type Account, type InsertAccount, type Transaction, type InsertTransaction, type RecurringPayment, type InsertRecurringPayment } from "@shared/schema";
import { randomUUID } from "crypto";
import { PgStorage } from "./storage-pg";
import { hashPassword } from "./auth";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Family operations
  getFamily(id: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getFamiliesByUserId(userId: string): Promise<Family[]>;
  getFamilyMembers(familyId: string): Promise<User[]>;

  // Account operations
  getAccount(id: string): Promise<Account | undefined>;

  // Invitation operations
  createFamilyInvitation(invitation: InsertFamilyInvitation): Promise<FamilyInvitation>;
  getFamilyInvitationsByEmail(email: string): Promise<FamilyInvitation[]>;
  getFamilyInvitationsByFamilyId(familyId: string): Promise<FamilyInvitation[]>;
  updateFamilyInvitation(id: string, updates: Partial<FamilyInvitation>): Promise<FamilyInvitation | undefined>;
  getFamilyInvitationByCode(invitationCode: string): Promise<FamilyInvitation | undefined>;
  deleteFamilyInvitation(id: string): Promise<boolean>;
  deleteFamilyInvitationsByInvitedBy(userId: string): Promise<number>;

  // Category operations
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoriesByFamilyId(familyId: string): Promise<Category[]>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Account operations
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountsByFamilyId(familyId: string): Promise<Account[]>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByFamilyId(familyId: string): Promise<Transaction[]>;
  getTransactionsByAccountId(accountId: string): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  deleteTransactionsByUserId(userId: string): Promise<number>;

  // Recurring payment operations
  createRecurringPayment(payment: InsertRecurringPayment): Promise<RecurringPayment>;
  getRecurringPaymentsByFamilyId(familyId: string): Promise<RecurringPayment[]>;
  updateRecurringPayment(id: string, updates: Partial<RecurringPayment>): Promise<RecurringPayment | undefined>;
  deleteRecurringPayment(id: string): Promise<boolean>;
  deleteRecurringPaymentsByUserId(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private families: Map<string, Family>;
  private invitations: Map<string, FamilyInvitation>;
  private categories: Map<string, Category>;
  private accounts: Map<string, Account>;
  private transactions: Map<string, Transaction>;
  private recurringPayments: Map<string, RecurringPayment>;

  constructor() {
    this.users = new Map();
    this.families = new Map();
    this.invitations = new Map();
    this.categories = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.recurringPayments = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      familyId: null,
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // Hash password if it's being updated
    const processedUpdates = { ...updates };
    if (updates.password) {
      processedUpdates.password = await hashPassword(updates.password);
    }

    const updatedUser = { ...user, ...processedUpdates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Family operations
  async getFamily(id: string): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    const id = randomUUID();
    const newFamily: Family = {
      ...family,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.families.set(id, newFamily);
    return newFamily;
  }

  async getFamiliesByUserId(userId: string): Promise<Family[]> {
    const user = await this.getUser(userId);
    if (!user?.familyId) return [];

    const family = await this.getFamily(user.familyId);
    return family ? [family] : [];
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.familyId === familyId
    );
  }

  // Invitation operations
  async createFamilyInvitation(invitation: InsertFamilyInvitation): Promise<FamilyInvitation> {
    const id = randomUUID();
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newInvitation: FamilyInvitation = {
      ...invitation,
      id,
      invitationCode,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invitations.set(id, newInvitation);
    return newInvitation;
  }

  async getFamilyInvitationsByEmail(email: string): Promise<FamilyInvitation[]> {
    return Array.from(this.invitations.values()).filter(
      (invitation) => invitation.email === email
    );
  }

  async getFamilyInvitationsByFamilyId(familyId: string): Promise<FamilyInvitation[]> {
    return Array.from(this.invitations.values()).filter(
      (invitation) => invitation.familyId === familyId
    );
  }

  async getFamilyInvitationByCode(invitationCode: string): Promise<FamilyInvitation | undefined> {
    return Array.from(this.invitations.values()).find(
      (invitation) => invitation.invitationCode === invitationCode
    );
  }

  async updateFamilyInvitation(id: string, updates: Partial<FamilyInvitation>): Promise<FamilyInvitation | undefined> {
    const invitation = this.invitations.get(id);
    if (!invitation) return undefined;

    const updatedInvitation = { ...invitation, ...updates, updatedAt: new Date() };
    this.invitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deleteFamilyInvitation(id: string): Promise<boolean> {
    return this.invitations.delete(id);
  }

  async deleteFamilyInvitationsByInvitedBy(userId: string): Promise<number> {
    const invitationsToDelete = Array.from(this.invitations.values())
      .filter(invitation => invitation.invitedBy === userId);

    let deletedCount = 0;
    for (const invitation of invitationsToDelete) {
      if (this.invitations.delete(invitation.id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // Category operations
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Category;
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getCategoriesByFamilyId(familyId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.familyId === familyId
    );
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...updates, updatedAt: new Date() };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Account operations
  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const newAccount: Account = {
      ...account,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async getAccountsByFamilyId(familyId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.familyId === familyId
    );
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Transaction;
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getTransactionsByFamilyId(familyId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.familyId === familyId
    );
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.accountId === accountId
    );
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async deleteTransactionsByUserId(userId: string): Promise<number> {
    const transactionsToDelete = Array.from(this.transactions.values())
      .filter(transaction => transaction.createdById === userId);

    let deletedCount = 0;
    for (const transaction of transactionsToDelete) {
      if (this.transactions.delete(transaction.id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  // Recurring payment operations
  async createRecurringPayment(payment: InsertRecurringPayment): Promise<RecurringPayment> {
    const id = randomUUID();
    const newPayment: RecurringPayment = {
      ...payment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RecurringPayment;
    this.recurringPayments.set(id, newPayment);
    return newPayment;
  }

  async getRecurringPaymentsByFamilyId(familyId: string): Promise<RecurringPayment[]> {
    return Array.from(this.recurringPayments.values()).filter(
      (payment) => payment.familyId === familyId
    );
  }

  async updateRecurringPayment(id: string, updates: Partial<RecurringPayment>): Promise<RecurringPayment | undefined> {
    const payment = this.recurringPayments.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...updates, updatedAt: new Date() };
    this.recurringPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deleteRecurringPayment(id: string): Promise<boolean> {
    return this.recurringPayments.delete(id);
  }

  async deleteRecurringPaymentsByUserId(userId: string): Promise<number> {
    const paymentsToDelete = Array.from(this.recurringPayments.values())
      .filter(payment => payment.createdById === userId);

    let deletedCount = 0;
    for (const payment of paymentsToDelete) {
      if (this.recurringPayments.delete(payment.id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
}

// Choose storage based on environment
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`DATABASE_URL value: ${process.env.DATABASE_URL}`);
export const storage: IStorage = process.env.DATABASE_URL ? new PgStorage() : new MemStorage();

// Log which storage is being used
console.log(`Using ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory'} storage`);
