import type {
  Analytics,
  Brand,
  Contact,
  FeatureIconKey,
  Footer,
  Hero,
  Homepage,
  LinkTarget,
  Live,
  Ordering,
  ProductOptionGroup,
  Seo,
  Social,
  Story,
} from "./schemas";

/** A resolved, render-ready reference to an uploaded file. */
export type MediaRef = {
  id: string;
  src: string;
  kind: "image" | "video";
  mime: string;
  width: number | null;
  height: number | null;
  alt: string;
  blurDataUrl: string | null;
};

export type SiteCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type SiteProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  image: MediaRef | null;
  diet: "veg" | "non_veg";
  badge: string;
  isBestseller: boolean;
  options: ProductOptionGroup[];
  isSample: boolean;
  /** Live value merged in at request time (never part of the published hash). */
  isAvailable: boolean;
};

export type SiteOffer = {
  id: string;
  title: string;
  description: string;
  image: MediaRef | null;
  badge: string;
  price: number | null;
  originalPrice: number | null;
  ctaLabel: string;
  ctaTarget: LinkTarget;
  startsAt: string | null;
  endsAt: string | null;
  isSample: boolean;
};

export type SiteReview = {
  id: string;
  authorName: string;
  content: string;
  rating: number | null;
  source: string;
  image: MediaRef | null;
  isSample: boolean;
};

export type SiteFeature = {
  id: string;
  title: string;
  description: string;
  icon: FeatureIconKey;
  image: MediaRef | null;
  isSample: boolean;
};

/** Everything the public website renders. Compiled from the CMS; published as one snapshot. */
export type SiteContent = {
  brand: Brand & { logo: MediaRef | null; favicon: MediaRef | null };
  social: Social;
  hero: Hero & { image: MediaRef | null; video: MediaRef | null };
  homepage: Homepage;
  story: Story & { images: MediaRef[] };
  contact: Contact;
  ordering: Ordering;
  seo: Seo & { ogImage: MediaRef | null };
  footer: Footer;
  analytics: Analytics;
  categories: SiteCategory[];
  products: SiteProduct[];
  bestsellerIds: string[];
  offers: SiteOffer[];
  reviews: SiteReview[];
  features: SiteFeature[];
};

export type LiveState = {
  live: Live;
  unavailableProductIds: string[];
};

export type SiteData = {
  content: SiteContent;
  live: Live;
  /**
   * "published" for the public site, "preview" when an admin is previewing unpublished changes,
   * "demo" for the no-database design preview (sample content, orders aren't saved).
   */
  mode: "published" | "preview" | "demo";
  publishedAt: string | null;
};
