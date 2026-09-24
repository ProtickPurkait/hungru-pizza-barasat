import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { checkSelection, computeTotals, MAX_LINE_QUANTITY, priceItem } from "@/lib/cart/pricing";
import { isValidPhone } from "@/lib/content/schemas";
import type { SiteData } from "@/lib/content/types";
import { formatINR } from "@/lib/money";
import type { OrderItem } from "./types";

export const checkoutSchema = z
  .object({
    fulfillment: z.enum(["delivery", "pickup"]),
    name: z.string().trim().min(2, "Please enter your name").max(60, "That name is too long"),
    phone: z.string().trim().max(20).refine(isValidPhone, "Enter a valid mobile number so we can reach you"),
    address: z.string().trim().max(300, "Please shorten the address").default(""),
    notes: z.string().trim().max(300, "Please keep notes under 300 characters").default(""),
    /** Honeypot: real people never fill this in. */
    website: z.string().max(0).optional().or(z.literal("")),
    lines: z
      .array(
        z.object({
          productId: z.uuid(),
          selection: z.record(z.string().max(40), z.array(z.string().max(40)).max(30)),
          quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
        }),
      )
      .min(1, "Your cart is empty")
      .max(40, "That's a lot of items. Please call us for large orders."),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === "delivery" && v.address.length < 8) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Please enter your full delivery address" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export class CheckoutError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_ORDERS = 5;

/**
 * Validates and prices an order entirely on the server, against the published menu and live
 * availability. Client-side prices are never trusted. Touches no database.
 */
export function priceOrder(input: z.output<typeof checkoutSchema>, site: SiteData) {
  const { content, live, mode } = site;
  const { ordering } = content;

  if (mode === "preview")
    throw new CheckoutError("You're in preview mode, so ordering is switched off. Exit preview to place a real order.");
  if (ordering.mode !== "native" && ordering.mode !== "whatsapp") throw new CheckoutError("Online ordering isn't available right now.");
  if (live.ordersPaused) throw new CheckoutError(live.pausedMessage);
  if (input.fulfillment === "delivery" && !ordering.delivery) throw new CheckoutError("Delivery isn't available. Please choose pickup.");
  if (input.fulfillment === "pickup" && !ordering.pickup) throw new CheckoutError("Pickup isn't available. Please choose delivery.");

  const whatsappNumber = ordering.whatsappNumber || content.contact.whatsapp;
  if (ordering.mode === "whatsapp" && !whatsappNumber)
    throw new CheckoutError("WhatsApp ordering isn't set up yet. Please call the restaurant.");

  const byId = new Map(content.products.map((p) => [p.id, p]));
  const items: OrderItem[] = [];
  const problems: string[] = [];
  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (!product) {
      problems.push("An item in your cart is no longer on the menu.");
      continue;
    }
    if (!product.isAvailable) {
      problems.push(`${product.name} is sold out right now.`);
      continue;
    }
    const check = checkSelection(product, line.selection);
    if (!check.ok) {
      problems.push(`Please re-select options for ${product.name}.`);
      continue;
    }
    const priced = priceItem(product, check.normalized, line.quantity);
    items.push({
      productId: product.id,
      name: product.name,
      diet: product.diet,
      quantity: line.quantity,
      options: priced.options,
      unitPrice: priced.unitPrice,
      unitOriginalPrice: priced.unitOriginalPrice,
      lineTotal: priced.lineTotal,
    });
  }
  if (problems.length) throw new CheckoutError(`${problems[0]} Update your cart and try again.`);

  const fee = input.fulfillment === "delivery" ? (ordering.deliveryFee ?? 0) : 0;
  const totals = computeTotals(
    items.map((i) => ({ quantity: i.quantity, lineTotal: i.lineTotal, lineOriginalTotal: i.unitOriginalPrice * i.quantity })),
    fee,
  );
  if (ordering.minOrder !== null && totals.total - totals.deliveryFee < ordering.minOrder) {
    throw new CheckoutError(`The minimum order is ${formatINR(ordering.minOrder)}.`);
  }
  return { items, totals, channel: ordering.mode };
}

export type PricedOrder = ReturnType<typeof priceOrder>;

/** Prices the order (see `priceOrder`), applies the per-IP rate limit and saves it. */
export async function placeOrder(input: z.output<typeof checkoutSchema>, site: SiteData, ip: string) {
  if (site.mode === "demo") throw new CheckoutError("Orders can't be saved in the design preview.");
  const { items, totals, channel } = priceOrder(input, site);

  const [recent] = await db
    .select({ n: count() })
    .from(orders)
    .where(and(eq(orders.ip, ip), gt(orders.createdAt, new Date(Date.now() - RATE_WINDOW_MS))));
  if ((recent?.n ?? 0) >= RATE_MAX_ORDERS) {
    throw new CheckoutError("You've placed several orders in a short time. Please wait a few minutes, or call us.");
  }

  const [{ next }] = await db.execute<{ next: string }>(sql`select nextval('order_number_seq')::text as next`).then((r) => r.rows);
  const number = Number(next);
  const reference = `${site.content.ordering.orderPrefix}-${number}`;
  const publicToken = randomBytes(18).toString("base64url");

  await db.insert(orders).values({
    number,
    reference,
    publicToken,
    channel,
    fulfillment: input.fulfillment,
    customerName: input.name,
    customerPhone: input.phone,
    address: input.fulfillment === "delivery" ? input.address : "",
    notes: input.notes,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    ip,
  });

  return { reference, publicToken, total: totals.total };
}
