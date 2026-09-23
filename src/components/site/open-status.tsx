"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import type { OpeningHours } from "@/lib/content/schemas";
import { describeOpenStatus, openStatus } from "@/lib/hours";

/** "Open now · until 11 PM" — computed in the browser so it's always current (never cached). */
export function OpenStatus({ hours, className, tone = "dark" }: { hours: OpeningHours; className?: string; tone?: "dark" | "light" }) {
  const [label, setLabel] = useState<{ open: boolean; label: string } | null>(null);

  useEffect(() => {
    const update = () => setLabel(describeOpenStatus(openStatus(hours)));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!label) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
        tone === "dark" ? "bg-cream/10 text-cream" : "bg-ink/5 text-ink",
        className,
      )}
    >
      <span className="relative flex size-2.5" aria-hidden>
        {label.open && <span className="motion-loop absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={clsx("relative inline-flex size-2.5 rounded-full", label.open ? "bg-emerald-400" : "bg-red-400")} />
      </span>
      {label.label}
    </span>
  );
}
