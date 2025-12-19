import { eq, and } from "drizzle-orm";
import { type User, type InsertUser, type Family, type InsertFamily, type FamilyInvitation, type InsertFamilyInvitation, type Category, type InsertCategory, type Account, type InsertAccount, type Transaction, type InsertTransaction, type RecurringPayment, type InsertRecurringPayment } from "../shared/schema";
import { db } from "./db";
import { users, families, familyInvitations, categories, accounts, transactions, recurringPayments } from "../shared/schema";
import { hashPassword } from "./auth";

// PostgreSQL storage implementation
export class PgStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("PgStorage: Creating user", insertUser.username);
    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(insertUser.password);
    const result = await db.insert(users).values({ ...insertUser, password: hashedPassword, id }).returning();
    console.log("PgStorage: User created successfully", result[0].id);
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Hash password if it's being updated
    const processedUpdates = { ...updates };
    if (updates.password) {
      processedUpdates.password = await hashPassword(updates.password);
    }

    const result = await db.update(users)
      .set({ ...processedUpdates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Family operations
  async getFamily(id: string): Promise<Family | undefined> {
    const result = await db.select().from(families).where(eq(families.id, id)).limit(1);
    return result[0];
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const result = await db.insert(families).values(insertFamily).returning();
    return result[0];
  }

  async getFamiliesByUserId(userId: string): Promise<Family[]> {
    const user = await this.getUser(userId);
    if (!user?.familyId) return [];

    const family = await this.getFamily(user.familyId);
    return family ? [family] : [];
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.familyId, familyId));
  }

  // Invitation operations
  async createFamilyInvitation(insertInvitation: InsertFamilyInvitation): Promise<FamilyInvitation> {
    // Generate a unique invitation code
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await db.insert(familyInvitations)
      .values({ ...insertInvitation, invitationCode })
      .returning();
    return result[0];
  }

  async getFamilyInvitationsByEmail(email: string): Promise<FamilyInvitation[]> {
    return await db.select().from(familyInvitations).where(eq(familyInvitations.email, email));
  }

  async getFamilyInvitationsByFamilyId(familyId: string): Promise<FamilyInvitation[]> {
    return await db.select().from(familyInvitations).where(eq(familyInvitations.familyId, familyId));
  }

  async getFamilyInvitationByCode(invitationCode: string): Promise<FamilyInvitation | undefined> {
    const result = await db.select().from(familyInvitations)
      .where(eq(familyInvitations.invitationCode, invitationCode))
      .limit(1);
    return result[0];
  }

  async updateFamilyInvitation(id: string, updates: Partial<FamilyInvitation>): Promise<FamilyInvitation | undefined> {
    const result = await db.update(familyInvitations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(familyInvitations.id, id))
      .returning();
    return result[0];
  }

  // Category operations
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory as any).returning();
    return result[0];
  }

  async getCategoriesByFamilyId(familyId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.familyId, familyId));
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Account operations
  async getAccount(id: string): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return result[0];
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const result = await db.insert(accounts).values(insertAccount as any).returning();
    return result[0];
  }

  async getAccountsByFamilyId(familyId: string): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.familyId, familyId));
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const result = await db.update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return result[0];
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id)).returning();
    return result.length > 0;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction as any).returning();
    return result[0];
  }

  async getTransactionsByFamilyId(familyId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.familyId, familyId));
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.accountId, accountId));
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }

  // Recurring payment operations
  async createRecurringPayment(insertPayment: InsertRecurringPayment): Promise<RecurringPayment> {
    const result = await db.insert(recurringPayments).values(insertPayment as any).returning();
    return result[0];
  }

  async getRecurringPaymentsByFamilyId(familyId: string): Promise<RecurringPayment[]> {
    return await db.select().from(recurringPayments).where(eq(recurringPayments.familyId, familyId));
  }

  async updateRecurringPayment(id: string, updates: Partial<RecurringPayment>): Promise<RecurringPayment | undefined> {
    const result = await db.update(recurringPayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recurringPayments.id, id))
      .returning();
    return result[0];
  }

  async deleteRecurringPayment(id: string): Promise<boolean> {
    const result = await db.delete(recurringPayments).where(eq(recurringPayments.id, id)).returning();
    return result.length > 0;
  }

  async deleteTransactionsByUserId(userId: string): Promise<number> {
    const result = await db.delete(transactions).where(eq(transactions.createdById, userId)).returning();
    return result.length;
  }

  async deleteRecurringPaymentsByUserId(userId: string): Promise<number> {
    const result = await db.delete(recurringPayments).where(eq(recurringPayments.createdById, userId)).returning();
    return result.length;
  }
}
