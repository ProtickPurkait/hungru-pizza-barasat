import type { ProductOptionGroup } from "@/lib/content/schemas";
import type { OrderItemOption } from "@/lib/ordering/types";

/** groupId → chosen option ids */
export type Selection = Record<string, string[]>;

export type PriceableProduct = {
  id: string;
  price: number;
  discountPrice: number | null;
  options: ProductOptionGroup[];
};

export function basePrice(product: Pick<PriceableProduct, "price" | "discountPrice">) {
  return product.discountPrice !== null && product.discountPrice < product.price ? product.discountPrice : product.price;
}

/** Pre-selects each group's default choice (or the first available choice for required single-choice groups). */
export function defaultSelection(product: PriceableProduct): Selection {
  const selection: Selection = {};
  for (const group of product.options) {
    const available = group.options.filter((o) => o.isAvailable);
    const defaults = available.filter((o) => o.isDefault).map((o) => o.id);
    if (group.type === "single") {
      const pick = defaults[0] ?? (group.required ? available[0]?.id : undefined);
      selection[group.id] = pick ? [pick] : [];
    } else {
      selection[group.id] = group.maxSelect > 0 ? defaults.slice(0, group.maxSelect) : defaults;
    }
  }
  return selection;
}

export type SelectionCheck = { ok: boolean; errors: Record<string, string>; normalized: Selection };

/** Validates a customer's choices against the product's current option groups. */
export function checkSelection(product: PriceableProduct, selection: Selection): SelectionCheck {
  const errors: Record<string, string> = {};
  const normalized: Selection = {};
  const knownGroups = new Set(product.options.map((g) => g.id));

  for (const groupId of Object.keys(selection)) {
    if (!knownGroups.has(groupId)) errors[groupId] = "This option is no longer offered";
  }

  for (const group of product.options) {
    const chosen = [...new Set(selection[group.id] ?? [])];
    const valid = chosen.filter((id) => group.options.some((o) => o.id === id && o.isAvailable));
    if (valid.length !== chosen.length) errors[group.id] = `Some ${group.name.toLowerCase()} choices are unavailable`;
    if (group.type === "single" && valid.length > 1) errors[group.id] = `Choose one ${group.name.toLowerCase()}`;
    if (group.type === "multiple" && group.maxSelect > 0 && valid.length > group.maxSelect) {
      errors[group.id] = `Choose up to ${group.maxSelect}`;
    }
    if (group.required && valid.length === 0) errors[group.id] = `Choose a ${group.name.toLowerCase()}`;
    // Keep the owner's option order so line keys are stable.
    normalized[group.id] = group.options.filter((o) => valid.includes(o.id)).map((o) => o.id);
  }
  return { ok: Object.keys(errors).length === 0, errors, normalized };
}

export type PricedItem = {
  options: OrderItemOption[];
  unitPrice: number;
  unitOriginalPrice: number;
  lineTotal: number;
  lineOriginalTotal: number;
};

export function priceItem(product: PriceableProduct, selection: Selection, quantity: number): PricedItem {
  const options: OrderItemOption[] = [];
  for (const group of product.options) {
    for (const optionId of selection[group.id] ?? []) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) continue;
      options.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
    }
  }
  const extras = options.reduce((sum, o) => sum + o.priceDelta, 0);
  const unitPrice = basePrice(product) + extras;
  const unitOriginalPrice = product.price + extras;
  const qty = Math.max(0, Math.floor(quantity));
  return {
    options,
    unitPrice,
    unitOriginalPrice,
    lineTotal: unitPrice * qty,
    lineOriginalTotal: unitOriginalPrice * qty,
  };
}

export type Totals = {
  itemCount: number;
  /** Before product discounts. */
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

export function computeTotals(
  lines: { quantity: number; lineTotal: number; lineOriginalTotal: number }[],
  deliveryFee = 0,
): Totals {
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.lineOriginalTotal, 0);
  const discounted = lines.reduce((n, l) => n + l.lineTotal, 0);
  const fee = itemCount > 0 ? deliveryFee : 0;
  return { itemCount, subtotal, discount: subtotal - discounted, deliveryFee: fee, total: discounted + fee };
}

/** Stable identity for "same product with the same choices" so repeated adds increase quantity. */
export function lineKey(productId: string, selection: Selection) {
  const parts = Object.keys(selection)
    .sort()
    .filter((g) => (selection[g] ?? []).length > 0)
    .map((g) => `${g}=${[...selection[g]].sort().join("+")}`);
  return parts.length ? `${productId}|${parts.join("&")}` : productId;
}

export const MAX_LINE_QUANTITY = 50;
