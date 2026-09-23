"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { Button } from "./ui";

/** Sticky footer for editors: shows unsaved state and the Save button within thumb reach on mobile. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  savedAt,
  note = "Saved changes go live when you publish.",
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  savedAt?: number | null;
  note?: string | null;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <p className={clsx("min-w-0 text-sm", dirty ? "font-semibold text-amber-700" : "text-stone-500")} aria-live="polite">
          {dirty ? (
            "You have unsaved changes"
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-emerald-600" aria-hidden /> Saved. <span className="hidden sm:inline">{note}</span>
            </span>
          ) : (
            <span className="hidden sm:inline">{note}</span>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          {onDiscard && dirty && (
            <Button variant="ghost" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
          )}
          <Button onClick={onSave} loading={saving} disabled={!dirty && !saving}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
