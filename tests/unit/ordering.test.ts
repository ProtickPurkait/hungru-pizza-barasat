import { describe, expect, it } from "vitest";
import { resolveLink } from "@/lib/content/links";
import { buildOrderMessage, toWhatsAppDigits, whatsappLink } from "@/lib/ordering/whatsapp";
import { nextStatuses } from "@/lib/ordering/status";

describe("toWhatsAppDigits", () => {
  it("assumes India for local numbers", () => {
    expect(toWhatsAppDigits("98765 43210")).toBe("919876543210");
    expect(toWhatsAppDigits("09876543210")).toBe("919876543210");
    expect(toWhatsAppDigits("+91 98765-43210")).toBe("919876543210");
    expect(toWhatsAppDigits("+44 20 7946 0958")).toBe("442079460958");
  });
  it("builds wa.me links with an encoded message", () => {
    expect(whatsappLink("9876543210", "Hi & hello")).toBe("https://wa.me/919876543210?text=Hi%20%26%20hello");
  });
});

describe("buildOrderMessage", () => {
  it("includes the reference, items, options, totals and address", () => {
    const text = buildOrderMessage({
      brandName: "Hungru Pizza",
      reference: "HP-1001",
      fulfillment: "delivery",
      customerName: "Riya",
      customerPhone: "9876543210",
      address: "12 Test Lane",
      notes: "Ring the bell",
      items: [
        {
          productId: "p",
          name: "Margherita",
          diet: "veg",
          quantity: 2,
          options: [{ groupId: "s", groupName: "Size", optionId: "l", optionName: "Large", priceDelta: 100 }],
          unitPrice: 29900,
          unitOriginalPrice: 29900,
          lineTotal: 59800,
        },
      ],
      subtotal: 59800,
      discount: 0,
      deliveryFee: 3000,
      total: 62800,
    });
    expect(text).toContain("HP-1001");
    expect(text).toContain("2 × Margherita (₹598)");
    expect(text).toContain("Size: Large");
    expect(text).toContain("Delivery: ₹30");
    expect(text).toContain("Total: ₹628");
    expect(text).toContain("Address: 12 Test Lane");
    expect(text).toContain("Notes: Ring the bell");
  });
});

describe("resolveLink", () => {
  const ctx = { contact: { phone: "+91 98765 43210", whatsapp: "" }, ordering: { whatsappNumber: "9876543210", phoneNumber: "" } };
  it("maps CMS destinations to hrefs", () => {
    expect(resolveLink({ type: "menu", value: "" }, ctx)).toEqual({ href: "/menu", external: false });
    expect(resolveLink({ type: "product", value: "margherita" }, ctx).href).toBe("/menu?item=margherita");
    expect(resolveLink({ type: "category", value: "pizzas" }, ctx).href).toBe("/menu#pizzas");
    expect(resolveLink({ type: "section", value: "offers" }, ctx).href).toBe("/#offers");
    expect(resolveLink({ type: "url", value: "https://zomato.com" }, ctx)).toEqual({ href: "https://zomato.com", external: true });
    expect(resolveLink({ type: "phone", value: "" }, ctx).href).toBe("tel:+919876543210");
    expect(resolveLink({ type: "whatsapp", value: "" }, ctx).href).toBe("https://wa.me/919876543210");
  });
  it("falls back to the menu when a number is missing", () => {
    const empty = { contact: { phone: "", whatsapp: "" }, ordering: { whatsappNumber: "", phoneNumber: "" } };
    expect(resolveLink({ type: "whatsapp", value: "" }, empty).href).toBe("/menu");
  });
});

describe("order status flow", () => {
  it("follows the right path for delivery and pickup", () => {
    expect(nextStatuses("preparing", "delivery")).toEqual(["out_for_delivery"]);
    expect(nextStatuses("preparing", "pickup")).toEqual(["ready"]);
    expect(nextStatuses("completed", "pickup")).toEqual([]);
  });
});
