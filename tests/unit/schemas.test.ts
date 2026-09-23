import { describe, expect, it } from "vitest";
import {
  contactSchema,
  documentSchemas,
  extractMapEmbedSrc,
  homepageSchema,
  isValidPhone,
  linkTargetSchema,
  offerInputSchema,
  orderingSchema,
  productInputSchema,
  rupeesToPaise,
} from "@/lib/content/schemas";

const categoryId = "3f1c2b6e-8a3d-4c1e-9f2a-1b2c3d4e5f60";

describe("rupeesToPaise", () => {
  it("parses owner-friendly input", () => {
    expect(rupeesToPaise("299")).toBe(29900);
    expect(rupeesToPaise("₹1,299.5")).toBe(129950);
    expect(rupeesToPaise("")).toBeNull();
    expect(rupeesToPaise("abc")).toBeNaN();
    expect(rupeesToPaise("2.999")).toBeNaN();
  });
});

describe("productInputSchema", () => {
  const base = { name: "Margherita", categoryId, price: "299", diet: "veg" };
  it("converts prices to paise", () => {
    const r = productInputSchema.parse({ ...base, discountPrice: "249" });
    expect(r.price).toBe(29900);
    expect(r.discountPrice).toBe(24900);
  });
  it("requires the discount to be lower than the price", () => {
    const r = productInputSchema.safeParse({ ...base, discountPrice: "399" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["discountPrice"]);
  });
  it("rejects bad prices and missing names", () => {
    expect(productInputSchema.safeParse({ ...base, price: "12x" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, name: " " }).success).toBe(false);
  });
  it("allows only one default in single-choice groups", () => {
    const r = productInputSchema.safeParse({
      ...base,
      options: [
        {
          id: "size",
          name: "Size",
          type: "single",
          options: [
            { id: "a", name: "A", priceDelta: 0, isDefault: true },
            { id: "b", name: "B", priceDelta: 0, isDefault: true },
          ],
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});

describe("phone and links", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("+91 98765 43210")).toBe(true);
    expect(isValidPhone("033-2552 1234")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("call me")).toBe(false);
  });
  it("validates CTA destinations", () => {
    expect(linkTargetSchema.safeParse({ type: "url", value: "https://zomato.com/x" }).success).toBe(true);
    expect(linkTargetSchema.safeParse({ type: "url", value: "/menu" }).success).toBe(true);
    expect(linkTargetSchema.safeParse({ type: "url", value: "javascript:alert(1)" }).success).toBe(false);
    expect(linkTargetSchema.safeParse({ type: "product", value: "" }).success).toBe(false);
  });
});

describe("contact map embed", () => {
  it("extracts the src from a pasted iframe", () => {
    expect(extractMapEmbedSrc('<iframe src="https://www.google.com/maps/embed?pb=abc" width="600"></iframe>')).toBe(
      "https://www.google.com/maps/embed?pb=abc",
    );
    expect(contactSchema.parse({ mapEmbedUrl: '<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>' }).mapEmbedUrl).toBe(
      "https://www.google.com/maps/embed?pb=1",
    );
  });
  it("rejects non-Google embeds", () => {
    expect(contactSchema.safeParse({ mapEmbedUrl: "https://evil.example.com/maps/embed" }).success).toBe(false);
  });
});

describe("ordering settings", () => {
  it("requires at least one fulfilment method", () => {
    expect(orderingSchema.safeParse({ mode: "native", delivery: false, pickup: false }).success).toBe(false);
  });
  it("requires a link for external ordering", () => {
    expect(orderingSchema.safeParse({ mode: "external" }).success).toBe(false);
    expect(orderingSchema.safeParse({ mode: "external", externalUrl: "https://www.zomato.com/x" }).success).toBe(true);
  });
});

describe("offers", () => {
  it("checks that the end date is after the start date", () => {
    const r = offerInputSchema.safeParse({
      title: "Deal",
      ctaTarget: { type: "menu" },
      startsAt: "2026-10-02T10:00:00.000Z",
      endsAt: "2026-10-01T10:00:00.000Z",
    });
    expect(r.success).toBe(false);
  });
});

describe("documents", () => {
  it("every document has complete defaults", () => {
    for (const schema of Object.values(documentSchemas)) expect(schema.safeParse({}).success).toBe(true);
  });
  it("homepage sections are de-duplicated and completed", () => {
    const r = homepageSchema.parse({ sections: [{ key: "offers", enabled: false }, { key: "offers", enabled: true }] });
    expect(r.sections[0]).toEqual({ key: "offers", enabled: false });
    expect(r.sections).toHaveLength(9);
  });
});
