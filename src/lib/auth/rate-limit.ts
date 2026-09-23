import "server-only";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

export async function isLoginBlocked(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    db
      .select({ n: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false), gt(loginAttempts.attemptedAt, since))),
    db
      .select({ n: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false), gt(loginAttempts.attemptedAt, since))),
  ]);
  return (byEmail[0]?.n ?? 0) >= MAX_FAILURES_PER_EMAIL || (byIp[0]?.n ?? 0) >= MAX_FAILURES_PER_IP;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await db.insert(loginAttempts).values({ email, ip, success });
  if (success) {
    // A successful sign-in clears earlier failures for that account.
    await db.delete(loginAttempts).where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false)));
  }
  // Keep the table small.
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
