import { describe, expect, it } from "vitest";
import { applyLiveState, hashContent, isOfferLive, stableStringify } from "@/lib/content/compile";
import { mediaUrl } from "@/lib/content/media-url";
import type { SiteContent } from "@/lib/content/types";
import { jsonLdScript, restaurantJsonLd } from "@/lib/seo/structured-data";
import { documentSchemas } from "@/lib/content/schemas";

function content(overrides: Partial<SiteContent> = {}): SiteContent {
  const d = (k: keyof typeof documentSchemas) => documentSchemas[k].parse({});
  return {
    brand: { ...(d("brand") as SiteContent["brand"]), logo: null, favicon: null },
    social: d("social") as SiteContent["social"],
    hero: { ...(d("hero") as SiteContent["hero"]), image: null, video: null },
    homepage: d("homepage") as SiteContent["homepage"],
    story: { ...(d("story") as SiteContent["story"]), images: [] },
    contact: d("contact") as SiteContent["contact"],
    ordering: d("ordering") as SiteContent["ordering"],
    seo: { ...(d("seo") as SiteContent["seo"]), ogImage: null },
    footer: d("footer") as SiteContent["footer"],
    analytics: d("analytics") as SiteContent["analytics"],
    categories: [],
    products: [],
    bestsellerIds: [],
    offers: [],
    reviews: [],
    features: [],
    ...overrides,
  };
}

describe("hashContent", () => {
  it("ignores object key order (JSONB reorders keys)", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
    const c = content();
    const shuffled = JSON.parse(JSON.stringify(c, Object.keys(c).reverse()));
    expect(hashContent({ ...shuffled, ...c })).toBe(hashContent(c));
  });
  it("changes when content changes", () => {
    const a = content();
    const b = content({ hero: { ...a.hero, headline: "New" } });
    expect(hashContent(a)).not.toBe(hashContent(b));
  });
});

describe("applyLiveState", () => {
  it("marks unavailable products without touching others", () => {
    const product = {
      id: "p1",
      categoryId: "c",
      name: "A",
      slug: "a",
      description: "",
      price: 100,
      discountPrice: null,
      image: null,
      diet: "veg" as const,
      badge: "",
      isBestseller: false,
      options: [],
      isSample: false,
      isAvailable: true,
    };
    const c = content({ products: [product, { ...product, id: "p2" }] });
    const live = applyLiveState(c, { live: documentSchemas.live.parse({}), unavailableProductIds: ["p2"] });
    expect(live.products.map((p) => p.isAvailable)).toEqual([true, false]);
  });
});

describe("isOfferLive", () => {
  const now = Date.parse("2026-09-23T12:00:00Z");
  it("respects start and end dates", () => {
    expect(isOfferLive({ startsAt: null, endsAt: null }, now)).toBe(true);
    expect(isOfferLive({ startsAt: "2026-09-24T00:00:00Z", endsAt: null }, now)).toBe(false);
    expect(isOfferLive({ startsAt: null, endsAt: "2026-09-23T11:00:00Z" }, now)).toBe(false);
  });
});

describe("structured data", () => {
  it("only includes information the owner entered", () => {
    const data = restaurantJsonLd(content(), "https://example.com");
    expect(data.telephone).toBeUndefined();
    expect(data.address).toBeUndefined();
    expect(data.aggregateRating).toBeUndefined();
    expect(data.name).toBe("Hungru Pizza Barasat");
  });
  it("adds contact details when present", () => {
    const c = content();
    const data = restaurantJsonLd(content({ contact: { ...c.contact, phone: "+91 98765 43210", address: "Line 1\nBarasat" } }), "https://example.com");
    expect(data.telephone).toBe("+91 98765 43210");
    expect(data.address).toMatchObject({ streetAddress: "Line 1, Barasat" });
  });
  it("escapes script-breaking characters", () => {
    expect(jsonLdScript({ a: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});

describe("mediaUrl", () => {
  it("builds clean, immutable URLs", () => {
    expect(mediaUrl({ id: "abc", filename: "My Pizza (1).JPG", mime: "image/webp" })).toBe("/media/abc/my-pizza-1.webp");
  });
});
