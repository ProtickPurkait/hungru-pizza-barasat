import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { EmptyState, ButtonLink, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add menu item" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/menu/new">) {
  await requireAdmin();
  const { category } = await searchParams;
  const categories = await db.select({ id: t.categories.id, name: t.categories.name }).from(t.categories).orderBy(asc(t.categories.sortOrder));
  const preselected = categories.find((c) => c.id === category)?.id ?? categories[0]?.id ?? "";

  return (
    <>
      <PageHeader title="Add menu item" back={{ href: "/admin/menu", label: "Menu items" }} />
      {categories.length === 0 ? (
        <EmptyState
          title="Create a category first"
          description="Menu items live in categories like Pizzas, Sides or Beverages."
          action={<ButtonLink href="/admin/categories">Add a category</ButtonLink>}
        />
      ) : (
        <ProductForm
          categories={categories}
          imagePreview={null}
          initial={{
            name: "",
            slug: "",
            description: "",
            categoryId: preselected,
            price: "",
            discountPrice: "",
            imageId: null,
            diet: "veg",
            badge: "",
            isBestseller: false,
            isAvailable: true,
            isVisible: true,
            options: [],
          }}
        />
      )}
    </>
  );
}
