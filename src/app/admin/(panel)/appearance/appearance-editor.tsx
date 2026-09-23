"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { saveDocuments } from "@/app/admin/_actions/content";
import { ColorField, LinkTargetField, type LinkOptions } from "@/components/admin/fields";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SaveBar } from "@/components/admin/save-bar";
import { Button, Card, IconButton, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import type { Brand, Footer } from "@/lib/content/schemas";

const DEFAULT_COLORS = { primary: "#D62B16", secondary: "#FF7A1A", accent: "#FFC229" };

export function AppearanceEditor({
  brand,
  footer,
  linkOptions,
  previews,
}: {
  brand: Brand;
  footer: Footer;
  linkOptions: LinkOptions;
  previews: Record<string, MediaPreview>;
}) {
  const form = useAdminForm({ brand, footer }, (v) => saveDocuments({ brand: v.brand, footer: v.footer }));
  const { values, error } = form;
  const b = values.brand;
  const f = values.footer;
  const setB = <K extends keyof Brand>(key: K, value: Brand[K]) => form.set("brand", { ...b, [key]: value });
  const setF = <K extends keyof Footer>(key: K, value: Footer[K]) => form.set("footer", { ...f, [key]: value });
  const setColor = (key: keyof Brand["colors"], value: string) => setB("colors", { ...b.colors, [key]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        <Card title="Brand">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Brand name" required value={b.name} onChange={(v) => setB("name", v)} error={error("brand.name")} maxLength={60} />
            <TextField label="Location" optional value={b.location} onChange={(v) => setB("location", v)} error={error("brand.location")} maxLength={60} help="Shown next to your name, e.g. Barasat." />
            <TextField label="Tagline" optional className="md:col-span-2" value={b.tagline} onChange={(v) => setB("tagline", v)} error={error("brand.tagline")} maxLength={120} />
            <MediaPicker
              label="Logo"
              value={b.logoId}
              preview={b.logoId ? previews[b.logoId] : null}
              onChange={(id) => setB("logoId", id)}
              aspect="aspect-[3/2]"
              help="A PNG with a transparent background works best. It's shown on dark and light backgrounds."
            />
            <MediaPicker
              label="Favicon (browser tab icon)"
              value={b.faviconId}
              preview={b.faviconId ? previews[b.faviconId] : null}
              onChange={(id) => setB("faviconId", id)}
              aspect="aspect-square"
              help="A square image, at least 512×512. Falls back to your logo."
            />
          </div>
        </Card>

        <Card
          title="Colours"
          description="Used for buttons, highlights and stickers across the site."
          actions={
            <Button variant="ghost" size="sm" onClick={() => setB("colors", DEFAULT_COLORS)}>
              Reset to Hungru defaults
            </Button>
          }
        >
          <div className="grid gap-5 md:grid-cols-3">
            <ColorField label="Primary" help="Main buttons (Order now)" value={b.colors.primary} onChange={(v) => setColor("primary", v)} error={error("brand.colors.primary")} checkAgainst={{ color: "#FFFFFF", label: "white button text" }} />
            <ColorField label="Secondary" help="Glows and gradients" value={b.colors.secondary} onChange={(v) => setColor("secondary", v)} error={error("brand.colors.secondary")} />
            <ColorField label="Accent" help="Stickers and highlights" value={b.colors.accent} onChange={(v) => setColor("accent", v)} error={error("brand.colors.accent")} checkAgainst={{ color: "#141110", label: "dark text" }} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#141110] p-4" style={{ "--p": b.colors.primary, "--a": b.colors.accent } as React.CSSProperties}>
            <span className="rounded-full bg-[var(--p)] px-5 py-2.5 text-sm font-bold text-white">Order now</span>
            <span className="-rotate-3 rounded-full bg-[var(--a)] px-3 py-1 text-xs font-bold text-[#141110]">Best seller</span>
            <span className="text-2xl font-extrabold text-[#FFF3DF]">
              Pizza that <span style={{ color: b.colors.accent }}>hits</span>
            </span>
          </div>
        </Card>

        <Card title="Footer">
          <div className="flex flex-col gap-5">
            <TextField label="Footer text" value={f.text} onChange={(v) => setF("text", v)} error={error("footer.text")} maxLength={200} />
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-800">Footer links</p>
              <div className="flex flex-col gap-3">
                {f.links.map((link, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-stone-200 p-3 md:grid-cols-[12rem_1fr_auto] md:items-start">
                    <TextField
                      label="Text"
                      value={link.label}
                      onChange={(v) => setF("links", f.links.map((l, j) => (j === i ? { ...l, label: v } : l)))}
                      error={error(`footer.links.${i}.label`)}
                      maxLength={30}
                    />
                    <LinkTargetField
                      label="Goes to"
                      value={link.target}
                      onChange={(target) => setF("links", f.links.map((l, j) => (j === i ? { ...l, target } : l)))}
                      options={linkOptions}
                      error={error(`footer.links.${i}.target.value`)}
                    />
                    <IconButton label={`Remove ${link.label || "link"}`} tone="danger" className="md:mt-7" onClick={() => setF("links", f.links.filter((_, j) => j !== i))}>
                      <Trash2 className="size-4" aria-hidden />
                    </IconButton>
                  </div>
                ))}
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="size-4" />}
                    disabled={f.links.length >= 10}
                    onClick={() => setF("links", [...f.links, { label: "", target: { type: "menu", value: "" } }])}
                  >
                    Add link
                  </Button>
                </div>
              </div>
            </div>
            <Switch
              label="Show social links in the footer"
              description={
                <>
                  Manage them in <Link href="/admin/contact" className="font-medium text-blue-700 hover:underline">Contact &amp; hours</Link>.
                </>
              }
              checked={f.showSocial}
              onChange={(v) => setF("showSocial", v)}
            />
          </div>
        </Card>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
