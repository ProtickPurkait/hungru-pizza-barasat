import { and, count, desc, eq, gte } from "drizzle-orm";
import {
  CheckCircle2,
  Circle,
  Home,
  MessageSquareQuote,
  PauseCircle,
  Pizza,
  PlayCircle,
  Plus,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card, PageHeader, Stat } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { isOfferLive, loadAllDocuments } from "@/lib/content/compile";
import { getPublishStatus } from "@/lib/content/publish";
import { STORY_PLACEHOLDER_BODY } from "@/lib/content/schemas";
import { hoursConfigured } from "@/lib/hours";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/ordering/status";
import { RemoveSamplesButton } from "./remove-samples-button";

export const metadata: Metadata = { title: "Dashboard" };

const MODE_LABELS = {
  native: "Website checkout",
  whatsapp: "WhatsApp",
  external: "External platform",
  phone: "Phone call",
} as const;

export default async function DashboardPage() {
  const user = await requireAdmin();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [docs, status, products, offers, reviewRows, featureRows, savedDocs, todayOrders, recentOrders] = await Promise.all([
    loadAllDocuments(db),
    getPublishStatus(db),
    db
      .select({ isAvailable: t.products.isAvailable, isVisible: t.products.isVisible, isSample: t.products.isSample, isBestseller: t.products.isBestseller })
      .from(t.products),
    db.select({ isActive: t.offers.isActive, startsAt: t.offers.startsAt, endsAt: t.offers.endsAt }).from(t.offers),
    db.select({ isEnabled: t.reviews.isEnabled, isSample: t.reviews.isSample }).from(t.reviews),
    db.select({ isActive: t.features.isActive, isSample: t.features.isSample }).from(t.features),
    db.select({ key: t.contentDocuments.key }).from(t.contentDocuments),
    db.select({ n: count() }).from(t.orders).where(gte(t.orders.createdAt, startOfDay)),
    db.select().from(t.orders).orderBy(desc(t.orders.createdAt)).limit(5),
  ]);
  const [newOrderCount] = await db.select({ n: count() }).from(t.orders).where(and(eq(t.orders.status, "new")));

  const saved = new Set(savedDocs.map((d) => d.key));
  const shown = products.filter((p) => p.isVisible);
  const outOfStock = shown.filter((p) => !p.isAvailable).length;
  const sampleProducts = products.filter((p) => p.isSample).length;
  const liveOffers = offers.filter(
    (o) => o.isActive && isOfferLive({ startsAt: o.startsAt?.toISOString() ?? null, endsAt: o.endsAt?.toISOString() ?? null }),
  ).length;
  const bestsellers = shown.filter((p) => p.isBestseller).length;
  const enabledReviews = reviewRows.filter((r) => r.isEnabled).length;
  const sampleReviews = reviewRows.filter((r) => r.isSample && r.isEnabled).length;
  const sampleFeatures = featureRows.filter((f) => f.isSample && f.isActive).length;
  const sampleTotal = sampleProducts + reviewRows.filter((r) => r.isSample).length + featureRows.filter((f) => f.isSample).length;
  const ordersEnabled = docs.ordering.mode === "native" || docs.ordering.mode === "whatsapp";

  const checklist = [
    { done: products.length > 0, label: "Add your menu items", href: "/admin/menu/new" },
    { done: products.length > 0 && sampleProducts === 0, label: "Replace the sample menu items", href: "/admin/menu", hide: sampleProducts === 0 },
    { done: Boolean(docs.brand.logoId), label: "Upload your logo", href: "/admin/appearance" },
    { done: Boolean(docs.contact.address), label: "Add your address", href: "/admin/contact" },
    { done: Boolean(docs.contact.phone || docs.contact.whatsapp), label: "Add a phone or WhatsApp number", href: "/admin/contact" },
    { done: hoursConfigured(docs.contact.hours), label: "Set your opening hours", href: "/admin/contact" },
    { done: saved.has("ordering"), label: "Choose how customers order", href: "/admin/ordering" },
    { done: docs.story.body !== STORY_PLACEHOLDER_BODY, label: "Tell your brand story", href: "/admin/brand-story" },
    { done: sampleReviews === 0, label: "Replace the placeholder reviews with real ones", href: "/admin/reviews" },
    { done: sampleFeatures === 0, label: "Write your “Why Hungru” points", href: "/admin/why-hungru" },
    { done: saved.has("seo") && Boolean(docs.seo.ogImageId), label: "Check Google & social sharing details", href: "/admin/seo" },
    { done: !status.hasUnpublishedChanges, label: "Publish your latest changes", href: "#publish" },
  ].filter((item) => !item.hide);
  const doneCount = checklist.filter((i) => i.done).length;

  return (
    <>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]} 👋`}
        description="Here's what's happening with your website today."
        actions={
          <ButtonLink href="/admin/menu/new" icon={<Plus className="size-4" aria-hidden />}>
            Add menu item
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Menu items"
          value={shown.length}
          hint={outOfStock ? `${outOfStock} out of stock` : "All in stock"}
          href="/admin/menu"
        />
        <Stat label="Active offers" value={liveOffers} hint={`${offers.length} total`} href="/admin/offers" />
        <Stat label="Best sellers" value={bestsellers} hint="Featured on homepage" href="/admin/best-sellers" />
        {ordersEnabled ? (
          <Stat
            label="Orders today"
            value={todayOrders[0]?.n ?? 0}
            hint={newOrderCount?.n ? `${newOrderCount.n} waiting for you` : "Nothing waiting"}
            href="/admin/orders"
          />
        ) : (
          <Stat label="Reviews shown" value={enabledReviews} hint="On the homepage" href="/admin/reviews" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card title="Quick actions">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { href: "/admin/menu/new", label: "Add product", icon: <Plus /> },
                { href: "/admin/menu", label: "Edit menu", icon: <Pizza /> },
                { href: "/admin/offers/new", label: "Add offer", icon: <Tag /> },
                { href: "/admin/homepage", label: "Edit homepage", icon: <Home /> },
                { href: "/admin/reviews", label: "Manage reviews", icon: <MessageSquareQuote /> },
                { href: "/admin/ordering", label: "Ordering settings", icon: <UtensilsCrossed /> },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-300 hover:bg-stone-50 [&_svg]:size-5 [&_svg]:text-primary"
                >
                  <span aria-hidden>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </Card>

          {ordersEnabled && (
            <Card
              title="Latest orders"
              actions={
                <Link href="/admin/orders" className="text-sm font-semibold text-blue-700 hover:underline">
                  View all
                </Link>
              }
              bodyClassName="p-0 sm:p-0"
            >
              {recentOrders.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-stone-500">No orders yet. They'll appear here as soon as customers order.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50 sm:px-5">
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900">
                            {o.reference} · {o.customerName}
                          </p>
                          <p className="text-sm text-stone-500">
                            {o.items.reduce((n, i) => n + i.quantity, 0)} items · {o.fulfillment === "delivery" ? "Delivery" : "Pickup"} ·{" "}
                            {o.createdAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="font-bold tabular-nums">{formatINR(o.total)}</span>
                          <Badge tone={o.status === "new" ? "brand" : o.status === "cancelled" ? "danger" : o.status === "completed" ? "success" : "info"}>
                            {ORDER_STATUS_LABELS[o.status]}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Website status">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-stone-500">Publishing</dt>
                <dd className="mt-0.5 font-semibold">
                  {status.hasUnpublishedChanges ? (
                    <span className="text-amber-700">Unpublished changes waiting</span>
                  ) : (
                    <span className="text-emerald-700">Live site is up to date</span>
                  )}
                </dd>
                {status.lastPublishedAt && (
                  <dd className="text-sm text-stone-500">
                    Last published {status.lastPublishedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-sm text-stone-500">How customers order</dt>
                <dd className="mt-0.5 font-semibold">{MODE_LABELS[docs.ordering.mode]}</dd>
                <dd className="flex items-center gap-1.5 text-sm">
                  {docs.live.ordersPaused ? (
                    <>
                      <PauseCircle className="size-4 text-red-600" aria-hidden />
                      <span className="text-red-700">Online orders paused</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="size-4 text-emerald-600" aria-hidden />
                      <span className="text-emerald-700">Accepting orders</span>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Launch checklist" description={`${doneCount} of ${checklist.length} done`}>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden>
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <ul className="flex flex-col gap-1">
              {checklist.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-stone-50"
                  >
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-emerald-600" aria-label="Done" />
                    ) : (
                      <Circle className="mt-0.5 size-[18px] shrink-0 text-stone-300" aria-label="To do" />
                    )}
                    <span className={item.done ? "text-stone-500 line-through" : "font-medium text-stone-800"}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          {sampleTotal > 0 && (
            <Card title="Sample content" description="Placeholder items are marked “Sample” on the website until you replace them.">
              <p className="text-sm text-stone-600">
                {sampleTotal} sample item{sampleTotal === 1 ? "" : "s"} (menu, reviews, “Why Hungru” points). Edit them to make them yours, or
                remove them all at once.
              </p>
              <div className="mt-3">
                <RemoveSamplesButton />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
