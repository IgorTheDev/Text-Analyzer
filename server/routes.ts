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
        familyName: z.string().nullable().optional(),
        invitationCode: z.string().optional(),
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

      // Handle family assignment - invitationCode has priority over familyName
      let family;
      let updatedUser = user;

      if (data.invitationCode) {
        // Priority: Use invitation code to join existing family
        console.log("Using invitation code:", data.invitationCode);
        try {
          const invitation = await storage.getFamilyInvitationByCode(data.invitationCode);
          if (!invitation) {
            return res.status(400).json({ error: "Invalid invitation code" });
          }

          if (invitation.status !== "pending") {
            return res.status(400).json({ error: "Invitation code has already been used" });
          }

          // Update invitation status
          await storage.updateFamilyInvitation(invitation.id, { status: "accepted" });

          // Add user to family
          await storage.updateUser(user.id, {
            familyId: invitation.familyId,
            role: "member",
          });

          // Get updated user and family info
          const fetchedUser = await storage.getUser(user.id);
          if (fetchedUser) {
            updatedUser = fetchedUser;
          }
          family = await storage.getFamily(invitation.familyId);

          console.log(`✅ User joined family via invitation code: ${family?.name}`);
        } catch (error) {
          console.error("Error joining family via invitation:", error);
          return res.status(400).json({ error: "Failed to join family using invitation code" });
        }
      } else if (data.familyName) {
        // Fallback: Create new family if no invitation code provided
        console.log("Creating new family:", data.familyName);
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

        // Create default categories for the new family
        const defaultCategories = [
          { name: "Продукты", type: "expense" as const, color: "#ef4444", icon: "shopping-cart", budgetLimit: "600" },
          { name: "Кафе и рестораны", type: "expense" as const, color: "#f97316", icon: "utensils", budgetLimit: "300" },
          { name: "Жилье", type: "expense" as const, color: "#8b5cf6", icon: "home", budgetLimit: "1500" },
          { name: "Транспорт", type: "expense" as const, color: "#06b6d4", icon: "car", budgetLimit: "200" },
          { name: "Развлечения", type: "expense" as const, color: "#ec4899", icon: "film", budgetLimit: "150" },
          { name: "Коммуналка", type: "expense" as const, color: "#6366f1", icon: "zap", budgetLimit: "200" },
          { name: "Зарплата", type: "income" as const, color: "#10b981", icon: "briefcase" },
          { name: "Фриланс", type: "income" as const, color: "#34d399", icon: "laptop" },
        ];

        for (const category of defaultCategories) {
          await storage.createCategory({
            ...category,
            familyId: family.id,
          });
        }

        console.log(`📂 Создано ${defaultCategories.length} стандартных категорий для новой семьи ${family.name}`);
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

      const success = await storage.deleteTransaction(transactionId);
      if (!success) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.status(200).json({ success: true, message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(400).json({ error: "Failed to delete transaction" });
    }
  });

  // ===============================
  // КАТЕГОРИИ (Categories)
  // ===============================

  // Создание категории
  app.post("/api/categories", express.json(), async (req, res) => {
    try {
      const categorySchema = z.object({
        name: z.string().min(1),
        type: z.enum(["expense", "income"]),
        color: z.string(),
        icon: z.string(),
        budgetLimit: z.number().optional().transform(val => val?.toString()),
        familyId: z.string(),
      });

      const categoryData = categorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);

      console.log(`📂 Категория создана в БД: ${category.name} (${category.type})`);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  // Получение категорий семьи
  app.get("/api/categories/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const categories = await storage.getCategoriesByFamilyId(familyId);

      console.log(`📂 Получено ${categories.length} категорий из БД для семьи ${familyId}`);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(400).json({ error: "Failed to get categories" });
    }
  });

  // Обновление категории
  app.put("/api/categories/:categoryId", express.json(), async (req, res) => {
    try {
      const { categoryId } = req.params;
      const updateData = req.body;

      const category = await storage.updateCategory(categoryId, updateData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      console.log(`📂 Категория обновлена в БД: ${category.name}`);
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  // Удаление категории
  app.delete("/api/categories/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;

      const success = await storage.deleteCategory(categoryId);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }

      console.log(`📂 Категория удалена из БД: ${categoryId}`);
      res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  // ===============================
  // СЧЕТА (Accounts)
  // ===============================

  // Создание счета
  app.post("/api/accounts", express.json(), async (req, res) => {
    try {
      const accountSchema = z.object({
        name: z.string().min(1),
        type: z.enum(["checking", "savings", "credit", "cash", "investment"]),
        balance: z.number().default(0).transform(val => val.toString()),
        currency: z.string().default("RUB"),
        familyId: z.string(),
      });

      const accountData = accountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);

      console.log(`🏦 Счет создан в БД: ${account.name} (${account.balance} ${account.currency})`);
      res.status(201).json(account);
    } catch (error) {
      console.error("Create account error:", error);
      res.status(400).json({ error: "Failed to create account" });
    }
  });

  // Получение счетов семьи
  app.get("/api/accounts/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const accounts = await storage.getAccountsByFamilyId(familyId);

      console.log(`🏦 Получено ${accounts.length} счетов из БД для семьи ${familyId}`);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts error:", error);
      res.status(400).json({ error: "Failed to get accounts" });
    }
  });

  // Обновление счета
  app.put("/api/accounts/:accountId", express.json(), async (req, res) => {
    try {
      const { accountId } = req.params;
      const updateData = req.body;

      const account = await storage.updateAccount(accountId, updateData);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      console.log(`🏦 Счет обновлен в БД: ${account.name}`);
      res.json(account);
    } catch (error) {
      console.error("Update account error:", error);
      res.status(400).json({ error: "Failed to update account" });
    }
  });

  // Удаление счета
  app.delete("/api/accounts/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;

      const success = await storage.deleteAccount(accountId);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }

      console.log(`🏦 Счет удален из БД: ${accountId}`);
      res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(400).json({ error: "Failed to delete account" });
    }
  });

  // ===============================
  // ТРАНЗАКЦИИ (Transactions)
  // ===============================

  // Создание транзакции
  app.post("/api/transactions", express.json(), async (req, res) => {
    try {
      const transactionSchema = z.object({
        amount: z.number().transform(val => val.toString()),
        date: z.string().transform(str => new Date(str)),
        description: z.string().min(1),
        type: z.enum(["expense", "income", "transfer"]),
        categoryId: z.string().optional(),
        accountId: z.string(),
        createdById: z.string(),
        familyId: z.string(),
      });

      const transactionData = transactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);

      // Update account balance
      const account = await storage.getAccount(transaction.accountId);
      if (account) {
        let newBalance = Number(account.balance);
        if (transaction.type === 'expense') newBalance -= Number(transaction.amount);
        if (transaction.type === 'income') newBalance += Number(transaction.amount);
        // Transfer logic can be added later if needed

        await storage.updateAccount(account.id, {
          balance: newBalance.toString()
        });
      }

      console.log(`💳 Транзакция создана в БД: ${transaction.description} (${transaction.amount} руб., ${transaction.type})`);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(400).json({ error: "Failed to create transaction" });
    }
  });

  // Получение транзакций семьи
  app.get("/api/transactions/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const transactions = await storage.getTransactionsByFamilyId(familyId);

      // Add user names to transactions
      const transactionsWithUsers = await Promise.all(
        transactions.map(async (transaction) => {
          const user = await storage.getUser(transaction.createdById);
          return {
            ...transaction,
            createdByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Неизвестный пользователь'
          };
        })
      );

      console.log(`💳 Получено ${transactions.length} транзакций из БД для семьи ${familyId}`);
      res.json(transactionsWithUsers);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(400).json({ error: "Failed to get transactions" });
    }
  });

  // Получение транзакций по счету
  app.get("/api/accounts/:accountId/transactions", async (req, res) => {
    try {
      const { accountId } = req.params;
      const transactions = await storage.getTransactionsByAccountId(accountId);

      console.log(`💳 Получено ${transactions.length} транзакций из БД для счета ${accountId}`);
      res.json(transactions);
    } catch (error) {
      console.error("Get account transactions error:", error);
      res.status(400).json({ error: "Failed to get account transactions" });
    }
  });

  // Обновление транзакции
  app.put("/api/transactions/:transactionId", express.json(), async (req, res) => {
    try {
      const { transactionId } = req.params;

      const updateTransactionSchema = z.object({
        amount: z.number().optional().transform(val => val?.toString()),
        date: z.string().optional().transform(str => str ? new Date(str) : undefined),
        description: z.string().min(1).optional(),
        type: z.enum(["expense", "income", "transfer"]).optional(),
        categoryId: z.string().optional(),
        accountId: z.string().optional(),
      });

      const updateData = updateTransactionSchema.parse(req.body);

      const transaction = await storage.updateTransaction(transactionId, updateData);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      console.log(`💳 Транзакция обновлена в БД: ${transaction.description}`);
      res.json(transaction);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(400).json({ error: "Failed to update transaction" });
    }
  });

  // ===============================
  // ПОВТОРЯЮЩИЕСЯ ПЛАТЕЖИ (Recurring Payments - Календарь)
  // ===============================

  // Создание повторяющегося платежа
  app.post("/api/recurring-payments", express.json(), async (req, res) => {
    try {
      const paymentSchema = z.object({
        name: z.string().min(1),
        amount: z.number().transform(val => val.toString()),
        frequency: z.enum(["monthly", "semi_annual", "annual"]),
        startDate: z.string().transform(str => new Date(str)),
        type: z.enum(["payment", "debt", "loan"]),
        color: z.string().optional(),
        familyId: z.string(),
        createdById: z.string(),
      });

      const paymentData = paymentSchema.parse(req.body);
      const payment = await storage.createRecurringPayment(paymentData);

      console.log(`📅 Повторяющийся платеж создан в БД: ${payment.name} (${payment.amount} руб., ${payment.frequency})`);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Create recurring payment error:", error);
      res.status(400).json({ error: "Failed to create recurring payment" });
    }
  });

  // Получение повторяющихся платежей семьи
  app.get("/api/recurring-payments/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;
      const payments = await storage.getRecurringPaymentsByFamilyId(familyId);

      // Add user names to payments
      const paymentsWithUsers = await Promise.all(
        payments.map(async (payment) => {
          const user = await storage.getUser(payment.createdById);
          return {
            ...payment,
            createdByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Неизвестный пользователь'
          };
        })
      );

      console.log(`📅 Получено ${payments.length} повторяющихся платежей из БД для семьи ${familyId}`);
      res.json(paymentsWithUsers);
    } catch (error) {
      console.error("Get recurring payments error:", error);
      res.status(400).json({ error: "Failed to get recurring payments" });
    }
  });

  // Обновление повторяющегося платежа
  app.put("/api/recurring-payments/:paymentId", express.json(), async (req, res) => {
    try {
      const { paymentId } = req.params;
      const updateData = req.body;

      const payment = await storage.updateRecurringPayment(paymentId, updateData);
      if (!payment) {
        return res.status(404).json({ error: "Recurring payment not found" });
      }

      console.log(`📅 Повторяющийся платеж обновлен в БД: ${payment.name}`);
      res.json(payment);
    } catch (error) {
      console.error("Update recurring payment error:", error);
      res.status(400).json({ error: "Failed to update recurring payment" });
    }
  });

  // Удаление повторяющегося платежа
  app.delete("/api/recurring-payments/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;

      const success = await storage.deleteRecurringPayment(paymentId);
      if (!success) {
        return res.status(404).json({ error: "Recurring payment not found" });
      }

      console.log(`📅 Повторяющийся платеж удален из БД: ${paymentId}`);
      res.status(200).json({ success: true, message: "Recurring payment deleted successfully" });
    } catch (error) {
      console.error("Delete recurring payment error:", error);
      res.status(400).json({ error: "Failed to delete recurring payment" });
    }
  });

  // ===============================
  // УДАЛЕНИЕ АККАУНТА
  // ===============================

  // Удаление аккаунта пользователя
  app.delete("/api/account/delete", express.json(), async (req, res) => {
    try {
      console.log("=== DELETE ACCOUNT REQUEST ===");
      console.log("Request body:", req.body);

      const { userId } = req.body;
      console.log("Extracted userId:", userId);

      if (!userId) {
        console.log("ERROR: User ID is required");
        return res.status(400).json({ error: "User ID is required" });
      }

      // Check if user exists
      console.log("Checking if user exists:", userId);
      const user = await storage.getUser(userId);
      console.log("User found:", user);

      if (!user) {
        console.log("ERROR: User not found");
        return res.status(404).json({ error: "User not found" });
      }

      // Delete all related data first to avoid foreign key constraints
      console.log("Deleting related data for user:", userId);

      // Delete transactions created by this user
      console.log("Deleting transactions created by user...");
      const deletedTransactions = await storage.deleteTransactionsByUserId(userId);
      console.log(`Deleted ${deletedTransactions} transactions`);

      // Delete recurring payments created by this user
      console.log("Deleting recurring payments created by user...");
      const deletedPayments = await storage.deleteRecurringPaymentsByUserId(userId);
      console.log(`Deleted ${deletedPayments} recurring payments`);

      // Now delete the user
      console.log("Deleting user account...");
      await storage.deleteUser(userId);

      console.log(`🗑️ Аккаунт пользователя ${user?.username || 'unknown'} удален`);
      res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(400).json({ error: "Failed to delete account" });
    }
  });

  // ===============================
  // СТАТИСТИКА ИСПОЛЬЗОВАНИЯ БД
  // ===============================

  // Получение статистики использования БД
  app.get("/api/db-stats/:familyId", async (req, res) => {
    try {
      const { familyId } = req.params;

      const [categories, accounts, transactions, recurringPayments] = await Promise.all([
        storage.getCategoriesByFamilyId(familyId),
        storage.getAccountsByFamilyId(familyId),
        storage.getTransactionsByFamilyId(familyId),
        storage.getRecurringPaymentsByFamilyId(familyId),
      ]);

      const storageType = process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory';

      const stats = {
        storage: {
          type: storageType,
          isDatabase: !!process.env.DATABASE_URL,
        },
        counts: {
          categories: categories.length,
          accounts: accounts.length,
          transactions: transactions.length,
          recurringPayments: recurringPayments.length,
        },
        totalBalance: accounts.reduce((sum, acc) => sum + Number(acc.balance), 0),
        totalIncome: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalExpenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };

      console.log(`📊 Статистика БД для семьи ${familyId}:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("Get DB stats error:", error);
      res.status(400).json({ error: "Failed to get database statistics" });
    }
  });

  return httpServer;
}
