import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/shell";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { getPublishStatus } from "@/lib/content/publish";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [status, brand, [newOrders]] = await Promise.all([
    getPublishStatus(db),
    loadDocument(db, "brand"),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "new")),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      brandName={brand.name}
      newOrders={newOrders?.n ?? 0}
      status={{
        hasUnpublishedChanges: status.hasUnpublishedChanges,
        lastPublishedAt: status.lastPublishedAt?.toISOString() ?? null,
      }}
    >
      {children}
    </AdminShell>
  );
}
