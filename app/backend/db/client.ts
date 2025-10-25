import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL (or SUPABASE_DB_URL) must be set.");
}

// Supabase “transaction” pool requires prepare=false.
export const pgClient = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20,
  max: 10,
  ssl: "require",
});

export const db = drizzle(pgClient);
