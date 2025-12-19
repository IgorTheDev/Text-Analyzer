import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/text_analyzer";

// Create the connection
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
