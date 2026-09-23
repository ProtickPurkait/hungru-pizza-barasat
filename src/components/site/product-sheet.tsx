"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { checkSelection, defaultSelection, priceItem, type Selection } from "@/lib/cart/pricing";
import { useProductSheet } from "@/lib/cart/sheet-store";
import type { SiteProduct } from "@/lib/content/types";
import { formatINR } from "@/lib/money";
import { VegMark } from "@/components/ui/veg-mark";
import { QuantityStepper, useAddToCart } from "./add-to-cart";
import { Price } from "./price";
import { SampleChip } from "./product-card";
import { ProductVisual } from "./product-visual";
import { useSite } from "./site-provider";

function removeItemParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("item")) return;
  url.searchParams.delete("item");
  window.history.replaceState(window.history.state, "", url);
}

/** Single product sheet for the whole site: customise, see the live price, add to cart. */
export function ProductSheet() {
  const { products, categories } = useSite();
  const productId = useProductSheet((s) => s.productId);
  const pushed = useProductSheet((s) => s.pushed);
  const openSheet = useProductSheet((s) => s.open);
  const closeSheet = useProductSheet((s) => s.close);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const product = products.find((p) => p.id === productId) ?? null;

  // Deep links: /menu?item=margherita opens the sheet on load.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("item");
    if (!slug) return;
    const match = products.find((p) => p.slug === slug);
    if (match) {
      openSheet(match.id);
      track("product_view", { item_id: match.id, item_name: match.name, source: "link" });
    } else removeItemParam();
  }, [products, openSheet]);

  // Phone back button closes the sheet.
  useEffect(() => {
    const onPop = () => {
      if (useProductSheet.getState().productId) closeSheet();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [closeSheet]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (product && !dialog.open) dialog.showModal();
    if (!product && dialog.open) dialog.close();
  }, [product]);

  const requestClose = () => {
    if (pushed) window.history.back();
    else {
      removeItemParam();
      closeSheet();
    }
  };

  const categoryName = product ? categories.find((c) => c.id === product.categoryId)?.name : undefined;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) requestClose();
      }}
      aria-labelledby="sheet-title"
      className="sheet mx-auto mt-auto mb-0 max-h-[94dvh] w-full max-w-none overflow-hidden rounded-t-[2rem] bg-cream p-0 text-ink md:m-auto md:max-h-[min(52rem,calc(100dvh-3rem))] md:w-[min(46rem,calc(100vw-3rem))] md:rounded-[2rem]"
    >
      {product && <SheetBody key={product.id} product={product} categoryName={categoryName} onClose={requestClose} />}
    </dialog>
  );
}

function SheetBody({ product, categoryName, onClose }: { product: SiteProduct; categoryName?: string; onClose: () => void }) {
  const { live, mode } = useSite();
  const addToCart = useAddToCart();
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product));
  const [quantity, setQuantity] = useState(1);
  const [showErrors, setShowErrors] = useState(false);

  const check = useMemo(() => checkSelection(product, selection), [product, selection]);
  const priced = useMemo(() => priceItem(product, check.normalized, quantity), [product, check.normalized, quantity]);

  const toggle = (groupId: string, optionId: string, type: "single" | "multiple", max: number) => {
    setSelection((prev) => {
      const current = prev[groupId] ?? [];
      if (type === "single") return { ...prev, [groupId]: current[0] === optionId ? current : [optionId] };
      if (current.includes(optionId)) return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      if (max > 0 && current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const submit = () => {
    if (!check.ok) {
      setShowErrors(true);
      const first = product.options.find((g) => check.errors[g.id]);
      document.getElementById(`group-${first?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (addToCart(product, undefined, check.normalized, quantity)) onClose();
  };

  return (
    <div className="flex max-h-[inherit] flex-col">
      <div className="relative flex-1 overflow-y-auto overscroll-contain">
        <div className="relative aspect-[4/3] bg-accent md:aspect-[16/9]">
          <div aria-hidden className="absolute inset-x-10 top-8 bottom-0 rounded-t-full bg-white/25" />
          <ProductVisual product={product} categoryName={categoryName} sizes="(min-width: 768px) 46rem, 100vw" className="absolute inset-0" priority />
          <div aria-hidden className="absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-ink/25 md:hidden" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-ink text-cream shadow-lg transition-transform hover:rotate-90"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 pt-5 pb-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <VegMark diet={product.diet} />
            {product.isBestseller && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-extrabold text-white uppercase">★ Best seller</span>}
            {product.badge && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-extrabold text-accent uppercase">{product.badge}</span>}
            {product.isSample && <SampleChip />}
          </div>
          <h2 id="sheet-title" className="font-display mt-2 text-4xl leading-[0.95] uppercase sm:text-5xl">
            {product.name}
          </h2>
          <Price price={product.price} discountPrice={product.discountPrice} size="lg" showPercent className="mt-2" />
          {product.description && <p className="mt-3 text-base leading-relaxed text-ink/75">{product.description}</p>}

          {product.options.map((group) => {
            const chosen = selection[group.id] ?? [];
            const error = showErrors ? check.errors[group.id] : undefined;
            return (
              <fieldset key={group.id} id={`group-${group.id}`} className="mt-6" aria-describedby={error ? `err-${group.id}` : undefined}>
                <legend className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-extrabold">{group.name}</span>
                  <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-bold", group.required ? "bg-ink text-cream" : "bg-ink/10 text-ink/70")}>
                    {group.required ? "Required" : "Optional"} ·{" "}
                    {group.type === "single" ? "pick 1" : group.maxSelect > 0 ? `up to ${group.maxSelect}` : "pick any"}
                  </span>
                </legend>
                {error && (
                  <p id={`err-${group.id}`} role="alert" className="mt-1 text-sm font-bold text-primary">
                    {error}
                  </p>
                )}
                <div className={clsx("mt-3 flex flex-col gap-2", error && "rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-cream")}>
                  {group.options.map((option) => {
                    const selected = chosen.includes(option.id);
                    const disabled = !option.isAvailable || (!selected && group.type === "multiple" && group.maxSelect > 0 && chosen.length >= group.maxSelect);
                    return (
                      <label
                        key={option.id}
                        className={clsx(
                          "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 transition-all",
                          selected ? "border-ink shadow-[3px_3px_0_0_var(--color-ink)]" : "border-ink/10 hover:border-ink/30",
                          disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <input
                          type={group.type === "single" ? "radio" : "checkbox"}
                          name={`opt-${group.id}`}
                          checked={selected}
                          disabled={disabled}
                          onChange={() => toggle(group.id, option.id, group.type, group.maxSelect)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={clsx(
                            "flex size-6 shrink-0 items-center justify-center border-2 border-ink transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent",
                            group.type === "single" ? "rounded-full" : "rounded-md",
                            selected ? "bg-ink text-cream" : "bg-white",
                          )}
                        >
                          {selected && <Check className="size-3.5" strokeWidth={4} />}
                        </span>
                        <span className="flex-1 font-semibold">
                          {option.name}
                          {!option.isAvailable && <span className="ml-2 text-xs font-bold text-meat">Sold out</span>}
                        </span>
                        {option.priceDelta > 0 && <span className="font-bold tabular-nums text-ink/70">+{formatINR(option.priceDelta)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="mt-7 flex items-center justify-between gap-4">
            <span className="text-lg font-extrabold">Quantity</span>
            <QuantityStepper quantity={quantity} onChange={(q) => setQuantity(Math.max(1, q))} label={product.name} size="lg" />
          </div>
        </div>
      </div>

      <div className="border-t-2 border-ink/10 bg-cream px-5 pt-3 pb-safe sm:px-7">
        <div className="pb-3">
          {live.ordersPaused && <p className="mb-2 text-center text-sm font-bold text-meat">{live.pausedMessage}</p>}
          {mode === "preview" && <p className="mb-2 text-center text-xs font-bold text-ink/60">Preview mode: adding to cart works; ordering is disabled.</p>}
          <button
            type="button"
            onClick={submit}
            disabled={!product.isAvailable}
            className="flex h-15 w-full items-center justify-between gap-3 rounded-full bg-primary px-6 text-lg font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--color-ink)] ring-2 ring-ink transition-transform active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink)] disabled:bg-ink/30 disabled:shadow-none"
          >
            <span>{product.isAvailable ? "Add to cart" : "Sold out"}</span>
            {product.isAvailable && (
              <span className="flex items-baseline gap-2 tabular-nums">
                {priced.lineOriginalTotal > priced.lineTotal && <s className="text-sm opacity-70">{formatINR(priced.lineOriginalTotal)}</s>}
                {formatINR(priced.lineTotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
