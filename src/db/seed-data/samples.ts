import type { FeatureIconKey, LinkTarget } from "@/lib/content/schemas";

/**
 * Clearly-worded placeholders shown until the owner adds real content. Used by `npm run db:seed` (flagged
 * `isSample` in the database) and by the no-database design preview. Never real reviews or claims.
 */
const featureText = (topic: string) => `Sample text: tell customers about your ${topic}. Replace this in Admin → Why Hungru.`;

export const sampleFeatures: { title: string; description: string; icon: FeatureIconKey }[] = [
  { title: "Freshness", description: featureText("ingredients and freshness"), icon: "leaf" },
  { title: "Flavour", description: featureText("signature flavours"), icon: "flame" },
  { title: "Value", description: featureText("pricing and portions"), icon: "badge-percent" },
  { title: "Preparation", description: featureText("kitchen and how every pizza is made"), icon: "chef-hat" },
];

const reviewText =
  "Placeholder review: paste a real customer review here (from Google, Zomato, Instagram or in person). Edit in Admin → Reviews.";

export const sampleReviews: { authorName: string; content: string; source: string }[] = [1, 2, 3].map((n) => ({
  authorName: `Sample reviewer ${n}`,
  content: reviewText,
  source: "Placeholder",
}));

export const sampleOffer: { title: string; description: string; badge: string; ctaLabel: string; ctaTarget: LinkTarget } = {
  title: "Your first offer",
  description: "Sample offer: describe a real deal here, then switch it on. Offers stay hidden until you activate them.",
  badge: "Sample",
  ctaLabel: "Order now",
  ctaTarget: { type: "menu", value: "" },
};
