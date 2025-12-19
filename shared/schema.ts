import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type InsertFamilyInvitation = z.infer<typeof insertFamilyInvitationSchema>;

export type User = typeof users.$inferSelect;
export type Family = typeof families.$inferSelect;
export type FamilyInvitation = typeof familyInvitations.$inferSelect;
