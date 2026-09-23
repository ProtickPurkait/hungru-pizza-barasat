import { MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusTracker } from "@/components/site/order-status";
import { VegMark } from "@/components/ui/veg-mark";
import { getSiteData } from "@/lib/content/get-site-content";
import { formatINR } from "@/lib/money";
import { findOrderByToken } from "@/lib/ordering/lookup";
import { buildOrderMessage, whatsappLink } from "@/lib/ordering/whatsapp";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: PageProps<"/order/[token]">) {
  const { token } = await params;
  const [order, { content }] = await Promise.all([findOrderByToken(token), getSiteData()]);
  if (!order) notFound();

  const { brand, contact, ordering } = content;
  const restaurantWhatsapp = ordering.whatsappNumber || contact.whatsapp;
  const viaWhatsapp = order.channel === "whatsapp";
  const waHref =
    viaWhatsapp && restaurantWhatsapp
      ? whatsappLink(
          restaurantWhatsapp,
          buildOrderMessage({
            brandName: brand.name,
            reference: order.reference,
            fulfillment: order.fulfillment,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.address,
            notes: order.notes,
            items: order.items,
            subtotal: order.subtotal,
            discount: order.discount,
            deliveryFee: order.deliveryFee,
            total: order.total,
          }),
        )
      : null;
  const awaitingWhatsapp = viaWhatsapp && order.status === "new";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6">
      <div className="grain relative overflow-hidden rounded-[2rem] bg-ink p-6 text-cream ring-2 ring-ink shadow-[6px_6px_0_0_var(--brand-primary)] sm:p-10">
        <p className="enter-pop inline-flex rounded-full bg-accent px-3 py-1 text-xs font-extrabold tracking-[0.18em] text-ink uppercase" style={{ ["--r" as string]: "-3deg" }}>
          Order {order.reference}
        </p>
        <h1 className="font-display enter-rise mt-4 text-[clamp(2.8rem,12vw,6rem)] leading-[0.85] uppercase" style={{ ["--d" as string]: 120 }}>
          {awaitingWhatsapp ? (
            <>
              Almost <span className="text-accent">there!</span>
            </>
          ) : (
            <>
              Order <span className="text-accent">received</span> 🍕
            </>
          )}
        </h1>
        <p className="enter-fade-up mt-4 max-w-lg text-lg text-cream/80" style={{ ["--d" as string]: 250 }}>
          {awaitingWhatsapp
            ? "Tap the button below to send your order on WhatsApp. The restaurant sees it once you hit send."
            : `Thanks, ${order.customerName.split(" ")[0]}! ${brand.name} has your order.`}
        </p>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="enter-fade-up mt-6 inline-flex h-16 items-center gap-3 rounded-full bg-basil px-8 text-lg font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--brand-accent)] ring-2 ring-ink"
            style={{ ["--d" as string]: 320 }}
          >
            <MessageCircle className="size-6" aria-hidden /> {awaitingWhatsapp ? "Send order on WhatsApp" : "Open WhatsApp chat"}
          </a>
        )}
        {ordering.confirmationNote && <p className="mt-5 rounded-2xl bg-cream/10 px-4 py-3 text-cream/90">{ordering.confirmationNote}</p>}
      </div>

      <div className="mt-6 rounded-[1.75rem] bg-white p-6 ring-2 ring-ink">
        <OrderStatusTracker token={token} initialStatus={order.status} fulfillment={order.fulfillment} total={order.total} reference={order.reference} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="items-heading" className="rounded-[1.75rem] bg-white p-6 ring-1 ring-ink/10">
          <h2 id="items-heading" className="font-display text-3xl uppercase">
            Your items
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-bold">
                    <VegMark diet={item.diet} size={13} /> {item.quantity} × {item.name}
                  </span>
                  {item.options.length > 0 && <span className="block text-sm text-ink/60">{item.options.map((o) => o.optionName).join(" · ")}</span>}
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatINR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 border-t-2 border-dashed border-ink/15 pt-4">
            <div className="flex justify-between">
              <dt className="text-ink/70">Subtotal</dt>
              <dd className="font-bold tabular-nums">{formatINR(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-basil">
                <dt className="font-semibold">Discount</dt>
                <dd className="font-bold tabular-nums">−{formatINR(order.discount)}</dd>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/70">Delivery fee</dt>
                <dd className="font-bold tabular-nums">{formatINR(order.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="text-lg font-extrabold">Total</dt>
              <dd className="font-display text-3xl tabular-nums">{formatINR(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="details-heading" className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-6 ring-1 ring-ink/10">
          <h2 id="details-heading" className="font-display text-3xl uppercase">
            {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
          </h2>
          {order.fulfillment === "delivery" ? (
            <p className="whitespace-pre-line text-ink/80">{order.address}</p>
          ) : contact.address ? (
            <p className="whitespace-pre-line text-ink/80">
              Collect from:
              <br />
              <span className="font-bold text-ink">{contact.address}</span>
            </p>
          ) : (
            <p className="text-ink/80">Collect from the restaurant.</p>
          )}
          {ordering.paymentNote && <p className="rounded-xl bg-accent/30 px-3 py-2 text-sm font-semibold">{ordering.paymentNote}</p>}
          {(contact.phone || contact.whatsapp) && (
            <div className="mt-auto flex flex-col gap-2">
              <p className="text-sm font-extrabold tracking-widest text-ink/65 uppercase">Need help?</p>
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-extrabold text-cream">
                  <Phone className="size-4" aria-hidden /> Call {brand.name}
                </a>
              )}
              {contact.whatsapp && !waHref && (
                <a href={whatsappLink(contact.whatsapp, `Hi! About my order ${order.reference}`)} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full font-extrabold ring-2 ring-ink">
                  <MessageCircle className="size-4" aria-hidden /> WhatsApp us
                </a>
              )}
            </div>
          )}
        </section>
      </div>

      <p className="mt-8 text-center text-sm text-ink/65">
        Keep this page to check your order status. <Link href="/menu" className="font-bold text-primary underline-offset-2 hover:underline">Order something else</Link>
      </p>
    </div>
  );
}
