"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { checkSelection, computeTotals, priceItem, type PricedItem, type Totals } from "@/lib/cart/pricing";
import { useCart, type CartLine } from "@/lib/cart/store";
import type { Live, Ordering } from "@/lib/content/schemas";
import type { SiteCategory, SiteData, SiteProduct } from "@/lib/content/types";

export type ClientSiteData = {
  mode: SiteData["mode"];
  brand: { name: string; location: string };
  products: SiteProduct[];
  categories: SiteCategory[];
  bestsellerIds: string[];
  ordering: Ordering;
  live: Live;
  contact: { phone: string; whatsapp: string };
};

const SiteContext = createContext<ClientSiteData | null>(null);

export function SiteProvider({ data, children }: { data: ClientSiteData; children: ReactNode }) {
  useEffect(() => {
    // Restore the saved cart after hydration (avoids server/client mismatch).
    void useCart.persist.rehydrate();
  }, []);
  return <SiteContext.Provider value={data}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

export function useProductMap() {
  const { products } = useSite();
  return useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
}

export type CartViewLine = CartLine & {
  product: SiteProduct | null;
  priced: PricedItem | null;
  problem: string | null;
};

/** Cart lines re-priced against the current menu, with anything no longer orderable flagged. */
export function useCartView(fulfillment: "delivery" | "pickup" | null = null) {
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const byId = useProductMap();
  const { ordering } = useSite();

  return useMemo(() => {
    const view: CartViewLine[] = lines.map((line) => {
      const product = byId.get(line.productId) ?? null;
      if (!product) return { ...line, product: null, priced: null, problem: "No longer on the menu" };
      if (!product.isAvailable) return { ...line, product, priced: null, problem: "Sold out right now" };
      const check = checkSelection(product, line.selection);
      if (!check.ok) return { ...line, product, priced: null, problem: Object.values(check.errors)[0] ?? "Options changed" };
      return { ...line, product, priced: priceItem(product, check.normalized, line.quantity), problem: null };
    });
    const valid = view.filter((l) => l.priced);
    const fee = fulfillment === "delivery" ? (ordering.deliveryFee ?? 0) : 0;
    const totals: Totals = computeTotals(
      valid.map((l) => ({ quantity: l.quantity, lineTotal: l.priced!.lineTotal, lineOriginalTotal: l.priced!.lineOriginalTotal })),
      fee,
    );
    const belowMinimum = ordering.minOrder !== null && totals.total - totals.deliveryFee < ordering.minOrder;
    return { lines: view, validLines: valid, totals, hydrated, hasProblems: view.some((l) => l.problem), belowMinimum };
  }, [lines, byId, ordering, fulfillment, hydrated]);
}

/** Quantity of a product already in the cart (all customisations combined). */
export function useQuantityInCart(productId: string) {
  return useCart((s) => s.lines.reduce((n, l) => (l.productId === productId ? n + l.quantity : n), 0));
}
