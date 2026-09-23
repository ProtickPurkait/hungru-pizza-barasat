"use client";

import { saveDocument } from "@/app/admin/_actions/content";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SaveBar } from "@/components/admin/save-bar";
import { Card, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import type { Seo } from "@/lib/content/schemas";

export function SeoEditor({ seo, brandName, siteUrl, ogPreview }: { seo: Seo; brandName: string; siteUrl: string; ogPreview: MediaPreview | null }) {
  const form = useAdminForm(seo, (v) => saveDocument("seo", v));
  const { values, set, error } = form;
  const ogTitle = values.ogTitle || values.title;
  const ogDescription = values.ogDescription || values.description;
  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Card title="Google search">
            <div className="flex flex-col gap-5">
              <TextField label="Page title" value={values.title} onChange={(v) => set("title", v)} error={error("title")} maxLength={70} help="Aim for 50–60 characters. Include “Barasat” so locals find you." />
              <TextField label="Description" multiline rows={3} value={values.description} onChange={(v) => set("description", v)} error={error("description")} maxLength={170} help="Aim for 120–160 characters. Only describe what's true." />
              <Switch
                label="Business info for Google"
                description="Adds structured data (name, address, phone, hours) from your Contact page so Google can show it. Only filled-in details are included."
                checked={values.structuredData}
                onChange={(v) => set("structuredData", v)}
              />
            </div>
          </Card>
          <Card title="Social sharing" description="Leave the fields empty to reuse the Google title and description.">
            <div className="flex flex-col gap-5">
              <TextField label="Share title" optional value={values.ogTitle} onChange={(v) => set("ogTitle", v)} error={error("ogTitle")} maxLength={90} placeholder={values.title} />
              <TextField label="Share description" optional multiline rows={2} value={values.ogDescription} onChange={(v) => set("ogDescription", v)} error={error("ogDescription")} maxLength={200} placeholder={values.description} />
              <MediaPicker
                label="Share image"
                value={values.ogImageId}
                preview={ogPreview}
                onChange={(id) => set("ogImageId", id)}
                aspect="aspect-[1.91/1]"
                help="1200×630 works best. Without one, a branded image is generated automatically."
              />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Google preview">
            <div className="rounded-lg border border-stone-200 p-4">
              <p className="truncate text-xs text-stone-600">{host}</p>
              <p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{values.title || brandName}</p>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600">{values.description}</p>
            </div>
          </Card>
          <Card title="Share preview">
            <div className="overflow-hidden rounded-lg border border-stone-200">
              <div className="flex aspect-[1.91/1] items-center justify-center bg-ink text-cream">
                {ogPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ogPreview.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display px-4 text-center text-3xl uppercase">{brandName}</span>
                )}
              </div>
              <div className="bg-stone-50 p-3">
                <p className="text-xs text-stone-500 uppercase">{host}</p>
                <p className="line-clamp-1 font-semibold">{ogTitle}</p>
                <p className="line-clamp-2 text-sm text-stone-600">{ogDescription}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
