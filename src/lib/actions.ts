import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export type ActionResult<T = undefined> =
  { ok: true; message?: string; data?: T } | { ok: false; message: string; fieldErrors?: FieldErrors };

/** An error whose message is safe to show to the admin. */
export class UserFacingError extends Error {}

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors = zodFieldErrors(error);
  const count = Object.keys(fieldErrors).length;
  return {
    ok: false,
    message: count === 1 ? "Please fix the highlighted field." : `Please fix the ${count} highlighted fields.`,
    fieldErrors,
  };
}

/** Wraps a Server Action body: lets redirects through, turns known errors into friendly messages. */
export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UserFacingError || (error instanceof Error && error.name === "AuthorizationError")) {
      return { ok: false, message: error.message };
    }
    console.error("[admin action] unexpected error", error);
    return { ok: false, message: "Something went wrong while saving. Please try again." };
  }
}
