import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { demoMenu } = await import("@/db/seed-data/demo-menu");
const { demoLive, demoSiteContent } = await import("@/lib/content/demo-content");
const { decodeDemoOrder, encodeDemoOrder } = await import("@/lib/ordering/demo-order");
const { CheckoutError, checkoutSchema, placeOrder, priceOrder } = await import("@/lib/ordering/place-order");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const site = () => ({ content: demoSiteContent(), live: demoLive(), mode: "demo" as const, publishedAt: null });

describe("design preview content", () => {
  const content = demoSiteContent();

  it("flags every product, review, feature and offer as a sample", () => {
    for (const list of [content.products, content.reviews, content.features, content.offers]) {
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((item) => item.isSample)).toBe(true);
    }
    expect(content.reviews.every((r) => r.rating === null)).toBe(true);
  });

  it("uses stable UUIDs and links every product to a listed category", () => {
    const categoryIds = new Set(content.categories.map((c) => c.id));
    for (const p of content.products) {
      expect(p.id).toMatch(UUID);
      expect(categoryIds.has(p.categoryId)).toBe(true);
    }
    expect(demoSiteContent().products[0].id).toBe(content.products[0].id);
    expect(new Set(content.products.map((p) => p.id)).size).toBe(content.products.length);
  });

  it("converts demo menu prices to paise", () => {
    const seed = demoMenu.categories.flatMap((c) => c.products).find((p) => p.name === "Farmhouse")!;
    const product = content.products.find((p) => p.name === "Farmhouse")!;
    expect(product.price).toBe(seed.price * 100);
    expect(product.discountPrice).toBe(seed.discountPrice! * 100);
    expect(content.bestsellerIds).toContain(product.id);
  });
});

describe("design preview checkout", () => {
  const content = demoSiteContent();
  const farmhouse = content.products.find((p) => p.name === "Farmhouse")!;
  const cola = content.products.find((p) => p.name === "Cola")!;
  const input = checkoutSchema.parse({
    fulfillment: "delivery",
    name: "Preview Visitor",
    phone: "98765 43210",
    address: "1 Sample Street, Sample Area",
    lines: [
      { productId: farmhouse.id, selection: { size: ["large"] }, quantity: 1 },
      { productId: cola.id, selection: {}, quantity: 1 },
    ],
  });

  it("prices on the server exactly like a real order", () => {
    const priced = priceOrder(input, site());
    expect(priced.totals.total).toBe(61_900); // (259 + 300) + 60
    expect(priced.items.map((i) => i.name)).toEqual(["Farmhouse", "Cola"]);
  });

  it("round-trips the order through the confirmation link", () => {
    const priced = priceOrder(input, site());
    const decoded = decodeDemoOrder(encodeDemoOrder(priced, input));
    expect(decoded).toMatchObject({ reference: "DEMO", customerName: "Preview Visitor", total: 61_900, status: "new" });
    expect(decoded?.items).toEqual(priced.items);
  });

  it("rejects tampered or oversized links", () => {
    expect(decodeDemoOrder("not-valid")).toBeNull();
    expect(decodeDemoOrder(Buffer.from(JSON.stringify({ total: -1 })).toString("base64url"))).toBeNull();
    expect(decodeDemoOrder("a".repeat(20_000))).toBeNull();
    expect(decodeDemoOrder(undefined)).toBeNull();
  });

  it("never saves an order in demo mode", async () => {
    await expect(placeOrder(input, site(), "127.0.0.1")).rejects.toBeInstanceOf(CheckoutError);
  });
});
