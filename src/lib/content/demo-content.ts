import "server-only";
import { createHash } from "node:crypto";
import { demoMenu } from "@/db/seed-data/demo-menu";
import { sampleFeatures, sampleOffer, sampleReviews } from "@/db/seed-data/samples";
import { slugify } from "@/lib/slug";
import { parseDocument } from "./compile";
import type { Live } from "./schemas";
import type { SiteContent } from "./types";

/** Stable UUID-shaped id from a name, so carts and links survive redeploys of the preview. */
function demoId(kind: string, name: string): string {
  const hex = createHash("sha1").update(`hungru-demo:${kind}:${name}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const toPaise = (rupees: number) => Math.round(rupees * 100);

let cached: SiteContent | null = null;

/**
 * Everything the public site renders, for the no-database design preview (`DEMO_MODE=true`):
 * schema defaults for every document, the SAMPLE demo menu and the standard placeholders. Every product,
 * review, feature and offer is flagged `isSample`, so the site labels them as samples.
 */
export function demoSiteContent(): SiteContent {
  if (cached) return cached;
  const brand = parseDocument("brand", {});
  const hero = parseDocument("hero", {});
  const story = parseDocument("story", {});
  const seo = parseDocument("seo", {});

  const categories: SiteContent["categories"] = demoMenu.categories
    .filter((c) => c.products.length > 0)
    .map((c) => ({ id: demoId("category", c.name), name: c.name, slug: slugify(c.name), description: c.description ?? "" }));

  const products: SiteContent["products"] = demoMenu.categories.flatMap((c) =>
    c.products.map((p) => ({
      id: demoId("product", p.name),
      categoryId: demoId("category", c.name),
      name: p.name,
      slug: slugify(p.name),
      description: p.description ?? "",
      price: toPaise(p.price),
      discountPrice: p.discountPrice ? toPaise(p.discountPrice) : null,
      image: null,
      diet: p.diet,
      badge: p.badge ?? "",
      isBestseller: Boolean(p.isBestseller),
      options: p.options ?? [],
      isSample: true,
      isAvailable: true,
    })),
  );

  cached = {
    brand: { ...brand, logo: null, favicon: null },
    social: parseDocument("social", {}),
    hero: { ...hero, image: null, video: null },
    homepage: parseDocument("homepage", {}),
    story: { ...story, images: [] },
    contact: parseDocument("contact", {}),
    ordering: parseDocument("ordering", {}),
    seo: { ...seo, ogImage: null },
    footer: parseDocument("footer", {}),
    analytics: parseDocument("analytics", {}),
    categories,
    products,
    bestsellerIds: products.filter((p) => p.isBestseller).map((p) => p.id),
    offers: [
      {
        id: demoId("offer", sampleOffer.title),
        ...sampleOffer,
        image: null,
        price: null,
        originalPrice: null,
        startsAt: null,
        endsAt: null,
        isSample: true,
      },
    ],
    reviews: sampleReviews.map((r) => ({ id: demoId("review", r.authorName), ...r, rating: null, image: null, isSample: true })),
    features: sampleFeatures.map((f) => ({ id: demoId("feature", f.title), ...f, image: null, isSample: true })),
  };
  return cached;
}

export function demoLive(): Live {
  return parseDocument("live", {});
}
