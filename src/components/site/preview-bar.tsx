import { Eye } from "lucide-react";

/** Shown only to signed-in admins while previewing unpublished changes. */
export function PreviewBar() {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-accent px-4 py-2 text-sm font-bold text-ink"
    >
      <span className="flex items-center gap-2">
        <Eye className="size-4" aria-hidden /> Preview: you&apos;re seeing unpublished changes. Only you can see this.
      </span>
      <span className="flex gap-3">
        <a href="/admin/publish" className="underline underline-offset-2">
          Publish
        </a>
        <a href="/api/preview/exit" className="underline underline-offset-2">
          Exit preview
        </a>
      </span>
    </div>
  );
}
