import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { OrderingEditor } from "./ordering-editor";

export const metadata: Metadata = { title: "Ordering" };

export default async function OrderingPage() {
  await requireAdmin();
  const [ordering, live, contact] = await Promise.all([
    loadDocument(db, "ordering"),
    loadDocument(db, "live"),
    loadDocument(db, "contact"),
  ]);
  return (
    <>
      <PageHeader
        title="Ordering"
        description="Choose where “Proceed to order” takes customers, and set delivery, pickup and payment details."
      />
      <OrderingEditor ordering={ordering} live={live} contactPhone={contact.phone} contactWhatsapp={contact.whatsapp} />
    </>
  );
}
