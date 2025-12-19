import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../server/db.js";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function checkTablesExist(client: postgres.Sql) {
  try {
    const result = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'families', 'family_invitations')
    `;
    return result.length === 3; // All required tables exist
  } catch (error) {
    console.log("Error checking tables:", error);
    return false;
  }
}

async function runMigrations() {
  console.log("Checking database state...");

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
    // Check if tables already exist
    const tablesExist = await checkTablesExist(client);

    if (tablesExist) {
      console.log("Database tables already exist, skipping migrations");
    } else {
      console.log("Running migrations...");
      await migrate(db, {
        migrationsFolder: path.join(__dirname, "..", "migrations"),
      });
      console.log("Migrations completed successfully!");
    }
  } catch (error) {
    console.error("Database operation failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
