"use client";

import { clsx } from "clsx";
import { Check, ImagePlus, Loader2, Search, Trash2, UploadCloud, Video, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button, Field, Input } from "./ui";

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  kind: "image" | "video";
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  blurDataUrl: string | null;
  createdAt: string;
};

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const ACCEPT_VIDEO = "video/mp4,video/webm";

/** Shrinks big phone photos in the browser before upload (faster on mobile data, fits hosting limits). */
async function downscaleImage(file: File, maxSize = 2400): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const type = file.type === "image/png" ? "image/png" : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".webp"), { type });
  } catch {
    return file;
  }
}

export async function uploadMediaFile(file: File, alt = ""): Promise<MediaItem> {
  const prepared = file.type.startsWith("image/") ? await downscaleImage(file) : file;
  const body = new FormData();
  body.append("file", prepared);
  body.append("alt", alt);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  const json = (await response.json().catch(() => ({}))) as { item?: MediaItem; error?: string };
  if (!response.ok || !json.item) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json.item;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ───────────────────────── Drop zone ───────────────────────── */

export function UploadZone({
  kind = "image",
  onUploaded,
  compact,
  multiple = true,
}: {
  kind?: "image" | "video" | "any";
  onUploaded: (item: MediaItem) => void;
  compact?: boolean;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const accept = kind === "image" ? ACCEPT_IMAGE : kind === "video" ? ACCEPT_VIDEO : `${ACCEPT_IMAGE},${ACCEPT_VIDEO}`;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).slice(0, multiple ? 12 : 1);
      setBusy((n) => n + list.length);
      for (const file of list) {
        try {
          const item = await uploadMediaFile(file);
          onUploaded(item);
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        } finally {
          setBusy((n) => n - 1);
        }
      }
    },
    [multiple, onUploaded],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-5" : "px-6 py-8",
        dragging ? "border-blue-500 bg-blue-50" : "border-stone-300 bg-stone-50 hover:border-stone-400",
      )}
    >
      {busy > 0 ? (
        <Loader2 className="size-7 animate-spin text-stone-500" aria-hidden />
      ) : (
        <UploadCloud className="size-7 text-stone-400" aria-hidden />
      )}
      <div>
        <label htmlFor={inputId} className="cursor-pointer font-semibold text-blue-700 underline-offset-2 hover:underline">
          {busy > 0 ? `Uploading ${busy} file${busy === 1 ? "" : "s"}…` : "Choose a file"}
        </label>
        {busy === 0 && <span className="text-stone-600"> or drag it here</span>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-stone-500">
        {kind === "video"
          ? "MP4 or WebM, up to 20 MB"
          : kind === "any"
            ? "JPG, PNG, WebP, AVIF, GIF (10 MB) · MP4/WebM video (20 MB)"
            : "JPG, PNG, WebP, AVIF or GIF · up to 10 MB · optimised automatically"}
      </p>
    </div>
  );
}

/* ───────────────────────── Library dialog ───────────────────────── */

function useMediaLibrary(kind: "image" | "video", open: boolean) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/admin/media?kind=${kind}`)
      .then((r) => r.json())
      .then((json: { items?: MediaItem[] }) => {
        if (!cancelled) setItems(json.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, open]);
  return [items, setItems] as const;
}

export function MediaLibraryDialog({
  open,
  onClose,
  onSelect,
  kind = "image",
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  kind?: "image" | "video";
  title?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useMediaLibrary(kind, open);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const filtered = (items ?? []).filter(
    (i) => !query || `${i.filename} ${i.alt}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label={title ?? "Choose from media library"}
      className="m-auto h-[min(44rem,calc(100dvh-2rem))] w-[min(56rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-2xl bg-white p-0 text-stone-900 shadow-2xl"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
            <h2 className="text-lg font-bold">{title ?? (kind === "video" ? "Choose a video" : "Choose an image")}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-lg hover:bg-stone-100"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <UploadZone
              kind={kind}
              compact
              multiple={false}
              onUploaded={(item) => {
                setItems((prev) => [item, ...(prev ?? [])]);
                onSelect(item);
              }}
            />
            <div className="mt-5 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your files"
                  aria-label="Search media"
                  className="pl-9"
                />
              </div>
            </div>
            {items === null ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-6 animate-spin text-stone-400" aria-label="Loading" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-stone-500">
                {items.length === 0 ? "No files yet. Upload one above." : "No files match your search."}
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="group block w-full overflow-hidden rounded-xl border border-stone-200 text-left transition hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30"
                    >
                      <MediaThumb item={item} className="aspect-square" />
                      <span className="block truncate px-2 py-1.5 text-xs text-stone-600">{item.filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

export function MediaThumb({ item, className }: { item: Pick<MediaItem, "url" | "kind" | "alt" | "filename">; className?: string }) {
  return (
    <span className={clsx("relative block overflow-hidden bg-stone-100", className)}>
      {item.kind === "video" ? (
        <span className="flex h-full w-full items-center justify-center bg-stone-900 text-white">
          <Video className="size-8" aria-hidden />
          <span className="sr-only">Video: {item.filename}</span>
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails of already-optimised uploads
        <img src={item.url} alt={item.alt || item.filename} loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}

/* ───────────────────────── Single picker ───────────────────────── */

export type MediaPreview = { id: string; url: string; kind: "image" | "video"; alt: string; filename: string };

export function MediaPicker({
  label,
  help,
  value,
  preview,
  onChange,
  kind = "image",
  error,
  aspect = "aspect-[4/3]",
  optional,
}: {
  label: string;
  help?: string;
  value: string | null;
  preview?: MediaPreview | null;
  onChange: (id: string | null, item: MediaPreview | null) => void;
  kind?: "image" | "video";
  error?: string;
  aspect?: string;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<MediaPreview | null>(preview ?? null);
  const shown = value && current?.id === value ? current : value ? preview ?? null : null;

  return (
    <Field label={label} help={help} error={error} optional={optional}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={clsx(
            "relative w-full overflow-hidden rounded-xl border bg-stone-100 sm:w-44",
            aspect,
            error ? "border-red-500" : "border-stone-200",
          )}
        >
          {shown ? (
            <MediaThumb item={shown} className="h-full w-full" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-stone-400">
              <ImagePlus className="size-7" aria-hidden />
              <span className="text-xs">{value ? "Selected" : "None"}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)} icon={<ImagePlus className="size-4" />}>
            {value ? "Replace" : kind === "video" ? "Choose video" : "Choose image"}
          </Button>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrent(null);
                onChange(null, null);
              }}
              icon={<Trash2 className="size-4" />}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaLibraryDialog
        open={open}
        kind={kind}
        onClose={() => setOpen(false)}
        onSelect={(item) => {
          const next = { id: item.id, url: item.url, kind: item.kind, alt: item.alt, filename: item.filename };
          setCurrent(next);
          onChange(item.id, next);
          setOpen(false);
        }}
      />
    </Field>
  );
}

/* ───────────────────────── Multi picker (e.g. brand story gallery) ───────────────────────── */

export function MultiMediaPicker({
  label,
  help,
  value,
  previews,
  onChange,
  max = 4,
}: {
  label: string;
  help?: string;
  value: string[];
  previews: MediaPreview[];
  onChange: (ids: string[]) => void;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [known, setKnown] = useState<MediaPreview[]>(previews);
  const byId = new Map(known.map((p) => [p.id, p]));

  return (
    <Field label={label} help={help}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((id, index) => {
          const item = byId.get(id);
          return (
            <li key={id} className="group relative overflow-hidden rounded-xl border border-stone-200">
              {item ? <MediaThumb item={item} className="aspect-square" /> : <span className="block aspect-square bg-stone-100" />}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <span className="rounded bg-black/50 px-1.5 text-xs font-semibold text-white">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== id))}
                  className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-red-600 hover:bg-white"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
        {value.length < max && (
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-stone-400 hover:bg-stone-50"
            >
              <ImagePlus className="size-6" aria-hidden />
              <span className="text-xs font-semibold">Add image</span>
            </button>
          </li>
        )}
      </ul>
      <MediaLibraryDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(item) => {
          setKnown((prev) => [...prev, { id: item.id, url: item.url, kind: item.kind, alt: item.alt, filename: item.filename }]);
          if (!value.includes(item.id)) onChange([...value, item.id].slice(0, max));
          setOpen(false);
        }}
      />
    </Field>
  );
}

export function SelectedCheck() {
  return (
    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-blue-600 text-white">
      <Check className="size-4" aria-hidden />
    </span>
  );
}
