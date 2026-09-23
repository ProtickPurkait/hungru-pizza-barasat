"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui";

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({ title: "Delete?" })) …` */
export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    requestAnimationFrame(() => dialogRef.current?.showModal());
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    dialogRef.current?.close();
  };

  const danger = (options?.tone ?? "danger") === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close(false);
        }}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-stone-900 shadow-2xl"
      >
        {options && (
          <div className="p-5 sm:p-6">
            <div className="flex gap-4">
              {danger && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="size-5" aria-hidden />
                </div>
              )}
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-lg font-bold">
                  {options.title}
                </h2>
                {options.description && <div className="mt-1 text-sm text-stone-600">{options.description}</div>}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => close(false)} autoFocus>
                {options.cancelLabel ?? "Cancel"}
              </Button>
              <Button variant={danger ? "danger" : "primary"} onClick={() => close(true)}>
                {options.confirmLabel ?? (danger ? "Delete" : "Confirm")}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
