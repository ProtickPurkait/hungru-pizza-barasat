"use client";

import { clsx } from "clsx";
import { Plus, Trash2 } from "lucide-react";
import { Badge, Button, IconButton, Input, Select, Switch } from "./ui";

export type OptionForm = { id: string; name: string; price: string; isDefault: boolean; isAvailable: boolean };
export type GroupForm = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  maxSelect: string;
  options: OptionForm[];
};

const newId = () => Math.random().toString(36).slice(2, 10);

const PRESETS: Record<string, () => GroupForm> = {
  Size: () => ({
    id: newId(),
    name: "Size",
    type: "single",
    required: true,
    maxSelect: "0",
    options: ["Regular", "Medium", "Large"].map((name, i) => ({ id: newId(), name, price: "0", isDefault: i === 0, isAvailable: true })),
  }),
  Crust: () => ({
    id: newId(),
    name: "Crust",
    type: "single",
    required: false,
    maxSelect: "0",
    options: [{ id: newId(), name: "", price: "0", isDefault: true, isAvailable: true }],
  }),
  "Add-ons": () => ({
    id: newId(),
    name: "Add-ons",
    type: "multiple",
    required: false,
    maxSelect: "0",
    options: [{ id: newId(), name: "", price: "0", isDefault: false, isAvailable: true }],
  }),
  Custom: () => ({
    id: newId(),
    name: "",
    type: "single",
    required: false,
    maxSelect: "0",
    options: [{ id: newId(), name: "", price: "0", isDefault: false, isAvailable: true }],
  }),
};

export function OptionsBuilder({
  value,
  onChange,
  error,
}: {
  value: GroupForm[];
  onChange: (value: GroupForm[]) => void;
  error: (path: string) => string | undefined;
}) {
  const setGroup = (index: number, patch: Partial<GroupForm>) => onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  const setOption = (gi: number, oi: number, patch: Partial<OptionForm>) =>
    setGroup(gi, {
      options: value[gi].options.map((o, j) => {
        if (j === oi) return { ...o, ...patch };
        // Single-choice groups can only have one default.
        if (patch.isDefault && value[gi].type === "single") return { ...o, isDefault: false };
        return o;
      }),
    });

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 && (
        <p className="text-sm text-stone-500">
          No options. Customers add this item as it is. Add option groups only for choices you really offer (e.g. sizes or crusts).
        </p>
      )}
      {value.map((group, gi) => (
        <fieldset key={group.id} className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 sm:p-4">
          <legend className="sr-only">Option group {gi + 1}</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-sm font-semibold text-stone-800">Group name</span>
              <Input
                value={group.name}
                placeholder="e.g. Size"
                onChange={(e) => setGroup(gi, { name: e.target.value })}
                invalid={Boolean(error(`options.${gi}.name`))}
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:w-44">
              <span className="text-sm font-semibold text-stone-800">Customers can</span>
              <Select value={group.type} onChange={(e) => setGroup(gi, { type: e.target.value as GroupForm["type"] })}>
                <option value="single">Choose one</option>
                <option value="multiple">Choose several</option>
              </Select>
            </label>
            {group.type === "multiple" && (
              <label className="flex flex-col gap-1.5 sm:w-32">
                <span className="text-sm font-semibold text-stone-800">Max choices</span>
                <Input
                  inputMode="numeric"
                  value={group.maxSelect}
                  onChange={(e) => setGroup(gi, { maxSelect: e.target.value.replace(/\D/g, "") })}
                  placeholder="0 = any"
                />
              </label>
            )}
            <IconButton label={`Remove ${group.name || "option group"}`} tone="danger" onClick={() => onChange(value.filter((_, i) => i !== gi))}>
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
          {error(`options.${gi}.name`) && <p className="mt-1 text-sm text-red-600">{error(`options.${gi}.name`)}</p>}
          <div className="mt-3">
            <Switch
              size="sm"
              label="Customer must choose"
              description={group.type === "single" ? "e.g. a size is always needed" : "at least one choice is needed"}
              checked={group.required}
              onChange={(required) => setGroup(gi, { required })}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div className="hidden grid-cols-[1fr_8rem_5.5rem_5.5rem_2.5rem] gap-2 px-1 text-xs font-semibold text-stone-500 sm:grid">
              <span>Choice</span>
              <span>Extra price</span>
              <span>{group.type === "single" ? "Default" : "Pre-ticked"}</span>
              <span>Available</span>
              <span />
            </div>
            {group.options.map((option, oi) => {
              const base = `options.${gi}.options.${oi}`;
              return (
                <div key={option.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-white p-2 ring-1 ring-stone-200 sm:grid-cols-[1fr_8rem_5.5rem_5.5rem_2.5rem] sm:items-center sm:bg-transparent sm:p-0 sm:ring-0">
                  <Input
                    aria-label="Choice name"
                    value={option.name}
                    placeholder="e.g. Large"
                    onChange={(e) => setOption(gi, oi, { name: e.target.value })}
                    invalid={Boolean(error(`${base}.name`))}
                    className="col-span-2 sm:col-span-1"
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-500">+₹</span>
                    <Input
                      aria-label={`Extra price for ${option.name || "choice"}`}
                      inputMode="decimal"
                      value={option.price}
                      onChange={(e) => setOption(gi, oi, { price: e.target.value.replace(/[^\d.]/g, "") })}
                      invalid={Boolean(error(`${base}.priceDelta`))}
                      className="pl-8 tabular-nums"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:justify-center">
                    <input
                      type={group.type === "single" ? "radio" : "checkbox"}
                      name={`default-${group.id}`}
                      checked={option.isDefault}
                      onChange={(e) => setOption(gi, oi, { isDefault: e.target.checked })}
                      onClick={() => {
                        if (group.type === "single" && option.isDefault) setOption(gi, oi, { isDefault: false });
                      }}
                      className="size-5 accent-stone-900"
                    />
                    <span className="sm:sr-only">{group.type === "single" ? "Default" : "Pre-ticked"}</span>
                  </label>
                  <div className="flex items-center gap-2 sm:justify-center">
                    <Switch
                      size="sm"
                      hideLabel
                      tone="success"
                      label={`${option.name || "Choice"} available`}
                      checked={option.isAvailable}
                      onChange={(isAvailable) => setOption(gi, oi, { isAvailable })}
                    />
                    <span className="text-sm sm:sr-only">Available</span>
                  </div>
                  <IconButton
                    label={`Remove ${option.name || "choice"}`}
                    tone="danger"
                    disabled={group.options.length === 1}
                    onClick={() => setGroup(gi, { options: group.options.filter((_, j) => j !== oi) })}
                    className="justify-self-end"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                  {(error(`${base}.name`) || error(`${base}.priceDelta`)) && (
                    <p className="col-span-2 text-sm text-red-600 sm:col-span-5">{error(`${base}.name`) ?? error(`${base}.priceDelta`)}</p>
                  )}
                </div>
              );
            })}
            {error(`options.${gi}.options`) && <p className="text-sm text-red-600">{error(`options.${gi}.options`)}</p>}
            <div>
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus className="size-4" />}
                onClick={() =>
                  setGroup(gi, { options: [...group.options, { id: newId(), name: "", price: "0", isDefault: false, isAvailable: true }] })
                }
              >
                Add choice
              </Button>
            </div>
          </div>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-700">Add option group:</span>
        {Object.keys(PRESETS).map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant="secondary"
            icon={<Plus className="size-4" />}
            onClick={() => onChange([...value, PRESETS[preset]()])}
            disabled={value.length >= 10}
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OptionsPreview({ groups, basePrice }: { groups: GroupForm[]; basePrice: number }) {
  if (!groups.length) return null;
  return (
    <div className="flex flex-col gap-2 text-sm">
      {groups.map((g) => (
        <div key={g.id}>
          <p className="font-semibold text-stone-800">
            {g.name || "Untitled"}{" "}
            <span className="font-normal text-stone-500">
              {g.type === "single" ? "· choose one" : `· choose ${Number(g.maxSelect) > 0 ? `up to ${g.maxSelect}` : "any"}`}
            </span>{" "}
            {g.required && <Badge tone="warning">Required</Badge>}
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {g.options.map((o) => (
              <li
                key={o.id}
                className={clsx(
                  "rounded-full border px-2.5 py-1",
                  o.isDefault ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white",
                  !o.isAvailable && "line-through opacity-50",
                )}
              >
                {o.name || "…"}
                {Number(o.price) > 0 && ` +₹${o.price}`}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-stone-500">Base price ₹{(basePrice / 100).toFixed(basePrice % 100 ? 2 : 0)} + selected extras.</p>
    </div>
  );
}
