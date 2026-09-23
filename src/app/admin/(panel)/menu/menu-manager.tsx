"use client";

import { clsx } from "clsx";
import { Copy, Eye, EyeOff, MoreHorizontal, Pencil, Pizza, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProduct,
  duplicateProduct,
  reorderProducts,
  setProductAvailability,
  setProductVisibility,
} from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, ButtonLink, EmptyState, Input, Select, Switch } from "@/components/admin/ui";
import { FoodArt } from "@/components/ui/food-art";
import { VegMark } from "@/components/ui/veg-mark";
import type { ActionResult } from "@/lib/actions";
import { formatINR } from "@/lib/money";

type Category = { id: string; name: string; isActive: boolean };
type Product = {
  id: string;
  name: string;
  categoryId: string | null;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  diet: "veg" | "non_veg";
  isBestseller: boolean;
  isAvailable: boolean;
  isVisible: boolean;
  isSample: boolean;
  badge: string;
  optionCount: number;
};

export function MenuManager({ categories, products: initial }: { categories: Category[]; products: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "out">("all");

  useEffect(() => setProducts(initial), [initial]);

  const filtering = query.trim() !== "" || stockFilter !== "all";
  const matches = (p: Product) =>
    (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase())) &&
    (stockFilter === "all" || !p.isAvailable) &&
    (categoryFilter === "all" || p.categoryId === categoryFilter);

  const groups = useMemo(() => {
    const cats = categoryFilter === "all" ? categories : categories.filter((c) => c.id === categoryFilter);
    const list = cats.map((c) => ({ category: c, items: products.filter((p) => p.categoryId === c.id && matches(p)) }));
    const orphans = products.filter((p) => !p.categoryId && matches(p));
    if (orphans.length && categoryFilter === "all") list.push({ category: { id: "none", name: "No category", isActive: false }, items: orphans });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, categoryFilter, query, stockFilter]);

  const update = (id: string, patch: Partial<Product>) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Pizza className="size-6" />}
        title="Your menu is empty"
        description="Add your first pizza, side or drink. You can set prices, photos, veg/non-veg and options like size or crust."
        action={
          <ButtonLink href="/admin/menu/new" icon={<Plus className="size-4" aria-hidden />}>
            Add your first item
          </ButtonLink>
        }
      />
    );
  }

  const outCount = products.filter((p) => !p.isAvailable).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu items" aria-label="Search menu items" className="pl-9" type="search" />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="sm:w-48">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as "all" | "out")} aria-label="Filter by stock" className="sm:w-48">
          <option value="all">All items</option>
          <option value="out">Out of stock ({outCount})</option>
        </Select>
      </div>

      {groups.map(({ category, items }) => (
        <section key={category.id} aria-labelledby={`cat-${category.id}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id={`cat-${category.id}`} className="flex items-center gap-2 text-sm font-bold tracking-wide text-stone-500 uppercase">
              {category.name}
              <span className="font-medium normal-case">({items.length})</span>
              {!category.isActive && category.id !== "none" && <Badge tone="warning">Hidden category</Badge>}
            </h2>
            {category.id !== "none" && (
              <Link href={`/admin/menu/new?category=${category.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
                + Add to {category.name}
              </Link>
            )}
          </div>
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
              {filtering ? "No matching items." : "No items in this category yet."}
            </p>
          ) : (
            <SortableList
              items={items}
              getId={(p) => p.id}
              label={(p) => p.name}
              disabled={filtering}
              onReorder={async (next) => {
                const ids = next.map((p) => p.id);
                setProducts((prev) => {
                  const others = prev.filter((p) => !ids.includes(p.id));
                  return [...others, ...next];
                });
                const result = await reorderProducts(ids);
                if (!result.ok) toast.error(result.message);
              }}
              renderItem={(p, { handle }) => <ProductRow product={p} handle={filtering ? null : handle} onChange={(patch) => update(p.id, patch)} />}
            />
          )}
        </section>
      ))}
    </div>
  );
}

function ProductRow({ product: p, handle, onChange }: { product: Product; handle: React.ReactNode; onChange: (patch: Partial<Product>) => void }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  const toggleStock = (available: boolean) => {
    onChange({ isAvailable: available });
    start(async () => {
      const result = await setProductAvailability(p.id, available);
      if (result.ok) toast.success(`${p.name}: ${result.message}`);
      else {
        onChange({ isAvailable: !available });
        toast.error(result.message);
      }
    });
  };

  const run = (fn: () => Promise<ActionResult<{ id: string }> | ActionResult>, after?: (id?: string) => void) =>
    start(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Done");
        after?.(result.data && "id" in result.data ? result.data.id : undefined);
        router.refresh();
      } else toast.error(result.message);
    });

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-xl border bg-white py-2 pr-2 pl-1 shadow-xs sm:gap-3 sm:pr-3",
        p.isAvailable ? "border-stone-200" : "border-red-200 bg-red-50/40",
        !p.isVisible && "opacity-70",
      )}
    >
      {handle ?? <span className="w-2" />}
      <Link href={`/admin/menu/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-cream">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <FoodArt name={p.name} className="h-full w-full p-1" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <VegMark diet={p.diet} size={14} />
            <span className="truncate font-semibold text-stone-900">{p.name}</span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
            {p.discountPrice !== null ? (
              <>
                <span className="font-semibold tabular-nums">{formatINR(p.discountPrice)}</span>
                <span className="text-stone-400 line-through tabular-nums">{formatINR(p.price)}</span>
              </>
            ) : (
              <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
            )}
            {p.isBestseller && <Badge tone="brand">Best seller</Badge>}
            {p.optionCount > 0 && <Badge>{p.optionCount} option group{p.optionCount === 1 ? "" : "s"}</Badge>}
            {!p.isVisible && <Badge tone="warning">Hidden</Badge>}
            {p.isSample && <Badge tone="info">Sample</Badge>}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <Switch
            hideLabel
            size="sm"
            tone="success"
            label={`${p.name} available`}
            checked={p.isAvailable}
            onChange={toggleStock}
            disabled={pending}
          />
          <span className={clsx("text-[11px] font-semibold", p.isAvailable ? "text-emerald-700" : "text-red-700")}>
            {p.isAvailable ? "In stock" : "Sold out"}
          </span>
        </div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`More actions for ${p.name}`}
            className="flex size-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
              <Link role="menuitem" href={`/admin/menu/${p.id}`} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-stone-50">
                <Pencil className="size-4 text-stone-400" aria-hidden /> Edit
              </Link>
              <button
                role="menuitem"
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                onClick={() => {
                  setMenuOpen(false);
                  run(() => duplicateProduct(p.id), (id) => id && router.push(`/admin/menu/${id}`));
                }}
              >
                <Copy className="size-4 text-stone-400" aria-hidden /> Duplicate
              </button>
              <button
                role="menuitem"
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-stone-50"
                onClick={() => {
                  setMenuOpen(false);
                  onChange({ isVisible: !p.isVisible });
                  run(() => setProductVisibility(p.id, !p.isVisible));
                }}
              >
                {p.isVisible ? <EyeOff className="size-4 text-stone-400" aria-hidden /> : <Eye className="size-4 text-stone-400" aria-hidden />}
                {p.isVisible ? "Hide from website" : "Show on website"}
              </button>
              <button
                role="menuitem"
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={async () => {
                  setMenuOpen(false);
                  if (await confirm({ title: `Delete “${p.name}”?`, description: "This can't be undone. If you only want to stop selling it for now, mark it sold out or hide it instead." })) {
                    run(() => deleteProduct(p.id));
                  }
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
