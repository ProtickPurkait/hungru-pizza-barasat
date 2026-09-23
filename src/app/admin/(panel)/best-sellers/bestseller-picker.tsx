"use client";

import { Plus, Search, Star, X } from "lucide-react";
import { useState } from "react";
import { saveBestsellers } from "@/app/admin/_actions/content";
import { SaveBar } from "@/components/admin/save-bar";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, Card, EmptyState, IconButton, Input } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { FoodArt } from "@/components/ui/food-art";
import { VegMark } from "@/components/ui/veg-mark";
import { formatINR } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  diet: "veg" | "non_veg";
  price: number;
  discountPrice: number | null;
  isVisible: boolean;
  isAvailable: boolean;
};

function Thumb({ p }: { p: Product }) {
  return (
    <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-cream">
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <FoodArt name={p.name} className="h-full w-full p-0.5" aria-hidden />
      )}
    </span>
  );
}

export function BestsellerPicker({ products, initialSelected }: { products: Product[]; initialSelected: string[] }) {
  const [query, setQuery] = useState("");
  const form = useAdminForm({ ids: initialSelected }, (v) => saveBestsellers(v.ids));
  const ids = form.values.ids;
  const byId = new Map(products.map((p) => [p.id, p]));
  const selected = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  const available = products.filter((p) => !ids.includes(p.id) && p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Featured (${selected.length})`} description="Drag to reorder. The first 4–8 look best on phones.">
          {selected.length === 0 ? (
            <EmptyState icon={<Star className="size-6" />} title="No best sellers yet" description="Add items from the list. The section is hidden on your homepage until you pick some." />
          ) : (
            <SortableList
              items={selected}
              getId={(p) => p.id}
              label={(p) => p.name}
              onReorder={(next) => form.set("ids", next.map((p) => p.id))}
              renderItem={(p, { handle, index }) => (
                <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white py-1.5 pr-2 pl-1">
                  {handle}
                  <span className="w-5 text-center text-sm font-bold text-stone-400">{index + 1}</span>
                  <Thumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-semibold">
                      <VegMark diet={p.diet} size={13} /> {p.name}
                    </p>
                    <p className="flex gap-1.5 text-sm text-stone-500">
                      {formatINR(p.discountPrice ?? p.price)}
                      {!p.isVisible && <Badge tone="warning">Hidden</Badge>}
                      {!p.isAvailable && <Badge tone="danger">Sold out</Badge>}
                    </p>
                  </div>
                  <IconButton label={`Remove ${p.name}`} onClick={() => form.set("ids", ids.filter((id) => id !== p.id))}>
                    <X className="size-4" aria-hidden />
                  </IconButton>
                </div>
              )}
            />
          )}
        </Card>
        <Card title="Add from your menu">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" aria-label="Search items" className="pl-9" />
          </div>
          {products.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Add menu items first.</p>
          ) : (
            <ul className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
              {available.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => form.set("ids", [...ids, p.id])}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-stone-50"
                  >
                    <Thumb p={p} />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-blue-700">
                      <Plus className="size-4" aria-hidden /> Add
                    </span>
                  </button>
                </li>
              ))}
              {available.length === 0 && <li className="py-6 text-center text-sm text-stone-500">Nothing else to add.</li>}
            </ul>
          )}
        </Card>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </>
  );
}
