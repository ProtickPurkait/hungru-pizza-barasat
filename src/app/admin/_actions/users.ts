"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { invalid, safeAction, type ActionResult } from "@/lib/actions";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessionsForUser, requireAdmin } from "@/lib/auth/session";

const passwordSchema = z.string().superRefine((v, ctx) => {
  const problem = passwordProblem(v);
  if (problem) ctx.addIssue({ code: "custom", message: problem });
});

export async function changeOwnPassword(input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    const parsed = z
      .object({ current: z.string().min(1, "Enter your current password"), next: passwordSchema, confirm: z.string() })
      .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords don't match" })
      .safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(row.passwordHash, parsed.data.current))) {
      return { ok: false, message: "Your current password is incorrect.", fieldErrors: { current: "Incorrect password" } };
    }
    await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(adminUsers.id, user.id));
    // Sign out every other device, keep this one signed in.
    await destroyAllSessionsForUser(user.id);
    await createSession(user.id);
    return { ok: true, message: "Password changed. Other devices were signed out." };
  });
}

const newUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: passwordSchema,
  role: z.enum(["owner", "editor"]),
});

export async function createAdminUser(input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin({ role: "owner" });
    const parsed = newUserSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
    if (existing[0]) return { ok: false, message: "An account with that email already exists.", fieldErrors: { email: "Already in use" } };
    await db.insert(adminUsers).values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    });
    return { ok: true, message: `Account created for ${parsed.data.email}. Share the password with them securely.` };
  });
}

async function assertNotLastOwner(userId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(and(eq(adminUsers.role, "owner"), eq(adminUsers.disabled, false), ne(adminUsers.id, userId)));
  return n > 0;
}

export async function setAdminUserDisabled(id: string, disabled: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    const me = await requireAdmin({ role: "owner" });
    const userId = z.uuid().parse(id);
    if (userId === me.id) return { ok: false, message: "You can't disable your own account." };
    if (disabled && !(await assertNotLastOwner(userId))) return { ok: false, message: "Keep at least one active owner." };
    await db.update(adminUsers).set({ disabled: Boolean(disabled) }).where(eq(adminUsers.id, userId));
    if (disabled) await destroyAllSessionsForUser(userId);
    return { ok: true, message: disabled ? "Account disabled and signed out." : "Account re-enabled." };
  });
}

export async function resetAdminUserPassword(id: string, password: string): Promise<ActionResult> {
  return safeAction(async () => {
    const me = await requireAdmin({ role: "owner" });
    const userId = z.uuid().parse(id);
    if (userId === me.id) return { ok: false, message: "Use “Change your password” for your own account." };
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid password." };
    await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data) }).where(eq(adminUsers.id, userId));
    await destroyAllSessionsForUser(userId);
    return { ok: true, message: "Password reset. They'll need to sign in again." };
  });
}

export async function deleteAdminUser(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    const me = await requireAdmin({ role: "owner" });
    const userId = z.uuid().parse(id);
    if (userId === me.id) return { ok: false, message: "You can't delete your own account." };
    if (!(await assertNotLastOwner(userId))) return { ok: false, message: "Keep at least one active owner." };
    await db.delete(adminUsers).where(eq(adminUsers.id, userId));
    return { ok: true, message: "Account deleted." };
  });
}
