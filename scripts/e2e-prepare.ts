/**
 * Resets the E2E database: drops everything, migrates, loads the SAMPLE demo menu and creates
 * a test admin. Refuses to run against a database whose name doesn't contain "test".
 */
import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { connect } from "./db";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/test/i.test(new URL(url).pathname)) {
    console.error(`Refusing to reset "${new URL(url).pathname}": E2E databases must have "test" in their name.`);
    process.exit(1);
  }
  const { db, pool } = connect();
  await db.execute(sql`drop schema if exists public cascade`);
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`create schema public`);
  await pool.end();
  const env = { ...process.env, ADMIN_EMAIL: "e2e-owner@hungru.test", ADMIN_PASSWORD: "e2e-password-123", ADMIN_NAME: "E2E Owner" };
  execSync("npx tsx scripts/migrate.ts", { stdio: "inherit", env });
  execSync("npx tsx scripts/seed.ts --demo", { stdio: "inherit", env });
  execSync("npx tsx scripts/create-admin.ts", { stdio: "inherit", env });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
