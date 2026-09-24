"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { isLoginBlocked, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { createSession, destroySession, requestMeta } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(200),
  password: z.string().max(200),
  next: z.string().max(500).optional(),
});

export type LoginState = { error?: string; email?: string };

function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return "/admin";
  return next;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (isDemoMode()) return { error: "The admin isn't available in the design preview." };
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success || !parsed.data.email || !parsed.data.password) {
    return { error: "Enter your email and password.", email: String(formData.get("email") ?? "") };
  }
  const { email, password, next } = parsed.data;
  const { ip } = await requestMeta();

  if (await isLoginBlocked(email, ip)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const user = rows[0];
  const valid = user ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);

  if (!user || !valid || user.disabled) {
    await recordLoginAttempt(email, ip, false);
    return {
      error: user?.disabled && valid ? "This account has been disabled." : "That email and password don't match.",
      email,
    };
  }

  await recordLoginAttempt(email, ip, true);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  redirect(safeNext(next));
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
