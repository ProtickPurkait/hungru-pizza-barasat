"use client";

import { MessageSquareQuote, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createReview, deleteReview, reorderReviews, setReviewEnabled, updateReview } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { EditorDialog } from "@/components/admin/editor-dialog";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, Button, EmptyState, Field, IconButton, Notice, Select, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";

type Review = {
  id: string;
  authorName: string;
  content: string;
  rating: number | null;
  source: string;
  imageId: string | null;
  isEnabled: boolean;
  isSample: boolean;
  image: MediaPreview | null;
};

type FormValues = { authorName: string; content: string; rating: string; source: string; imageId: string | null; isEnabled: boolean };

const EMPTY: FormValues = { authorName: "", content: "", rating: "", source: "", imageId: null, isEnabled: true };

export function ReviewManager({ reviews: initial }: { reviews: Review[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [reviews, setReviews] = useSyncedState(initial);
  const [editing, setEditing] = useState<Review | "new" | null>(null);
  const [, start] = useTransition();

  const samples = reviews.filter((r) => r.isSample).length;

  return (
    <div className="flex flex-col gap-4">
      {samples > 0 && (
        <Notice tone="warning" title={`${samples} placeholder review${samples === 1 ? "" : "s"}`}>
          These are marked “Sample” on your website. Replace them with real reviews (or delete them) before you launch. Never invent
          reviews.
        </Notice>
      )}
      <div>
        <Button onClick={() => setEditing("new")} icon={<Plus className="size-4" />}>
          Add review
        </Button>
      </div>
      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="size-6" />}
          title="No reviews yet"
          description="The Reviews section stays hidden on your homepage until you add one."
        />
      ) : (
        <SortableList
          items={reviews}
          getId={(r) => r.id}
          label={(r) => `review by ${r.authorName}`}
          onReorder={async (next) => {
            setReviews(next);
            const result = await reorderReviews(next.map((r) => r.id));
            if (!result.ok) toast.error(result.message);
          }}
          renderItem={(r, { handle }) => (
            <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white py-2 pr-2 pl-1 shadow-xs sm:items-center sm:pr-3">
              {handle}
              <button type="button" onClick={() => setEditing(r)} className="min-w-0 flex-1 py-1 text-left">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {r.authorName}
                  {r.rating && (
                    <span className="flex items-center gap-0.5 text-sm text-amber-600">
                      <Star className="size-3.5 fill-current" aria-hidden /> {r.rating}/5
                    </span>
                  )}
                  {r.source && <Badge>{r.source}</Badge>}
                  {r.isSample && <Badge tone="info">Sample</Badge>}
                  {!r.isEnabled && <Badge tone="warning">Hidden</Badge>}
                </p>
                <p className="line-clamp-2 text-sm text-stone-600">“{r.content}”</p>
              </button>
              <Switch
                size="sm"
                hideLabel
                label={`Show review by ${r.authorName}`}
                checked={r.isEnabled}
                onChange={(value) => {
                  setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, isEnabled: value } : x)));
                  start(async () => {
                    const result = await setReviewEnabled(r.id, value);
                    if (result.ok) toast.success(`${result.message} Publish to update the website.`);
                    else toast.error(result.message);
                    router.refresh();
                  });
                }}
              />
              <IconButton label={`Edit review by ${r.authorName}`} onClick={() => setEditing(r)}>
                <Pencil className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                label={`Delete review by ${r.authorName}`}
                tone="danger"
                onClick={async () => {
                  if (
                    !(await confirm({
                      title: "Delete this review?",
                      description: `Review by ${r.authorName}. To hide it for now, switch it off instead.`,
                    }))
                  )
                    return;
                  start(async () => {
                    const result = await deleteReview(r.id);
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
      {editing && <ReviewEditor review={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ReviewEditor({ review, onClose }: { review: Review | null; onClose: () => void }) {
  const initial: FormValues = review
    ? {
        authorName: review.authorName,
        content: review.content,
        rating: review.rating ? String(review.rating) : "",
        source: review.source,
        imageId: review.imageId,
        isEnabled: review.isEnabled,
      }
    : EMPTY;
  const form = useAdminForm(
    initial,
    (v) => {
      const payload = { ...v, rating: v.rating ? Number(v.rating) : null };
      return review ? updateReview(review.id, payload) : createReview(payload);
    },
    { onSuccess: onClose },
  );
  const { values, set, error } = form;

  return (
    <EditorDialog
      open
      onClose={onClose}
      title={review ? "Edit review" : "Add review"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => form.submit()} loading={form.saving}>
            {review ? "Save review" : "Add review"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField
          label="Customer name"
          required
          value={values.authorName}
          onChange={(v) => set("authorName", v)}
          error={error("authorName")}
          maxLength={60}
          placeholder="e.g. Riya S."
          help="First name + initial is fine."
        />
        <TextField
          label="Review"
          required
          multiline
          rows={4}
          value={values.content}
          onChange={(v) => set("content", v)}
          error={error("content")}
          maxLength={600}
          help="Paste their words exactly as written."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Star rating" optional help="Only if the customer gave one.">
            <Select value={values.rating} onChange={(e) => set("rating", e.target.value)}>
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </Select>
          </Field>
          <TextField
            label="Where it's from"
            optional
            value={values.source}
            onChange={(v) => set("source", v)}
            error={error("source")}
            maxLength={40}
            placeholder="Google, Zomato, Instagram…"
          />
        </div>
        <MediaPicker
          label="Customer photo"
          optional
          value={values.imageId}
          preview={review?.image ?? null}
          onChange={(id) => set("imageId", id)}
          aspect="aspect-square"
          help="Only with the customer's permission."
        />
        <Switch label="Show on website" checked={values.isEnabled} onChange={(v) => set("isEnabled", v)} />
      </div>
    </EditorDialog>
  );
}
