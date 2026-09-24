import "server-only";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";

/** For route handlers that need the database: a 503 in the design preview (`DEMO_MODE=true`), otherwise null. */
export function demoModeResponse(): NextResponse | null {
  if (!isDemoMode()) return null;
  return NextResponse.json({ error: "Not available in the design preview." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
