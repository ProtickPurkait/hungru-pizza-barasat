import { createHash } from "node:crypto";
import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db";
import * as t from "@/db/schema";
import { mediaUrl } from "./media-url";
import {
  documentSchemas,
  linkTargetSchema,
  type DocumentData,
  type DocumentKey,
  type FeatureIconKey,
  FEATURE_ICONS,
} from "./schemas";
import type { LiveState, MediaRef, SiteContent } from "./types";

type Db = Pick<Database, "select" | "query">;

/** Reads a singleton document, falling back to schema defaults for anything missing. */
export async function loadDocument<K extends DocumentKey>(db: Db, key: K): Promise<DocumentData<K>> {
  const rows = await db
    .select({ data: t.contentDocuments.data })
    .from(t.contentDocuments)
    .where(eq(t.contentDocuments.key, key))
    .limit(1);
  return parseDocument(key, rows[0]?.data);
}

export function parseDocument<K extends DocumentKey>(key: K, data: unknown): DocumentData<K> {
  const schema = documentSchemas[key];
  const parsed = schema.safeParse(data ?? {});
  if (parsed.success) return parsed.data as DocumentData<K>;
  console.warn(`[content] Stored "${key}" document failed validation; using defaults.`, parsed.error.issues);
  return schema.parse({}) as DocumentData<K>;
}

export async function loadAllDocuments(db: Db) {
  const rows = await db.select({ key: t.contentDocuments.key, data: t.contentDocuments.data }).from(t.contentDocuments);
  const byKey = new Map(rows.map((r) => [r.key, r.data]));
  return {
    brand: parseDocument("brand", byKey.get("brand")),
    social: parseDocument("social", byKey.get("social")),
    hero: parseDocument("hero", byKey.get("hero")),
    homepage: parseDocument("homepage", byKey.get("homepage")),
    story: parseDocument("story", byKey.get("story")),
    contact: parseDocument("contact", byKey.get("contact")),
    ordering: parseDocument("ordering", byKey.get("ordering")),
    seo: parseDocument("seo", byKey.get("seo")),
    footer: parseDocument("footer", byKey.get("footer")),
    analytics: parseDocument("analytics", byKey.get("analytics")),
    live: parseDocument("live", byKey.get("live")),
  };
}

const toIcon = (icon: string): FeatureIconKey =>
  (FEATURE_ICONS as readonly string[]).includes(icon) ? (icon as FeatureIconKey) : "flame";

/**
 * Compiles the CMS working tables into the exact data the public site renders.
 * The result is deterministic, so its hash tells us whether there are unpublished changes.
 */
export async function compileSiteContent(db: Db): Promise<SiteContent> {
  const [docs, categoryRows, productRows, offerRows, reviewRows, featureRows] = await Promise.all([
    loadAllDocuments(db),
    db.select().from(t.categories).where(eq(t.categories.isActive, true)).orderBy(asc(t.categories.sortOrder), asc(t.categories.createdAt)),
    db.select().from(t.products).where(eq(t.products.isVisible, true)).orderBy(asc(t.products.sortOrder), asc(t.products.createdAt)),
    db.select().from(t.offers).where(eq(t.offers.isActive, true)).orderBy(asc(t.offers.sortOrder), asc(t.offers.createdAt)),
    db.select().from(t.reviews).where(eq(t.reviews.isEnabled, true)).orderBy(asc(t.reviews.sortOrder), asc(t.reviews.createdAt)),
    db.select().from(t.features).where(eq(t.features.isActive, true)).orderBy(asc(t.features.sortOrder), asc(t.features.createdAt)),
  ]);

  const activeCategoryIds = new Set(categoryRows.map((c) => c.id));
  const visibleProducts = productRows.filter((p) => p.categoryId && activeCategoryIds.has(p.categoryId));

  // Resolve every referenced media file in one query (metadata only — never the binary).
  const mediaIds = new Set<string>();
  const addId = (id: string | null | undefined) => {
    if (id) mediaIds.add(id);
  };
  addId(docs.brand.logoId);
  addId(docs.brand.faviconId);
  addId(docs.hero.media.imageId);
  addId(docs.hero.media.videoId);
  addId(docs.seo.ogImageId);
  docs.story.imageIds.forEach(addId);
  visibleProducts.forEach((p) => addId(p.imageId));
  offerRows.forEach((o) => addId(o.imageId));
  reviewRows.forEach((r) => addId(r.imageId));
  featureRows.forEach((f) => addId(f.imageId));

  const mediaRows = mediaIds.size
    ? await db
        .select({
          id: t.media.id,
          filename: t.media.filename,
          mime: t.media.mime,
          kind: t.media.kind,
          width: t.media.width,
          height: t.media.height,
          alt: t.media.alt,
          blurDataUrl: t.media.blurDataUrl,
        })
        .from(t.media)
        .where(inArray(t.media.id, [...mediaIds].sort()))
    : [];
  const mediaById = new Map<string, MediaRef>(
    mediaRows.map((m) => [
      m.id,
      {
        id: m.id,
        src: mediaUrl(m),
        kind: m.kind,
        mime: m.mime,
        width: m.width,
        height: m.height,
        alt: m.alt,
        blurDataUrl: m.blurDataUrl,
      },
    ]),
  );
  const ref = (id: string | null | undefined) => (id ? (mediaById.get(id) ?? null) : null);

  const products: SiteContent["products"] = visibleProducts.map((p) => ({
    id: p.id,
    categoryId: p.categoryId!,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    discountPrice: p.discountPrice,
    image: ref(p.imageId),
    diet: p.diet,
    badge: p.badge,
    isBestseller: p.isBestseller,
    options: p.options ?? [],
    isSample: p.isSample,
    isAvailable: true,
  }));

  const bestsellerIds = visibleProducts
    .filter((p) => p.isBestseller)
    .sort((a, b) => a.bestsellerSort - b.bestsellerSort || a.sortOrder - b.sortOrder)
    .map((p) => p.id);

  return {
    brand: { ...docs.brand, logo: ref(docs.brand.logoId), favicon: ref(docs.brand.faviconId) },
    social: docs.social,
    hero: { ...docs.hero, image: ref(docs.hero.media.imageId), video: ref(docs.hero.media.videoId) },
    homepage: docs.homepage,
    story: {
      ...docs.story,
      images: docs.story.imageIds.map((id) => mediaById.get(id)).filter((m): m is MediaRef => Boolean(m)),
    },
    contact: docs.contact,
    ordering: docs.ordering,
    seo: { ...docs.seo, ogImage: ref(docs.seo.ogImageId) },
    footer: docs.footer,
    analytics: docs.analytics,
    categories: categoryRows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description })),
    products,
    bestsellerIds,
    offers: offerRows.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      image: ref(o.imageId),
      badge: o.badge,
      price: o.price,
      originalPrice: o.originalPrice,
      ctaLabel: o.ctaLabel,
      ctaTarget: linkTargetSchema.safeParse(o.ctaTarget).data ?? { type: "menu", value: "" },
      startsAt: o.startsAt?.toISOString() ?? null,
      endsAt: o.endsAt?.toISOString() ?? null,
      isSample: o.isSample,
    })),
    reviews: reviewRows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      content: r.content,
      rating: r.rating,
      source: r.source,
      image: ref(r.imageId),
      isSample: r.isSample,
    })),
    features: featureRows.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      icon: toIcon(f.icon),
      image: ref(f.imageId),
      isSample: f.isSample,
    })),
  };
}

/** Stable hash of compiled content (object keys are built in a fixed order by compileSiteContent). */
export function hashContent(content: SiteContent): string {
  return createHash("sha256").update(stableStringify(content)).digest("hex");
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/** Operational state that changes instantly, without publishing. */
export async function loadLiveState(db: Db): Promise<LiveState> {
  const [live, unavailable] = await Promise.all([
    loadDocument(db, "live"),
    db.select({ id: t.products.id }).from(t.products).where(eq(t.products.isAvailable, false)),
  ]);
  return { live, unavailableProductIds: unavailable.map((p) => p.id) };
}

export function applyLiveState(content: SiteContent, state: LiveState): SiteContent {
  const unavailable = new Set(state.unavailableProductIds);
  return {
    ...content,
    products: content.products.map((p) => ({ ...p, isAvailable: !unavailable.has(p.id) })),
  };
}

/** Offers can be scheduled; filter by the current time at render so schedules work without republishing. */
export function isOfferLive(offer: { startsAt: string | null; endsAt: string | null }, now = Date.now()) {
  if (offer.startsAt && Date.parse(offer.startsAt) > now) return false;
  if (offer.endsAt && Date.parse(offer.endsAt) <= now) return false;
  return true;
}
