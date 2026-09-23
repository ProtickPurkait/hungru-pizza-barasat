import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/lib/auth/cookie";

/**
 * First line of defence for the admin area: bounce visitors without a session cookie to the login page.
 * Every admin page, Server Action and route handler still verifies the session against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasCookie = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  if (!hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const next = pathname + search;
    if (next !== "/admin") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // API routes verify the session themselves (and uploads must not be buffered by the proxy).
  matcher: ["/admin/:path*"],
};
