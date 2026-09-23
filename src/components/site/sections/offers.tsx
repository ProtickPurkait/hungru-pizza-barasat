import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { ResolvedLink } from "@/lib/content/links";
import type { SiteOffer } from "@/lib/content/types";
import { discountPercent, formatINR } from "@/lib/money";
import { FoodArt } from "@/components/ui/food-art";
import { CtaLink } from "../cta-link";
import { SampleChip } from "../product-card";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

export function OffersSection({
  heading,
  offers,
}: {
  heading: { eyebrow: string; heading: string; subtext: string };
  offers: (SiteOffer & { link: ResolvedLink })[];
}) {
  if (offers.length === 0) return null;
  const single = offers.length === 1;
  return (
    <section id="offers" aria-labelledby="offers-heading" className="grain relative overflow-hidden bg-primary py-16 text-cream sm:py-24">
      <p
        aria-hidden
        className="font-display text-stroke pointer-events-none absolute -top-6 right-0 left-0 text-center text-[30vw] leading-none text-ink/15 uppercase select-none"
      >
        Deals
      </p>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="offers-heading" {...heading} tone="brand" />
        <ul className={clsx("mt-10 grid gap-5 sm:gap-6", !single && "md:grid-cols-2")}>
          {offers.map((offer, i) => (
            <Reveal as="li" key={offer.id} index={i}>
              <article
                className={clsx(
                  "group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink text-cream ring-2 ring-ink shadow-[6px_6px_0_0_var(--brand-accent)]",
                  single && "md:flex-row",
                )}
              >
                <div className={clsx("relative aspect-[16/10] overflow-hidden bg-secondary", single && "md:aspect-auto md:w-1/2")}>
                  {offer.image ? (
                    <Image
                      src={offer.image.src}
                      alt={offer.image.alt || offer.title}
                      fill
                      sizes={single ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      placeholder={offer.image.blurDataUrl ? "blur" : "empty"}
                      blurDataURL={offer.image.blurDataUrl ?? undefined}
                    />
                  ) : (
                    <FoodArt
                      name={offer.title}
                      kind="combo"
                      className="absolute inset-0 h-full w-full p-6 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3"
                    />
                  )}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {offer.badge && (
                      <span className="-rotate-3 rounded-full bg-accent px-3 py-1 text-xs font-extrabold tracking-wider text-ink uppercase shadow-[2px_2px_0_0_var(--color-ink)] sm:text-sm">
                        {offer.badge}
                      </span>
                    )}
                    {offer.isSample && <SampleChip />}
                  </div>
                  {offer.price !== null && offer.originalPrice !== null && offer.originalPrice > offer.price && (
                    <span className="absolute right-4 bottom-4 flex size-20 rotate-12 flex-col items-center justify-center rounded-full bg-accent text-ink ring-2 ring-ink sm:size-24">
                      <span className="font-display text-2xl leading-none sm:text-3xl">
                        {discountPercent(offer.originalPrice, offer.price)}%
                      </span>
                      <span className="text-[10px] font-extrabold tracking-widest uppercase">off</span>
                    </span>
                  )}
                </div>
                <div className={clsx("flex flex-1 flex-col gap-3 p-6 sm:p-8", single && "md:justify-center")}>
                  <h3 className="font-display text-4xl leading-[0.9] uppercase sm:text-5xl">{offer.title}</h3>
                  {offer.description && <p className="max-w-md text-base leading-relaxed text-cream/75">{offer.description}</p>}
                  {offer.price !== null && (
                    <p className="flex items-baseline gap-3">
                      <span className="font-display text-4xl text-accent">{formatINR(offer.price)}</span>
                      {offer.originalPrice !== null && offer.originalPrice > offer.price && (
                        <s className="text-lg font-bold text-cream/50">
                          <span className="sr-only">was </span>
                          {formatINR(offer.originalPrice)}
                        </s>
                      )}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <CtaLink
                      link={offer.link}
                      className="group/cta inline-flex h-14 items-center gap-2 rounded-full bg-primary px-7 text-base font-extrabold tracking-wide text-white uppercase shadow-[4px_4px_0_0_var(--brand-accent)] transition-transform hover:-translate-y-0.5"
                    >
                      {offer.ctaLabel}
                      <ArrowRight className="size-5 transition-transform group-hover/cta:translate-x-1" aria-hidden />
                    </CtaLink>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
