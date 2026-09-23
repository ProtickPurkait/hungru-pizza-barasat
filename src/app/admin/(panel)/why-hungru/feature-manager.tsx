"use client";

import { clsx } from "clsx";
import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createFeature, deleteFeature, patchDocument, reorderFeatures, setFeatureActive, updateFeature } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { EditorDialog } from "@/components/admin/editor-dialog";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, Button, Card, EmptyState, IconButton, Notice, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { FeatureIcon } from "@/components/ui/feature-icon";
import { FEATURE_ICONS, type FeatureIconKey, type Homepage } from "@/lib/content/schemas";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: FeatureIconKey;
  imageId: string | null;
  isActive: boolean;
  isSample: boolean;
  image: MediaPreview | null;
};

export function FeatureManager({ features: initial, homepage }: { features: Feature[]; homepage: Homepage }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [features, setFeatures] = useState(initial);
  const [editing, setEditing] = useState<Feature | "new" | null>(null);
  const [, start] = useTransition();
  useEffect(() => setFeatures(initial), [initial]);

  const heading = useAdminForm(homepage.why, (why) => patchDocument("homepage", { why }));
  const samples = features.filter((f) => f.isSample).length;

  return (
    <div className="flex flex-col gap-6">
      <Card title="Section heading">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Small label" value={heading.values.eyebrow} onChange={(v) => heading.set("eyebrow", v)} maxLength={40} error={heading.error("why.eyebrow")} />
          <TextField label="Heading" value={heading.values.heading} onChange={(v) => heading.set("heading", v)} maxLength={90} error={heading.error("why.heading")} />
          <TextField label="Intro text" optional className="sm:col-span-2" value={heading.values.subtext} onChange={(v) => heading.set("subtext", v)} maxLength={280} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => heading.submit()} loading={heading.saving} disabled={!heading.dirty} size="sm">
            Save heading
          </Button>
        </div>
      </Card>

      {samples > 0 && (
        <Notice tone="warning" title="Sample points">
          {samples} point{samples === 1 ? " is" : "s are"} placeholder text marked “Sample” on the website. Rewrite them with what really makes Hungru special.
        </Notice>
      )}

      <div>
        <Button onClick={() => setEditing("new")} icon={<Plus className="size-4" />} disabled={features.length >= 8}>
          Add point
        </Button>
      </div>

      {features.length === 0 ? (
        <EmptyState icon={<Heart className="size-6" />} title="No points yet" description="This section stays hidden until you add at least one point." />
      ) : (
        <SortableList
          items={features}
          getId={(f) => f.id}
          label={(f) => f.title}
          onReorder={async (next) => {
            setFeatures(next);
            const result = await reorderFeatures(next.map((f) => f.id));
            if (!result.ok) toast.error(result.message);
          }}
          renderItem={(f, { handle }) => (
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white py-2 pr-2 pl-1 shadow-xs sm:pr-3">
              {handle}
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FeatureIcon icon={f.icon} className="size-5" />
              </span>
              <button type="button" onClick={() => setEditing(f)} className="min-w-0 flex-1 text-left">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {f.title}
                  {f.isSample && <Badge tone="info">Sample</Badge>}
                  {!f.isActive && <Badge tone="warning">Hidden</Badge>}
                </p>
                <p className="line-clamp-1 text-sm text-stone-600">{f.description}</p>
              </button>
              <Switch
                size="sm"
                hideLabel
                label={`Show ${f.title}`}
                checked={f.isActive}
                onChange={(value) => {
                  setFeatures((prev) => prev.map((x) => (x.id === f.id ? { ...x, isActive: value } : x)));
                  start(async () => {
                    const result = await setFeatureActive(f.id, value);
                    if (!result.ok) toast.error(result.message);
                    router.refresh();
                  });
                }}
              />
              <IconButton label={`Edit ${f.title}`} onClick={() => setEditing(f)}>
                <Pencil className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                label={`Delete ${f.title}`}
                tone="danger"
                onClick={async () => {
                  if (!(await confirm({ title: `Delete “${f.title}”?` }))) return;
                  start(async () => {
                    const result = await deleteFeature(f.id);
                    if (result.ok) toast.success(result.message);
                    else toast.error(result.message);
                    router.refresh();
                  });
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </IconButton>
            </div>
          )}
        />
      )}
      {editing && <FeatureEditor feature={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function FeatureEditor({ feature, onClose }: { feature: Feature | null; onClose: () => void }) {
  const form = useAdminForm(
    {
      title: feature?.title ?? "",
      description: feature?.description ?? "",
      icon: feature?.icon ?? ("flame" as FeatureIconKey),
      imageId: feature?.imageId ?? null,
      isActive: feature?.isActive ?? true,
    },
    (v) => (feature ? updateFeature(feature.id, v) : createFeature(v)),
    { onSuccess: onClose },
  );
  const { values, set, error } = form;
  return (
    <EditorDialog
      open
      onClose={onClose}
      title={feature ? "Edit point" : "Add point"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => form.submit()} loading={form.saving}>
            {feature ? "Save" : "Add point"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField label="Title" required value={values.title} onChange={(v) => set("title", v)} error={error("title")} maxLength={50} placeholder="e.g. Dough made fresh" />
        <TextField label="Description" multiline rows={3} value={values.description} onChange={(v) => set("description", v)} error={error("description")} maxLength={240} optional />
        <fieldset>
          <legend className="text-sm font-semibold text-stone-800">Icon</legend>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {FEATURE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => set("icon", icon)}
                aria-label={icon.replace(/-/g, " ")}
                aria-pressed={values.icon === icon}
                className={clsx(
                  "flex aspect-square items-center justify-center rounded-lg border-2 transition-colors",
                  values.icon === icon ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400",
                )}
              >
                <FeatureIcon icon={icon} className="size-5" />
              </button>
            ))}
          </div>
        </fieldset>
        <MediaPicker label="Image (instead of icon)" optional value={values.imageId} preview={feature?.image ?? null} onChange={(id) => set("imageId", id)} aspect="aspect-square" />
        <Switch label="Show on website" checked={values.isActive} onChange={(v) => set("isActive", v)} />
      </div>
    </EditorDialog>
  );
}
