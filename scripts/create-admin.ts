/**
 * Creates (or resets the password of) an admin account.
 *   npm run admin:create                       → uses ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME, or asks
 *   npm run admin:create -- --role editor      → creates an editor instead of the owner
 *   npm run admin:create -- --reset            → resets the password of an existing account
 */
import { createInterface } from "node:readline/promises";
import { eq } from "drizzle-orm";
import * as t from "../src/db/schema";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";
import { connect } from "./db";

async function ask(question: string, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    const rlAny = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    rlAny._writeToOutput = (s: string) => {
      if (s.includes(question)) rlAny.output.write(s);
      else rlAny.output.write("*");
    };
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) process.stdout.write("\n");
  return answer.trim();
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const role = args.includes("--role") && args[args.indexOf("--role") + 1] === "editor" ? "editor" : "owner";

  const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That email address doesn't look right.");
  const name = process.env.ADMIN_NAME || (reset ? "" : await ask("Display name: ")) || "Owner";
  const password = process.env.ADMIN_PASSWORD || (await ask("Password (min 10 characters): ", { hidden: true }));
  const problem = passwordProblem(password);
  if (problem) throw new Error(`Password rejected: ${problem}.`);

  const { db, pool } = connect();
  const existing = await db.select().from(t.adminUsers).where(eq(t.adminUsers.email, email)).limit(1);
  const passwordHash = await hashPassword(password);

  if (existing[0]) {
    if (!reset) {
      console.log(`An account for ${email} already exists. Use --reset to set a new password.`);
    } else {
      await db.update(t.adminUsers).set({ passwordHash, disabled: false }).where(eq(t.adminUsers.id, existing[0].id));
      await db.delete(t.adminSessions).where(eq(t.adminSessions.userId, existing[0].id));
      console.log(`✓ Password reset for ${email}. Existing sessions were signed out.`);
    }
  } else {
    await db.insert(t.adminUsers).values({ email, name, passwordHash, role });
    console.log(`✓ Created ${role} account for ${email}. Sign in at /admin/login`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
