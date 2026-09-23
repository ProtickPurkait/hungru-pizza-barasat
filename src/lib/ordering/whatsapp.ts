import { formatINR } from "@/lib/money";
import type { OrderItem } from "./types";

/** Turns a local/ international number into the digits-only form wa.me expects. Defaults to India (+91). */
export function toWhatsAppDigits(phone: string, defaultCountryCode = "91") {
  let digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
}

export function whatsappLink(phone: string, text?: string) {
  const base = `https://wa.me/${toWhatsAppDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export type OrderMessageInput = {
  brandName: string;
  reference: string;
  fulfillment: "delivery" | "pickup";
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

/** The pre-filled WhatsApp message a customer sends to the restaurant. */
export function buildOrderMessage(o: OrderMessageInput) {
  const lines: string[] = [];
  lines.push(`Hi ${o.brandName}! I'd like to place an order 🍕`);
  lines.push(`Order ref: ${o.reference}`);
  lines.push("");
  for (const item of o.items) {
    lines.push(`• ${item.quantity} × ${item.name} (${formatINR(item.lineTotal)})`);
    for (const opt of item.options) lines.push(`   – ${opt.groupName}: ${opt.optionName}`);
  }
  lines.push("");
  if (o.discount > 0) {
    lines.push(`Subtotal: ${formatINR(o.subtotal)}`);
    lines.push(`Discount: −${formatINR(o.discount)}`);
  }
  if (o.deliveryFee > 0) lines.push(`Delivery: ${formatINR(o.deliveryFee)}`);
  lines.push(`Total: ${formatINR(o.total)}`);
  lines.push("");
  lines.push(o.fulfillment === "delivery" ? "🛵 Delivery" : "🏃 Pickup");
  lines.push(`Name: ${o.customerName}`);
  if (o.customerPhone) lines.push(`Phone: ${o.customerPhone}`);
  if (o.fulfillment === "delivery" && o.address) lines.push(`Address: ${o.address}`);
  if (o.notes) lines.push(`Notes: ${o.notes}`);
  return lines.join("\n");
}
