import { asc, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const rows = await db
    .select({
      id: t.categories.id,
      name: t.categories.name,
      slug: t.categories.slug,
      description: t.categories.description,
      isActive: t.categories.isActive,
      productCount: count(t.products.id),
    })
    .from(t.categories)
    .leftJoin(t.products, eq(t.products.categoryId, t.categories.id))
    .groupBy(t.categories.id)
    .orderBy(asc(t.categories.sortOrder), asc(t.categories.createdAt));

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your menu (Pizzas, Sides, Beverages…). Drag to change the order customers see. Empty or hidden categories don't appear on the website."
      />
      <CategoryManager categories={rows} />
    </>
  );
}
