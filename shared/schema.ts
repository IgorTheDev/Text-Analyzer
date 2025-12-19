import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  familyId: varchar("family_id").references(() => families.id),
  role: text("role").$type<"admin" | "member">().default("member"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const familyInvitations = pgTable("family_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull().references(() => families.id),
  email: text("email").notNull(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  invitationCode: text("invitation_code").notNull().unique(),
  status: text("status").$type<"pending" | "accepted" | "rejected">().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").$type<"expense" | "income">().notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  budgetLimit: decimal("budget_limit", { precision: 10, scale: 2 }),
  familyId: varchar("family_id").references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").$type<"checking" | "savings" | "credit" | "cash" | "investment">().notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("RUB"),
  familyId: varchar("family_id").notNull().references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  type: text("type").$type<"expense" | "income" | "transfer">().notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  familyId: varchar("family_id").notNull().references(() => families.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recurringPayments = pgTable("recurring_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  frequency: text("frequency").$type<"monthly" | "semi_annual" | "annual">().notNull(),
  startDate: timestamp("start_date").notNull(),
  type: text("type").$type<"payment" | "debt" | "loan">().notNull(),
  color: text("color"),
  familyId: varchar("family_id").notNull().references(() => families.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(users, ({ one, many }) => ({
  family: one(families, {
    fields: [users.familyId],
    references: [families.id],
  }),
  invitationsSent: many(familyInvitations),
}));

export const familyRelations = relations(families, ({ many }) => ({
  users: many(users),
  invitations: many(familyInvitations),
}));

export const invitationRelations = relations(familyInvitations, ({ one }) => ({
  family: one(families, {
    fields: [familyInvitations.familyId],
    references: [families.id],
  }),
  invitedByUser: one(users, {
    fields: [familyInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertFamilySchema = createInsertSchema(families).pick({
  name: true,
});

export const insertFamilyInvitationSchema = createInsertSchema(familyInvitations).pick({
  familyId: true,
  email: true,
  invitedBy: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecurringPaymentSchema = createInsertSchema(recurringPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type InsertFamilyInvitation = z.infer<typeof insertFamilyInvitationSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertRecurringPayment = z.infer<typeof insertRecurringPaymentSchema>;

export type User = typeof users.$inferSelect;
export type Family = typeof families.$inferSelect;
export type FamilyInvitation = typeof familyInvitations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type RecurringPayment = typeof recurringPayments.$inferSelect;
