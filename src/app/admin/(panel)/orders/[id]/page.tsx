import { eq } from "drizzle-orm";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABELS, statusTone } from "@/lib/ordering/status";
import { whatsappLink } from "@/lib/ordering/whatsapp";
import { OrderStatusControls } from "./status-controls";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [order] = await db.select().from(t.orders).where(eq(t.orders.id, id)).limit(1);
  if (!order) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {order.reference} <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          </span>
        }
        description={`Placed ${order.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} via ${order.channel === "whatsapp" ? "WhatsApp" : "website checkout"}`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-stone-100">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold">
                      {item.quantity} × {item.name}
                    </p>
                    {item.options.length > 0 && (
                      <p className="text-sm text-stone-600">{item.options.map((o) => `${o.groupName}: ${o.optionName}`).join(" · ")}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatINR(order.discount)}</dd>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone-600">Delivery fee</dt>
                  <dd className="tabular-nums">{formatINR(order.deliveryFee)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </Card>
          {order.notes && (
            <Card title="Customer notes">
              <p className="whitespace-pre-line">{order.notes}</p>
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Update status">
            <OrderStatusControls id={order.id} status={order.status} fulfillment={order.fulfillment} />
          </Card>
          <Card title="Customer">
            <p className="text-lg font-semibold">{order.customerName}</p>
            <p className="text-stone-600">{order.fulfillment === "delivery" ? "Delivery" : "Pickup"}</p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}
                className="flex h-11 items-center gap-2 rounded-lg bg-stone-900 px-4 font-semibold text-white"
              >
                <Phone className="size-4" aria-hidden /> Call {order.customerPhone}
              </a>
              <a
                href={whatsappLink(order.customerPhone, `Hi ${order.customerName}, this is about your order ${order.reference}.`)}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center gap-2 rounded-lg px-4 font-semibold text-stone-800 ring-1 ring-stone-300"
              >
                <MessageCircle className="size-4" aria-hidden /> WhatsApp customer
              </a>
            </div>
            {order.fulfillment === "delivery" && order.address && (
              <div className="mt-4 rounded-lg bg-stone-50 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
                  <MapPin className="size-4" aria-hidden /> Delivery address
                </p>
                <p className="mt-1 whitespace-pre-line">{order.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
