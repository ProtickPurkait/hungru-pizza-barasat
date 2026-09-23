import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { loadDocument } from "@/lib/content/compile";
import { serverEnv, siteUrl } from "@/lib/env";
import { AccountSettings, AnalyticsSettings, TeamSettings } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireAdmin();
  const [analytics, team] = await Promise.all([
    loadDocument(db, "analytics"),
    user.role === "owner"
      ? db
          .select({
            id: adminUsers.id,
            name: adminUsers.name,
            email: adminUsers.email,
            role: adminUsers.role,
            disabled: adminUsers.disabled,
            lastLoginAt: adminUsers.lastLoginAt,
          })
          .from(adminUsers)
          .orderBy(asc(adminUsers.createdAt))
      : Promise.resolve([]),
  ]);
  return (
    <>
      <PageHeader title="Settings" description="Your account, team access and website analytics." />
      <div className="flex flex-col gap-6">
        <AccountSettings name={user.name} email={user.email} />
        {user.role === "owner" && (
          <TeamSettings meId={user.id} users={team.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))} />
        )}
        <AnalyticsSettings analytics={analytics} />
        <Card title="System">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Website address</dt>
              <dd className="font-medium break-all">{siteUrl()}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Media storage</dt>
              <dd className="font-medium">{serverEnv.mediaStorage() === "fs" ? "Server disk" : "Database"}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
