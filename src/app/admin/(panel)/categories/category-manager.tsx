"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCategory, deleteCategory, reorderCategories, setCategoryActive, updateCategory } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, Button, Card, IconButton, Input, Switch } from "@/components/admin/ui";
import type { ActionResult } from "@/lib/actions";

type Category = { id: string; name: string; slug: string; description: string; isActive: boolean; productCount: number };

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useSyncedState(initial);
  const [name, setName] = useState("");
  const [addError, setAddError] = useState<string>();
  const [adding, startAdding] = useTransition();

  const add = () =>
    startAdding(async () => {
      const result = await createCategory({ name, isActive: true });
      if (result.ok) {
        toast.success(result.message);
        setName("");
        setAddError(undefined);
        router.refresh();
      } else {
        setAddError(result.fieldErrors?.name ?? result.message);
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <Card title="Add a category">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <label htmlFor="new-category" className="sr-only">
              Category name
            </label>
            <Input
              id="new-category"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Desserts"
              invalid={Boolean(addError)}
              maxLength={40}
            />
            {addError && <p className="mt-1 text-sm text-red-600">{addError}</p>}
          </div>
          <Button type="submit" loading={adding} disabled={!name.trim()} icon={<Plus className="size-4" />}>
            Add category
          </Button>
        </form>
      </Card>

      <SortableList
        items={items}
        getId={(c) => c.id}
        label={(c) => c.name}
        onReorder={async (next) => {
          setItems(next);
          const result = await reorderCategories(next.map((c) => c.id));
          if (result.ok) toast.success("Order saved. Publish to update the website.");
          else toast.error(result.message);
        }}
        renderItem={(category, { handle }) => <CategoryRow category={category} handle={handle} onChanged={() => router.refresh()} />}
      />
    </div>
  );
}

function CategoryRow({ category, handle, onChanged }: { category: Category; handle: React.ReactNode; onChanged: () => void }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [error, setError] = useState<string>();
  const [active, setActive] = useState(category.isActive);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        after?.();
        onChanged();
      } else {
        setError(result.fieldErrors?.name ?? result.message);
        toast.error(result.message);
      }
    });

  return (
    <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white py-2 pr-2 pl-1 shadow-xs sm:items-center sm:pr-3">
      {handle}
      <div className="min-w-0 flex-1 py-1">
        {editing ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => updateCategory(category.id, { name, slug: category.slug, description, isActive: active }),
                () => setEditing(false),
              );
            }}
          >
            <Input
              aria-label="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={Boolean(error)}
              autoFocus
              maxLength={40}
            />
            <Input
              aria-label="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              maxLength={200}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={pending} icon={<Check className="size-4" />}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<X className="size-4" />}
                onClick={() => {
                  setEditing(false);
                  setName(category.name);
                  setDescription(category.description);
                  setError(undefined);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-900">
              {category.name}
              <Badge>
                {category.productCount} item{category.productCount === 1 ? "" : "s"}
              </Badge>
              {!active && <Badge tone="warning">Hidden</Badge>}
            </p>
            {category.description && <p className="text-sm text-stone-500">{category.description}</p>}
          </>
        )}
      </div>
      {!editing && (
        <div className="flex shrink-0 items-center gap-1">
          <Switch
            size="sm"
            hideLabel
            label={`Show ${category.name} on website`}
            checked={active}
            disabled={pending}
            onChange={(value) => {
              setActive(value);
              run(() => setCategoryActive(category.id, value));
            }}
          />
          <IconButton label={`Rename ${category.name}`} onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden />
          </IconButton>
          <IconButton
            label={`Delete ${category.name}`}
            tone="danger"
            onClick={async () => {
              if (category.productCount > 0) {
                toast.error(
                  `Move or delete the ${category.productCount} item${category.productCount === 1 ? "" : "s"} in “${category.name}” first.`,
                );
                return;
              }
              if (
                await confirm({ title: `Delete “${category.name}”?`, description: "This category is empty, so nothing else is affected." })
              ) {
                run(() => deleteCategory(category.id));
              }
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </IconButton>
        </div>
      )}
    </div>
  );
}
