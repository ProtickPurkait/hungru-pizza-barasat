/** Standalone DB connection for CLI scripts (migrate, seed, admin:create). */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

config({ path: [".env.local", ".env"], quiet: true });

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, max: 2 });
  const db = drizzle({ client: pool, schema });
  return { db, pool };
}
