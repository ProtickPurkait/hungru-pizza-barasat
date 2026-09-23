"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Modal used for quick add/edit forms (reviews, Why Hungru points…). Full-height sheet on phones. */
export function EditorDialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-none rounded-t-2xl bg-white p-0 text-stone-900 shadow-2xl sm:m-auto sm:max-h-[min(48rem,calc(100dvh-2rem))] sm:w-[min(40rem,calc(100vw-2rem))] sm:rounded-2xl"
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-lg hover:bg-stone-100" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">{children}</div>
          <div className="flex justify-end gap-2 border-t border-stone-200 px-4 py-3 pb-safe sm:px-5">{footer}</div>
        </div>
      )}
    </dialog>
  );
}
