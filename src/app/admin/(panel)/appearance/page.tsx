import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { getLinkOptions, getMediaPreviews } from "../../_lib/data";
import { AppearanceEditor } from "./appearance-editor";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  await requireAdmin();
  const [brand, footer, linkOptions] = await Promise.all([loadDocument(db, "brand"), loadDocument(db, "footer"), getLinkOptions()]);
  const previews = await getMediaPreviews([brand.logoId, brand.faviconId]);
  return (
    <>
      <PageHeader title="Appearance" description="Your logo, brand colours and footer. Social links are under Contact & hours." />
      <AppearanceEditor brand={brand} footer={footer} linkOptions={linkOptions} previews={previews} />
    </>
  );
}
