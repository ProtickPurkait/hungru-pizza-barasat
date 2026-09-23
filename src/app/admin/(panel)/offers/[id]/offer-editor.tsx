"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { OfferForm, toLocalInput, type OfferFormValues } from "../offer-form";

const subscribe = () => () => {};

/** Converts stored ISO dates to the admin's local time (only known in the browser) before editing. */
export function OfferEditor({
  initial,
  ...rest
}: Omit<ComponentProps<typeof OfferForm>, "initial"> & {
  initial: Omit<OfferFormValues, "startsAt" | "endsAt"> & { startsAt: string | null; endsAt: string | null };
}) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!isClient) return <div className="h-96 animate-pulse rounded-xl bg-stone-100" aria-hidden />;
  return <OfferForm {...rest} initial={{ ...initial, startsAt: toLocalInput(initial.startsAt), endsAt: toLocalInput(initial.endsAt) }} />;
}
