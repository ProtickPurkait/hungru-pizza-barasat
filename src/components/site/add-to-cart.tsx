"use client";

import { clsx } from "clsx";
import { Check, Minus, Plus } from "lucide-react";
import { useCallback, useState, type MouseEvent } from "react";
import { track } from "@/lib/analytics";
import { basePrice, defaultSelection, lineKey, type Selection } from "@/lib/cart/pricing";
import { useProductSheet } from "@/lib/cart/sheet-store";
import { useCart } from "@/lib/cart/store";
import type { SiteProduct } from "@/lib/content/types";
import { useQuantityInCart } from "./site-provider";

export function needsCustomisation(product: SiteProduct) {
  return product.options.length > 0;
}

/** Opens the product sheet (and records it in history so the phone's back button closes it). */
export function useOpenProduct() {
  const open = useProductSheet((s) => s.open);
  return useCallback(
    (product: SiteProduct) => {
      const url = new URL(window.location.href);
      url.searchParams.set("item", product.slug);
      window.history.pushState({ hungruSheet: product.id }, "", url);
      open(product.id, { pushed: true });
      track("product_view", { item_id: product.id, item_name: product.name });
    },
    [open],
  );
}

/** Adds to cart with feedback; customisable items open the sheet instead. */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  const openProduct = useOpenProduct();
  return useCallback(
    (product: SiteProduct, event?: MouseEvent<HTMLElement>, selection?: Selection, quantity = 1) => {
      if (!product.isAvailable) return false;
      if (!selection && needsCustomisation(product)) {
        openProduct(product);
        return false;
      }
      const chosen = selection ?? defaultSelection(product);
      const rect = event?.currentTarget.getBoundingClientRect();
      add(product.id, chosen, quantity, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
      navigator.vibrate?.(12);
      track("add_to_cart", { item_id: product.id, item_name: product.name, quantity, value: basePrice(product) / 100, currency: "INR" });
      return true;
    },
    [add, openProduct],
  );
}

export function QuantityStepper({
  quantity,
  onChange,
  label,
  size = "md",
  tone = "light",
  max = 50,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  label: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark" | "brand";
  max?: number;
}) {
  const dims = size === "sm" ? "h-9" : size === "lg" ? "h-13" : "h-11";
  const btn = size === "sm" ? "w-9" : size === "lg" ? "w-13" : "w-11";
  return (
    <div
      role="group"
      aria-label={`Quantity for ${label}`}
      className={clsx(
        "inline-flex items-center overflow-hidden rounded-full font-extrabold",
        dims,
        tone === "brand" ? "bg-primary text-white" : tone === "dark" ? "bg-ink text-cream" : "bg-white text-ink ring-2 ring-ink",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={quantity === 1 ? `Remove ${label}` : `One less ${label}`}
        className={clsx("flex h-full items-center justify-center transition-colors hover:bg-black/10 active:scale-90", btn)}
      >
        <Minus className="size-4" strokeWidth={3} aria-hidden />
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={`One more ${label}`}
        className={clsx(
          "flex h-full items-center justify-center transition-colors hover:bg-black/10 active:scale-90 disabled:opacity-40",
          btn,
        )}
      >
        <Plus className="size-4" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}

/**
 * The ADD control on product cards. Simple items become a quantity stepper once added;
 * customisable items always open the sheet (and show how many are already in the cart).
 */
export function AddControl({ product, size = "md", className }: { product: SiteProduct; size?: "sm" | "md"; className?: string }) {
  const addToCart = useAddToCart();
  const setQuantity = useCart((s) => s.setQuantity);
  const inCart = useQuantityInCart(product.id);
  const [justAdded, setJustAdded] = useState(false);
  const customisable = needsCustomisation(product);
  const simpleKey = lineKey(product.id, defaultSelection(product));
  const simpleQty = useCart((s) => s.lines.find((l) => l.key === simpleKey)?.quantity ?? 0);

  if (!product.isAvailable) {
    return (
      <span
        className={clsx(
          "inline-flex h-11 items-center rounded-full bg-ink/10 px-4 text-sm font-extrabold text-ink/65 uppercase",
          className,
        )}
      >
        Sold out
      </span>
    );
  }

  if (!customisable && simpleQty > 0) {
    return (
      <QuantityStepper
        quantity={simpleQty}
        onChange={(q) => setQuantity(simpleKey, q)}
        label={product.name}
        size={size === "sm" ? "sm" : "md"}
        tone="brand"
      />
    );
  }

  return (
    <div className={clsx("flex flex-col items-center gap-1", className)}>
      <button
        type="button"
        onClick={(e) => {
          if (addToCart(product, e)) {
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1100);
          }
        }}
        aria-label={customisable ? `Customise and add ${product.name}` : `Add ${product.name} to cart`}
        className={clsx(
          "group/add inline-flex items-center justify-center gap-1.5 rounded-full bg-primary font-extrabold tracking-wide text-white uppercase shadow-[3px_3px_0_0_var(--color-ink)] ring-2 ring-ink transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink)]",
          size === "sm" ? "h-10 px-4 text-sm" : "h-11 px-5 text-sm",
        )}
      >
        {justAdded ? (
          <Check className="size-4" strokeWidth={3} aria-hidden />
        ) : (
          <Plus className="size-4 transition-transform group-hover/add:rotate-90" strokeWidth={3} aria-hidden />
        )}
        {justAdded ? "Added" : "Add"}
      </button>
      {customisable && <span className="text-[11px] font-semibold text-ink/65">{inCart > 0 ? `${inCart} in cart` : "Customisable"}</span>}
    </div>
  );
}
