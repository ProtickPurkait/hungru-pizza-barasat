import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SiteCategory, SiteProduct } from "@/lib/content/types";
import { FeatureProductCard } from "../product-card";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";

export function BestSellersSection({
  heading,
  products,
  categories,
}: {
  heading: { eyebrow: string; heading: string; subtext: string };
  products: SiteProduct[];
  categories: SiteCategory[];
}) {
  if (products.length === 0) return null;
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;
  return (
    <section id="bestsellers" aria-labelledby="bestsellers-heading" className="relative overflow-hidden bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="bestsellers-heading"
          {...heading}
          action={
            <Link href="/menu" className="group inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-extrabold tracking-wide text-cream uppercase">
              Full menu <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          }
        />
      </div>
      <div className="mx-auto mt-10 max-w-7xl lg:px-8">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-8 no-scrollbar sm:gap-6 sm:px-6 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {products.map((product, i) => (
            <Reveal as="li" key={product.id} index={i % 4} className="w-[78%] max-w-[20rem] shrink-0 snap-start xs:w-[70%] sm:w-[45%] lg:w-auto lg:max-w-none">
              <FeatureProductCard product={product} index={i} categoryName={categoryName(product.categoryId)} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
