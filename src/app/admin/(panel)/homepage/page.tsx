import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { getLinkOptions, getMediaPreviews } from "../../_lib/data";
import { HomepageEditor } from "./homepage-editor";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepagePage() {
  await requireAdmin();
  const [hero, homepage, linkOptions] = await Promise.all([loadDocument(db, "hero"), loadDocument(db, "homepage"), getLinkOptions()]);
  const previews = await getMediaPreviews([hero.media.imageId, hero.media.videoId]);
  return (
    <>
      <PageHeader
        title="Homepage"
        description="The first thing customers see. Edit the hero, choose which sections appear and in what order, and set the headings."
      />
      <HomepageEditor hero={hero} homepage={homepage} linkOptions={linkOptions} previews={previews} />
    </>
  );
}
