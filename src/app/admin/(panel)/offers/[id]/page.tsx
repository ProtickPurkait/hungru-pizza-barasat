import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { linkTargetSchema } from "@/lib/content/schemas";
import { paiseToInput } from "@/lib/money";
import { getLinkOptions, getMediaPreviews } from "../../../_lib/data";
import { OfferEditor } from "./offer-editor";

export const metadata: Metadata = { title: "Edit offer" };

export default async function EditOfferPage({ params }: PageProps<"/admin/offers/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [rows, linkOptions] = await Promise.all([db.select().from(t.offers).where(eq(t.offers.id, id)).limit(1), getLinkOptions()]);
  const offer = rows[0];
  if (!offer) notFound();
  const previews = await getMediaPreviews([offer.imageId]);
  return (
    <>
      <PageHeader title={offer.title} back={{ href: "/admin/offers", label: "Offers" }} />
      <OfferEditor
        key={offer.updatedAt.toISOString()}
        offerId={offer.id}
        linkOptions={linkOptions}
        imagePreview={offer.imageId ? (previews[offer.imageId] ?? null) : null}
        initial={{
          title: offer.title,
          description: offer.description,
          imageId: offer.imageId,
          badge: offer.badge,
          price: paiseToInput(offer.price),
          originalPrice: paiseToInput(offer.originalPrice),
          ctaLabel: offer.ctaLabel,
          ctaTarget: linkTargetSchema.safeParse(offer.ctaTarget).data ?? { type: "menu", value: "" },
          startsAt: offer.startsAt?.toISOString() ?? null,
          endsAt: offer.endsAt?.toISOString() ?? null,
          isActive: offer.isActive,
        }}
      />
    </>
  );
}
