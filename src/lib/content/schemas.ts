import { z } from "zod";

/* ───────────────────────── Primitive validators ───────────────────────── */

export const MAX_PRICE_PAISE = 1_000_000_00; // ₹10,00,000 — generous upper bound

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

export const mediaIdSchema = z.uuid({ message: "Choose an image from the media library" });

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #E5311B");

/** Accepts https://… URLs or site-relative paths starting with "/". Empty allowed. */
export const urlOrEmptySchema = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^\/(?!\/)/.test(v) || isHttpUrl(v), {
    message: "Enter a full link starting with https:// (or a page path like /menu)",
  });

export const httpUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(isHttpUrl, { message: "Enter a full link starting with https://" });

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Phone numbers: digits, spaces, dashes, optional leading +. 8–15 digits. Empty allowed. */
export const phoneOrEmptySchema = z
  .string()
  .trim()
  .max(24)
  .refine((v) => v === "" || isValidPhone(v), {
    message: "Enter a valid phone number, e.g. +91 98765 43210",
  });

export function isValidPhone(value: string) {
  if (!/^\+?[\d\s()-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export const emailOrEmptySchema = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || z.email().safeParse(v).success, { message: "Enter a valid email address" });

/** Parses rupee input ("299", "299.5", "₹1,299") into integer paise. */
export function rupeesToPaise(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.round(input * 100) : null;
  }
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

export const requiredRupeesSchema = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const paise = rupeesToPaise(v);
    if (paise === null) {
      ctx.addIssue({ code: "custom", message: "Enter a price" });
      return z.NEVER;
    }
    if (Number.isNaN(paise) || paise < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 299 or 299.50" });
      return z.NEVER;
    }
    if (paise > MAX_PRICE_PAISE) {
      ctx.addIssue({ code: "custom", message: "That price looks too high" });
      return z.NEVER;
    }
    return paise;
  });

export const optionalRupeesSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((v, ctx) => {
    if (v === null) return null;
    const paise = rupeesToPaise(v);
    if (paise === null) return null;
    if (Number.isNaN(paise) || paise < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a price like 299 or 299.50" });
      return z.NEVER;
    }
    if (paise > MAX_PRICE_PAISE) {
      ctx.addIssue({ code: "custom", message: "That price looks too high" });
      return z.NEVER;
    }
    return paise;
  });

/* ───────────────────────── Link targets (CTA destinations) ───────────────────────── */

export const LINK_TARGET_TYPES = [
  "menu",
  "category",
  "product",
  "cart",
  "section",
  "url",
  "whatsapp",
  "phone",
] as const;

export const HOMEPAGE_ANCHORS = [
  "top",
  "bestsellers",
  "menu",
  "offers",
  "why",
  "story",
  "reviews",
  "contact",
] as const;

export const linkTargetSchema = z
  .object({
    type: z.enum(LINK_TARGET_TYPES),
    value: z.string().trim().max(1000).default(""),
  })
  .superRefine((target, ctx) => {
    if (target.type === "url" && !(isHttpUrl(target.value) || /^\/(?!\/)/.test(target.value))) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a full link starting with https:// (or a page path like /menu)",
      });
    }
    if ((target.type === "category" || target.type === "product") && !target.value) {
      ctx.addIssue({ code: "custom", path: ["value"], message: `Choose a ${target.type}` });
    }
  });
export type LinkTarget = z.infer<typeof linkTargetSchema>;

export const ctaSchema = z.object({
  label: trimmed(40).min(1, "Button text is required"),
  target: linkTargetSchema,
});
export type Cta = z.infer<typeof ctaSchema>;

const sectionHeadingSchema = (defaults: { eyebrow: string; heading: string; subtext: string }) =>
  z
    .object({
      eyebrow: trimmed(40).default(defaults.eyebrow),
      heading: trimmed(90).default(defaults.heading),
      subtext: trimmed(280).default(defaults.subtext),
    })
    .prefault({});

/* ───────────────────────── Singleton documents ───────────────────────── */

export const brandSchema = z.object({
  name: trimmed(60).min(1, "Brand name is required").default("Hungru Pizza"),
  location: trimmed(60).default("Barasat"),
  tagline: trimmed(120).default(""),
  logoId: mediaIdSchema.nullable().default(null),
  faviconId: mediaIdSchema.nullable().default(null),
  colors: z
    .object({
      primary: hexColorSchema.default("#E5311B"),
      secondary: hexColorSchema.default("#FF7A1A"),
      accent: hexColorSchema.default("#FFC229"),
    })
    .prefault({}),
});

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "youtube",
  "x",
  "google",
  "zomato",
  "swiggy",
  "whatsapp",
  "website",
  "other",
] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  label: trimmed(40).default(""),
  url: httpUrlSchema,
});
export const socialSchema = z.object({
  links: z.array(socialLinkSchema).max(12).default([]),
});

export const HERO_MEDIA_TYPES = ["illustration", "image", "video"] as const;

export const heroSchema = z.object({
  badge: trimmed(60).default("Hot • Cheesy • Loaded"),
  headline: trimmed(90).min(1, "Headline is required").default("Pizza that *hits* different."),
  subtext: trimmed(280).default(
    "Big flavour, bigger cheese pull. Pick your pizza, make it yours and order in a few taps.",
  ),
  media: z
    .object({
      type: z.enum(HERO_MEDIA_TYPES).default("illustration"),
      imageId: mediaIdSchema.nullable().default(null),
      videoId: mediaIdSchema.nullable().default(null),
    })
    .prefault({}),
  primaryCta: ctaSchema.prefault({ label: "Order now", target: { type: "menu", value: "" } }),
  secondaryCta: ctaSchema.prefault({ label: "View menu", target: { type: "section", value: "menu" } }),
});

export const HOMEPAGE_SECTION_KEYS = [
  "marquee",
  "bestsellers",
  "menu",
  "offers",
  "why",
  "story",
  "reviews",
  "contact",
  "finalCta",
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  marquee: "Scrolling marquee",
  bestsellers: "Best sellers",
  menu: "Menu preview",
  offers: "Offers",
  why: "Why Hungru",
  story: "Brand story",
  reviews: "Reviews",
  contact: "Location & contact",
  finalCta: "Final call to action",
};

const DEFAULT_SECTIONS = HOMEPAGE_SECTION_KEYS.map((key) => ({ key, enabled: true }));

export const homepageSchema = z.object({
  sections: z
    .array(z.object({ key: z.enum(HOMEPAGE_SECTION_KEYS), enabled: z.boolean() }))
    .default(DEFAULT_SECTIONS)
    .transform(normalizeSections),
  marquee: z
    .object({
      items: z
        .array(trimmed(40).min(1))
        .max(12)
        .default(["Hot", "Cheesy", "Loaded", "Hungru", "Barasat"]),
    })
    .prefault({}),
  bestsellers: sectionHeadingSchema({
    eyebrow: "Crowd favourites",
    heading: "The ones everyone orders",
    subtext: "",
  }),
  menu: sectionHeadingSchema({
    eyebrow: "The menu",
    heading: "Pick your craving",
    subtext: "",
  }),
  offers: sectionHeadingSchema({ eyebrow: "Deals", heading: "Offers worth the hype", subtext: "" }),
  why: sectionHeadingSchema({ eyebrow: "Why Hungru", heading: "Why you'll come back hungry", subtext: "" }),
  reviews: sectionHeadingSchema({ eyebrow: "Word on the street", heading: "What people are saying", subtext: "" }),
  contact: sectionHeadingSchema({ eyebrow: "Find us", heading: "Come hungry", subtext: "" }),
  finalCta: z
    .object({
      heading: trimmed(90).default("Your pizza is waiting."),
      subtext: trimmed(200).default("Hot, cheesy and a few taps away."),
      cta: ctaSchema.prefault({ label: "Order now", target: { type: "menu", value: "" } }),
    })
    .prefault({}),
});

function normalizeSections(sections: { key: HomepageSectionKey; enabled: boolean }[]) {
  const seen = new Set<HomepageSectionKey>();
  const result: { key: HomepageSectionKey; enabled: boolean }[] = [];
  for (const section of sections) {
    if (seen.has(section.key)) continue;
    seen.add(section.key);
    result.push(section);
  }
  for (const key of HOMEPAGE_SECTION_KEYS) {
    if (!seen.has(key)) result.push({ key, enabled: true });
  }
  return result;
}

export const STORY_PLACEHOLDER_BODY =
  "This is where your story goes: who started Hungru, why Barasat, and what goes into every pizza. Replace this text in Admin → Brand Story.";

export const storySchema = z.object({
  eyebrow: trimmed(40).default("The Hungru story"),
  heading: trimmed(90).default("Made for the hungry."),
  body: trimmed(3000).default(STORY_PLACEHOLDER_BODY),
  imageIds: z.array(mediaIdSchema).max(4).default([]),
  highlights: z
    .array(z.object({ title: trimmed(40).min(1, "Add a short title"), text: trimmed(160).default("") }))
    .max(4)
    .default([]),
});

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABELS: Record<Day, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time like 11:00");

export const timeRangeSchema = z
  .object({ open: timeSchema, close: timeSchema })
  .refine((r) => r.open !== r.close, { message: "Opening and closing time can't be the same" });

export const dayHoursSchema = z.object({
  closed: z.boolean().default(false),
  ranges: z.array(timeRangeSchema).max(3).default([]),
});

export const hoursSchema = z.object({
  timezone: z.string().default("Asia/Kolkata"),
  days: z
    .object(Object.fromEntries(DAYS.map((d) => [d, dayHoursSchema.prefault({})])) as Record<
      Day,
      z.ZodPrefault<typeof dayHoursSchema>
    >)
    .prefault({}),
  note: trimmed(160).default(""),
});
export type OpeningHours = z.infer<typeof hoursSchema>;

export const contactSchema = z.object({
  address: trimmed(300).default(""),
  phone: phoneOrEmptySchema.default(""),
  whatsapp: phoneOrEmptySchema.default(""),
  email: emailOrEmptySchema.default(""),
  mapsUrl: urlOrEmptySchema.default(""),
  mapEmbedUrl: z
    .string()
    .trim()
    .max(2000)
    .default("")
    .transform(extractMapEmbedSrc)
    .refine((v) => v === "" || isGoogleMapsEmbed(v), {
      message: "Paste the Google Maps “Embed a map” code or its https://www.google.com/maps/embed link",
    }),
  hours: hoursSchema.prefault({}),
});

/** Owners often paste the whole <iframe> snippet. Pull out the src. */
export function extractMapEmbedSrc(value: string) {
  const match = value.match(/src=["']([^"']+)["']/i);
  return (match ? match[1] : value).trim();
}

export function isGoogleMapsEmbed(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /(^|\.)google\.[a-z.]+$/.test(url.hostname) &&
      url.pathname.startsWith("/maps/embed")
    );
  } catch {
    return false;
  }
}

export const ORDERING_MODES = ["native", "whatsapp", "external", "phone"] as const;
export type OrderingMode = (typeof ORDERING_MODES)[number];

export const orderingSchema = z
  .object({
    mode: z.enum(ORDERING_MODES).default("native"),
    whatsappNumber: phoneOrEmptySchema.default(""),
    externalUrl: urlOrEmptySchema.default(""),
    externalPlatformName: trimmed(40).default(""),
    phoneNumber: phoneOrEmptySchema.default(""),
    delivery: z.boolean().default(true),
    pickup: z.boolean().default(true),
    deliveryFee: z.number().int().min(0).max(MAX_PRICE_PAISE).nullable().default(null),
    minOrder: z.number().int().min(0).max(MAX_PRICE_PAISE).nullable().default(null),
    deliveryNote: trimmed(200).default(""),
    paymentNote: trimmed(200).default("Payment is collected when you receive your order."),
    confirmationNote: trimmed(300).default(""),
    orderPrefix: z
      .string()
      .trim()
      .regex(/^[A-Z0-9]{1,6}$/, "Use 1–6 capital letters or digits")
      .default("HP"),
  })
  .superRefine((o, ctx) => {
    if (o.mode === "native" || o.mode === "whatsapp") {
      if (!o.delivery && !o.pickup) {
        ctx.addIssue({ code: "custom", path: ["pickup"], message: "Turn on delivery, pickup or both" });
      }
    }
    if (o.mode === "external" && !isHttpUrl(o.externalUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["externalUrl"],
        message: "Add the link where customers should place their order",
      });
    }
  });

export const liveSchema = z.object({
  ordersPaused: z.boolean().default(false),
  pausedMessage: trimmed(160).default("We're not taking online orders right now. Please check back soon."),
});

export const seoSchema = z.object({
  title: trimmed(70).default("Hungru Pizza Barasat | Order Pizza Online"),
  description: trimmed(170).default(
    "Order hot, cheesy pizza from Hungru Pizza in Barasat. Browse the menu, customise your pizza and order in a few taps.",
  ),
  ogTitle: trimmed(90).default(""),
  ogDescription: trimmed(200).default(""),
  ogImageId: mediaIdSchema.nullable().default(null),
  structuredData: z.boolean().default(true),
});

export const footerSchema = z.object({
  text: trimmed(200).default("Hot, cheesy and made for the hungry."),
  links: z
    .array(z.object({ label: trimmed(30).min(1, "Add link text"), target: linkTargetSchema }))
    .max(10)
    .default([
      { label: "Menu", target: { type: "menu", value: "" } },
      { label: "Offers", target: { type: "section", value: "offers" } },
      { label: "Find us", target: { type: "section", value: "contact" } },
    ]),
  showSocial: z.boolean().default(true),
});

export const analyticsSchema = z.object({
  ga4Id: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || /^G-[A-Z0-9]{4,}$/.test(v), { message: "GA4 IDs look like G-XXXXXXX" }),
  plausibleDomain: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v), {
      message: "Enter your domain, e.g. hungrupizza.in",
    }),
});

export const documentSchemas = {
  brand: brandSchema,
  social: socialSchema,
  hero: heroSchema,
  homepage: homepageSchema,
  story: storySchema,
  contact: contactSchema,
  ordering: orderingSchema,
  seo: seoSchema,
  footer: footerSchema,
  analytics: analyticsSchema,
  live: liveSchema,
} as const;

export type DocumentKey = keyof typeof documentSchemas;
export type DocumentData<K extends DocumentKey> = z.output<(typeof documentSchemas)[K]>;
/** Documents compiled into the published snapshot ("live" is instant and excluded). */
export const PUBLISHED_DOCUMENT_KEYS = [
  "brand",
  "social",
  "hero",
  "homepage",
  "story",
  "contact",
  "ordering",
  "seo",
  "footer",
  "analytics",
] as const satisfies readonly DocumentKey[];

export type Brand = z.output<typeof brandSchema>;
export type Social = z.output<typeof socialSchema>;
export type Hero = z.output<typeof heroSchema>;
export type Homepage = z.output<typeof homepageSchema>;
export type Story = z.output<typeof storySchema>;
export type Contact = z.output<typeof contactSchema>;
export type Ordering = z.output<typeof orderingSchema>;
export type Live = z.output<typeof liveSchema>;
export type Seo = z.output<typeof seoSchema>;
export type Footer = z.output<typeof footerSchema>;
export type Analytics = z.output<typeof analyticsSchema>;

/* ───────────────────────── Product options ───────────────────────── */

export const productOptionSchema = z.object({
  id: z.string().min(1).max(40),
  name: trimmed(60).min(1, "Name each choice"),
  priceDelta: z
    .number({ error: "Enter an extra price like 50 (or 0)" })
    .int("Use at most 2 decimals")
    .min(0, "Extra price can't be negative")
    .max(MAX_PRICE_PAISE, "That price looks too high")
    .default(0),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

export const productOptionGroupSchema = z
  .object({
    id: z.string().min(1).max(40),
    name: trimmed(60).min(1, "Name this option group, e.g. Size"),
    type: z.enum(["single", "multiple"]).default("single"),
    required: z.boolean().default(false),
    /** For "multiple": maximum selections (0 = no limit). */
    maxSelect: z.number().int().min(0).max(30).default(0),
    options: z.array(productOptionSchema).min(1, "Add at least one choice").max(30),
  })
  .superRefine((group, ctx) => {
    if (group.type === "single" && group.options.filter((o) => o.isDefault).length > 1) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Only one choice can be the default" });
    }
  });
export type ProductOption = z.output<typeof productOptionSchema>;
export type ProductOptionGroup = z.output<typeof productOptionGroupSchema>;

/* ───────────────────────── Collection inputs (admin forms) ───────────────────────── */

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export const categoryInputSchema = z.object({
  name: trimmed(40).min(1, "Category name is required"),
  slug: slugSchema.or(z.literal("")).default(""),
  description: trimmed(200).default(""),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z
  .object({
    name: trimmed(80).min(1, "Product name is required"),
    slug: slugSchema.or(z.literal("")).default(""),
    description: trimmed(400).default(""),
    categoryId: z.uuid({ message: "Choose a category" }),
    price: requiredRupeesSchema,
    discountPrice: optionalRupeesSchema.default(null),
    imageId: mediaIdSchema.nullable().default(null),
    diet: z.enum(["veg", "non_veg"]),
    badge: trimmed(24).default(""),
    isBestseller: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
    isVisible: z.boolean().default(true),
    options: z.array(productOptionGroupSchema).max(10).default([]),
  })
  .superRefine((p, ctx) => {
    if (p.discountPrice !== null && p.discountPrice >= p.price) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPrice"],
        message: "Discount price must be lower than the regular price",
      });
    }
  });
export type ProductInput = z.input<typeof productInputSchema>;

export const offerInputSchema = z
  .object({
    title: trimmed(80).min(1, "Offer title is required"),
    description: trimmed(300).default(""),
    imageId: mediaIdSchema.nullable().default(null),
    badge: trimmed(24).default(""),
    price: optionalRupeesSchema.default(null),
    originalPrice: optionalRupeesSchema.default(null),
    ctaLabel: trimmed(30).min(1, "Button text is required").default("Order now"),
    ctaTarget: linkTargetSchema,
    startsAt: z.string().trim().default(""),
    endsAt: z.string().trim().default(""),
    isActive: z.boolean().default(true),
  })
  .superRefine((o, ctx) => {
    if (o.price !== null && o.originalPrice !== null && o.originalPrice <= o.price) {
      ctx.addIssue({
        code: "custom",
        path: ["originalPrice"],
        message: "Original price should be higher than the offer price",
      });
    }
    const start = o.startsAt ? Date.parse(o.startsAt) : null;
    const end = o.endsAt ? Date.parse(o.endsAt) : null;
    if (o.startsAt && Number.isNaN(start)) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Enter a valid start date" });
    }
    if (o.endsAt && Number.isNaN(end)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Enter a valid end date" });
    }
    if (start !== null && end !== null && !Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after the start date" });
    }
  });

export const reviewInputSchema = z.object({
  authorName: trimmed(60).min(1, "Reviewer name is required"),
  content: trimmed(600).min(1, "Review text is required"),
  rating: z.number().int().min(1).max(5).nullable().default(null),
  source: trimmed(40).default(""),
  imageId: mediaIdSchema.nullable().default(null),
  isEnabled: z.boolean().default(true),
});

export const FEATURE_ICONS = [
  "flame",
  "pizza",
  "leaf",
  "chef-hat",
  "wheat",
  "clock",
  "bike",
  "heart",
  "sparkles",
  "star",
  "smile",
  "zap",
  "thumbs-up",
  "badge-percent",
  "utensils",
  "map-pin",
] as const;
export type FeatureIconKey = (typeof FEATURE_ICONS)[number];

export const featureInputSchema = z.object({
  title: trimmed(50).min(1, "Title is required"),
  description: trimmed(240).default(""),
  icon: z.enum(FEATURE_ICONS).default("flame"),
  imageId: mediaIdSchema.nullable().default(null),
  isActive: z.boolean().default(true),
});
