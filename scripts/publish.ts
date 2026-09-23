/** Publishes the current CMS content from the command line (same as the Publish button). */
import { publishContent } from "../src/lib/content/publish";
import { connect } from "./db";

async function main() {
  const { db, pool } = connect();
  const row = await publishContent(db, null, process.argv[2] ?? "Published from the command line");
  await pool.end();
  console.log(`✓ Published version #${row.id}. Running sites pick it up within 5 minutes (or instantly after the next admin publish).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
