import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { getSession } from "@/lib/auth/session";
import { TAG_LIVE, TAG_PUBLISHED } from "./cache-tags";
import { applyLiveState, compileSiteContent, isOfferLive, loadLiveState } from "./compile";
import { getLatestSnapshot } from "./publish";
import type { SiteContent, SiteData } from "./types";

/** The published snapshot, cached until the next publish (with a time-based safety net for multi-instance hosting). */
const getPublished = unstable_cache(
  async (): Promise<{ content: SiteContent; publishedAt: string | null }> => {
    const snapshot = await getLatestSnapshot(db);
    if (snapshot) return { content: snapshot.content, publishedAt: snapshot.createdAt.toISOString() };
    // Nothing published yet (fresh install): show the working content so the site is never blank.
    return { content: await compileSiteContent(db), publishedAt: null };
  },
  ["site-published-v1"],
  { tags: [TAG_PUBLISHED], revalidate: 300 },
);

/** Availability + "orders paused": changes go live instantly. */
const getLive = unstable_cache(async () => loadLiveState(db), ["site-live-v1"], {
  tags: [TAG_LIVE],
  revalidate: 60,
});

async function isPreviewing() {
  const draft = await draftMode();
  if (!draft.isEnabled) return false;
  // Draft mode alone is not enough — the viewer must also be a signed-in admin.
  return Boolean(await getSession());
}

/** Single entry point for everything the public website renders. */
export const getSiteData = cache(async (): Promise<SiteData> => {
  if (await isPreviewing()) {
    const [content, live] = await Promise.all([compileSiteContent(db), loadLiveState(db)]);
    return finalize(applyLiveState(content, live), live.live, "preview", null);
  }
  const [published, live] = await Promise.all([getPublished(), getLive()]);
  return finalize(applyLiveState(published.content, live), live.live, "published", published.publishedAt);
});

function finalize(
  content: SiteContent,
  live: SiteData["live"],
  mode: SiteData["mode"],
  publishedAt: string | null,
): SiteData {
  const now = Date.now();
  return {
    content: { ...content, offers: content.offers.filter((o) => isOfferLive(o, now)) },
    live,
    mode,
    publishedAt,
  };
}
