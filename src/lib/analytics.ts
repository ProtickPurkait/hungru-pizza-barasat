"use client";

/**
 * Conversion-funnel events. Sent to GA4 and/or Plausible only when an ID is configured in
 * Admin → Settings → Analytics. Nothing is tracked (and no scripts load) otherwise.
 */
export type FunnelEvent =
  | "homepage_view"
  | "menu_view"
  | "product_view"
  | "add_to_cart"
  | "cart_view"
  | "order_initiated"
  | "order_completed";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Props }) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: FunnelEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as Props;
  window.gtag?.("event", event, clean);
  window.plausible?.(event, { props: clean });
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, clean);
}
