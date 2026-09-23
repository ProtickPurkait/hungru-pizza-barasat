import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db";
import * as t from "@/db/schema";
import { compileSiteContent, hashContent } from "./compile";
import type { SiteContent } from "./types";

export type SnapshotSummary = { id: number; createdAt: Date; note: string; publishedBy: string | null };

export async function getLatestSnapshot(db: Database) {
  const rows = await db.select().from(t.publishedSnapshots).orderBy(desc(t.publishedSnapshots.id)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, content: row.data as SiteContent, hash: row.hash, createdAt: row.createdAt };
}

export async function getPublishStatus(db: Database) {
  const [latest, working] = await Promise.all([
    db
      .select({ id: t.publishedSnapshots.id, hash: t.publishedSnapshots.hash, createdAt: t.publishedSnapshots.createdAt })
      .from(t.publishedSnapshots)
      .orderBy(desc(t.publishedSnapshots.id))
      .limit(1),
    compileSiteContent(db),
  ]);
  const workingHash = hashContent(working);
  const snapshot = latest[0] ?? null;
  return {
    hasUnpublishedChanges: !snapshot || snapshot.hash !== workingHash,
    lastPublishedAt: snapshot?.createdAt ?? null,
    snapshotId: snapshot?.id ?? null,
  };
}

/** Compiles the working content and stores it as the new live version. */
export async function publishContent(db: Database, userId: string | null, note = "") {
  const content = await compileSiteContent(db);
  const hash = hashContent(content);
  const [row] = await db
    .insert(t.publishedSnapshots)
    .values({ data: content, hash, note, publishedBy: userId })
    .returning({ id: t.publishedSnapshots.id, createdAt: t.publishedSnapshots.createdAt });
  return row;
}

/** Makes an older version live again (as a new snapshot, so history is preserved). */
export async function restoreSnapshot(db: Database, snapshotId: number, userId: string | null) {
  const rows = await db.select().from(t.publishedSnapshots).where(eq(t.publishedSnapshots.id, snapshotId)).limit(1);
  const source = rows[0];
  if (!source) return null;
  const [row] = await db
    .insert(t.publishedSnapshots)
    .values({ data: source.data, hash: source.hash, note: `Restored version #${source.id}`, publishedBy: userId })
    .returning({ id: t.publishedSnapshots.id });
  return row;
}

export async function listSnapshots(db: Database, limit = 20) {
  return db
    .select({
      id: t.publishedSnapshots.id,
      createdAt: t.publishedSnapshots.createdAt,
      note: t.publishedSnapshots.note,
      publishedBy: t.adminUsers.name,
    })
    .from(t.publishedSnapshots)
    .leftJoin(t.adminUsers, eq(t.adminUsers.id, t.publishedSnapshots.publishedBy))
    .orderBy(desc(t.publishedSnapshots.id))
    .limit(limit);
}
