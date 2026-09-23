import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { FEATURE_ICONS, type FeatureIconKey } from "@/lib/content/schemas";
import { getMediaPreviews } from "../../_lib/data";
import { FeatureManager } from "./feature-manager";

export const metadata: Metadata = { title: "Why Hungru" };

export default async function WhyHungruPage() {
  await requireAdmin();
  const [rows, homepage] = await Promise.all([
    db.select().from(t.features).orderBy(asc(t.features.sortOrder), asc(t.features.createdAt)),
    loadDocument(db, "homepage"),
  ]);
  const previews = await getMediaPreviews(rows.map((r) => r.imageId));
  return (
    <>
      <PageHeader
        title="Why Hungru"
        description="The reasons people should choose you. Keep each point short and true: no awards, ratings or promises you can't back up."
      />
      <FeatureManager
        homepage={homepage}
        features={rows.map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          icon: ((FEATURE_ICONS as readonly string[]).includes(f.icon) ? f.icon : "flame") as FeatureIconKey,
          imageId: f.imageId,
          isActive: f.isActive,
          isSample: f.isSample,
          image: f.imageId ? (previews[f.imageId] ?? null) : null,
        }))}
      />
    </>
  );
}
