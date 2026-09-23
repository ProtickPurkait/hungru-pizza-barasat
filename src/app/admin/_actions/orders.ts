"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderStatus } from "@/db/schema";
import { safeAction, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth/session";
import { ORDER_STATUS_LABELS } from "@/lib/ordering/status";

const schema = z.object({ id: z.uuid(), status: z.enum(orderStatus.enumValues) });

export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = schema.safeParse({ id, status });
    if (!parsed.success) return { ok: false, message: "Unknown order status." };
    await db.update(orders).set({ status: parsed.data.status }).where(eq(orders.id, parsed.data.id));
    return { ok: true, message: `Order marked “${ORDER_STATUS_LABELS[parsed.data.status]}”.` };
  });
}
