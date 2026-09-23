"use client";

import { Pencil, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteOffer, reorderOffers, setOfferActive } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge, ButtonLink, EmptyState, IconButton, Switch } from "@/components/admin/ui";
import { FoodArt } from "@/components/ui/food-art";
import { formatINR } from "@/lib/money";

type Offer = {
  id: string;
  title: string;
  badge: string;
  price: number | null;
  originalPrice: number | null;
  isActive: boolean;
  isSample: boolean;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
};

function scheduleLabel(o: Offer) {
  const now = Date.now();
  const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  if (o.endsAt && Date.parse(o.endsAt) <= now) return { tone: "neutral" as const, text: `Ended ${fmt(o.endsAt)}` };
  if (o.startsAt && Date.parse(o.startsAt) > now) return { tone: "info" as const, text: `Starts ${fmt(o.startsAt)}` };
  if (o.endsAt) return { tone: "success" as const, text: `Until ${fmt(o.endsAt)}` };
  return null;
}

export function OfferList({ offers: initial }: { offers: Offer[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [offers, setOffers] = useState(initial);
  const [, start] = useTransition();
  useEffect(() => setOffers(initial), [initial]);

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="size-6" />}
        title="No offers yet"
        description="Add a deal, combo or seasonal special. The Offers section stays hidden on your homepage until you have an active offer."
        action={<ButtonLink href="/admin/offers/new">Add your first offer</ButtonLink>}
      />
    );
  }

  return (
    <SortableList
      items={offers}
      getId={(o) => o.id}
      label={(o) => o.title}
      onReorder={async (next) => {
        setOffers(next);
        const result = await reorderOffers(next.map((o) => o.id));
        if (!result.ok) toast.error(result.message);
      }}
      renderItem={(o, { handle }) => {
        const schedule = scheduleLabel(o);
        return (
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white py-2 pr-2 pl-1 shadow-xs sm:gap-3 sm:pr-3">
            {handle}
            <Link href={`/admin/offers/${o.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-primary/10">
                {o.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FoodArt name={o.title} kind="combo" className="h-full w-full p-1" aria-hidden />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-stone-900">{o.title}</span>
                <span className="mt-0.5 flex flex-wrap gap-1.5 text-sm">
                  {o.price !== null && <span className="font-semibold">{formatINR(o.price)}</span>}
                  {o.originalPrice !== null && <s className="text-stone-400">{formatINR(o.originalPrice)}</s>}
                  {o.badge && <Badge tone="brand">{o.badge}</Badge>}
                  {schedule && <Badge tone={schedule.tone}>{schedule.text}</Badge>}
                  {o.isSample && <Badge tone="info">Sample</Badge>}
                  {!o.isActive && <Badge tone="warning">Off</Badge>}
                </span>
              </span>
            </Link>
            <Switch
              size="sm"
              hideLabel
              label={`${o.title} active`}
              checked={o.isActive}
              onChange={(value) => {
                setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, isActive: value } : x)));
                start(async () => {
                  const result = await setOfferActive(o.id, value);
                  if (result.ok) toast.success(result.message);
                  else toast.error(result.message);
                  router.refresh();
                });
              }}
            />
            <IconButton label={`Edit ${o.title}`} onClick={() => router.push(`/admin/offers/${o.id}`)}>
              <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton
              label={`Delete ${o.title}`}
              tone="danger"
              onClick={async () => {
                if (!(await confirm({ title: `Delete “${o.title}”?`, description: "To pause an offer instead, switch it off." }))) return;
                start(async () => {
                  const result = await deleteOffer(o.id);
                  if (result.ok) toast.success(result.message);
                  else toast.error(result.message);
                  router.refresh();
                });
              }}
            >
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </div>
        );
      }}
    />
  );
}
