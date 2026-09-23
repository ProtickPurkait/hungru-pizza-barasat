"use client";

import { clsx } from "clsx";
import { Menu as MenuIcon, MessageCircle, Phone, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/store";
import type { MediaRef } from "@/lib/content/types";
import { whatsappLink } from "@/lib/ordering/whatsapp";
import { BrandLogo } from "./brand-logo";
import { useCartView, useSite } from "./site-provider";

export type NavLink = { href: string; label: string };

export function SiteHeader({ logo, nav }: { logo: MediaRef | null; nav: NavLink[] }) {
  const { brand, contact } = useSite();
  const pathname = usePathname();
  const { totals, hydrated } = useCartView();
  const lastAddAt = useCart((s) => s.lastAdd?.at ?? 0);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const count = hydrated ? totals.itemCount : 0;

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 text-cream transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-ink/92 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md" : "bg-ink",
      )}
    >
      <a
        href="#main"
        className="sr-only z-50 rounded bg-accent px-3 py-2 text-ink focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="hero-enter-nav mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={`${brand.name} home`} className="shrink-0 rounded-lg">
          <BrandLogo name={brand.name} location={brand.location} logo={logo} priority />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-cream/10",
                pathname === item.href && "bg-cream/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            data-cart-target="secondary"
            aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
            className="relative flex size-11 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-cream/20"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span
                key={lastAddAt}
                className={clsx(
                  "absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-extrabold text-ink ring-2 ring-ink",
                  lastAddAt > 0 && "animate-pop",
                )}
              >
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/menu"
            className="hidden h-11 items-center rounded-full bg-primary px-5 text-sm font-extrabold tracking-wide uppercase shadow-[3px_3px_0_0_var(--color-accent)] transition-transform hover:-translate-y-0.5 active:translate-y-0 md:inline-flex"
          >
            Order now
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full bg-cream/10 md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => {
              dialogRef.current?.showModal();
              setOpen(true);
            }}
          >
            <MenuIcon className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-cream backdrop:bg-transparent"
      >
        <div className="grain flex h-full flex-col px-5 pt-3 pb-8">
          <div className="relative z-10 flex h-14 items-center justify-between">
            <BrandLogo name={brand.name} location={brand.location} logo={logo} />
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex size-11 items-center justify-center rounded-full bg-cream/10"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="relative z-10 mt-10 flex flex-col">
            {[{ href: "/", label: "Home" }, ...nav].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dialogRef.current?.close()}
                className="font-display border-b border-cream/10 py-3 text-5xl uppercase transition-colors hover:text-accent"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="relative z-10 mt-auto flex flex-col gap-3">
            <Link
              href="/menu"
              onClick={() => dialogRef.current?.close()}
              className="flex h-14 items-center justify-center rounded-full bg-primary text-lg font-extrabold tracking-wide uppercase shadow-[4px_4px_0_0_var(--color-accent)]"
            >
              🍕 Order now
            </Link>
            <div className="grid grid-cols-2 gap-3">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-cream/10 font-bold"
                >
                  <Phone className="size-4" aria-hidden /> Call
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={whatsappLink(contact.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-cream/10 font-bold"
                >
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
