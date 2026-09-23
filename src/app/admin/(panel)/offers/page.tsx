import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getMediaPreviews } from "../../_lib/data";
import { OfferList } from "./offer-list";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  await requireAdmin();
  const rows = await db.select().from(t.offers).orderBy(asc(t.offers.sortOrder), asc(t.offers.createdAt));
  const previews = await getMediaPreviews(rows.map((r) => r.imageId));
  return (
    <>
      <PageHeader
        title="Offers"
        description="Deals and combos shown in the bold promo section of your homepage. Only switched-on offers within their dates are shown."
        actions={
          <ButtonLink href="/admin/offers/new" icon={<Plus className="size-4" aria-hidden />}>
            Add offer
          </ButtonLink>
        }
      />
      <OfferList
        offers={rows.map((o) => ({
          id: o.id,
          title: o.title,
          badge: o.badge,
          price: o.price,
          originalPrice: o.originalPrice,
          isActive: o.isActive,
          isSample: o.isSample,
          startsAt: o.startsAt?.toISOString() ?? null,
          endsAt: o.endsAt?.toISOString() ?? null,
          imageUrl: o.imageId ? (previews[o.imageId]?.url ?? null) : null,
        }))}
      />
    </>
  );
}
