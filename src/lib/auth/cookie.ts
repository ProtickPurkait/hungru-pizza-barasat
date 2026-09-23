/** Shared by proxy.ts (edge of the app) and the session module. Keep dependency-free. */
const SECURE_NAME = "__Host-hungru_admin";
const PLAIN_NAME = "hungru_admin";

export const SESSION_COOKIE_NAMES = [SECURE_NAME, PLAIN_NAME] as const;

export function shouldUseSecureCookies() {
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function sessionCookieName() {
  return shouldUseSecureCookies() ? SECURE_NAME : PLAIN_NAME;
}
