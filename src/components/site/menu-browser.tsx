"use client";

import { clsx } from "clsx";
import { ArrowRight, PauseCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatINR } from "@/lib/money";
import { VegMark } from "@/components/ui/veg-mark";
import { MenuItemCard } from "./product-card";
import { useCartView, useSite } from "./site-provider";

const BESTSELLERS = "bestsellers";

export function MenuBrowser() {
  const { products, categories, bestsellerIds, live, contact } = useSite();
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [active, setActive] = useState<string>("");
  const navRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const matches = (p: (typeof products)[number]) =>
    (!vegOnly || p.diet === "veg") && (!q || `${p.name} ${p.description} ${p.badge}`.toLowerCase().includes(q));

  const sections = useMemo(() => {
    const list: { id: string; name: string; description: string; items: typeof products }[] = [];
    if (!q) {
      const byId = new Map(products.map((p) => [p.id, p]));
      const best = bestsellerIds.map((id) => byId.get(id)).filter((p): p is (typeof products)[number] => Boolean(p) && matches(p!));
      if (best.length) list.push({ id: BESTSELLERS, name: "★ Best sellers", description: "", items: best });
    }
    for (const c of categories) {
      const items = products.filter((p) => p.categoryId === c.id && matches(p));
      if (items.length) list.push({ id: c.slug, name: c.name, description: c.description, items });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, bestsellerIds, q, vegOnly]);

  // Scroll-spy: highlight the category currently on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const current = sections.some((s) => s.id === active) ? active : (sections[0]?.id ?? "");

  // Keep the active pill visible in the horizontal category bar.
  useEffect(() => {
    const pill = navRef.current?.querySelector<HTMLElement>(`[data-cat="${current}"]`);
    pill?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

  // Honour /menu#pizzas links once content is on screen.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", `#${id}`);
  };

  const hasVeg = products.some((p) => p.diet === "veg");
  const hasNonVeg = products.some((p) => p.diet === "non_veg");

  if (products.length === 0) {
    return (
      <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <p className="font-display text-6xl uppercase">Menu coming soon</p>
        <p className="mt-4 text-lg text-ink/70">We&apos;re putting the finishing touches on our menu. Check back shortly!</p>
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
            className="mt-8 inline-flex h-14 items-center rounded-full bg-primary px-8 font-extrabold text-white uppercase"
          >
            Call us
          </a>
        )}
      </section>
    );
  }

  return (
    <>
      <div className="grain relative overflow-hidden bg-ink text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--brand-secondary)_0%,transparent_65%)] opacity-50"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-7 sm:px-6 sm:pt-12 lg:px-8">
          <h1 className="font-display enter-rise text-[clamp(3.2rem,15vw,7.5rem)] leading-[0.85] tracking-[-0.035em] uppercase">
            The <span className="text-accent [text-shadow:4px_4px_0_var(--brand-primary)]">menu</span>
          </h1>
          <p className="enter-fade-up mt-3 text-cream/70" style={{ ["--d" as string]: 150 }}>
            Tap anything to see details and customise.
          </p>
          <div className="enter-fade-up mt-6 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ["--d" as string]: 220 }}>
            <label className="relative flex-1 sm:max-w-md">
              <span className="sr-only">Search the menu</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink/65" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pizzas, sides, drinks…"
                className="h-13 w-full rounded-full bg-cream pr-11 pl-12 text-base font-semibold text-ink placeholder:text-ink/45 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink/60 hover:bg-ink/10"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </label>
            {hasVeg && hasNonVeg && (
              <button
                type="button"
                role="switch"
                aria-checked={vegOnly}
                onClick={() => setVegOnly((v) => !v)}
                className={clsx(
                  "inline-flex h-13 items-center gap-3 self-start rounded-full px-5 font-extrabold transition-colors",
                  vegOnly ? "bg-basil text-white" : "bg-cream/10 text-cream hover:bg-cream/15",
                )}
              >
                <VegMark diet="veg" />
                Veg only
                <span
                  aria-hidden
                  className={clsx(
                    "relative block h-6 w-10 shrink-0 rounded-full transition-colors",
                    vegOnly ? "bg-white/30" : "bg-cream/20",
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-1 left-0 size-4 rounded-full bg-white transition-transform",
                      vegOnly ? "translate-x-5" : "translate-x-1",
                    )}
                  />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {live.ordersPaused && (
        <div role="status" className="bg-accent px-4 py-3 text-center font-bold text-ink">
          <PauseCircle className="mr-2 inline size-5 align-[-4px]" aria-hidden />
          {live.pausedMessage}
        </div>
      )}

      <nav aria-label="Menu categories" className="sticky top-16 z-30 border-b-2 border-ink/10 bg-cream/95 backdrop-blur-md">
        <div ref={navRef} className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 no-scrollbar sm:px-6 lg:px-8">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              data-cat={s.id}
              onClick={() => jump(s.id)}
              aria-current={current === s.id ? "true" : undefined}
              className={clsx(
                "h-11 shrink-0 rounded-full px-5 text-sm font-extrabold tracking-wide whitespace-nowrap uppercase transition-all",
                current === s.id
                  ? "bg-ink text-cream shadow-[3px_3px_0_0_var(--brand-primary)]"
                  : "bg-white text-ink ring-2 ring-ink/10 hover:ring-ink/30",
              )}
            >
              {s.name}
              <span className={clsx("ml-1.5 text-xs", current === s.id ? "text-cream/60" : "text-ink/65")}>{s.items.length}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:grid lg:grid-cols-[1fr_22rem] lg:gap-8 lg:px-8">
        <div>
          {sections.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="font-display text-4xl uppercase">No matches</p>
              <p className="mt-2 text-ink/60">
                Nothing on the menu matches “{query}”{vegOnly ? " in veg" : ""}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setVegOnly(false);
                }}
                className="mt-6 h-12 rounded-full bg-ink px-6 font-extrabold text-cream uppercase"
              >
                Show everything
              </button>
            </div>
          )}
          {sections.map((section, si) => (
            <section key={section.id} id={section.id} aria-labelledby={`h-${section.id}`} className="scroll-mt-36 pt-6 first:pt-2">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 id={`h-${section.id}`} className="font-display text-4xl leading-none uppercase sm:text-5xl">
                  {section.name}
                </h2>
                <span className="text-sm font-bold text-ink/65">
                  {section.items.length} item{section.items.length === 1 ? "" : "s"}
                </span>
              </div>
              {section.description && <p className="-mt-2 mb-4 text-ink/65">{section.description}</p>}
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {section.items.map((product, i) => (
                  <li key={`${section.id}-${product.id}`}>
                    <MenuItemCard product={product} categoryName={section.name} priority={si === 0 && i < 2} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <CartSidebar />
      </div>
    </>
  );
}

/** Desktop: a persistent cart summary next to the menu. */
function CartSidebar() {
  const { lines, totals, hydrated } = useCartView();
  const { live } = useSite();
  return (
    <aside aria-label="Your order" className="hidden lg:block">
      <div className="sticky top-36 mt-8 rounded-[1.75rem] bg-white p-5 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)]">
        <h2 className="font-display text-3xl uppercase">Your order</h2>
        {!hydrated || totals.itemCount === 0 ? (
          <p className="mt-3 text-ink/60">Your cart is empty. Tap ADD on anything that looks good.</p>
        ) : (
          <>
            <ul className="mt-4 flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-1">
              {lines.map((line) => (
                <li key={line.key} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-bold">
                      {line.quantity} × {line.product?.name ?? "Unavailable item"}
                    </span>
                    {line.priced && line.priced.options.length > 0 && (
                      <span className="block truncate text-ink/65">{line.priced.options.map((o) => o.optionName).join(", ")}</span>
                    )}
                    {line.problem && <span className="block text-meat">{line.problem}</span>}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{line.priced ? formatINR(line.priced.lineTotal) : "–"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t-2 border-dashed border-ink/15 pt-4">
              <span className="font-bold">Total</span>
              <span className="font-display text-3xl">{formatINR(totals.total)}</span>
            </div>
            {totals.discount > 0 && <p className="text-right text-sm font-bold text-basil">You save {formatINR(totals.discount)}</p>}
            <Link
              href="/cart"
              className="mt-4 flex h-14 items-center justify-center gap-2 rounded-full bg-primary font-extrabold tracking-wide text-white uppercase shadow-[3px_3px_0_0_var(--color-ink)] ring-2 ring-ink"
            >
              View cart <ArrowRight className="size-5" aria-hidden />
            </Link>
            {live.ordersPaused && <p className="mt-2 text-center text-sm font-bold text-meat">{live.pausedMessage}</p>}
          </>
        )}
      </div>
    </aside>
  );
}
