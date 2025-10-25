import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL (or SUPABASE_DB_URL) must be set.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/backend/db/schema/**/*.ts",
  out: "./app/backend/db/migrations",
  dbCredentials: { url: connectionString },
  strict: true,
});
