import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { siteUrl } from "@/lib/env";
import { getMediaPreviews } from "../../_lib/data";
import { SeoEditor } from "./seo-editor";

export const metadata: Metadata = { title: "SEO & sharing" };

export default async function SeoPage() {
  await requireAdmin();
  const [seo, brand] = await Promise.all([loadDocument(db, "seo"), loadDocument(db, "brand")]);
  const previews = await getMediaPreviews([seo.ogImageId]);
  return (
    <>
      <PageHeader
        title="SEO & sharing"
        description="How Hungru looks in Google results and when someone shares your link on WhatsApp, Instagram or Facebook."
      />
      <SeoEditor
        seo={seo}
        brandName={brand.name}
        siteUrl={siteUrl()}
        ogPreview={seo.ogImageId ? (previews[seo.ogImageId] ?? null) : null}
      />
    </>
  );
}
