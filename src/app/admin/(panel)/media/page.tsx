import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { mediaUrl } from "@/lib/content/media-url";
import { MediaLibrary } from "./media-library";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  await requireAdmin();
  const rows = await db
    .select({
      id: media.id,
      filename: media.filename,
      mime: media.mime,
      kind: media.kind,
      size: media.size,
      width: media.width,
      height: media.height,
      alt: media.alt,
      blurDataUrl: media.blurDataUrl,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt));
  return (
    <>
      <PageHeader
        title="Media library"
        description="All your photos and videos. Uploads are resized and compressed automatically so the website stays fast. Add a short description to each photo; it helps Google and visually impaired visitors."
      />
      <MediaLibrary items={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), url: mediaUrl(r) }))} />
    </>
  );
}
