"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/admin/_actions/orders";
import { useConfirm } from "@/components/admin/confirm";
import { Button, Select } from "@/components/admin/ui";
import { nextStatuses, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/ordering/status";

export function OrderStatusControls({ id, status, fulfillment }: { id: string; status: OrderStatus; fulfillment: "delivery" | "pickup" }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const next = nextStatuses(status, fulfillment);

  const change = (value: OrderStatus) =>
    start(async () => {
      const result = await updateOrderStatus(id, value);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {next.map((s) => (
        <Button key={s} size="lg" onClick={() => change(s)} loading={pending}>
          Mark as {ORDER_STATUS_LABELS[s].toLowerCase()}
        </Button>
      ))}
      {status !== "cancelled" && status !== "completed" && (
        <Button
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          disabled={pending}
          onClick={async () => {
            if (
              await confirm({
                title: "Cancel this order?",
                description: "Let the customer know by phone or WhatsApp.",
                confirmLabel: "Cancel order",
                cancelLabel: "Keep order",
              })
            )
              change("cancelled");
          }}
        >
          Cancel order
        </Button>
      )}
      <label className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-stone-700">
        Or set status
        <Select value={status} onChange={(e) => change(e.target.value as OrderStatus)} disabled={pending}>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
