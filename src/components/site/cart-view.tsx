"use client";

import { clsx } from "clsx";
import { AlertTriangle, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/lib/cart/store";
import { formatINR } from "@/lib/money";
import { VegMark } from "@/components/ui/veg-mark";
import { AddControl, QuantityStepper } from "./add-to-cart";
import { ProductVisual } from "./product-visual";
import { useCartView, useSite } from "./site-provider";

export function CartView() {
  const { lines, totals, hydrated, hasProblems, belowMinimum } = useCartView();
  const { ordering, live, products, categories, mode } = useSite();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.productId));
    const extraCats = new Set(categories.filter((c) => /side|bever|drink|dessert|dip|extra/i.test(c.name)).map((c) => c.id));
    return products.filter((p) => extraCats.has(p.categoryId) && !inCart.has(p.id) && p.isAvailable).slice(0, 6);
  }, [lines, products, categories]);

  const handoff = ordering.mode === "external" || ordering.mode === "phone";
  const blocked = totals.itemCount === 0 || hasProblems || belowMinimum || (!handoff && live.ordersPaused);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10" aria-busy="true">
        <div className="h-12 w-48 animate-pulse rounded-xl bg-ink/10" />
        <div className="mt-6 h-28 animate-pulse rounded-3xl bg-ink/10" />
        <div className="mt-3 h-28 animate-pulse rounded-3xl bg-ink/10" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex size-24 -rotate-6 items-center justify-center rounded-3xl bg-accent ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)]">
          <ShoppingBag className="size-11" aria-hidden />
        </span>
        <h1 className="font-display mt-8 text-6xl leading-none uppercase">Cart&apos;s empty</h1>
        <p className="mt-3 text-lg text-ink/65">Your next favourite pizza is one tap away.</p>
        <Link
          href="/menu"
          className="mt-8 inline-flex h-15 items-center gap-2 rounded-full bg-primary px-9 text-lg font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--color-ink)] ring-2 ring-ink"
        >
          Browse the menu <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-40 sm:px-6 lg:grid lg:grid-cols-[1fr_24rem] lg:gap-10 lg:px-8 lg:pb-16">
      <div>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(3rem,12vw,5.5rem)] leading-[0.85] uppercase">Your cart</h1>
          <Link href="/menu" className="mb-2 shrink-0 text-sm font-extrabold tracking-wide text-primary uppercase underline-offset-4 hover:underline">
            + Add more
          </Link>
        </div>

        {hasProblems && (
          <div role="alert" className="mt-5 flex gap-3 rounded-2xl bg-accent/40 p-4 ring-2 ring-accent">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="font-semibold">Some items can&apos;t be ordered right now. Remove them to continue.</p>
          </div>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {lines.map((line) => {
            const product = line.product;
            const name = product?.name ?? "Item no longer available";
            return (
              <li
                key={line.key}
                className={clsx("flex gap-3 rounded-3xl bg-white p-3 ring-1 ring-ink/10 sm:gap-4 sm:p-4", line.problem && "bg-white/60 ring-2 ring-meat/40")}
              >
                {product ? (
                  <ProductVisual product={product} sizes="96px" className={clsx("size-20 shrink-0 rounded-2xl bg-cream-2 sm:size-24", line.problem && "grayscale")} />
                ) : (
                  <span className="size-20 shrink-0 rounded-2xl bg-ink/5 sm:size-24" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-2 font-extrabold leading-tight">
                      {product && <VegMark diet={product.diet} size={14} />}
                      <span className={clsx(line.problem && "line-through opacity-60")}>{name}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      aria-label={`Remove ${name}`}
                      className="-mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full text-ink/65 hover:bg-ink/5 hover:text-meat"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  {line.priced && line.priced.options.length > 0 && (
                    <p className="text-sm text-ink/60">{line.priced.options.map((o) => o.optionName).join(" · ")}</p>
                  )}
                  {line.problem && <p className="text-sm font-bold text-meat">{line.problem}</p>}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    {line.priced ? (
                      <QuantityStepper quantity={line.quantity} onChange={(q) => setQuantity(line.key, q)} label={name} size="sm" />
                    ) : (
                      <button type="button" onClick={() => remove(line.key)} className="h-9 rounded-full bg-ink px-4 text-sm font-bold text-cream">
                        Remove
                      </button>
                    )}
                    {line.priced && (
                      <span className="text-right">
                        {line.priced.lineOriginalTotal > line.priced.lineTotal && (
                          <s className="block text-xs font-semibold text-ink/65 tabular-nums">{formatINR(line.priced.lineOriginalTotal)}</s>
                        )}
                        <span className="text-lg font-extrabold tabular-nums">{formatINR(line.priced.lineTotal)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {suggestions.length > 0 && (
          <section aria-labelledby="suggest-heading" className="mt-10">
            <h2 id="suggest-heading" className="font-display text-3xl uppercase">
              Goes well with
            </h2>
            <ul className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
              {suggestions.map((p) => (
                <li key={p.id} className="w-40 shrink-0 rounded-3xl bg-white p-3 ring-1 ring-ink/10">
                  <ProductVisual product={p} sizes="160px" className="aspect-square rounded-2xl bg-cream-2" />
                  <p className="mt-2 truncate font-bold">{p.name}</p>
                  <p className="text-sm font-semibold text-ink/60">{formatINR(p.discountPrice ?? p.price)}</p>
                  <div className="mt-2">
                    <AddControl product={p} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside aria-label="Order summary" className="mt-10 lg:mt-24">
        <div className="rounded-[1.75rem] bg-white p-5 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)] lg:sticky lg:top-24">
          <h2 className="font-display text-3xl uppercase">Summary</h2>
          <dl className="mt-4 flex flex-col gap-2 text-base">
            <div className="flex justify-between">
              <dt className="text-ink/70">Subtotal ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"})</dt>
              <dd className="font-bold tabular-nums">{formatINR(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-basil">
                <dt className="font-semibold">Discount</dt>
                <dd className="font-bold tabular-nums">−{formatINR(totals.discount)}</dd>
              </div>
            )}
            {ordering.delivery && ordering.deliveryFee !== null && ordering.deliveryFee > 0 && !handoff && (
              <div className="flex justify-between text-sm">
                <dt className="text-ink/60">Delivery fee (if delivered)</dt>
                <dd className="font-semibold tabular-nums text-ink/60">{formatINR(ordering.deliveryFee)}</dd>
              </div>
            )}
            <div className="mt-2 flex items-baseline justify-between border-t-2 border-dashed border-ink/15 pt-3">
              <dt className="text-lg font-extrabold">Total</dt>
              <dd className="font-display text-4xl tabular-nums">{formatINR(totals.total)}</dd>
            </div>
          </dl>
          {belowMinimum && ordering.minOrder !== null && (
            <p className="mt-3 rounded-xl bg-accent/40 px-3 py-2 text-sm font-bold">
              Minimum order is {formatINR(ordering.minOrder)}. Add {formatINR(ordering.minOrder - (totals.total - totals.deliveryFee))} more.
            </p>
          )}
          {!handoff && live.ordersPaused && <p className="mt-3 rounded-xl bg-accent/40 px-3 py-2 text-sm font-bold">{live.pausedMessage}</p>}
          {mode === "preview" && <p className="mt-3 text-sm font-semibold text-ink/60">Preview mode: you can try checkout, but real orders are disabled.</p>}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink/10 bg-cream/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
            <Link
              href={blocked ? "#" : "/checkout"}
              aria-disabled={blocked}
              onClick={(e) => blocked && e.preventDefault()}
              className={clsx(
                "flex h-16 items-center justify-between gap-3 rounded-full px-6 text-lg font-extrabold tracking-wide uppercase ring-2 ring-ink transition-transform",
                blocked ? "cursor-not-allowed bg-ink/20 text-ink/65 ring-ink/20" : "bg-primary text-white shadow-[4px_4px_0_0_var(--color-ink)] active:translate-y-0.5",
              )}
            >
              <span>Proceed to order</span>
              <span className="flex items-center gap-2 tabular-nums">
                {formatINR(totals.total)} <ArrowRight className="size-5" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
