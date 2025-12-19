import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db.js";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

console.log("Starting server...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL from env:", process.env.DATABASE_URL);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function waitForDatabase(url: string, maxAttempts = 30, delay = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = postgres(url, { prepare: false, connect_timeout: 5 });
      await client`SELECT 1`;
      await client.end();
      console.log("Database is ready!");
      return;
    } catch (error) {
      console.log(`Database not ready, attempt ${attempt}/${maxAttempts}. Waiting...`);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error("Database connection timeout");
}

async function runMigrations() {
  console.log("Running migrations...");

  // Wait for database to be ready
  await waitForDatabase(process.env.DATABASE_URL!);

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });

  // We should not decide "migrations are done" by checking a single table.
  // Instead, check the actual applied Drizzle migration history.
  // If the history is missing/empty (e.g., schema exists but entries were cleared),
  // Drizzle won't know what has been applied and we must run migrate().
  try {
    const [{ exists }] = await client<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'drizzle'
          AND table_name = '__drizzle_migrations'
      ) as exists;
    `;

    if (exists) {
      const [{ count }] = await client<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM drizzle.__drizzle_migrations
      `;

      // If there are already applied migrations and we are not forcing, we can skip.
      // Otherwise, run migrate() to bring DB up-to-date.
      const forceMigrate = process.env.FORCE_MIGRATE === "true";
      if (count > 0 && !forceMigrate) {
        console.log(`Found ${count} applied migrations, skipping migrate()`);
        console.log('Set FORCE_MIGRATE=true to force run migrations');
        return;
      }

      if (count === 0) {
        console.log("Migration history table exists but is empty; will run migrations");
      } else {
        console.log("FORCE_MIGRATE=true, will run migrations");
      }
    } else {
      console.log("Migration history table doesn't exist; will run migrations");
    }
  } catch (error) {
    console.log("Could not inspect migration history, will attempt to run migrations anyway:", error);
  } finally {
    await client.end();
  }

  await migrate(db, {
    migrationsFolder: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations"),
  });

  console.log("Migrations completed successfully!");
}

(async () => {
  console.log("FORCE_MIGRATE:", process.env.FORCE_MIGRATE);

  // In docker/dev we run migrations via script/migrate.ts (docker-compose entrypoint).
  // Running them again here can race or break if migration history was cleared.
  const runMigrationsInServer = process.env.RUN_MIGRATIONS_IN_SERVER === "true";

  if (runMigrationsInServer) {
    console.log("RUN_MIGRATIONS_IN_SERVER=true, running migrations");
    await runMigrations();
  } else {
    console.log("Skipping migrations in server process (set RUN_MIGRATIONS_IN_SERVER=true to enable)");
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || (process.env.NODE_ENV === "development" ? "4000" : "5000"), 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
