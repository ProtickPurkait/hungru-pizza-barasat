import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in (see README → Configuration).`);
  }
  return value;
}

/**
 * Design preview without a database (`DEMO_MODE=true`): the public site renders built-in, clearly-labelled sample
 * content, checkout shows a confirmation without saving, and the admin is unavailable. Opt-in only, so a real
 * deployment that's missing DATABASE_URL still fails loudly instead of showing sample content.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export const serverEnv = {
  databaseUrl: () => required("DATABASE_URL"),
  mediaStorage: (): "db" | "fs" => (process.env.MEDIA_STORAGE === "fs" ? "fs" : "db"),
  mediaDir: () => process.env.MEDIA_DIR || "./storage/media",
  isProduction: process.env.NODE_ENV === "production",
};

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
