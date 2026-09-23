import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { adminSessions, adminUsers, type AdminUser } from "@/db/schema";
import { SESSION_COOKIE_NAMES, sessionCookieName, useSecureCookies } from "./cookie";

const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // sign out after 7 days of inactivity
const ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // always sign in again after 30 days
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000; // extend the idle window at most once a day

export type SessionUser = Pick<AdminUser, "id" | "email" | "name" | "role">;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || h.get("x-real-ip") || "unknown",
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

/** Creates a session and sets the cookie. Only callable from Server Actions / Route Handlers. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const meta = await requestMeta();
  await db.insert(adminSessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(now + IDLE_TIMEOUT_MS),
    absoluteExpiresAt: new Date(now + ABSOLUTE_TIMEOUT_MS),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_TIMEOUT_MS / 1000,
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date(now)));
}

async function readToken() {
  const jar = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    const value = jar.get(name)?.value;
    if (value) return value;
  }
  return null;
}

/** Returns the signed-in admin for this request, or null. Memoised per request. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await readToken();
  if (!token || token.length > 200) return null;
  const now = new Date();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      absoluteExpiresAt: adminSessions.absoluteExpiresAt,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      disabled: adminUsers.disabled,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(and(eq(adminSessions.id, hashToken(token)), gt(adminSessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row || row.disabled || row.absoluteExpiresAt <= now) return null;

  // Sliding idle expiry (stored server-side, so it works even during Server Component renders).
  if (row.expiresAt.getTime() - now.getTime() < IDLE_TIMEOUT_MS - REFRESH_AFTER_MS) {
    const next = new Date(Math.min(now.getTime() + IDLE_TIMEOUT_MS, row.absoluteExpiresAt.getTime()));
    await db.update(adminSessions).set({ expiresAt: next }).where(eq(adminSessions.id, row.sessionId));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/** Guards admin pages and Server Actions. Redirects to the login page when signed out. */
export async function requireAdmin(options: { role?: "owner" } = {}): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  if (options.role === "owner" && user.role !== "owner") {
    throw new AuthorizationError("Only the owner account can do that.");
  }
  return user;
}

export class AuthorizationError extends Error {
  name = "AuthorizationError";
}

export async function destroySession() {
  const token = await readToken();
  if (token) await db.delete(adminSessions).where(eq(adminSessions.id, hashToken(token)));
  const jar = await cookies();
  for (const name of SESSION_COOKIE_NAMES) jar.delete(name);
}

export async function destroyAllSessionsForUser(userId: string) {
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}
