import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/admin")) return "/";
  return value;
}

/** Turns on preview mode for signed-in admins, then shows the site with unpublished changes. */
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) redirect("/admin/login");
  const draft = await draftMode();
  draft.enable();
  redirect(safePath(request.nextUrl.searchParams.get("path")));
}
