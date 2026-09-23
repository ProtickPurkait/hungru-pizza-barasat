"use client";

import { clsx } from "clsx";
import type { SiteProduct } from "@/lib/content/types";
import { VegMark } from "@/components/ui/veg-mark";
import { AddControl, useOpenProduct } from "./add-to-cart";
import { Price } from "./price";
import { ProductVisual } from "./product-visual";

const TINTS = ["bg-accent", "bg-primary", "bg-secondary", "bg-cream-2"];

export function SampleChip({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-cream uppercase",
        className,
      )}
      title="Sample content: the restaurant hasn't replaced this yet"
    >
      Sample
    </span>
  );
}

/** Big, punchy card used in Best Sellers. */
export function FeatureProductCard({ product, index, categoryName }: { product: SiteProduct; index: number; categoryName?: string }) {
  const openProduct = useOpenProduct();
  const tint = TINTS[index % TINTS.length];
  return (
    <article
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white ring-2 ring-ink transition-transform duration-300 hover:-translate-y-1.5",
        "shadow-[5px_5px_0_0_var(--color-ink)] hover:shadow-[8px_8px_0_0_var(--color-ink)]",
        !product.isAvailable && "opacity-75",
      )}
    >
      <button type="button" onClick={() => openProduct(product)} className="relative block text-left" aria-label={`View ${product.name}`}>
        <div className={clsx("relative aspect-[5/4] overflow-hidden", tint)}>
          <div aria-hidden className="absolute inset-x-6 top-6 bottom-0 rounded-t-full bg-white/25" />
          <ProductVisual
            product={product}
            categoryName={categoryName}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw"
            className="absolute inset-0"
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-6"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.badge && (
              <span className="-rotate-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-accent uppercase">
                {product.badge}
              </span>
            )}
            {product.isSample && <SampleChip />}
          </div>
          {!product.isAvailable && (
            <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rotate-[-4deg] rounded-full bg-ink px-4 py-1.5 text-sm font-extrabold tracking-wider text-cream uppercase">
              Sold out
            </span>
          )}
        </div>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <VegMark diet={product.diet} className="mt-1.5" />
          <h3 className="font-display text-2xl leading-none uppercase">{product.name}</h3>
        </div>
        {product.description && <p className="line-clamp-2 text-sm leading-snug text-ink/70">{product.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <Price price={product.price} discountPrice={product.discountPrice} />
          <AddControl product={product} size="sm" />
        </div>
      </div>
    </article>
  );
}

/** Menu list item: row on phones (text left, image right, like the delivery apps people know), card on larger screens. */
export function MenuItemCard({ product, categoryName, priority }: { product: SiteProduct; categoryName?: string; priority?: boolean }) {
  const openProduct = useOpenProduct();
  return (
    <article
      className={clsx(
        "group relative flex gap-4 rounded-3xl bg-white p-3.5 ring-1 ring-ink/10 transition-shadow hover:shadow-[0_18px_40px_-20px_rgb(20_17_16/0.45)] sm:flex-col sm:p-0 sm:ring-2 sm:ring-ink",
        !product.isAvailable && "bg-white/70",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:order-2 sm:px-4 sm:pb-4">
        <div className="flex items-center gap-2">
          <VegMark diet={product.diet} size={15} />
          {product.isBestseller && <span className="text-[11px] font-extrabold tracking-wider text-primary uppercase">★ Best seller</span>}
          {product.badge && !product.isBestseller && (
            <span className="text-[11px] font-extrabold tracking-wider text-primary uppercase">{product.badge}</span>
          )}
          {product.isSample && <SampleChip />}
        </div>
        <h3>
          <button
            type="button"
            onClick={() => openProduct(product)}
            className="text-left text-lg leading-tight font-extrabold after:absolute after:inset-0 sm:text-xl"
          >
            {product.name}
          </button>
        </h3>
        <Price price={product.price} discountPrice={product.discountPrice} size="sm" showPercent />
        {product.description && <p className="line-clamp-2 text-sm leading-snug text-ink/65">{product.description}</p>}
        <div className="relative z-10 mt-auto hidden items-center justify-between pt-3 sm:flex">
          {!product.isAvailable ? <span className="text-sm font-bold text-meat">Sold out right now</span> : <span />}
          <AddControl product={product} size="sm" />
        </div>
      </div>
      <div className="relative w-[7.5rem] shrink-0 self-start sm:order-1 sm:w-full">
        <ProductVisual
          product={product}
          categoryName={categoryName}
          priority={priority}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 120px"
          className={clsx(
            "aspect-square rounded-2xl bg-cream-2 sm:aspect-[4/3] sm:rounded-t-[1.35rem] sm:rounded-b-none",
            !product.isAvailable && "grayscale",
          )}
          imageClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="relative z-10 -mt-5 flex justify-center sm:hidden">
          <AddControl product={product} size="sm" />
        </div>
      </div>
    </article>
  );
}
