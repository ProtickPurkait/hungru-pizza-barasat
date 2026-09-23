import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import * as t from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { paiseToInput } from "@/lib/money";
import { getMediaPreviews } from "../../../_lib/data";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit menu item" };

export default async function EditProductPage({ params }: PageProps<"/admin/menu/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [rows, categories] = await Promise.all([
    db.select().from(t.products).where(eq(t.products.id, id)).limit(1),
    db.select({ id: t.categories.id, name: t.categories.name }).from(t.categories).orderBy(asc(t.categories.sortOrder)),
  ]);
  const product = rows[0];
  if (!product) notFound();
  const previews = await getMediaPreviews([product.imageId]);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {product.name}
            {product.isSample && <Badge tone="info">Sample item: edit it to make it yours</Badge>}
          </span>
        }
        back={{ href: "/admin/menu", label: "Menu items" }}
      />
      <ProductForm
        key={product.updatedAt.toISOString()}
        productId={product.id}
        categories={categories}
        imagePreview={product.imageId ? (previews[product.imageId] ?? null) : null}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId ?? "",
          price: paiseToInput(product.price),
          discountPrice: paiseToInput(product.discountPrice),
          imageId: product.imageId,
          diet: product.diet,
          badge: product.badge,
          isBestseller: product.isBestseller,
          isAvailable: product.isAvailable,
          isVisible: product.isVisible,
          options: (product.options ?? []).map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            required: g.required,
            maxSelect: String(g.maxSelect ?? 0),
            options: g.options.map((o) => ({
              id: o.id,
              name: o.name,
              price: paiseToInput(o.priceDelta),
              isDefault: o.isDefault,
              isAvailable: o.isAvailable,
            })),
          })),
        }}
      />
    </>
  );
}
