"use client";

import { create } from "zustand";

type SheetState = {
  productId: string | null;
  /** True when the sheet pushed a history entry (so closing can go "back"). */
  pushed: boolean;
  open: (productId: string, options?: { pushed?: boolean }) => void;
  close: () => void;
};

export const useProductSheet = create<SheetState>((set) => ({
  productId: null,
  pushed: false,
  open: (productId, options) => set({ productId, pushed: Boolean(options?.pushed) }),
  close: () => set({ productId: null, pushed: false }),
}));
