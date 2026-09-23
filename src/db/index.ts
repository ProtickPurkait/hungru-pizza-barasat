import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __hungruPool?: Pool; __hungruDb?: Database };

function createPool() {
  return new Pool({
    connectionString: serverEnv.databaseUrl(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  });
}

/** Lazily created so `next build` never needs a database connection. */
export function getDb(): Database {
  if (!globalForDb.__hungruDb) {
    globalForDb.__hungruPool ??= createPool();
    globalForDb.__hungruDb = drizzle({ client: globalForDb.__hungruPool, schema });
  }
  return globalForDb.__hungruDb;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
