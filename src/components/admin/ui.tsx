"use client";

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/* ───────────────────────── Buttons ───────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brand";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400",
  brand: "bg-primary text-white hover:brightness-110 disabled:opacity-60",
  secondary: "bg-white text-stone-900 ring-1 ring-stone-300 hover:bg-stone-50 disabled:text-stone-400",
  ghost: "text-stone-700 hover:bg-stone-100 disabled:text-stone-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors select-none",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  icon,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  tone = "default",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
        tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Form fields ───────────────────────── */

export function Field({
  label,
  help,
  error,
  htmlFor,
  required,
  children,
  className,
  optional,
  aside,
}: {
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
  /** Right-aligned extra on the label row (e.g. a character counter). */
  aside?: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-stone-800">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden>*</span>}
          {optional && <span className="ml-1.5 text-xs font-normal text-stone-500">Optional</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : help ? (
        <p id={htmlFor ? `${htmlFor}-help` : undefined} className="text-sm text-stone-500">
          {help}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white px-3 text-[15px] text-stone-900 placeholder:text-stone-400 shadow-xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:bg-stone-100 disabled:text-stone-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={clsx(inputBase, "h-11", invalid ? "border-red-500" : "border-stone-300", className)}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={clsx(inputBase, "py-2.5 leading-relaxed", invalid ? "border-red-500" : "border-stone-300", className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={clsx(inputBase, "h-11 pr-8", invalid ? "border-red-500" : "border-stone-300", className)}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

/** Labelled text input wired to a form-state field. */
export function TextField({
  label,
  help,
  error,
  value,
  onChange,
  required,
  optional,
  multiline,
  rows,
  className,
  maxLength,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  multiline?: boolean;
  rows?: number;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;
  const counter =
    maxLength && value.length > maxLength * 0.8 ? (
      <span className={clsx("text-xs", value.length > maxLength ? "text-red-600" : "text-stone-500")}>
        {value.length}/{maxLength}
      </span>
    ) : null;
  return (
    <Field
      label={label}
      aside={counter}
      help={help}
      error={error}
      htmlFor={id}
      required={required}
      optional={optional}
      className={className}
    >
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={rest.placeholder}
        />
      ) : (
        <Input
          id={id}
          value={value}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          {...rest}
        />
      )}
    </Field>
  );
}

/** Rupee price input: shows ₹ prefix, accepts "299" or "299.50". */
export function PriceField({
  label,
  help,
  error,
  value,
  onChange,
  required,
  optional,
}: {
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} help={help} error={error} htmlFor={id} required={required} optional={optional}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-500">₹</span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          className="pl-7 tabular-nums"
          placeholder="0"
        />
      </div>
    </Field>
  );
}

/* ───────────────────────── Switch ───────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = "md",
  tone = "default",
  hideLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
  tone?: "default" | "success";
  hideLabel?: boolean;
}) {
  const id = useId();
  const on = tone === "success" ? "bg-emerald-600" : "bg-stone-900";
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      aria-describedby={description && !hideLabel ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        size === "sm" ? "h-6 w-10" : "h-7 w-12",
        checked ? on : "bg-stone-300",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "inline-block rounded-full bg-white shadow transition-transform",
          size === "sm" ? "size-4.5" : "size-5.5",
          checked ? (size === "sm" ? "translate-x-5" : "translate-x-5.5") : "translate-x-0.5",
        )}
      />
    </button>
  );
  if (hideLabel) return control;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-stone-800">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-stone-500">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}

/* ───────────────────────── Layout ───────────────────────── */

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-stone-200 bg-white shadow-xs", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-stone-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx("px-4 py-4 sm:px-5 sm:py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex text-sm font-medium text-stone-500 hover:text-stone-900">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
    info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    brand: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-12 text-center">
      {icon && <div className="flex size-12 items-center justify-center rounded-full bg-white text-stone-500 shadow-xs">{icon}</div>}
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={clsx("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={clsx(title && "mt-0.5", "opacity-90")}>{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-stone-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5";
  return href ? (
    <Link href={href} className={clsx(cls, "transition-colors hover:border-stone-300 hover:bg-stone-50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
