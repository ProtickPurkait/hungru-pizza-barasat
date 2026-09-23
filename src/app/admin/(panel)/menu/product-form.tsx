"use client";

import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { createProduct, deleteProduct, updateProduct } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { OptionsBuilder, OptionsPreview, type GroupForm } from "@/components/admin/options-builder";
import { SaveBar } from "@/components/admin/save-bar";
import { Button, Card, Field, PriceField, Select, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { FoodArt } from "@/components/ui/food-art";
import { VegMark } from "@/components/ui/veg-mark";
import { rupeesToPaise } from "@/lib/content/schemas";
import { discountPercent, formatINR } from "@/lib/money";

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  imageId: string | null;
  diet: "veg" | "non_veg";
  badge: string;
  isBestseller: boolean;
  isAvailable: boolean;
  isVisible: boolean;
  options: GroupForm[];
};

function toPayload(v: ProductFormValues) {
  return {
    ...v,
    discountPrice: v.discountPrice.trim() === "" ? null : v.discountPrice,
    options: v.options.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      required: g.required,
      maxSelect: Number(g.maxSelect) || 0,
      options: g.options.map((o) => {
        const paise = rupeesToPaise(o.price || "0");
        return { id: o.id, name: o.name, priceDelta: paise ?? 0, isDefault: o.isDefault, isAvailable: o.isAvailable };
      }),
    })),
  };
}

export function ProductForm({
  productId,
  initial,
  categories,
  imagePreview,
}: {
  productId?: string;
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  imagePreview: MediaPreview | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [deleting, startDelete] = useTransition();
  const form = useAdminForm(initial, (values) => (productId ? updateProduct(productId, toPayload(values)) : createProduct(toPayload(values))), {
    onSuccess: (result) => {
      if (!productId && result.data && "id" in result.data) router.replace(`/admin/menu/${(result.data as { id: string }).id}`);
    },
  });
  const { values, set, error } = form;

  const price = rupeesToPaise(values.price) ?? 0;
  const discount = values.discountPrice ? rupeesToPaise(values.discountPrice) : null;
  const validPrice = Number.isFinite(price) && price > 0;
  const validDiscount = discount !== null && Number.isFinite(discount) && discount < price;
  const categoryName = categories.find((c) => c.id === values.categoryId)?.name ?? "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Basics">
            <div className="flex flex-col gap-5">
              <TextField label="Name" required value={values.name} onChange={(v) => set("name", v)} error={error("name")} maxLength={80} placeholder="e.g. Margherita" />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={values.description}
                onChange={(v) => set("description", v)}
                error={error("description")}
                maxLength={400}
                help="One or two short lines: key toppings or what makes it special."
                optional
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" required error={error("categoryId")} htmlFor="product-category">
                  <Select id="product-category" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} invalid={Boolean(error("categoryId"))}>
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <TextField
                  label="Badge"
                  optional
                  value={values.badge}
                  onChange={(v) => set("badge", v)}
                  error={error("badge")}
                  maxLength={24}
                  placeholder="e.g. New, Spicy"
                  help="A short sticker shown on the card."
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-stone-800">
                  Veg / non-veg <span className="text-red-600">*</span>
                </legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:max-w-sm">
                  {(["veg", "non_veg"] as const).map((diet) => (
                    <label
                      key={diet}
                      className={clsx(
                        "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 text-sm font-semibold transition-colors",
                        values.diet === diet ? (diet === "veg" ? "border-basil bg-emerald-50" : "border-meat bg-red-50") : "border-stone-200 bg-white hover:border-stone-300",
                      )}
                    >
                      <input type="radio" name="diet" value={diet} checked={values.diet === diet} onChange={() => set("diet", diet)} className="sr-only" />
                      <VegMark diet={diet} />
                      {diet === "veg" ? "Veg" : "Non-veg"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          <Card title="Price">
            <div className="grid gap-5 sm:grid-cols-2">
              <PriceField label="Price" required value={values.price} onChange={(v) => set("price", v)} error={error("price")} />
              <PriceField
                label="Discounted price"
                optional
                value={values.discountPrice}
                onChange={(v) => set("discountPrice", v)}
                error={error("discountPrice")}
                help="Leave empty for no discount."
              />
            </div>
            {validPrice && (
              <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
                Customers see:{" "}
                {validDiscount ? (
                  <>
                    <strong className="text-stone-900">{formatINR(discount!)}</strong> <s>{formatINR(price)}</s>{" "}
                    <span className="font-semibold text-emerald-700">({discountPercent(price, discount!)}% off)</span>
                  </>
                ) : (
                  <strong className="text-stone-900">{formatINR(price)}</strong>
                )}
              </p>
            )}
          </Card>

          <Card title="Options" description="Sizes, crusts, add-ons… only add choices you actually offer. The price updates as customers choose.">
            <OptionsBuilder value={values.options} onChange={(v) => set("options", v)} error={error} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Availability">
            <div className="flex flex-col gap-5">
              <Switch
                label={values.isAvailable ? "In stock" : "Out of stock"}
                description="Goes live instantly when saved, no publishing needed."
                tone="success"
                checked={values.isAvailable}
                onChange={(v) => set("isAvailable", v)}
              />
              <Switch label="Show on website" description="Hidden items stay in your admin only." checked={values.isVisible} onChange={(v) => set("isVisible", v)} />
              <Switch label="Best seller" description="Adds a badge and features it on the homepage." checked={values.isBestseller} onChange={(v) => set("isBestseller", v)} />
            </div>
          </Card>

          <Card title="Photo">
            <MediaPicker
              label="Product photo"
              value={values.imageId}
              preview={imagePreview}
              onChange={(id) => set("imageId", id)}
              error={error("imageId")}
              aspect="aspect-square"
              help="Square photos look best. No photo yet? An illustration is shown until you add one."
            />
            {!values.imageId && values.name && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-cream p-3">
                <FoodArt name={values.name} category={categoryName} className="size-16 shrink-0" aria-hidden />
                <p className="text-xs text-stone-600">Illustration shown until you upload a real photo.</p>
              </div>
            )}
          </Card>

          {values.options.length > 0 && (
            <Card title="Options preview">
              <OptionsPreview groups={values.options} basePrice={validDiscount ? discount! : validPrice ? price : 0} />
            </Card>
          )}

          <Card title="Web address" description="Used for sharing links to this item.">
            <TextField
              label="Short name for links"
              optional
              value={values.slug}
              onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              error={error("slug")}
              placeholder="auto-generated from the name"
              help={values.slug ? `/menu?item=${values.slug}` : undefined}
            />
          </Card>

          {productId && (
            <Button
              variant="ghost"
              className="justify-start text-red-600 hover:bg-red-50"
              loading={deleting}
              icon={<Trash2 className="size-4" aria-hidden />}
              onClick={async () => {
                if (!(await confirm({ title: `Delete “${values.name}”?`, description: "This can't be undone. To stop selling it for now, mark it out of stock instead." }))) return;
                startDelete(async () => {
                  const result = await deleteProduct(productId);
                  if (result.ok) {
                    toast.success(result.message);
                    router.push("/admin/menu");
                    router.refresh();
                  } else toast.error(result.message);
                });
              }}
            >
              Delete this item
            </Button>
          )}
        </div>
      </div>
      <SaveBar
        dirty={form.dirty}
        saving={form.saving}
        onSave={() => form.submit()}
        onDiscard={() => form.reset()}
        savedAt={form.savedAt}
        saveLabel={productId ? "Save changes" : "Add item"}
      />
    </form>
  );
}
