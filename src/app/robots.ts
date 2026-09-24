import type { MetadataRoute } from "next";
import { isDemoMode, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // The design preview shows sample content: keep it out of search engines entirely.
  if (isDemoMode()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout", "/order"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
