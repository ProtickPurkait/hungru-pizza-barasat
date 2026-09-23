"use client";

import { useState } from "react";

/**
 * Local, optimistic copy of server data that resets whenever the server sends new data
 * (e.g. after router.refresh()). Uses React's "adjust state during render" pattern.
 */
export function useSyncedState<T>(serverValue: T) {
  const [value, setValue] = useState(serverValue);
  const [previous, setPrevious] = useState(serverValue);
  if (serverValue !== previous) {
    setPrevious(serverValue);
    setValue(serverValue);
  }
  return [value, setValue] as const;
}
