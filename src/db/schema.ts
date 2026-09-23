import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ProductOptionGroup } from "@/lib/content/schemas";
import type { OrderItem } from "@/lib/ordering/types";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ───────────────────────── Admin & auth ───────────────────────── */

export const adminRole = pgEnum("admin_role", ["owner", "editor"]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRole("role").notNull().default("editor"),
  disabled: boolean("disabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const adminSessions = pgTable(
  "admin_sessions",
  {
    /** SHA-256 hash of the session token. The raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    ip: text("ip").notNull(),
    success: boolean("success").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email, t.attemptedAt),
    index("login_attempts_ip_idx").on(t.ip, t.attemptedAt),
  ],
);

/* ───────────────────────── Media ───────────────────────── */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  kind: text("kind", { enum: ["image", "video"] }).notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt").notNull().default(""),
  blurDataUrl: text("blur_data_url"),
  storage: text("storage", { enum: ["db", "fs"] }).notNull(),
  /** Binary payload when storage = 'db'. */
  data: bytea("data"),
  /** Relative path inside MEDIA_DIR when storage = 'fs'. */
  path: text("path"),
  uploadedBy: uuid("uploaded_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
});

/* ───────────────────────── Singleton content documents ───────────────────────── */

export const contentDocuments = pgTable("content_documents", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
  ...timestamps,
});

/* ───────────────────────── Menu ───────────────────────── */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const diet = pgEnum("diet", ["veg", "non_veg"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    /** Price in paise (₹1 = 100). */
    price: integer("price").notNull(),
    /** Optional discounted price in paise; must be lower than price. */
    discountPrice: integer("discount_price"),
    imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
    diet: diet("diet").notNull().default("veg"),
    badge: text("badge").notNull().default(""),
    isBestseller: boolean("is_bestseller").notNull().default(false),
    bestsellerSort: integer("bestseller_sort").notNull().default(0),
    /** Instant (not part of publishing): out-of-stock toggle. */
    isAvailable: boolean("is_available").notNull().default(true),
    /** Hidden products are not shown on the website at all. */
    isVisible: boolean("is_visible").notNull().default(true),
    options: jsonb("options").$type<ProductOptionGroup[]>().notNull().default(sql`'[]'::jsonb`),
    isSample: boolean("is_sample").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId, t.sortOrder)],
);

/* ───────────────────────── Marketing collections ───────────────────────── */

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
  badge: text("badge").notNull().default(""),
  price: integer("price"),
  originalPrice: integer("original_price"),
  ctaLabel: text("cta_label").notNull().default("Order now"),
  ctaTarget: jsonb("cta_target").$type<{ type: string; value?: string }>().notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  source: text("source").notNull().default(""),
  imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
  isEnabled: boolean("is_enabled").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("flame"),
  imageId: uuid("image_id").references(() => media.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/* ───────────────────────── Publishing ───────────────────────── */

export const publishedSnapshots = pgTable("published_snapshots", {
  id: serial("id").primaryKey(),
  data: jsonb("data").notNull(),
  hash: text("hash").notNull(),
  note: text("note").notNull().default(""),
  publishedBy: uuid("published_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────── Orders ───────────────────────── */

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 1001 });

export const orderStatus = pgEnum("order_status", [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number")
      .notNull()
      .default(sql`nextval('order_number_seq')`),
    reference: text("reference").notNull(),
    /** Unguessable token used for the customer's confirmation page. */
    publicToken: text("public_token").notNull(),
    channel: text("channel", { enum: ["native", "whatsapp"] }).notNull(),
    fulfillment: text("fulfillment", { enum: ["delivery", "pickup"] }).notNull(),
    status: orderStatus("status").notNull().default("new"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    items: jsonb("items").$type<OrderItem[]>().notNull(),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    total: integer("total").notNull(),
    ip: text("ip"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    uniqueIndex("orders_token_idx").on(t.publicToken),
    index("orders_created_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
  ],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type MediaRow = typeof media.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type OfferRow = typeof offers.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type FeatureRow = typeof features.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
