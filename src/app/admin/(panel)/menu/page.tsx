import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getMediaPreviews } from "../../_lib/data";
import { MenuManager } from "./menu-manager";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([
    db.select({ id: t.categories.id, name: t.categories.name, isActive: t.categories.isActive }).from(t.categories).orderBy(asc(t.categories.sortOrder)),
    db
      .select({
        id: t.products.id,
        name: t.products.name,
        categoryId: t.products.categoryId,
        price: t.products.price,
        discountPrice: t.products.discountPrice,
        imageId: t.products.imageId,
        diet: t.products.diet,
        isBestseller: t.products.isBestseller,
        isAvailable: t.products.isAvailable,
        isVisible: t.products.isVisible,
        isSample: t.products.isSample,
        badge: t.products.badge,
        optionCount: t.products.options,
      })
      .from(t.products)
      .orderBy(asc(t.products.sortOrder), asc(t.products.createdAt)),
  ]);
  const previews = await getMediaPreviews(products.map((p) => p.imageId));

  return (
    <>
      <PageHeader
        title="Menu items"
        description="Add dishes, change prices and mark items out of stock. Out-of-stock changes go live instantly; everything else goes live when you publish."
        actions={
          <ButtonLink href="/admin/menu/new" icon={<Plus className="size-4" aria-hidden />}>
            Add menu item
          </ButtonLink>
        }
      />
      <MenuManager
        categories={categories}
        products={products.map((p) => ({
          ...p,
          optionCount: Array.isArray(p.optionCount) ? p.optionCount.length : 0,
          imageUrl: p.imageId ? (previews[p.imageId]?.url ?? null) : null,
        }))}
      />
    </>
  );
}
