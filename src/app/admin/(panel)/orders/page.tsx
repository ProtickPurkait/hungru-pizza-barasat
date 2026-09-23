import { and, desc, inArray, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABELS, statusTone, type OrderStatus } from "@/lib/ordering/status";
import { OrdersLive } from "./orders-live";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: Record<string, { label: string; statuses: OrderStatus[] | null }> = {
  active: { label: "Active", statuses: ["new", "confirmed", "preparing", "ready", "out_for_delivery"] },
  completed: { label: "Completed", statuses: ["completed"] },
  cancelled: { label: "Cancelled", statuses: ["cancelled"] },
  all: { label: "All", statuses: null },
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { filter: rawFilter } = await searchParams;
  const filter = typeof rawFilter === "string" && rawFilter in FILTERS ? rawFilter : "active";
  const statuses = FILTERS[filter].statuses;
  const where: SQL[] = [];
  if (statuses) where.push(inArray(t.orders.status, statuses));
  const rows = await db
    .select()
    .from(t.orders)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(t.orders.createdAt))
    .limit(100);
  const newCount = rows.filter((o) => o.status === "new").length;

  return (
    <>
      <PageHeader
        title="Orders"
        description="Orders placed through the website (checkout or WhatsApp). This page refreshes by itself."
        actions={<OrdersLive newCount={newCount} />}
      />
      <nav aria-label="Filter orders" className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 no-scrollbar">
        {Object.entries(FILTERS).map(([key, f]) => (
          <Link
            key={key}
            href={key === "active" ? "/admin/orders" : `/admin/orders?filter=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={clsx(
              "flex h-9 items-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap",
              filter === key ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title={filter === "active" ? "No active orders" : "No orders here"}
          description="New orders show up here automatically."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className={clsx(
                  "flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-xs hover:bg-stone-50",
                  o.status === "new" ? "border-orange-300 ring-1 ring-orange-200" : "border-stone-200",
                )}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {o.reference}
                    <Badge tone={statusTone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    <Badge>{o.fulfillment === "delivery" ? "Delivery" : "Pickup"}</Badge>
                    {o.channel === "whatsapp" && <Badge tone="success">WhatsApp</Badge>}
                  </p>
                  <p className="truncate text-sm text-stone-600">
                    {o.customerName} · {o.items.reduce((n, i) => n + i.quantity, 0)} items ·{" "}
                    {o.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-bold tabular-nums">{formatINR(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
