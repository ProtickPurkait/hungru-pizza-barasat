"use client";

import { useRouter } from "next/navigation";
import { createOffer, updateOffer } from "@/app/admin/_actions/content";
import { LinkTargetField, type LinkOptions } from "@/components/admin/fields";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SaveBar } from "@/components/admin/save-bar";
import { Card, Field, Input, PriceField, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import type { LinkTarget } from "@/lib/content/schemas";

export type OfferFormValues = {
  title: string;
  description: string;
  imageId: string | null;
  badge: string;
  price: string;
  originalPrice: string;
  ctaLabel: string;
  ctaTarget: LinkTarget;
  startsAt: string; // datetime-local value in the admin's timezone
  endsAt: string;
  isActive: boolean;
};

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toPayload(v: OfferFormValues) {
  const iso = (local: string) => (local ? new Date(local).toISOString() : "");
  return {
    ...v,
    price: v.price.trim() === "" ? null : v.price,
    originalPrice: v.originalPrice.trim() === "" ? null : v.originalPrice,
    startsAt: iso(v.startsAt),
    endsAt: iso(v.endsAt),
  };
}

export function OfferForm({
  offerId,
  initial,
  imagePreview,
  linkOptions,
}: {
  offerId?: string;
  initial: OfferFormValues;
  imagePreview: MediaPreview | null;
  linkOptions: LinkOptions;
}) {
  const router = useRouter();
  const form = useAdminForm(initial, (v) => (offerId ? updateOffer(offerId, toPayload(v)) : createOffer(toPayload(v))), {
    onSuccess: (result) => {
      if (!offerId && result.data && "id" in result.data) router.replace(`/admin/offers/${(result.data as { id: string }).id}`);
    },
  });
  const { values, set, error } = form;

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
          <Card title="Offer details">
            <div className="flex flex-col gap-5">
              <TextField label="Title" required value={values.title} onChange={(v) => set("title", v)} error={error("title")} maxLength={80} placeholder="e.g. Weekend Duo Deal" />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={values.description}
                onChange={(v) => set("description", v)}
                error={error("description")}
                maxLength={300}
                optional
                help="What's included, and any conditions."
              />
              <TextField label="Sticker text" optional value={values.badge} onChange={(v) => set("badge", v)} error={error("badge")} maxLength={24} placeholder="e.g. Weekend only" />
              <div className="grid gap-5 sm:grid-cols-2">
                <PriceField label="Offer price" optional value={values.price} onChange={(v) => set("price", v)} error={error("price")} />
                <PriceField
                  label="Original price"
                  optional
                  value={values.originalPrice}
                  onChange={(v) => set("originalPrice", v)}
                  error={error("originalPrice")}
                  help="Shown crossed out, only if it's a real saving."
                />
              </div>
            </div>
          </Card>
          <Card title="Button">
            <div className="flex flex-col gap-5">
              <TextField label="Button text" required value={values.ctaLabel} onChange={(v) => set("ctaLabel", v)} error={error("ctaLabel")} maxLength={30} />
              <LinkTargetField label="Button goes to" value={values.ctaTarget} onChange={(v) => set("ctaTarget", v)} options={linkOptions} error={error("ctaTarget.value")} />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Visibility">
            <div className="flex flex-col gap-5">
              <Switch label="Offer is on" checked={values.isActive} onChange={(v) => set("isActive", v)} description="Switch off to hide it without deleting." />
              <Field label="Starts" optional error={error("startsAt")} help="Leave empty to start straight away.">
                <Input type="datetime-local" value={values.startsAt} onChange={(e) => set("startsAt", e.target.value)} invalid={Boolean(error("startsAt"))} />
              </Field>
              <Field label="Ends" optional error={error("endsAt")} help="Leave empty to run until you switch it off.">
                <Input type="datetime-local" value={values.endsAt} onChange={(e) => set("endsAt", e.target.value)} invalid={Boolean(error("endsAt"))} />
              </Field>
            </div>
          </Card>
          <Card title="Image">
            <MediaPicker label="Offer image" optional value={values.imageId} preview={imagePreview} onChange={(id) => set("imageId", id)} help="Landscape or square images work best." />
          </Card>
        </div>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} saveLabel={offerId ? "Save offer" : "Add offer"} />
    </form>
  );
}
