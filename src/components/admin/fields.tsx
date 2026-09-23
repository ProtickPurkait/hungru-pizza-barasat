"use client";

import { clsx } from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import {
  DAYS,
  DAY_LABELS,
  HOMEPAGE_ANCHORS,
  LINK_TARGET_TYPES,
  type Day,
  type LinkTarget,
  type OpeningHours,
} from "@/lib/content/schemas";
import { Button, Field, IconButton, Input, Select, Switch } from "./ui";

/* ───────────────────────── Link target ───────────────────────── */

export type LinkOptions = {
  categories: { slug: string; name: string }[];
  products: { slug: string; name: string }[];
};

const TARGET_LABELS: Record<LinkTarget["type"], string> = {
  menu: "Menu / order page",
  category: "A menu category",
  product: "A specific menu item",
  cart: "Cart",
  section: "A homepage section",
  url: "Custom link (URL)",
  whatsapp: "WhatsApp chat",
  phone: "Phone call",
};

const ANCHOR_LABELS: Record<(typeof HOMEPAGE_ANCHORS)[number], string> = {
  top: "Top of page",
  bestsellers: "Best sellers",
  menu: "Menu preview",
  offers: "Offers",
  why: "Why Hungru",
  story: "Brand story",
  reviews: "Reviews",
  contact: "Location & contact",
};

export function LinkTargetField({
  label,
  value,
  onChange,
  options,
  error,
  help,
}: {
  label: string;
  value: LinkTarget;
  onChange: (value: LinkTarget) => void;
  options: LinkOptions;
  error?: string;
  help?: string;
}) {
  const id = useId();
  const setType = (type: LinkTarget["type"]) => {
    const defaults: Partial<Record<LinkTarget["type"], string>> = {
      category: options.categories[0]?.slug ?? "",
      product: options.products[0]?.slug ?? "",
      section: "menu",
    };
    onChange({ type, value: defaults[type] ?? "" });
  };

  return (
    <Field label={label} htmlFor={id} error={error} help={help}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select id={id} value={value.type} onChange={(e) => setType(e.target.value as LinkTarget["type"])} className="sm:max-w-[16rem]">
          {LINK_TARGET_TYPES.map((type) => (
            <option key={type} value={type}>
              {TARGET_LABELS[type]}
            </option>
          ))}
        </Select>
        {value.type === "category" && (
          <Select aria-label="Category" value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value })} invalid={Boolean(error)}>
            {options.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        {value.type === "product" && (
          <Select aria-label="Menu item" value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value })} invalid={Boolean(error)}>
            {options.products.length === 0 && <option value="">No menu items yet</option>}
            {options.products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
        {value.type === "section" && (
          <Select aria-label="Section" value={value.value || "top"} onChange={(e) => onChange({ ...value, value: e.target.value })}>
            {HOMEPAGE_ANCHORS.map((a) => (
              <option key={a} value={a}>
                {ANCHOR_LABELS[a]}
              </option>
            ))}
          </Select>
        )}
        {value.type === "url" && (
          <Input
            aria-label="Link address"
            value={value.value}
            placeholder="https://…"
            inputMode="url"
            invalid={Boolean(error)}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
          />
        )}
        {value.type === "whatsapp" && (
          <Input
            aria-label="Pre-filled WhatsApp message (optional)"
            value={value.value}
            placeholder="Pre-filled message (optional)"
            onChange={(e) => onChange({ ...value, value: e.target.value })}
          />
        )}
      </div>
      {(value.type === "whatsapp" || value.type === "phone") && (
        <p className="text-xs text-stone-500">Uses the number from Contact &amp; hours.</p>
      )}
    </Field>
  );
}

/* ───────────────────────── Opening hours ───────────────────────── */

export function HoursEditor({
  value,
  onChange,
  errors,
}: {
  value: OpeningHours;
  onChange: (value: OpeningHours) => void;
  errors: (path: string) => string | undefined;
}) {
  const setDay = (day: Day, next: OpeningHours["days"][Day]) => onChange({ ...value, days: { ...value.days, [day]: next } });

  const copyToAll = (day: Day) => {
    const source = value.days[day];
    const days = Object.fromEntries(
      DAYS.map((d) => [d, { closed: source.closed, ranges: source.ranges.map((r) => ({ ...r })) }]),
    ) as OpeningHours["days"];
    onChange({ ...value, days });
  };

  return (
    <div className="flex flex-col divide-y divide-stone-100 rounded-xl border border-stone-200">
      {DAYS.map((day) => {
        const d = value.days[day];
        return (
          <div key={day} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:px-4">
            <div className="flex items-center justify-between gap-3 sm:w-44 sm:pt-2">
              <span className="font-semibold text-stone-800">{DAY_LABELS[day]}</span>
              <div className="sm:hidden">
                <Switch
                  size="sm"
                  hideLabel
                  label={`${DAY_LABELS[day]} open`}
                  checked={!d.closed}
                  onChange={(open) => setDay(day, { closed: !open, ranges: open && d.ranges.length === 0 ? [{ open: "11:00", close: "23:00" }] : d.ranges })}
                />
              </div>
            </div>
            <div className="hidden pt-2 sm:block">
              <Switch
                size="sm"
                hideLabel
                label={`${DAY_LABELS[day]} open`}
                checked={!d.closed}
                onChange={(open) => setDay(day, { closed: !open, ranges: open && d.ranges.length === 0 ? [{ open: "11:00", close: "23:00" }] : d.ranges })}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {d.closed ? (
                <p className="text-sm text-stone-500 sm:pt-2">Closed all day</p>
              ) : d.ranges.length === 0 ? (
                <div className="flex flex-wrap items-center gap-2 sm:pt-0.5">
                  <span className="text-sm text-stone-500">Not set</span>
                  <Button size="sm" variant="secondary" onClick={() => setDay(day, { ...d, ranges: [{ open: "11:00", close: "23:00" }] })}>
                    Add hours
                  </Button>
                </div>
              ) : (
                d.ranges.map((range, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${DAY_LABELS[day]} opens`}
                      value={range.open}
                      onChange={(e) =>
                        setDay(day, { ...d, ranges: d.ranges.map((r, j) => (j === i ? { ...r, open: e.target.value } : r)) })
                      }
                      className="w-32"
                      invalid={Boolean(errors(`hours.days.${day}.ranges.${i}`) || errors(`hours.days.${day}.ranges.${i}.open`))}
                    />
                    <span className="text-stone-500">to</span>
                    <Input
                      type="time"
                      aria-label={`${DAY_LABELS[day]} closes`}
                      value={range.close}
                      onChange={(e) =>
                        setDay(day, { ...d, ranges: d.ranges.map((r, j) => (j === i ? { ...r, close: e.target.value } : r)) })
                      }
                      className="w-32"
                      invalid={Boolean(errors(`hours.days.${day}.ranges.${i}.close`))}
                    />
                    <IconButton
                      label="Remove time range"
                      tone="danger"
                      onClick={() => setDay(day, { ...d, ranges: d.ranges.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                    {range.close < range.open && <span className="text-xs text-stone-500">closes after midnight</span>}
                  </div>
                ))
              )}
              {errors(`hours.days.${day}.ranges.0`) && (
                <p className="text-sm text-red-600">{errors(`hours.days.${day}.ranges.0`)}</p>
              )}
              {!d.closed && d.ranges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {d.ranges.length < 3 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Plus className="size-4" />}
                      onClick={() => setDay(day, { ...d, ranges: [...d.ranges, { open: "18:00", close: "23:00" }] })}
                    >
                      Split shift
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => copyToAll(day)}>
                    Copy to all days
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Colour ───────────────────────── */

function luminance(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 0;
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function ColorField({
  label,
  help,
  value,
  onChange,
  error,
  checkAgainst,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  checkAgainst?: { color: string; label: string };
}) {
  const id = useId();
  const ratio = checkAgainst ? contrastRatio(value, checkAgainst.color) : null;
  return (
    <Field label={label} help={help} error={error} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} invalid={Boolean(error)} className="font-mono uppercase" maxLength={7} />
      </div>
      {ratio !== null && ratio > 0 && (
        <p className={clsx("text-xs", ratio >= 4.5 ? "text-emerald-700" : ratio >= 3 ? "text-amber-700" : "text-red-600")}>
          Contrast with {checkAgainst!.label}: {ratio.toFixed(1)}:1{" "}
          {ratio >= 4.5 ? "✓ easy to read" : ratio >= 3 ? "OK for big text only" : "too low, text will be hard to read"}
        </p>
      )}
    </Field>
  );
}
