"use server";

import { and, count, eq, max, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import * as t from "@/db/schema";
import { invalid, safeAction, UserFacingError, zodFieldErrors, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth/session";
import { TAG_LIVE } from "@/lib/content/cache-tags";
import { loadDocument } from "@/lib/content/compile";
import {
  categoryInputSchema,
  documentSchemas,
  featureInputSchema,
  offerInputSchema,
  productInputSchema,
  reviewInputSchema,
  type DocumentKey,
} from "@/lib/content/schemas";
import { uniqueSlug } from "@/lib/slug";

const idSchema = z.uuid();
const idListSchema = z.array(z.uuid()).max(1000);

function parseId(id: unknown) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) throw new UserFacingError("That item couldn't be found. Refresh the page and try again.");
  return parsed.data;
}

type SortableTable = typeof t.categories | typeof t.products | typeof t.offers | typeof t.reviews | typeof t.features;

async function reorder(table: SortableTable, ids: unknown) {
  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) throw new UserFacingError("Couldn't save the new order.");
  await db.transaction(async (tx) => {
    for (const [index, id] of parsed.data.entries()) {
      await tx.update(table).set({ sortOrder: index }).where(eq(table.id, id));
    }
  });
}

async function nextSortOrder(table: SortableTable) {
  const [row] = await db.select({ value: max(table.sortOrder) }).from(table);
  return (row?.value ?? -1) + 1;
}

/* ───────────────────────── Singleton documents ───────────────────────── */

const EDITABLE_DOCUMENTS = Object.keys(documentSchemas).filter((k) => k !== "live") as DocumentKey[];

export async function saveDocument(key: DocumentKey, data: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    if (!EDITABLE_DOCUMENTS.includes(key)) return { ok: false, message: "Unknown section." };
    const parsed = documentSchemas[key].safeParse(data);
    if (!parsed.success) return invalid(parsed.error);
    await db
      .insert(t.contentDocuments)
      .values({ key, data: parsed.data, updatedBy: user.id })
      .onConflictDoUpdate({ target: t.contentDocuments.key, set: { data: parsed.data, updatedBy: user.id, updatedAt: new Date() } });
    return { ok: true, message: "Saved. Publish when you're ready to make it live." };
  });
}

/** Saves part of a document (top-level keys), merged with the latest stored version. */
export async function patchDocument(key: DocumentKey, patch: Record<string, unknown>): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    if (!EDITABLE_DOCUMENTS.includes(key) || typeof patch !== "object" || patch === null) {
      return { ok: false, message: "Unknown section." };
    }
    const current = await loadDocument(db, key);
    const merged = { ...(current as Record<string, unknown>), ...patch };
    return saveDocument(key, merged);
  });
}

/** Saves several documents at once (e.g. the homepage editor = hero + homepage). Errors are prefixed by key. */
export async function saveDocuments(docs: Partial<Record<DocumentKey, unknown>>): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    const entries = Object.entries(docs) as [DocumentKey, unknown][];
    const fieldErrors: Record<string, string> = {};
    const valid: [DocumentKey, unknown][] = [];
    for (const [key, data] of entries) {
      if (!EDITABLE_DOCUMENTS.includes(key)) return { ok: false, message: "Unknown section." };
      const parsed = documentSchemas[key].safeParse(data);
      if (parsed.success) valid.push([key, parsed.data]);
      else for (const [path, message] of Object.entries(zodFieldErrors(parsed.error))) fieldErrors[`${key}.${path}`] = message;
    }
    if (Object.keys(fieldErrors).length) {
      const count = Object.keys(fieldErrors).length;
      return { ok: false, message: count === 1 ? "Please fix the highlighted field." : `Please fix the ${count} highlighted fields.`, fieldErrors };
    }
    await db.transaction(async (tx) => {
      for (const [key, data] of valid) {
        await tx
          .insert(t.contentDocuments)
          .values({ key, data, updatedBy: user.id })
          .onConflictDoUpdate({ target: t.contentDocuments.key, set: { data, updatedBy: user.id, updatedAt: new Date() } });
      }
    });
    return { ok: true, message: "Saved. Publish when you're ready to make it live." };
  });
}

/** Instantly pauses/resumes online ordering (no publishing needed). */
export async function saveLiveSettings(data: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    const parsed = documentSchemas.live.safeParse(data);
    if (!parsed.success) return invalid(parsed.error);
    await db
      .insert(t.contentDocuments)
      .values({ key: "live", data: parsed.data, updatedBy: user.id })
      .onConflictDoUpdate({ target: t.contentDocuments.key, set: { data: parsed.data, updatedBy: user.id, updatedAt: new Date() } });
    updateTag(TAG_LIVE);
    return {
      ok: true,
      message: parsed.data.ordersPaused ? "Online orders are paused (live now)." : "Online orders are open (live now).",
    };
  });
}

/* ───────────────────────── Categories ───────────────────────── */

async function categorySlug(name: string, slug: string, excludeId?: string) {
  const taken = async (candidate: string) => {
    const rows = await db
      .select({ id: t.categories.id })
      .from(t.categories)
      .where(excludeId ? and(eq(t.categories.slug, candidate), ne(t.categories.id, excludeId)) : eq(t.categories.slug, candidate))
      .limit(1);
    return rows.length > 0;
  };
  if (slug) {
    if (await taken(slug)) throw new UserFacingError("Another category already uses that web address.");
    return slug;
  }
  return uniqueSlug(name, taken);
}

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await categorySlug(parsed.data.name, parsed.data.slug);
    const [row] = await db
      .insert(t.categories)
      .values({ ...parsed.data, slug, sortOrder: await nextSortOrder(t.categories) })
      .returning({ id: t.categories.id });
    return { ok: true, message: `Added “${parsed.data.name}”.`, data: { id: row.id } };
  });
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const categoryId = parseId(id);
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const slug = await categorySlug(parsed.data.name, parsed.data.slug, categoryId);
    await db.update(t.categories).set({ ...parsed.data, slug }).where(eq(t.categories.id, categoryId));
    return { ok: true, message: "Category saved." };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const categoryId = parseId(id);
    const [{ n }] = await db.select({ n: count() }).from(t.products).where(eq(t.products.categoryId, categoryId));
    if (n > 0) {
      return {
        ok: false,
        message: `This category still has ${n} menu item${n === 1 ? "" : "s"}. Move or delete them first.`,
      };
    }
    await db.delete(t.categories).where(eq(t.categories.id, categoryId));
    return { ok: true, message: "Category deleted." };
  });
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.categories).set({ isActive: Boolean(isActive) }).where(eq(t.categories.id, parseId(id)));
    return { ok: true, message: isActive ? "Category shown." : "Category hidden." };
  });
}

export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await reorder(t.categories, ids);
    return { ok: true, message: "Order saved." };
  });
}

/* ───────────────────────── Products ───────────────────────── */

async function productSlug(name: string, slug: string, excludeId?: string) {
  const taken = async (candidate: string) => {
    const rows = await db
      .select({ id: t.products.id })
      .from(t.products)
      .where(excludeId ? and(eq(t.products.slug, candidate), ne(t.products.id, excludeId)) : eq(t.products.slug, candidate))
      .limit(1);
    return rows.length > 0;
  };
  if (slug) {
    if (await taken(slug)) throw new UserFacingError("Another menu item already uses that web address.");
    return slug;
  }
  return uniqueSlug(name, taken);
}

async function assertCategory(categoryId: string) {
  const rows = await db.select({ id: t.categories.id }).from(t.categories).where(eq(t.categories.id, categoryId)).limit(1);
  if (!rows[0]) throw new UserFacingError("Choose a category that exists.");
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    await assertCategory(data.categoryId);
    const slug = await productSlug(data.name, data.slug);
    const [row] = await db
      .insert(t.products)
      .values({ ...data, slug, sortOrder: await nextSortOrder(t.products), bestsellerSort: 999 })
      .returning({ id: t.products.id });
    updateTag(TAG_LIVE);
    return { ok: true, message: `Added “${data.name}”. Publish to show it on the website.`, data: { id: row.id } };
  });
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const productId = parseId(id);
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    await assertCategory(data.categoryId);
    const slug = await productSlug(data.name, data.slug, productId);
    await db.update(t.products).set({ ...data, slug, isSample: false }).where(eq(t.products.id, productId));
    updateTag(TAG_LIVE);
    return { ok: true, message: "Saved. Publish to update the website (availability changes are already live)." };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.delete(t.products).where(eq(t.products.id, parseId(id)));
    updateTag(TAG_LIVE);
    return { ok: true, message: "Menu item deleted. Publish to remove it from the website." };
  });
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const rows = await db.select().from(t.products).where(eq(t.products.id, parseId(id))).limit(1);
    const source = rows[0];
    if (!source) return { ok: false, message: "That item no longer exists." };
    const name = `${source.name} (copy)`;
    const slug = await productSlug(name, "");
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = source;
    const [row] = await db
      .insert(t.products)
      .values({ ...rest, name, slug, isVisible: false, sortOrder: source.sortOrder + 1 })
      .returning({ id: t.products.id });
    return { ok: true, message: "Duplicated (hidden until you're ready).", data: { id: row.id } };
  });
}

/** Instant: marks a product in stock / out of stock on the live website immediately. */
export async function setProductAvailability(id: string, isAvailable: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.products).set({ isAvailable: Boolean(isAvailable) }).where(eq(t.products.id, parseId(id)));
    updateTag(TAG_LIVE);
    return { ok: true, message: isAvailable ? "Back in stock (live now)." : "Marked out of stock (live now)." };
  });
}

export async function setProductVisibility(id: string, isVisible: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.products).set({ isVisible: Boolean(isVisible) }).where(eq(t.products.id, parseId(id)));
    return { ok: true, message: isVisible ? "Item will be shown after you publish." : "Item will be hidden after you publish." };
  });
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await reorder(t.products, ids);
    return { ok: true, message: "Order saved." };
  });
}

/* ───────────────────────── Best sellers ───────────────────────── */

export async function saveBestsellers(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = idListSchema.max(24, "Pick up to 24 best sellers").safeParse(ids);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid selection." };
    await db.transaction(async (tx) => {
      await tx.update(t.products).set({ isBestseller: false, bestsellerSort: 999 });
      for (const [index, id] of parsed.data.entries()) {
        await tx.update(t.products).set({ isBestseller: true, bestsellerSort: index }).where(eq(t.products.id, id));
      }
    });
    return { ok: true, message: "Best sellers saved. Publish to update the homepage." };
  });
}

/* ───────────────────────── Offers ───────────────────────── */

function offerValues(data: z.output<typeof offerInputSchema>) {
  return {
    ...data,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  };
}

export async function createOffer(input: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const parsed = offerInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const [row] = await db
      .insert(t.offers)
      .values({ ...offerValues(parsed.data), sortOrder: await nextSortOrder(t.offers) })
      .returning({ id: t.offers.id });
    return { ok: true, message: "Offer added. Publish to show it on the website.", data: { id: row.id } };
  });
}

export async function updateOffer(id: string, input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = offerInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await db.update(t.offers).set({ ...offerValues(parsed.data), isSample: false }).where(eq(t.offers.id, parseId(id)));
    return { ok: true, message: "Offer saved. Publish to update the website." };
  });
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.delete(t.offers).where(eq(t.offers.id, parseId(id)));
    return { ok: true, message: "Offer deleted." };
  });
}

export async function setOfferActive(id: string, isActive: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.offers).set({ isActive: Boolean(isActive) }).where(eq(t.offers.id, parseId(id)));
    return { ok: true, message: isActive ? "Offer switched on. Publish to show it." : "Offer switched off. Publish to hide it." };
  });
}

export async function reorderOffers(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await reorder(t.offers, ids);
    return { ok: true, message: "Order saved." };
  });
}

/* ───────────────────────── Reviews ───────────────────────── */

export async function createReview(input: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const parsed = reviewInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const [row] = await db
      .insert(t.reviews)
      .values({ ...parsed.data, sortOrder: await nextSortOrder(t.reviews) })
      .returning({ id: t.reviews.id });
    return { ok: true, message: "Review added.", data: { id: row.id } };
  });
}

export async function updateReview(id: string, input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = reviewInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await db.update(t.reviews).set({ ...parsed.data, isSample: false }).where(eq(t.reviews.id, parseId(id)));
    return { ok: true, message: "Review saved." };
  });
}

export async function deleteReview(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.delete(t.reviews).where(eq(t.reviews.id, parseId(id)));
    return { ok: true, message: "Review deleted." };
  });
}

export async function setReviewEnabled(id: string, isEnabled: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.reviews).set({ isEnabled: Boolean(isEnabled) }).where(eq(t.reviews.id, parseId(id)));
    return { ok: true, message: isEnabled ? "Review shown." : "Review hidden." };
  });
}

export async function reorderReviews(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await reorder(t.reviews, ids);
    return { ok: true, message: "Order saved." };
  });
}

/* ───────────────────────── Why Hungru features ───────────────────────── */

export async function createFeature(input: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction<{ id: string }>(async () => {
    await requireAdmin();
    const parsed = featureInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const [row] = await db
      .insert(t.features)
      .values({ ...parsed.data, sortOrder: await nextSortOrder(t.features) })
      .returning({ id: t.features.id });
    return { ok: true, message: "Point added.", data: { id: row.id } };
  });
}

export async function updateFeature(id: string, input: unknown): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const parsed = featureInputSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await db.update(t.features).set({ ...parsed.data, isSample: false }).where(eq(t.features.id, parseId(id)));
    return { ok: true, message: "Saved." };
  });
}

export async function deleteFeature(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.delete(t.features).where(eq(t.features.id, parseId(id)));
    return { ok: true, message: "Deleted." };
  });
}

export async function setFeatureActive(id: string, isActive: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.update(t.features).set({ isActive: Boolean(isActive) }).where(eq(t.features.id, parseId(id)));
    return { ok: true, message: isActive ? "Shown." : "Hidden." };
  });
}

export async function reorderFeatures(ids: string[]): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await reorder(t.features, ids);
    return { ok: true, message: "Order saved." };
  });
}

/* ───────────────────────── Sample content cleanup ───────────────────────── */

export async function removeSampleContent(): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    await db.transaction(async (tx) => {
      await tx.delete(t.reviews).where(eq(t.reviews.isSample, true));
      await tx.delete(t.features).where(eq(t.features.isSample, true));
      await tx.delete(t.offers).where(eq(t.offers.isSample, true));
      await tx.delete(t.products).where(eq(t.products.isSample, true));
    });
    updateTag(TAG_LIVE);
    return { ok: true, message: "Sample content removed. Publish to update the website." };
  });
}
