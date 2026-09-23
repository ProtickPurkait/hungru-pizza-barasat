"use server";

import { zodFieldErrors } from "@/lib/actions";
import { requestMeta } from "@/lib/auth/session";
import { getSiteData } from "@/lib/content/get-site-content";
import { CheckoutError, checkoutSchema, placeOrder } from "@/lib/ordering/place-order";

export type CheckoutResult =
  { ok: true; token: string; reference: string; total: number } | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function submitOrder(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);
    if (fieldErrors.website) return { ok: false, message: "We couldn't place your order. Please try again." };
    return { ok: false, message: fieldErrors.lines ?? "Please check the highlighted details.", fieldErrors };
  }
  try {
    const [site, meta] = await Promise.all([getSiteData(), requestMeta()]);
    const order = await placeOrder(parsed.data, site, meta.ip);
    return { ok: true, token: order.publicToken, reference: order.reference, total: order.total };
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
    console.error("[checkout] failed to place order", error);
    return { ok: false, message: "Something went wrong while placing your order. Please try again, or call us." };
  }
}
