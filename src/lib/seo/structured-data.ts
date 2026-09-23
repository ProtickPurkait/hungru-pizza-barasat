import { DAYS, DAY_LABELS } from "@/lib/content/constants";
import type { SiteContent } from "@/lib/content/types";
import { hoursConfigured } from "@/lib/hours";

/**
 * Restaurant (LocalBusiness) structured data built ONLY from information the owner entered.
 * Missing fields are omitted, never guessed. No ratings are included.
 */
export function restaurantJsonLd(content: SiteContent, siteUrl: string) {
  const { brand, contact, social, seo } = content;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: brand.location && !brand.name.includes(brand.location) ? `${brand.name} ${brand.location}` : brand.name,
    url: siteUrl,
    servesCuisine: "Pizza",
    hasMenu: `${siteUrl}/menu`,
  };
  const image = seo.ogImage?.src ?? brand.logo?.src;
  if (image) data.image = new URL(image, siteUrl).toString();
  if (brand.logo) data.logo = new URL(brand.logo.src, siteUrl).toString();
  if (contact.phone) data.telephone = contact.phone;
  if (contact.email) data.email = contact.email;
  if (contact.address) {
    data.address = { "@type": "PostalAddress", streetAddress: contact.address.replace(/\s*\n\s*/g, ", "), addressCountry: "IN" };
  }
  if (contact.mapsUrl) data.hasMap = contact.mapsUrl;
  if (social.links.length) data.sameAs = social.links.map((l) => l.url);
  if (hoursConfigured(contact.hours)) {
    data.openingHoursSpecification = DAYS.flatMap((day) => {
      const d = contact.hours.days[day];
      if (d.closed || d.ranges.length === 0) return [];
      return d.ranges.map((r) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_LABELS[day]}`,
        opens: r.open,
        closes: r.close,
      }));
    });
  }
  return data;
}

/** Safe for dangerouslySetInnerHTML: escapes "<" so content can't break out of the script tag. */
export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
