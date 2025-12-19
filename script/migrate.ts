import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../server/db.js";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kept for backwards compatibility with logs; not used for decision-making anymore.
async function checkTablesExist(client: postgres.Sql) {
  try {
    const result = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'families', 'family_invitations', 'categories', 'accounts', 'transactions', 'recurring_payments')
    `;
    return result.length === 7;
  } catch (error) {
    console.log("Error checking tables:", error);
    return false;
  }
}

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
  console.log("Checking database state...");

  // Check if we should force run migrations
  const forceMigrate = process.env.FORCE_MIGRATE === 'true';
  if (forceMigrate) {
    console.log("FORCE_MIGRATE=true, will run migrations regardless of current state");
  }

  // Wait for database to be ready
  await waitForDatabase(process.env.DATABASE_URL!);

  // First, ensure database exists by connecting to postgres database
  const adminConnectionString = process.env.DATABASE_URL!.replace(/\/[^/]*$/, '/postgres');
  const adminClient = postgres(adminConnectionString, { prepare: false });

  try {
    // Create database if it doesn't exist
    await adminClient`CREATE DATABASE familyfinance`;
    console.log("Database created or already exists");
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log("Database already exists");
    } else {
      throw error;
    }
  } finally {
    await adminClient.end();
  }

  // Now connect to the application database
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });

  try {
    // Decision logic: Drizzle will apply only missing migrations.
    // We should not drop tables by default; that destroys user data.
    // FORCE_MIGRATE is interpreted as "still run migrate()" (not "drop everything").
    const tablesExist = await checkTablesExist(client);
    console.log(`Tables present (heuristic): ${tablesExist}`);

    console.log("Running migrations...");
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "..", "migrations"),
    });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Database operation failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error("Migration script failed:", error);
  process.exit(1);
}).finally(() => {
  process.exit(0);
});
