"use client";

import { useEffect } from "react";
import { track, type FunnelEvent } from "@/lib/analytics";

/** Fires a funnel event once when a page mounts. */
export function TrackView({ event, props }: { event: FunnelEvent; props?: Record<string, string | number | boolean> }) {
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
