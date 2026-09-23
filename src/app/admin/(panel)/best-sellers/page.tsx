import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getMediaPreviews } from "../../_lib/data";
import { BestsellerPicker } from "./bestseller-picker";

export const metadata: Metadata = { title: "Best sellers" };

export default async function BestSellersPage() {
  await requireAdmin();
  const products = await db
    .select({
      id: t.products.id,
      name: t.products.name,
      imageId: t.products.imageId,
      diet: t.products.diet,
      price: t.products.price,
      discountPrice: t.products.discountPrice,
      isBestseller: t.products.isBestseller,
      bestsellerSort: t.products.bestsellerSort,
      isVisible: t.products.isVisible,
      isAvailable: t.products.isAvailable,
    })
    .from(t.products)
    .orderBy(asc(t.products.name));
  const previews = await getMediaPreviews(products.map((p) => p.imageId));
  const withImages = products.map((p) => ({ ...p, imageUrl: p.imageId ? (previews[p.imageId]?.url ?? null) : null }));
  const selected = withImages.filter((p) => p.isBestseller).sort((a, b) => a.bestsellerSort - b.bestsellerSort);

  return (
    <>
      <PageHeader
        title="Best sellers"
        description="Choose which items appear in the Best Sellers section on your homepage, and in what order. They also get a “Best seller” badge on the menu."
      />
      <BestsellerPicker products={withImages} initialSelected={selected.map((p) => p.id)} />
    </>
  );
}
