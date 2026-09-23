"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult, FieldErrors } from "@/lib/actions";

type Options<R> = {
  successMessage?: string;
  onSuccess?: (result: Extract<ActionResult<R>, { ok: true }>) => void;
  /** Keep the page's server data fresh after saving (default true). */
  refresh?: boolean;
};

/**
 * Controlled form state for admin editors: tracks dirty state, field errors and saving,
 * shows toasts, and warns before leaving with unsaved changes.
 */
export function useAdminForm<T, R = undefined>(
  initial: T,
  save: (values: T) => Promise<ActionResult<R>>,
  options: Options<R> = {},
) {
  const router = useRouter();
  const [values, setValues] = useState<T>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const dirty = useMemo(() => JSON.stringify(values) !== baseline, [values, baseline]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const k = String(key);
      if (!Object.keys(prev).some((e) => e === k || e.startsWith(`${k}.`))) return prev;
      const next = { ...prev };
      for (const e of Object.keys(next)) if (e === k || e.startsWith(`${k}.`)) delete next[e];
      return next;
    });
  }, []);

  const submit = useCallback(
    (override?: T) => {
      const payload = override ?? values;
      startSaving(async () => {
        const result = await save(payload);
        if (result.ok) {
          setErrors({});
          setBaseline(JSON.stringify(payload));
          setSavedAt(Date.now());
          toast.success(result.message ?? optionsRef.current.successMessage ?? "Saved");
          optionsRef.current.onSuccess?.(result);
          if (optionsRef.current.refresh !== false) router.refresh();
        } else {
          setErrors(result.fieldErrors ?? {});
          toast.error(result.message);
          requestAnimationFrame(() => {
            const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
            firstInvalid?.focus({ preventScroll: true });
            firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        }
      });
    },
    [save, values, router],
  );

  const reset = useCallback(
    (next?: T) => {
      const value = next ?? (JSON.parse(baseline) as T);
      setValues(value);
      if (next) setBaseline(JSON.stringify(next));
      setErrors({});
    },
    [baseline],
  );

  const error = useCallback((path: string) => errors[path], [errors]);

  return { values, setValues, set, errors, error, saving, dirty, submit, reset, savedAt };
}
