import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getMediaPreviews } from "../../_lib/data";
import { ReviewManager } from "./review-manager";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  await requireAdmin();
  const rows = await db.select().from(t.reviews).orderBy(asc(t.reviews.sortOrder), asc(t.reviews.createdAt));
  const previews = await getMediaPreviews(rows.map((r) => r.imageId));
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Real words from real customers. Copy reviews from Google, Zomato or Instagram. Only switched-on reviews appear on the homepage."
      />
      <ReviewManager
        reviews={rows.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          content: r.content,
          rating: r.rating,
          source: r.source,
          imageId: r.imageId,
          isEnabled: r.isEnabled,
          isSample: r.isSample,
          image: r.imageId ? (previews[r.imageId] ?? null) : null,
        }))}
      />
    </>
  );
}
