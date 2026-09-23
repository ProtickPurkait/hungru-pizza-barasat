"use client";

import { clsx } from "clsx";
import {
  BookOpen,
  ChefHat,
  ClipboardList,
  ExternalLink,
  Eye,
  Heart,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  MessageSquareQuote,
  Palette,
  Pizza,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Tags,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { logout } from "@/app/admin/(auth)/login/actions";
import { publishSite } from "@/app/admin/_actions/publish";
import { Button } from "./ui";

type NavItem = { href: string; label: string; icon: ReactNode; badge?: number };

export type ShellProps = {
  user: { name: string; email: string; role: "owner" | "editor" };
  brandName: string;
  status: { hasUnpublishedChanges: boolean; lastPublishedAt: string | null };
  newOrders: number;
  children: ReactNode;
};

export function AdminShell({ user, brandName, status, newOrders, children }: ShellProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Overview",
      items: [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
        { href: "/admin/orders", label: "Orders", icon: <ShoppingBag />, badge: newOrders },
      ],
    },
    {
      label: "Menu",
      items: [
        { href: "/admin/menu", label: "Menu items", icon: <Pizza /> },
        { href: "/admin/categories", label: "Categories", icon: <Tags /> },
        { href: "/admin/best-sellers", label: "Best sellers", icon: <Star /> },
      ],
    },
    {
      label: "Homepage",
      items: [
        { href: "/admin/homepage", label: "Homepage", icon: <Home /> },
        { href: "/admin/offers", label: "Offers", icon: <Tag /> },
        { href: "/admin/reviews", label: "Reviews", icon: <MessageSquareQuote /> },
        { href: "/admin/why-hungru", label: "Why Hungru", icon: <Heart /> },
        { href: "/admin/brand-story", label: "Brand story", icon: <BookOpen /> },
      ],
    },
    {
      label: "Business",
      items: [
        { href: "/admin/contact", label: "Contact & hours", icon: <MapPin /> },
        { href: "/admin/ordering", label: "Ordering", icon: <ClipboardList /> },
      ],
    },
    {
      label: "Website",
      items: [
        { href: "/admin/media", label: "Media library", icon: <ImageIcon /> },
        { href: "/admin/appearance", label: "Appearance", icon: <Palette /> },
        { href: "/admin/seo", label: "SEO & sharing", icon: <Search /> },
        { href: "/admin/publish", label: "Publish history", icon: <Rocket /> },
        { href: "/admin/settings", label: "Settings", icon: <Settings /> },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  useEffect(() => {
    // Close the mobile drawer whenever the route changes (its onClose resets drawerOpen).
    drawerRef.current?.close();
  }, [pathname]);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-xs font-semibold tracking-wide text-stone-400 uppercase">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors [&_svg]:size-[18px]",
                      active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
                    )}
                  >
                    <span aria-hidden className={active ? "text-white" : "text-stone-400"}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                        {item.badge}
                        <span className="sr-only"> new</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-stone-200 pt-4">
      <p className="truncate px-3 text-sm font-semibold text-stone-900">{user.name}</p>
      <p className="truncate px-3 text-xs text-stone-500">
        {user.email} · {user.role === "owner" ? "Owner" : "Editor"}
      </p>
      <form action={logout} className="mt-2">
        <button
          type="submit"
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-stone-700 hover:bg-stone-100"
        >
          <LogOut className="size-[18px] text-stone-400" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
        <ChefHat className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-bold text-stone-900">{brandName}</span>
        <span className="block text-xs text-stone-500">Website admin</span>
      </span>
    </Link>
  );

  return (
    <div className="admin min-h-dvh bg-stone-50 text-stone-900">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-stone-200 bg-white px-3 py-5 lg:flex">
        {brand}
        <div className="flex-1">{nav}</div>
        {account}
      </aside>

      {/* Mobile drawer */}
      <dialog
        ref={drawerRef}
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === drawerRef.current) drawerRef.current?.close();
        }}
        aria-label="Admin navigation"
        className="m-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none bg-white p-0 lg:hidden"
      >
        <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4">
          <div className="flex items-center justify-between">
            {brand}
            <button
              type="button"
              onClick={() => drawerRef.current?.close()}
              className="flex size-10 items-center justify-center rounded-lg hover:bg-stone-100"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1">{nav}</div>
          {account}
        </div>
      </dialog>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-ml-2 flex size-10 items-center justify-center rounded-lg hover:bg-stone-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => {
                drawerRef.current?.showModal();
                setDrawerOpen(true);
              }}
            >
              <MenuIcon className="size-5" aria-hidden />
            </button>
            <PublishBar status={status} />
          </div>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function PublishBar({ status }: { status: ShellProps["status"] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const last = status.lastPublishedAt ? new Date(status.lastPublishedAt) : null;

  const publish = () =>
    start(async () => {
      const result = await publishSite();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-between">
      <p className="hidden min-w-0 items-center gap-2 text-sm sm:flex" aria-live="polite">
        {status.hasUnpublishedChanges ? (
          <>
            <span className="size-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            <span className="truncate font-semibold text-amber-800">Unpublished changes</span>
            <span className="hidden truncate text-stone-500 xl:inline">· Preview them, then publish to go live</span>
          </>
        ) : (
          <>
            <span className="size-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span className="truncate text-stone-600">
              Website is up to date
              {last && (
                <span className="hidden text-stone-400 md:inline">
                  {" "}
                  · published {last.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
            </span>
          </>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 md:inline-flex"
        >
          <ExternalLink className="size-4" aria-hidden /> View site
        </a>
        <a
          href="/api/preview?path=/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
        >
          <Eye className="size-4" aria-hidden /> Preview
        </a>
        <Button
          size="sm"
          variant={status.hasUnpublishedChanges ? "brand" : "secondary"}
          onClick={publish}
          loading={pending}
          disabled={!status.hasUnpublishedChanges}
          icon={<Rocket className="size-4" aria-hidden />}
        >
          {status.hasUnpublishedChanges ? "Publish" : "Published"}
          {status.hasUnpublishedChanges && <span className="sr-only"> unpublished changes</span>}
        </Button>
      </div>
    </div>
  );
}
