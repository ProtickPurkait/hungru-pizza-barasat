import type { Metadata } from "next";
import { Card, Notice, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { getPublishStatus, listSnapshots } from "@/lib/content/publish";
import { PublishPanel } from "./publish-panel";

export const metadata: Metadata = { title: "Publish" };

export default async function PublishPage() {
  await requireAdmin();
  const [status, history] = await Promise.all([getPublishStatus(db), listSnapshots(db, 25)]);
  return (
    <>
      <PageHeader title="Publish" description="Your edits are saved as a draft. Nothing changes on the live website until you publish." />
      <div className="flex flex-col gap-6">
        <Notice tone="info" title="How it works">
          1. Edit and <strong>save</strong> anything in the admin. 2. Tap <strong>Preview</strong> to see the website with your changes
          (only you can see it). 3. Tap <strong>Publish</strong> to make it live for everyone. Out-of-stock switches and “Pause online
          orders” are the exception: they go live instantly.
        </Notice>
        <PublishPanel
          hasUnpublishedChanges={status.hasUnpublishedChanges}
          history={history.map((h) => ({ id: h.id, createdAt: h.createdAt.toISOString(), note: h.note, publishedBy: h.publishedBy }))}
          currentId={status.snapshotId}
        />
        <Card title="Tip">
          <p className="text-sm text-stone-600">
            Made a mistake? Restore any earlier version below. Your drafts in the admin aren&apos;t changed by restoring.
          </p>
        </Card>
      </div>
    </>
  );
}
