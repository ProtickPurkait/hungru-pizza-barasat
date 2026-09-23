"use client";

import { Eye, History, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { publishSite, restoreVersion } from "@/app/admin/_actions/publish";
import { useConfirm } from "@/components/admin/confirm";
import { Badge, Button, Card } from "@/components/admin/ui";

type Version = { id: number; createdAt: string; note: string; publishedBy: string | null };

export function PublishPanel({
  hasUnpublishedChanges,
  history,
  currentId,
}: {
  hasUnpublishedChanges: boolean;
  history: Version[];
  currentId: number | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.message ?? "Something went wrong");
      router.refresh();
    });

  return (
    <>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold">{hasUnpublishedChanges ? "You have unpublished changes" : "Everything is published"}</p>
            <p className="text-sm text-stone-500">
              {hasUnpublishedChanges
                ? "Preview them first, then publish when you're happy."
                : "The live website matches your latest saved content."}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/preview?path=/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-lg px-5 font-semibold ring-1 ring-stone-300 hover:bg-stone-50"
            >
              <Eye className="size-4" aria-hidden /> Preview
            </a>
            <Button
              size="lg"
              variant="brand"
              loading={pending}
              disabled={!hasUnpublishedChanges}
              onClick={() => run(publishSite)}
              icon={<Rocket className="size-4" aria-hidden />}
            >
              Publish now
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Version history" bodyClassName="p-0 sm:p-0">
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone-500">Nothing published yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {history.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    Version #{v.id}
                    {v.id === currentId && <Badge tone="success">Live now</Badge>}
                  </p>
                  <p className="text-sm text-stone-500">
                    {new Date(v.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    {v.publishedBy && ` · ${v.publishedBy}`}
                    {v.note && ` · ${v.note}`}
                  </p>
                </div>
                {v.id !== currentId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    icon={<History className="size-4" aria-hidden />}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Restore version #${v.id}?`,
                          description: "The live website will go back to how it looked then.",
                          confirmLabel: "Restore",
                          tone: "default",
                        })
                      ) {
                        run(() => restoreVersion(v.id));
                      }
                    }}
                  >
                    Restore
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
