"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { lineKey, MAX_LINE_QUANTITY, type Selection } from "./pricing";

export type CartLine = {
  key: string;
  productId: string;
  selection: Selection;
  quantity: number;
  addedAt: number;
};

type CartState = {
  lines: CartLine[];
  hydrated: boolean;
  /** Bumps whenever something is added, so UI can play feedback animations. */
  lastAdd: { key: string; at: number; x?: number; y?: number } | null;
  add: (productId: string, selection: Selection, quantity?: number, origin?: { x: number; y: number }) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hydrated: false,
      lastAdd: null,
      add: (productId, selection, quantity = 1, origin) =>
        set((state) => {
          const key = lineKey(productId, selection);
          const existing = state.lines.find((l) => l.key === key);
          const lines = existing
            ? state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + quantity) } : l))
            : [...state.lines, { key, productId, selection, quantity: Math.min(MAX_LINE_QUANTITY, quantity), addedAt: Date.now() }];
          return { lines, lastAdd: { key, at: Date.now(), ...origin } };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)) } : l)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "hungru-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCart.setState({ hydrated: true });
      },
    },
  ),
);
