"use server";

import { updateTag } from "next/cache";
import { db } from "@/db";
import { safeAction, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth/session";
import { TAG_PUBLISHED } from "@/lib/content/cache-tags";
import { publishContent, restoreSnapshot } from "@/lib/content/publish";

export async function publishSite(): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    await publishContent(db, user.id);
    updateTag(TAG_PUBLISHED);
    return { ok: true, message: "Published! Your changes are now live on the website." };
  });
}

export async function restoreVersion(snapshotId: number): Promise<ActionResult> {
  return safeAction(async () => {
    const user = await requireAdmin();
    if (!Number.isInteger(snapshotId)) return { ok: false, message: "Unknown version." };
    const row = await restoreSnapshot(db, snapshotId, user.id);
    if (!row) return { ok: false, message: "That version no longer exists." };
    updateTag(TAG_PUBLISHED);
    return { ok: true, message: `Version #${snapshotId} is live again.` };
  });
}
