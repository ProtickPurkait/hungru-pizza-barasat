import { describe, expect, it } from "vitest";
import {
  basePrice,
  checkSelection,
  computeTotals,
  defaultSelection,
  lineKey,
  priceItem,
  type PriceableProduct,
} from "@/lib/cart/pricing";

const pizza: PriceableProduct = {
  id: "p1",
  price: 29900,
  discountPrice: 25900,
  options: [
    {
      id: "size",
      name: "Size",
      type: "single",
      required: true,
      maxSelect: 0,
      options: [
        { id: "reg", name: "Regular", priceDelta: 0, isDefault: true, isAvailable: true },
        { id: "lg", name: "Large", priceDelta: 20000, isDefault: false, isAvailable: true },
        { id: "xl", name: "XL", priceDelta: 30000, isDefault: false, isAvailable: false },
      ],
    },
    {
      id: "addons",
      name: "Add-ons",
      type: "multiple",
      required: false,
      maxSelect: 2,
      options: [
        { id: "cheese", name: "Extra cheese", priceDelta: 6000, isDefault: false, isAvailable: true },
        { id: "olive", name: "Olives", priceDelta: 4000, isDefault: false, isAvailable: true },
        { id: "jala", name: "Jalapeño", priceDelta: 4000, isDefault: false, isAvailable: true },
      ],
    },
  ],
};

describe("basePrice", () => {
  it("uses the discount when it is lower", () => {
    expect(basePrice(pizza)).toBe(25900);
    expect(basePrice({ price: 100, discountPrice: null })).toBe(100);
    expect(basePrice({ price: 100, discountPrice: 200 })).toBe(100);
  });
});

describe("defaultSelection", () => {
  it("picks defaults and leaves optional groups empty", () => {
    expect(defaultSelection(pizza)).toEqual({ size: ["reg"], addons: [] });
  });
  it("falls back to the first available choice for required groups without a default", () => {
    const p = { ...pizza, options: [{ ...pizza.options[0], options: pizza.options[0].options.map((o) => ({ ...o, isDefault: false })) }] };
    expect(defaultSelection(p)).toEqual({ size: ["reg"] });
  });
});

describe("checkSelection", () => {
  it("accepts a valid selection", () => {
    expect(checkSelection(pizza, { size: ["lg"], addons: ["cheese"] }).ok).toBe(true);
  });
  it("rejects missing required groups", () => {
    const r = checkSelection(pizza, { size: [], addons: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.size).toMatch(/choose a size/i);
  });
  it("rejects unavailable choices", () => {
    expect(checkSelection(pizza, { size: ["xl"] }).ok).toBe(false);
  });
  it("enforces the maximum for multi-select groups", () => {
    const r = checkSelection(pizza, { size: ["reg"], addons: ["cheese", "olive", "jala"] });
    expect(r.ok).toBe(false);
    expect(r.errors.addons).toMatch(/up to 2/);
  });
  it("rejects two choices in a single-choice group", () => {
    expect(checkSelection(pizza, { size: ["reg", "lg"] }).ok).toBe(false);
  });
  it("rejects option groups the product no longer has", () => {
    expect(checkSelection(pizza, { size: ["reg"], crust: ["thin"] }).ok).toBe(false);
  });
  it("normalises to the owner's option order", () => {
    expect(checkSelection(pizza, { size: ["reg"], addons: ["olive", "cheese"] }).normalized.addons).toEqual(["cheese", "olive"]);
  });
});

describe("priceItem", () => {
  it("adds option deltas to the discounted base and the original price", () => {
    const r = priceItem(pizza, { size: ["lg"], addons: ["cheese"] }, 2);
    expect(r.unitPrice).toBe(25900 + 20000 + 6000);
    expect(r.unitOriginalPrice).toBe(29900 + 20000 + 6000);
    expect(r.lineTotal).toBe(2 * 51900);
    expect(r.options.map((o) => o.optionName)).toEqual(["Large", "Extra cheese"]);
  });
});

describe("computeTotals", () => {
  it("sums items, discount and delivery fee", () => {
    const t = computeTotals(
      [
        { quantity: 2, lineTotal: 1000, lineOriginalTotal: 1200 },
        { quantity: 1, lineTotal: 500, lineOriginalTotal: 500 },
      ],
      3000,
    );
    expect(t).toEqual({ itemCount: 3, subtotal: 1700, discount: 200, deliveryFee: 3000, total: 4500 });
  });
  it("never charges delivery on an empty cart", () => {
    expect(computeTotals([], 3000).total).toBe(0);
  });
});

describe("lineKey", () => {
  it("is stable regardless of key and choice order", () => {
    expect(lineKey("p1", { b: ["y", "x"], a: ["z"] })).toBe(lineKey("p1", { a: ["z"], b: ["x", "y"] }));
    expect(lineKey("p1", { a: [] })).toBe("p1");
  });
});
