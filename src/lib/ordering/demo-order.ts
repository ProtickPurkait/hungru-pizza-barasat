import "server-only";
import { z } from "zod";
import type { PricedOrder } from "./place-order";

/**
 * The design preview (`DEMO_MODE=true`) has no database, so a "placed" order is never stored: the priced order
 * travels to the confirmation page in the URL instead. It's only ever displayed back to the same visitor.
 */
export const DEMO_ORDER_TOKEN = "demo";
const MAX_ENCODED_LENGTH = 16_000;

const money = z.number().int().min(0).max(100_000_000);
const text = (max: number) => z.string().max(max);

const demoOrderSchema = z.object({
  reference: text(20),
  channel: z.enum(["native", "whatsapp"]),
  fulfillment: z.enum(["delivery", "pickup"]),
  customerName: text(60),
  customerPhone: text(20),
  address: text(300),
  notes: text(300),
  items: z
    .array(
      z.object({
        productId: text(40),
        name: text(120),
        diet: z.enum(["veg", "non_veg"]),
        quantity: z.number().int().min(1).max(99),
        options: z
          .array(
            z.object({ groupId: text(40), groupName: text(80), optionId: text(40), optionName: text(80), priceDelta: z.number().int() }),
          )
          .max(40),
        unitPrice: money,
        unitOriginalPrice: money,
        lineTotal: money,
      }),
    )
    .min(1)
    .max(40),
  subtotal: money,
  discount: money,
  deliveryFee: money,
  total: money,
});

export type DemoOrder = z.output<typeof demoOrderSchema> & { status: "new" };

type Customer = { fulfillment: "delivery" | "pickup"; name: string; phone: string; address: string; notes: string };

export function encodeDemoOrder(priced: PricedOrder, customer: Customer): string {
  const order: z.input<typeof demoOrderSchema> = {
    reference: "DEMO",
    channel: priced.channel === "whatsapp" ? "whatsapp" : "native",
    fulfillment: customer.fulfillment,
    customerName: customer.name,
    customerPhone: customer.phone,
    address: customer.fulfillment === "delivery" ? customer.address : "",
    notes: customer.notes,
    items: priced.items,
    subtotal: priced.totals.subtotal,
    discount: priced.totals.discount,
    deliveryFee: priced.totals.deliveryFee,
    total: priced.totals.total,
  };
  return Buffer.from(JSON.stringify(order)).toString("base64url");
}

export function decodeDemoOrder(encoded: string | string[] | undefined): DemoOrder | null {
  if (typeof encoded !== "string" || encoded.length > MAX_ENCODED_LENGTH) return null;
  try {
    const parsed = demoOrderSchema.safeParse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    return parsed.success ? { ...parsed.data, status: "new" } : null;
  } catch {
    return null;
  }
}
