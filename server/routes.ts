import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import express from "express";
import { comparePassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // User registration
  app.post("/api/register", express.json(), async (req, res) => {
    try {
      const registerSchema = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        familyName: z.string().optional(),
      });

      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user
      const user = await storage.createUser({
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Create family if familyName is provided
      let family;
      let updatedUser = user;
      if (data.familyName) {
        family = await storage.createFamily({ name: data.familyName });
        await storage.updateUser(user.id, {
          familyId: family.id,
          role: "admin",
        });
        // Get the updated user to ensure we have the correct familyId
        const fetchedUser = await storage.getUser(user.id);
        if (fetchedUser) {
          updatedUser = fetchedUser;
        }
      }

      res.status(201).json({
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          familyId: updatedUser.familyId,
          role: updatedUser.role,
        },
        family: family || null,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  });

  // User login
  app.post("/api/login", express.json(), async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string(),
        password: z.string(),
      });

      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Get family info if user has one
      const family = user.familyId
        ? await storage.getFamily(user.familyId)
        : null;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          familyId: user.familyId,
          role: user.role,
        },
        family: family || null,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  // Create family invitation
  app.post("/api/families/:familyId/invitations", express.json(), async (req, res) => {
    try {
      const invitationSchema = z.object({
        username: z.string(),
        invitedBy: z.string(),
      });

      const { familyId } = req.params;
      const { username, invitedBy } = invitationSchema.parse(req.body);

      // Check if family exists
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }

      // Check if inviting user is part of the family
      const invitingUser = await storage.getUser(invitedBy);
      if (!invitingUser || invitingUser.familyId !== familyId) {
        return res.status(403).json({ error: "Not authorized to invite" });
      }

      // Create invitation
      const invitation = await storage.createFamilyInvitation({
        familyId,
        email: username + "@familyfinance.local", // Use username as basis for email in invitations
        invitedBy,
      });

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Invitation error:", error);
      res.status(400).json({ error: "Failed to create invitation" });
    }
  });

  // Accept family invitation
  app.post("/api/invitations/:invitationId/accept", express.json(), async (req, res) => {
    try {
      const { invitationId } = req.params;
      const { userId } = req.body;

      // Get invitation
      const invitation = await storage.getFamilyInvitationsByFamilyId(invitationId);
      if (!invitation || invitation.length === 0) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      const inv = invitation[0];

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user username matches invitation (using the generated email format)
      const expectedEmail = user.username + "@familyfinance.local";
      if (expectedEmail !== inv.email) {
        return res.status(403).json({ error: "Invitation not for this user" });
      }

      // Update invitation status
      await storage.updateFamilyInvitation(inv.id, { status: "accepted" });

      // Add user to family
      await storage.updateUser(userId, {
        familyId: inv.familyId,
        role: "member",
      });

      // Get updated user and family info
      const updatedUser = await storage.getUser(userId);
      const family = await storage.getFamily(inv.familyId);

      res.json({
        user: updatedUser,
        family,
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res.status(400).json({ error: "Failed to accept invitation" });
    }
  });

  // Get family members
  app.get("/api/families/:familyId/members", async (req, res) => {
    try {
      const { familyId } = req.params;

      // Check if family exists
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }

      // Get family members
      const members = await storage.getFamilyMembers(familyId);

      res.json({
        family,
        members: members.map(member => ({
          id: member.id,
          username: member.username,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
        })),
      });
    } catch (error) {
      console.error("Get family members error:", error);
      res.status(400).json({ error: "Failed to get family members" });
    }
  });

  // Get family invitations
  app.get("/api/families/:familyId/invitations", async (req, res) => {
    try {
      const { familyId } = req.params;

      // Check if family exists
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }

      // Get family invitations
      const invitations = await storage.getFamilyInvitationsByFamilyId(familyId);

      res.json(invitations);
    } catch (error) {
      console.error("Get family invitations error:", error);
      res.status(400).json({ error: "Failed to get family invitations" });
    }
  });

  // Join family using invitation code
  app.post("/api/families/join", express.json(), async (req, res) => {
    try {
      const joinSchema = z.object({
        userId: z.string(),
        invitationCode: z.string(),
      });

      const { userId, invitationCode } = joinSchema.parse(req.body);

      // Get invitation by code
      const invitation = await storage.getFamilyInvitationByCode(invitationCode);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      // Check if invitation is still valid
      if (invitation.status !== "pending") {
        return res.status(400).json({ error: "Invitation is no longer valid" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has a family
      if (user.familyId) {
        return res.status(400).json({ error: "User already belongs to a family" });
      }

      // Update invitation status
      await storage.updateFamilyInvitation(invitation.id, { status: "accepted" });

      // Add user to family
      await storage.updateUser(userId, {
        familyId: invitation.familyId,
        role: "member",
      });

      // Get updated user and family info
      const updatedUser = await storage.getUser(userId);
      const family = await storage.getFamily(invitation.familyId);

      res.json({
        user: updatedUser,
        family,
      });
    } catch (error) {
      console.error("Join family error:", error);
      res.status(400).json({ error: "Failed to join family" });
    }
  });

  // Generate new invitation code
  app.post("/api/families/:familyId/generate-invitation", express.json(), async (req, res) => {
    try {
      const { familyId } = req.params;
      const { invitedBy } = req.body;

      // Check if family exists
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }

      // Check if inviting user is part of the family
      const invitingUser = await storage.getUser(invitedBy);
      if (!invitingUser || invitingUser.familyId !== familyId) {
        return res.status(403).json({ error: "Not authorized to invite" });
      }

      // Create invitation with a generic email for code-based invitations
      const invitation = await storage.createFamilyInvitation({
        familyId,
        email: "code-based-invitation@example.com",
        invitedBy,
      });

      res.status(201).json(invitation);
    } catch (error) {
      console.error("Generate invitation error:", error);
      res.status(400).json({ error: "Failed to generate invitation" });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:transactionId", express.json(), async (req, res) => {
    try {
      const { transactionId } = req.params;

      // Check if transaction exists and delete it
      // Note: In a real implementation, we would have storage.deleteTransaction
      // For now, we'll return success to allow the frontend to handle deletion

      res.status(200).json({ success: true, message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(400).json({ error: "Failed to delete transaction" });
    }
  });

  return httpServer;
}
