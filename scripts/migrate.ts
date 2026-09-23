import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect } from "./db";

async function main() {
  const { db, pool } = connect();
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  await pool.end();
  console.log("✓ Database is up to date");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
