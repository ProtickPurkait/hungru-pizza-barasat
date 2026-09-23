import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as t from "@/db/schema";
import { loadAllDocuments } from "@/lib/content/compile";

/** Where a media file is used — deleting a file that's in use would leave holes on the website. */
export async function findMediaUsage(mediaId: string): Promise<string[]> {
  const uses: string[] = [];
  const docs = await loadAllDocuments(db);
  if (docs.brand.logoId === mediaId) uses.push("Logo (Appearance)");
  if (docs.brand.faviconId === mediaId) uses.push("Favicon (Appearance)");
  if (docs.hero.media.imageId === mediaId) uses.push("Homepage hero image");
  if (docs.hero.media.videoId === mediaId) uses.push("Homepage hero video");
  if (docs.seo.ogImageId === mediaId) uses.push("Social sharing image (SEO)");
  if (docs.story.imageIds.includes(mediaId)) uses.push("Brand story");

  const [products, offers, reviews, features] = await Promise.all([
    db.select({ name: t.products.name }).from(t.products).where(eq(t.products.imageId, mediaId)),
    db.select({ name: t.offers.title }).from(t.offers).where(eq(t.offers.imageId, mediaId)),
    db.select({ name: t.reviews.authorName }).from(t.reviews).where(eq(t.reviews.imageId, mediaId)),
    db.select({ name: t.features.title }).from(t.features).where(eq(t.features.imageId, mediaId)),
  ]);
  products.forEach((p) => uses.push(`Menu item: ${p.name}`));
  offers.forEach((o) => uses.push(`Offer: ${o.name}`));
  reviews.forEach((r) => uses.push(`Review by ${r.name}`));
  features.forEach((f) => uses.push(`Why Hungru: ${f.name}`));

  if (uses.length === 0) {
    const live = await db
      .select({ id: t.publishedSnapshots.id })
      .from(t.publishedSnapshots)
      .where(sql`${t.publishedSnapshots.data}::text like ${`%${mediaId}%`}`)
      .orderBy(desc(t.publishedSnapshots.id))
      .limit(1);
    const latest = await db
      .select({ id: t.publishedSnapshots.id })
      .from(t.publishedSnapshots)
      .orderBy(desc(t.publishedSnapshots.id))
      .limit(1);
    if (live[0] && latest[0] && live[0].id === latest[0].id) uses.push("The live website (publish your latest changes first)");
  }
  return uses;
}
