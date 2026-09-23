"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { media } from "@/db/schema";
import { safeAction, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth/session";
import { deleteStoredFile } from "@/lib/media/storage";
import { findMediaUsage } from "@/lib/media/usage";

const idSchema = z.uuid();

export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const mediaId = idSchema.parse(id);
    await db
      .update(media)
      .set({ alt: String(alt).trim().slice(0, 200) })
      .where(eq(media.id, mediaId));
    return { ok: true, message: "Description saved. Publish to update it on the website." };
  });
}

export async function getMediaUsage(id: string): Promise<string[]> {
  await requireAdmin();
  return findMediaUsage(idSchema.parse(id));
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    await requireAdmin();
    const mediaId = idSchema.parse(id);
    const uses = await findMediaUsage(mediaId);
    if (uses.length) {
      return { ok: false, message: `This file is still used in: ${uses.join(", ")}. Replace it there first.` };
    }
    const [row] = await db.delete(media).where(eq(media.id, mediaId)).returning({ storage: media.storage, path: media.path });
    if (row) await deleteStoredFile(row);
    return { ok: true, message: "File deleted." };
  });
}
