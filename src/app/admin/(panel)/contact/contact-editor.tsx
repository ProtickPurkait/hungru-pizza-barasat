"use client";

import { Plus, Trash2 } from "lucide-react";
import { saveDocuments } from "@/app/admin/_actions/content";
import { HoursEditor } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/save-bar";
import { Button, Card, IconButton, Input, Select, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { SOCIAL_PLATFORMS, type Contact, type Social } from "@/lib/content/schemas";

const PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X (Twitter)",
  google: "Google Business",
  zomato: "Zomato",
  swiggy: "Swiggy",
  whatsapp: "WhatsApp channel",
  website: "Website",
  other: "Other",
};

export function ContactEditor({ contact, social }: { contact: Contact; social: Social }) {
  const form = useAdminForm({ contact, social }, (v) => saveDocuments({ contact: v.contact, social: v.social }));
  const { values, error } = form;
  const c = values.contact;
  const setC = <K extends keyof Contact>(key: K, value: Contact[K]) => form.set("contact", { ...c, [key]: value });
  const links = values.social.links;
  const setLinks = (next: Social["links"]) => form.set("social", { links: next });
  const contactError = (path: string) => error(`contact.${path}`);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        <Card title="Contact details">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Address"
              multiline
              rows={3}
              className="md:col-span-2"
              value={c.address}
              onChange={(v) => setC("address", v)}
              error={contactError("address")}
              maxLength={300}
              optional
              placeholder="Shop no., street, landmark, Barasat, PIN"
            />
            <TextField
              label="Phone"
              type="tel"
              inputMode="tel"
              value={c.phone}
              onChange={(v) => setC("phone", v)}
              error={contactError("phone")}
              optional
              placeholder="+91 98765 43210"
            />
            <TextField
              label="WhatsApp number"
              type="tel"
              inputMode="tel"
              value={c.whatsapp}
              onChange={(v) => setC("whatsapp", v)}
              error={contactError("whatsapp")}
              optional
              placeholder="+91 98765 43210"
              help="Customers can chat with you in one tap."
            />
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              value={c.email}
              onChange={(v) => setC("email", v)}
              error={contactError("email")}
              optional
            />
            <TextField
              label="Google Maps link"
              inputMode="url"
              value={c.mapsUrl}
              onChange={(v) => setC("mapsUrl", v)}
              error={contactError("mapsUrl")}
              optional
              placeholder="https://maps.app.goo.gl/…"
              help="In Google Maps: Share → Copy link."
            />
            <TextField
              label="Map embed (optional)"
              className="md:col-span-2"
              value={c.mapEmbedUrl}
              onChange={(v) => setC("mapEmbedUrl", v)}
              error={contactError("mapEmbedUrl")}
              optional
              placeholder="Paste the <iframe …> code from Google Maps → Share → Embed a map"
              help="Shows an interactive map (loads only when a visitor taps it, to keep the site fast)."
            />
          </div>
        </Card>

        <Card
          title="Opening hours"
          description="Times are in India Standard Time. Switch a day off if you're closed. Leave all days unset to hide hours."
        >
          <HoursEditor value={c.hours} onChange={(hours) => setC("hours", hours)} errors={(p) => contactError(p)} />
          <div className="mt-4">
            <TextField
              label="Note"
              optional
              value={c.hours.note}
              onChange={(v) => setC("hours", { ...c.hours, note: v })}
              maxLength={160}
              placeholder="e.g. Kitchen closes 30 minutes before closing"
            />
          </div>
        </Card>

        <Card title="Social links" description="Shown in the footer and contact section.">
          <div className="flex flex-col gap-3">
            {links.length === 0 && <p className="text-sm text-stone-500">No social links yet.</p>}
            {links.map((link, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[11rem_1fr_auto] sm:items-start">
                <Select
                  aria-label="Platform"
                  value={link.platform}
                  onChange={(e) =>
                    setLinks(links.map((l, j) => (j === i ? { ...l, platform: e.target.value as typeof link.platform } : l)))
                  }
                >
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </Select>
                <div>
                  <Input
                    aria-label={`${PLATFORM_LABELS[link.platform]} link`}
                    value={link.url}
                    inputMode="url"
                    placeholder="https://instagram.com/yourpage"
                    onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))}
                    invalid={Boolean(error(`social.links.${i}.url`))}
                  />
                  {error(`social.links.${i}.url`) && <p className="mt-1 text-sm text-red-600">{error(`social.links.${i}.url`)}</p>}
                </div>
                <IconButton label="Remove link" tone="danger" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            ))}
            <div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="size-4" />}
                disabled={links.length >= 12}
                onClick={() => setLinks([...links, { platform: "instagram", label: "", url: "" }])}
              >
                Add social link
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
