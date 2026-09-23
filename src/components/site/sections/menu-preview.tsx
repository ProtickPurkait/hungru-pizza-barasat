"use client";

import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { SiteCategory, SiteProduct } from "@/lib/content/types";
import { MenuItemCard } from "../product-card";
import { SectionHeading } from "../section-heading";

const PREVIEW_COUNT = 6;

export function MenuPreviewSection({
  heading,
  categories,
  products,
}: {
  heading: { eyebrow: string; heading: string; subtext: string };
  categories: SiteCategory[];
  products: SiteProduct[];
}) {
  const withItems = categories.filter((c) => products.some((p) => p.categoryId === c.id));
  const [active, setActive] = useState(withItems[0]?.id ?? "");
  const reduce = useReducedMotion();
  if (withItems.length === 0) return null;
  const items = products.filter((p) => p.categoryId === active);
  const activeCategory = withItems.find((c) => c.id === active);

  return (
    <section id="menu" aria-labelledby="menu-heading" className="bg-cream-2 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="menu-heading" {...heading} />
        <div
          role="tablist"
          aria-label="Menu categories"
          className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {withItems.map((category) => {
            const selected = category.id === active;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                id={`tab-${category.id}`}
                aria-selected={selected}
                aria-controls="menu-preview-panel"
                onClick={() => setActive(category.id)}
                className={clsx(
                  "relative h-12 shrink-0 rounded-full px-5 text-base font-extrabold tracking-wide uppercase transition-colors",
                  selected ? "text-cream" : "bg-white text-ink ring-2 ring-ink/10 hover:ring-ink/30",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="menu-tab"
                    className="absolute inset-0 rounded-full bg-ink shadow-[3px_3px_0_0_var(--brand-primary)]"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{category.name}</span>
              </button>
            );
          })}
        </div>
        <div id="menu-preview-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.ul
              key={active}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            >
              {items.slice(0, PREVIEW_COUNT).map((product) => (
                <li key={product.id}>
                  <MenuItemCard product={product} categoryName={activeCategory?.name} />
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
          <div className="mt-8 flex justify-center">
            <Link
              href={`/menu#${activeCategory?.slug ?? ""}`}
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-primary px-8 text-base font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--color-ink)] ring-2 ring-ink transition-transform hover:-translate-y-0.5"
            >
              {items.length > PREVIEW_COUNT ? `See all ${items.length} ${activeCategory?.name ?? ""}` : "See the full menu"}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
