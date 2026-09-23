"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { useCart } from "@/lib/cart/store";
import { ORDER_STATUS_CUSTOMER, type OrderStatus } from "@/lib/ordering/status";

/** Live order progress: polls every 20 seconds while the page is open. */
export function OrderStatusTracker({
  token,
  initialStatus,
  fulfillment,
  total,
  reference,
}: {
  token: string;
  initialStatus: OrderStatus;
  fulfillment: "delivery" | "pickup";
  total: number;
  reference: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const clear = useCart((s) => s.clear);
  const tracked = useRef(false);

  useEffect(() => {
    clear();
    if (tracked.current) return;
    tracked.current = true;
    try {
      const key = `hungru-tracked-${token}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        track("order_completed", { value: total / 100, currency: "INR", transaction_id: reference });
      }
    } catch {
      track("order_completed", { value: total / 100, currency: "INR", transaction_id: reference });
    }
  }, [clear, token, total, reference]);

  useEffect(() => {
    if (status === "completed" || status === "cancelled") return;
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/orders/${token}`, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { status: OrderStatus };
          setStatus(json.status);
        }
      } catch {
        /* offline — try again next tick */
      }
    }, 20_000);
    return () => clearInterval(id);
  }, [status, token]);

  const steps: OrderStatus[] =
    fulfillment === "delivery" ? ["new", "confirmed", "preparing", "out_for_delivery", "completed"] : ["new", "confirmed", "preparing", "ready", "completed"];
  const labels: Record<OrderStatus, string> = {
    new: "Received",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    out_for_delivery: "On the way",
    completed: "Done",
    cancelled: "Cancelled",
  };
  const current = steps.indexOf(status);

  return (
    <div aria-live="polite">
      <p className="text-sm font-extrabold tracking-widest text-ink/65 uppercase">Status</p>
      <p className={clsx("mt-1 text-xl font-extrabold", status === "cancelled" && "text-meat")}>{ORDER_STATUS_CUSTOMER[status]}</p>
      {status === "cancelled" ? (
        <p className="mt-3 flex items-center gap-2 font-semibold text-meat">
          <X className="size-5" aria-hidden /> This order was cancelled. Please contact the restaurant if you have questions.
        </p>
      ) : (
        <ol className="mt-5 grid grid-cols-5 gap-1.5">
          {steps.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={clsx(
                    "flex size-9 items-center justify-center rounded-full ring-2 ring-ink transition-colors",
                    done ? "bg-basil text-white" : "bg-white text-ink/60",
                    i === current && "ring-4 ring-basil/30",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <span className="text-sm font-bold">{i + 1}</span>}
                </span>
                <span className={clsx("text-[11px] leading-tight font-bold sm:text-xs", done ? "text-ink" : "text-ink/65")}>{labels[step]}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
