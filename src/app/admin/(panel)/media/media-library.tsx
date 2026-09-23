"use client";

import { Copy, ImageIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMedia, getMediaUsage, updateMediaAlt } from "@/app/admin/_actions/media";
import { useConfirm } from "@/components/admin/confirm";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { EditorDialog } from "@/components/admin/editor-dialog";
import { formatBytes, MediaThumb, UploadZone, type MediaItem } from "@/components/admin/media";
import { Badge, Button, EmptyState, TextField } from "@/components/admin/ui";

export function MediaLibrary({ items: initial }: { items: MediaItem[] }) {
  const router = useRouter();
  const [items, setItems] = useSyncedState(initial);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <UploadZone kind="any" onUploaded={(item) => setItems((prev) => [item, ...prev])} />
      {items.length === 0 ? (
        <EmptyState icon={<ImageIcon className="size-6" />} title="No files yet" description="Upload your logo, pizza photos and more. You can also upload straight from any image field." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="group block w-full overflow-hidden rounded-xl border border-stone-200 bg-white text-left transition hover:border-stone-400"
              >
                <MediaThumb item={item} className="aspect-square" />
                <span className="block px-2.5 py-2">
                  <span className="block truncate text-sm font-medium">{item.filename}</span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500">
                    {formatBytes(item.size)}
                    {item.width && ` · ${item.width}×${item.height}`}
                    {!item.alt && item.kind === "image" && <Badge tone="warning">No description</Badge>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <MediaDetails
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={(alt) => {
            setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, alt } : i)));
            setSelected(null);
          }}
          onDeleted={() => {
            setItems((prev) => prev.filter((i) => i.id !== selected.id));
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function MediaDetails({ item, onClose, onSaved, onDeleted }: { item: MediaItem; onClose: () => void; onSaved: (alt: string) => void; onDeleted: () => void }) {
  const confirm = useConfirm();
  const [alt, setAlt] = useState(item.alt);
  const [usage, setUsage] = useState<string[] | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    getMediaUsage(item.id).then(setUsage).catch(() => setUsage([]));
  }, [item.id]);

  return (
    <EditorDialog
      open
      onClose={onClose}
      title={item.filename}
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-red-600 hover:bg-red-50"
            icon={<Trash2 className="size-4" />}
            disabled={pending || (usage?.length ?? 0) > 0}
            onClick={async () => {
              if (!(await confirm({ title: "Delete this file?", description: "It will be removed permanently." }))) return;
              start(async () => {
                const result = await deleteMedia(item.id);
                if (result.ok) {
                  toast.success(result.message);
                  onDeleted();
                } else toast.error(result.message);
              });
            }}
          >
            Delete
          </Button>
          <Button
            loading={pending}
            disabled={alt === item.alt}
            onClick={() =>
              start(async () => {
                const result = await updateMediaAlt(item.id, alt);
                if (result.ok) {
                  toast.success(result.message);
                  onSaved(alt);
                } else toast.error(result.message);
              })
            }
          >
            Save description
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="overflow-hidden rounded-xl bg-stone-100">
          {item.kind === "video" ? (
            <video src={item.url} controls muted playsInline className="max-h-80 w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={item.alt} className="mx-auto max-h-80 object-contain" />
          )}
        </div>
        {item.kind === "image" && (
          <TextField
            label="Description (alt text)"
            value={alt}
            onChange={setAlt}
            maxLength={200}
            placeholder="e.g. Paneer tikka pizza with melted cheese"
            help="Describe what's in the photo in a few words."
          />
        )}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Size</dt>
            <dd className="font-medium">{formatBytes(item.size)}</dd>
          </div>
          {item.width && (
            <div>
              <dt className="text-stone-500">Dimensions</dt>
              <dd className="font-medium">
                {item.width} × {item.height}px
              </dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-stone-500">Used in</dt>
            <dd className="font-medium">
              {usage === null ? "Checking…" : usage.length === 0 ? "Not used anywhere" : usage.join(", ")}
            </dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          size="sm"
          icon={<Copy className="size-4" />}
          onClick={() => {
            navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString()).then(
              () => toast.success("Link copied"),
              () => toast.error("Couldn't copy"),
            );
          }}
          className="self-start"
        >
          Copy link
        </Button>
      </div>
    </EditorDialog>
  );
}
