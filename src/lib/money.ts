const whole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fractional = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats paise as rupees: 29900 → "₹299", 29950 → "₹299.50". */
export function formatINR(paise: number) {
  const rupees = paise / 100;
  return paise % 100 === 0 ? whole.format(rupees) : fractional.format(rupees);
}

/** Paise → editable rupee string for admin inputs: 29900 → "299", 29950 → "299.50". */
export function paiseToInput(paise: number | null | undefined) {
  if (paise === null || paise === undefined) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

export function discountPercent(price: number, discounted: number) {
  if (discounted >= price || price <= 0) return 0;
  return Math.round(((price - discounted) / price) * 100);
}
