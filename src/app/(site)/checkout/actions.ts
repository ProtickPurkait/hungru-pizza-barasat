"use server";

import { zodFieldErrors } from "@/lib/actions";
import { requestMeta } from "@/lib/auth/session";
import { getSiteData } from "@/lib/content/get-site-content";
import { DEMO_ORDER_TOKEN, encodeDemoOrder } from "@/lib/ordering/demo-order";
import { CheckoutError, checkoutSchema, placeOrder, priceOrder } from "@/lib/ordering/place-order";

export type CheckoutResult =
  | { ok: true; token: string; reference: string; total: number; href: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function submitOrder(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);
    if (fieldErrors.website) return { ok: false, message: "We couldn't place your order. Please try again." };
    return { ok: false, message: fieldErrors.lines ?? "Please check the highlighted details.", fieldErrors };
  }
  try {
    const site = await getSiteData();
    if (site.mode === "demo") {
      // Design preview: price it exactly like a real order, but save nothing.
      const priced = priceOrder(parsed.data, site);
      const encoded = encodeDemoOrder(priced, parsed.data);
      return {
        ok: true,
        token: DEMO_ORDER_TOKEN,
        reference: "DEMO",
        total: priced.totals.total,
        href: `/order/${DEMO_ORDER_TOKEN}?o=${encoded}`,
      };
    }
    const meta = await requestMeta();
    const order = await placeOrder(parsed.data, site, meta.ip);
    return { ok: true, token: order.publicToken, reference: order.reference, total: order.total, href: `/order/${order.publicToken}` };
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
    console.error("[checkout] failed to place order", error);
    return { ok: false, message: "Something went wrong while placing your order. Please try again, or call us." };
  }
}
