import { BestSellersSection } from "@/components/site/sections/best-sellers";
import { BrandStorySection } from "@/components/site/sections/brand-story";
import { ContactSection } from "@/components/site/sections/contact";
import { FinalCtaSection } from "@/components/site/sections/final-cta";
import { HeroSection } from "@/components/site/sections/hero";
import { MarqueeSection } from "@/components/site/sections/marquee";
import { MenuPreviewSection } from "@/components/site/sections/menu-preview";
import { OffersSection } from "@/components/site/sections/offers";
import { ReviewsSection } from "@/components/site/sections/reviews";
import { WhyHungruSection } from "@/components/site/sections/why-hungru";
import { TrackView } from "@/components/site/track-view";
import { getSiteData } from "@/lib/content/get-site-content";
import { resolveLink } from "@/lib/content/links";
import type { HomepageSectionKey } from "@/lib/content/schemas";
import { siteUrl } from "@/lib/env";
import { jsonLdScript, restaurantJsonLd } from "@/lib/seo/structured-data";

export default async function HomePage() {
  const { content } = await getSiteData();
  const { hero, homepage, contact, ordering } = content;
  const ctx = { contact, ordering };
  const primary = resolveLink(hero.primaryCta.target, ctx);
  const secondary = resolveLink(hero.secondaryCta.target, ctx);
  const productById = new Map(content.products.map((p) => [p.id, p]));
  const bestsellers = content.bestsellerIds.map((id) => productById.get(id)).filter((p) => p !== undefined);

  const sections: Record<HomepageSectionKey, React.ReactNode> = {
    marquee: <MarqueeSection items={homepage.marquee.items} />,
    bestsellers: <BestSellersSection heading={homepage.bestsellers} products={bestsellers} categories={content.categories} />,
    menu: <MenuPreviewSection heading={homepage.menu} categories={content.categories} products={content.products} />,
    offers: <OffersSection heading={homepage.offers} offers={content.offers.map((o) => ({ ...o, link: resolveLink(o.ctaTarget, ctx) }))} />,
    why: <WhyHungruSection heading={homepage.why} features={content.features} />,
    story: <BrandStorySection story={content.story} brandName={content.brand.name} />,
    reviews: <ReviewsSection heading={homepage.reviews} reviews={content.reviews} />,
    contact: <ContactSection heading={homepage.contact} contact={contact} social={content.social} brandName={content.brand.name} />,
    finalCta: (
      <FinalCtaSection
        heading={homepage.finalCta.heading}
        subtext={homepage.finalCta.subtext}
        label={homepage.finalCta.cta.label}
        link={resolveLink(homepage.finalCta.cta.target, ctx)}
      />
    ),
  };

  return (
    <>
      {content.seo.structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(restaurantJsonLd(content, siteUrl())) }} />
      )}
      <TrackView event="homepage_view" />
      <HeroSection
        hero={hero}
        brandName={content.brand.name}
        primaryHref={primary.href}
        primaryExternal={primary.external}
        secondaryHref={secondary.href}
        secondaryExternal={secondary.external}
        hours={contact.hours}
      />
      {homepage.sections.filter((s) => s.enabled).map((s) => (
        <div key={s.key}>{sections[s.key]}</div>
      ))}
    </>
  );
}
