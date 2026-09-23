import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { getMediaPreviews } from "../../_lib/data";
import { StoryEditor } from "./story-editor";

export const metadata: Metadata = { title: "Brand story" };

export default async function BrandStoryPage() {
  await requireAdmin();
  const story = await loadDocument(db, "story");
  const previews = await getMediaPreviews(story.imageIds);
  return (
    <>
      <PageHeader title="Brand story" description="Tell customers who you are. Real stories beat marketing speak: how Hungru started, the people, the kitchen." />
      <StoryEditor story={story} previews={Object.values(previews)} />
    </>
  );
}
