"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { removeSampleContent } from "@/app/admin/_actions/content";
import { useConfirm } from "@/components/admin/confirm";
import { Button } from "@/components/admin/ui";

export function RemoveSamplesButton() {
  const confirm = useConfirm();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      loading={pending}
      onClick={async () => {
        const ok = await confirm({
          title: "Remove all sample content?",
          description:
            "This deletes every item marked “Sample” (menu items, reviews, Why Hungru points and offers). Your own content isn't touched.",
          confirmLabel: "Remove samples",
        });
        if (!ok) return;
        start(async () => {
          const result = await removeSampleContent();
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
    >
      Remove all sample content
    </Button>
  );
}
