"use client";

import { Plus, Trash2 } from "lucide-react";
import { saveDocument } from "@/app/admin/_actions/content";
import { MultiMediaPicker, type MediaPreview } from "@/components/admin/media";
import { SaveBar } from "@/components/admin/save-bar";
import { Button, Card, IconButton, Notice, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { STORY_PLACEHOLDER_BODY, type Story } from "@/lib/content/schemas";

export function StoryEditor({ story, previews }: { story: Story; previews: MediaPreview[] }) {
  const form = useAdminForm(story, (v) => saveDocument("story", v));
  const { values, set, error } = form;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        {values.body === STORY_PLACEHOLDER_BODY && (
          <Notice tone="warning" title="This is placeholder text">
            Replace it with your real story before launch. We never make up history or claims for you.
          </Notice>
        )}
        <Card title="Story">
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Small label" value={values.eyebrow} onChange={(v) => set("eyebrow", v)} error={error("eyebrow")} maxLength={40} />
              <TextField label="Heading" value={values.heading} onChange={(v) => set("heading", v)} error={error("heading")} maxLength={90} />
            </div>
            <TextField
              label="Your story"
              multiline
              rows={8}
              value={values.body}
              onChange={(v) => set("body", v)}
              error={error("body")}
              maxLength={3000}
              help="Leave an empty line between paragraphs."
            />
          </div>
        </Card>
        <Card title="Photos" description="Up to 4 photos: your team, kitchen, oven, storefront or food.">
          <MultiMediaPicker label="Story photos" value={values.imageIds} previews={previews} onChange={(ids) => set("imageIds", ids)} />
        </Card>
        <Card title="Highlights" description="Optional short facts shown as stickers, e.g. “Since 2023” or “Wood-fired oven”. Only use facts that are true.">
          <div className="flex flex-col gap-3">
            {values.highlights.map((h, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-stone-200 p-3 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
                <TextField
                  label="Title"
                  value={h.title}
                  onChange={(v) => set("highlights", values.highlights.map((x, j) => (j === i ? { ...x, title: v } : x)))}
                  error={error(`highlights.${i}.title`)}
                  maxLength={40}
                />
                <TextField
                  label="Detail"
                  optional
                  value={h.text}
                  onChange={(v) => set("highlights", values.highlights.map((x, j) => (j === i ? { ...x, text: v } : x)))}
                  maxLength={160}
                />
                <IconButton label="Remove highlight" tone="danger" className="sm:mt-7" onClick={() => set("highlights", values.highlights.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            ))}
            <div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="size-4" />}
                disabled={values.highlights.length >= 4}
                onClick={() => set("highlights", [...values.highlights, { title: "", text: "" }])}
              >
                Add highlight
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
