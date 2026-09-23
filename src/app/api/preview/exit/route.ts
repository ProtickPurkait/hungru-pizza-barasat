import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();
  const to = request.nextUrl.searchParams.get("to");
  redirect(to === "admin" ? "/admin" : "/");
}
