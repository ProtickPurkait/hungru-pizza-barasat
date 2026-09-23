"use client";

import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { formatINR } from "@/lib/money";
import { useCartView } from "./site-provider";

/**
 * Thumb-reach ordering bar on phones: "ORDER NOW" until something is in the cart,
 * then "2 ITEMS · ₹548 → VIEW CART" with the real cart values.
 */
export function StickyOrderBar() {
  const pathname = usePathname();
  const { totals, hydrated } = useCartView();
  const lastAddAt = useCart((s) => s.lastAdd?.at ?? 0);

  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/order")) return null;
  const hasItems = hydrated && totals.itemCount > 0;
  if (!hasItems && pathname.startsWith("/menu")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href={hasItems ? "/cart" : "/menu"}
        data-cart-target="primary"
        className={clsx(
          "pointer-events-auto flex h-16 items-center justify-between gap-3 rounded-full px-6 font-extrabold tracking-wide uppercase ring-2 ring-ink transition-all duration-300",
          hasItems
            ? "bg-ink text-cream shadow-[4px_4px_0_0_var(--brand-primary)]"
            : "bg-primary text-white shadow-[4px_4px_0_0_var(--color-ink)]",
        )}
      >
        {hasItems ? (
          <>
            <span className="flex min-w-0 items-center gap-3">
              <span
                key={lastAddAt}
                className={clsx(
                  "flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-2 text-sm text-ink",
                  lastAddAt > 0 && "animate-pop",
                )}
              >
                {totals.itemCount}
              </span>
              <span className="truncate text-base tabular-nums">
                {totals.itemCount === 1 ? "item" : "items"} · {formatINR(totals.total)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-base">
              View cart <ArrowRight className="size-5" aria-hidden />
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-3 text-lg">
              <span aria-hidden className="text-2xl">
                🍕
              </span>
              Order now
            </span>
            <ArrowRight className="size-6" aria-hidden />
          </>
        )}
      </Link>
    </div>
  );
}
