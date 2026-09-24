import type { Metadata } from "next";
import { AnalyticsScripts } from "@/components/site/analytics-scripts";
import { DemoBar } from "@/components/site/demo-bar";
import { FlyToCart } from "@/components/site/fly-to-cart";
import { PreviewBar } from "@/components/site/preview-bar";
import { ProductSheet } from "@/components/site/product-sheet";
import { RevealManager } from "@/components/site/reveal-manager";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader, type NavLink } from "@/components/site/site-header";
import { SiteProvider } from "@/components/site/site-provider";
import { StickyOrderBar } from "@/components/site/sticky-order-bar";
import { hasContactInfo } from "@/components/site/sections/contact";
import { mediaIconUrl } from "@/lib/content/media-url";
import { getSiteData } from "@/lib/content/get-site-content";
import { siteUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const { content, mode } = await getSiteData();
  const { seo, brand } = content;
  const iconSource = brand.favicon ?? brand.logo;
  const ogTitle = seo.ogTitle || seo.title;
  const ogDescription = seo.ogDescription || seo.description;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo.title, template: `%s · ${brand.name}${brand.location ? ` ${brand.location}` : ""}` },
    description: seo.description,
    applicationName: brand.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: ogTitle,
      description: ogDescription,
      locale: "en_IN",
      url: "/",
      images: seo.ogImage
        ? [
            {
              url: seo.ogImage.src,
              width: seo.ogImage.width ?? undefined,
              height: seo.ogImage.height ?? undefined,
              alt: seo.ogImage.alt || brand.name,
            },
          ]
        : [{ url: "/og", width: 1200, height: 630, alt: brand.name }],
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription },
    icons: iconSource
      ? {
          icon: [
            { url: mediaIconUrl(iconSource.id, 32), sizes: "32x32", type: "image/png" },
            { url: mediaIconUrl(iconSource.id, 192), sizes: "192x192", type: "image/png" },
          ],
          apple: [{ url: mediaIconUrl(iconSource.id, 180), sizes: "180x180" }],
        }
      : { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
    robots: mode === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { content, live, mode } = await getSiteData();
  const { brand } = content;
  const style = {
    "--brand-primary": brand.colors.primary,
    "--brand-secondary": brand.colors.secondary,
    "--brand-accent": brand.colors.accent,
  } as React.CSSProperties;

  const nav: NavLink[] = [{ href: "/menu", label: "Menu" }];
  if (content.offers.length) nav.push({ href: "/#offers", label: "Offers" });
  nav.push({ href: "/#story", label: "Our story" });
  if (hasContactInfo(content.contact)) nav.push({ href: "/#contact", label: "Find us" });

  return (
    <div style={style} className="flex min-h-dvh flex-col bg-cream">
      <SiteProvider
        data={{
          mode,
          brand: { name: brand.name, location: brand.location },
          products: content.products,
          categories: content.categories,
          bestsellerIds: content.bestsellerIds,
          ordering: content.ordering,
          live,
          contact: { phone: content.contact.phone, whatsapp: content.contact.whatsapp },
        }}
      >
        {mode === "preview" && <PreviewBar />}
        {mode === "demo" && <DemoBar />}
        <SiteHeader logo={brand.logo} nav={nav} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter content={content} showArtNote={content.hero.media.type === "illustration" || content.products.some((p) => !p.image)} />
        <StickyOrderBar />
        <ProductSheet />
        <FlyToCart />
        <RevealManager />
      </SiteProvider>
      {mode === "published" && <AnalyticsScripts analytics={content.analytics} />}
    </div>
  );
}
