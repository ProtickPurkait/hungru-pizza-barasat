import "server-only";
import { asc, inArray } from "drizzle-orm";
import type { LinkOptions } from "@/components/admin/fields";
import type { MediaPreview } from "@/components/admin/media";
import { db } from "@/db";
import * as t from "@/db/schema";
import { mediaUrl } from "@/lib/content/media-url";

export async function getLinkOptions(): Promise<LinkOptions> {
  const [categories, products] = await Promise.all([
    db.select({ slug: t.categories.slug, name: t.categories.name }).from(t.categories).orderBy(asc(t.categories.sortOrder)),
    db.select({ slug: t.products.slug, name: t.products.name }).from(t.products).orderBy(asc(t.products.name)),
  ]);
  return { categories, products };
}

/** Thumbnails for media ids referenced by a form. */
export async function getMediaPreviews(ids: (string | null | undefined)[]): Promise<Record<string, MediaPreview>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return {};
  const rows = await db
    .select({ id: t.media.id, filename: t.media.filename, mime: t.media.mime, kind: t.media.kind, alt: t.media.alt })
    .from(t.media)
    .where(inArray(t.media.id, unique));
  return Object.fromEntries(rows.map((r) => [r.id, { id: r.id, url: mediaUrl(r), kind: r.kind, alt: r.alt, filename: r.filename }]));
}
