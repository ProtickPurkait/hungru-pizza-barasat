import { NextResponse } from "next/server";
import { findOrderByToken } from "@/lib/ordering/lookup";
import { demoModeResponse } from "@/lib/demo-guard";

/** Lets the confirmation page poll for status updates made by the restaurant. */
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[token]">) {
  const unavailable = demoModeResponse();
  if (unavailable) return unavailable;
  const { token } = await ctx.params;
  const order = await findOrderByToken(token);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(
    { status: order.status, updatedAt: order.updatedAt.toISOString() },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
