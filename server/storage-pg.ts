import { eq, and } from "drizzle-orm";
import { type User, type InsertUser, type Family, type InsertFamily, type FamilyInvitation, type InsertFamilyInvitation } from "../shared/schema";
import { db } from "./db";
import { users, families, familyInvitations } from "../shared/schema";
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
}
