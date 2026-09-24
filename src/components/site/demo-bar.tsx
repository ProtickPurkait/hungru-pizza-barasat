import { Info } from "lucide-react";

/** Shown on the no-database design preview so nobody mistakes the sample menu for the real one. */
export function DemoBar() {
  return (
    <div role="note" className="bg-accent px-4 py-2 text-center text-sm font-bold text-ink">
      <span className="inline-flex items-center gap-2">
        <Info className="size-4 shrink-0" aria-hidden /> Design preview: sample menu and prices. Orders aren&apos;t sent.
      </span>
    </div>
  );
}
