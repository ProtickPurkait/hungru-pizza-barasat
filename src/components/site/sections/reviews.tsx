import { Quote, Star } from "lucide-react";
import Image from "next/image";
import type { SiteReview } from "@/lib/content/types";
import { SampleChip } from "../product-card";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const TILTS = ["md:-rotate-2", "md:rotate-1", "md:-rotate-1", "md:rotate-2"];
const COLORS = ["bg-white", "bg-cream", "bg-white", "bg-cream"];

export function ReviewsSection({ heading, reviews }: { heading: { eyebrow: string; heading: string; subtext: string }; reviews: SiteReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="relative overflow-hidden bg-accent py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="reviews-heading" {...heading} tone="brand" />
      </div>
      <ul className="mx-auto mt-10 flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-8 no-scrollbar sm:gap-6 sm:px-6 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 lg:px-8">
        {reviews.map((review, i) => (
          <Reveal as="li" key={review.id} index={i % 3} className="w-[85%] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none">
            <figure className={`relative flex h-full flex-col rounded-[1.75rem] p-6 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)] ${COLORS[i % 4]} ${TILTS[i % 4]}`}>
              <Quote className="size-10 fill-primary text-primary" aria-hidden />
              {review.rating && (
                <p className="mt-3 flex gap-0.5 text-primary" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star key={s} className={s < review.rating! ? "size-5 fill-current" : "size-5 opacity-25"} aria-hidden />
                  ))}
                </p>
              )}
              <blockquote className="mt-3 flex-1 text-lg leading-snug font-semibold text-ink">“{review.content}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {review.image ? (
                  <span className="relative size-11 overflow-hidden rounded-full ring-2 ring-ink">
                    <Image src={review.image.src} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                ) : (
                  <span aria-hidden className="font-display flex size-11 items-center justify-center rounded-full bg-ink text-xl text-accent uppercase">
                    {review.authorName.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-extrabold">{review.authorName}</span>
                  {review.source && <span className="block text-sm text-ink/60">via {review.source}</span>}
                </span>
                {review.isSample && <SampleChip className="ml-auto" />}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
