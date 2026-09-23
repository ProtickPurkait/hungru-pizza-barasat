"use client";

import { KeyRound, Plus, UserX, UserCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDocument } from "@/app/admin/_actions/content";
import { changeOwnPassword, createAdminUser, deleteAdminUser, resetAdminUserPassword, setAdminUserDisabled } from "@/app/admin/_actions/users";
import { useConfirm } from "@/components/admin/confirm";
import { EditorDialog } from "@/components/admin/editor-dialog";
import { Badge, Button, Card, Field, IconButton, Select, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import type { Analytics } from "@/lib/content/schemas";

export function AccountSettings({ name, email }: { name: string; email: string }) {
  const form = useAdminForm({ current: "", next: "", confirm: "" }, (v) => changeOwnPassword(v), {
    onSuccess: () => form.reset({ current: "", next: "", confirm: "" }),
  });
  const { values, set, error } = form;
  return (
    <Card title="Your account" description={`${name} · ${email}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
        className="grid gap-4 md:grid-cols-3"
        noValidate
      >
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <TextField label="Current password" type="password" autoComplete="current-password" value={values.current} onChange={(v) => set("current", v)} error={error("current")} />
        <TextField label="New password" type="password" autoComplete="new-password" value={values.next} onChange={(v) => set("next", v)} error={error("next")} help="At least 10 characters." />
        <TextField label="Repeat new password" type="password" autoComplete="new-password" value={values.confirm} onChange={(v) => set("confirm", v)} error={error("confirm")} />
        <div className="md:col-span-3">
          <Button type="submit" loading={form.saving} disabled={!values.current || !values.next} icon={<KeyRound className="size-4" />}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

type TeamUser = { id: string; name: string; email: string; role: "owner" | "editor"; disabled: boolean; lastLoginAt: string | null };

export function TeamSettings({ users, meId }: { users: TeamUser[]; meId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<TeamUser | null>(null);
  const [, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const result = await fn();
      if (result.ok) toast.success(result.message ?? "Done");
      else toast.error(result.message ?? "Something went wrong");
      router.refresh();
    });

  return (
    <Card
      title="Team"
      description="Editors can manage all website content. Only owners can manage team members."
      actions={
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)} icon={<Plus className="size-4" />}>
          Add person
        </Button>
      }
      bodyClassName="p-0 sm:p-0"
    >
      <ul className="divide-y divide-stone-100">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {u.name}
                <Badge tone={u.role === "owner" ? "brand" : "neutral"}>{u.role === "owner" ? "Owner" : "Editor"}</Badge>
                {u.id === meId && <Badge tone="info">You</Badge>}
                {u.disabled && <Badge tone="danger">Disabled</Badge>}
              </p>
              <p className="truncate text-sm text-stone-500">
                {u.email} · {u.lastLoginAt ? `last signed in ${new Date(u.lastLoginAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "never signed in"}
              </p>
            </div>
            {u.id !== meId && (
              <div className="flex items-center gap-1">
                <IconButton label={`Reset password for ${u.name}`} onClick={() => setResetting(u)}>
                  <KeyRound className="size-4" aria-hidden />
                </IconButton>
                <IconButton label={u.disabled ? `Re-enable ${u.name}` : `Disable ${u.name}`} onClick={() => run(() => setAdminUserDisabled(u.id, !u.disabled))}>
                  {u.disabled ? <UserCheck className="size-4" aria-hidden /> : <UserX className="size-4" aria-hidden />}
                </IconButton>
                <IconButton
                  label={`Delete ${u.name}`}
                  tone="danger"
                  onClick={async () => {
                    if (await confirm({ title: `Remove ${u.name}?`, description: "They'll lose access to the admin immediately." })) run(() => deleteAdminUser(u.id));
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            )}
          </li>
        ))}
      </ul>
      {adding && <AddUserDialog onClose={() => setAdding(false)} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </Card>
  );
}

function AddUserDialog({ onClose }: { onClose: () => void }) {
  const form = useAdminForm({ name: "", email: "", password: "", role: "editor" as "owner" | "editor" }, (v) => createAdminUser(v), { onSuccess: onClose });
  const { values, set, error } = form;
  return (
    <EditorDialog
      open
      onClose={onClose}
      title="Add a team member"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => form.submit()} loading={form.saving}>
            Create account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Name" required value={values.name} onChange={(v) => set("name", v)} error={error("name")} />
        <TextField label="Email" required type="email" value={values.email} onChange={(v) => set("email", v)} error={error("email")} />
        <TextField label="Temporary password" required type="text" autoComplete="off" value={values.password} onChange={(v) => set("password", v)} error={error("password")} help="At least 10 characters. Share it privately; they can change it in Settings." />
        <Field label="Role">
          <Select value={values.role} onChange={(e) => set("role", e.target.value as "owner" | "editor")}>
            <option value="editor">Editor: manages website content</option>
            <option value="owner">Owner: also manages the team</option>
          </Select>
        </Field>
      </div>
    </EditorDialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: TeamUser; onClose: () => void }) {
  const form = useAdminForm({ password: "" }, (v) => resetAdminUserPassword(user.id, v.password), { onSuccess: onClose });
  return (
    <EditorDialog
      open
      onClose={onClose}
      title={`Reset password for ${user.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => form.submit()} loading={form.saving}>
            Reset password
          </Button>
        </>
      }
    >
      <TextField label="New password" type="text" autoComplete="off" value={form.values.password} onChange={(v) => form.set("password", v)} error={form.error("password")} help="At least 10 characters. They'll be signed out everywhere." />
    </EditorDialog>
  );
}

export function AnalyticsSettings({ analytics }: { analytics: Analytics }) {
  const form = useAdminForm(analytics, (v) => saveDocument("analytics", v));
  const { values, set, error } = form;
  return (
    <Card title="Analytics" description="Optional. Connect Google Analytics 4 or Plausible to measure visits and the ordering funnel. Nothing is tracked until you add an ID.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
        className="grid gap-4 md:grid-cols-2"
        noValidate
      >
        <TextField label="Google Analytics 4 measurement ID" optional value={values.ga4Id} onChange={(v) => set("ga4Id", v.trim().toUpperCase())} error={error("ga4Id")} placeholder="G-XXXXXXXXXX" />
        <TextField label="Plausible domain" optional value={values.plausibleDomain} onChange={(v) => set("plausibleDomain", v.trim().toLowerCase())} error={error("plausibleDomain")} placeholder="hungrupizza.in" />
        <p className="text-sm text-stone-500 md:col-span-2">
          Funnel events sent: homepage view → menu view → product view → add to cart → cart view → order started → order placed. Takes effect after publishing.
        </p>
        <div className="md:col-span-2">
          <Button type="submit" loading={form.saving} disabled={!form.dirty}>
            Save analytics
          </Button>
        </div>
      </form>
    </Card>
  );
}
