import { type User, type InsertUser, type Family, type InsertFamily, type FamilyInvitation, type InsertFamilyInvitation } from "@shared/schema";
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

  // Family operations
  getFamily(id: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getFamiliesByUserId(userId: string): Promise<Family[]>;
  getFamilyMembers(familyId: string): Promise<User[]>;

  // Invitation operations
  createFamilyInvitation(invitation: InsertFamilyInvitation): Promise<FamilyInvitation>;
  getFamilyInvitationsByEmail(email: string): Promise<FamilyInvitation[]>;
  getFamilyInvitationsByFamilyId(familyId: string): Promise<FamilyInvitation[]>;
  updateFamilyInvitation(id: string, updates: Partial<FamilyInvitation>): Promise<FamilyInvitation | undefined>;
  getFamilyInvitationByCode(invitationCode: string): Promise<FamilyInvitation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private families: Map<string, Family>;
  private invitations: Map<string, FamilyInvitation>;

  constructor() {
    this.users = new Map();
    this.families = new Map();
    this.invitations = new Map();
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
}

// Choose storage based on environment
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`DATABASE_URL value: ${process.env.DATABASE_URL}`);
export const storage: IStorage = process.env.DATABASE_URL ? new PgStorage() : new MemStorage();

// Log which storage is being used
console.log(`Using ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory'} storage`);
