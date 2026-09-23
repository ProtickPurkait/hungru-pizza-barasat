export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Customer-facing wording on the confirmation page. */
export const ORDER_STATUS_CUSTOMER: Record<OrderStatus, string> = {
  new: "Received — waiting for the restaurant to confirm",
  confirmed: "Confirmed by the restaurant",
  preparing: "Being prepared",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed — enjoy!",
  cancelled: "Cancelled",
};

export function nextStatuses(status: OrderStatus, fulfillment: "delivery" | "pickup"): OrderStatus[] {
  const flow: OrderStatus[] =
    fulfillment === "delivery"
      ? ["new", "confirmed", "preparing", "out_for_delivery", "completed"]
      : ["new", "confirmed", "preparing", "ready", "completed"];
  const index = flow.indexOf(status);
  if (status === "completed" || status === "cancelled") return [];
  return index >= 0 && index < flow.length - 1 ? [flow[index + 1]] : [];
}

export function statusTone(status: OrderStatus) {
  return status === "new" ? "brand" : status === "cancelled" ? "danger" : status === "completed" ? "success" : "info";
}
