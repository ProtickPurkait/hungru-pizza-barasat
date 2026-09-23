import { describe, expect, it } from "vitest";
import { discountPercent, formatINR, paiseToInput } from "@/lib/money";

describe("formatINR", () => {
  it("formats whole rupees without decimals", () => {
    expect(formatINR(29900)).toBe("₹299");
    expect(formatINR(0)).toBe("₹0");
  });
  it("keeps paise when present", () => {
    expect(formatINR(29950)).toBe("₹299.50");
  });
  it("uses Indian digit grouping", () => {
    expect(formatINR(12345600)).toBe("₹1,23,456");
  });
});

describe("paiseToInput", () => {
  it("round-trips admin inputs", () => {
    expect(paiseToInput(29900)).toBe("299");
    expect(paiseToInput(29950)).toBe("299.50");
    expect(paiseToInput(null)).toBe("");
  });
});

describe("discountPercent", () => {
  it("computes rounded percentage", () => {
    expect(discountPercent(29900, 25900)).toBe(13);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, 150)).toBe(0);
  });
});
