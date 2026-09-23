import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getSession()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <main className="admin grain flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_122_26/0.35),transparent_70%)]"
      />
      <div className="relative z-10 w-full max-w-sm">
        <p className="font-display text-center text-5xl leading-none text-cream uppercase">
          Hungru<span className="text-primary">.</span>
        </p>
        <p className="mt-2 text-center text-sm text-cream/70">Website admin</p>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
          <h1 className="text-xl font-bold text-stone-900">Sign in</h1>
          <p className="mt-1 text-sm text-stone-500">Manage your menu, offers and website content.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
        <p className="mt-6 text-center text-xs text-cream/50">
          Forgot your password? Ask the account owner to reset it, or run{" "}
          <code className="rounded bg-white/10 px-1">npm run admin:create -- --reset</code>.
        </p>
      </div>
    </main>
  );
}
