import Image from "next/image";
import type { SiteFeature } from "@/lib/content/types";
import { FeatureIcon } from "@/components/ui/feature-icon";
import { SampleChip } from "../product-card";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

const ROTATIONS = ["sm:-rotate-2", "sm:rotate-1", "sm:-rotate-1", "sm:rotate-2"];

export function WhyHungruSection({
  heading,
  features,
}: {
  heading: { eyebrow: string; heading: string; subtext: string };
  features: SiteFeature[];
}) {
  if (features.length === 0) return null;
  return (
    <section id="why" aria-labelledby="why-heading" className="grain relative overflow-hidden bg-ink py-16 text-cream sm:py-24">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--brand-secondary)_0%,transparent_65%)] opacity-40" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="why-heading" {...heading} tone="dark" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal as="li" key={feature.id} index={i}>
              <article
                className={`group relative h-full rounded-[1.75rem] bg-cream p-6 text-ink ring-2 ring-ink shadow-[5px_5px_0_0_var(--brand-primary)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1 ${ROTATIONS[i % 4]}`}
              >
                <div className="flex items-start justify-between">
                  {feature.image ? (
                    <div className="relative size-16 overflow-hidden rounded-2xl ring-2 ring-ink">
                      <Image src={feature.image.src} alt={feature.image.alt || ""} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-accent ring-2 ring-ink transition-transform duration-300 group-hover:-rotate-12">
                      <FeatureIcon icon={feature.icon} className="size-8" strokeWidth={2.2} />
                    </span>
                  )}
                  <span className="font-display text-5xl leading-none text-ink/15">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display mt-6 flex flex-wrap items-center gap-2 text-3xl leading-none uppercase">
                  {feature.title}
                  {feature.isSample && <SampleChip />}
                </h3>
                {feature.description && <p className="mt-3 text-base leading-relaxed text-ink/70">{feature.description}</p>}
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
