"use client";

import { clsx } from "clsx";
import { ArrowUpRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { saveDocuments } from "@/app/admin/_actions/content";
import { LinkTargetField, type LinkOptions } from "@/components/admin/fields";
import { MediaPicker, type MediaPreview } from "@/components/admin/media";
import { SaveBar } from "@/components/admin/save-bar";
import { SortableList } from "@/components/admin/sortable-list";
import { Button, Card, Input, Switch, TextField } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { HOMEPAGE_SECTION_LABELS, type Hero, type Homepage, type HomepageSectionKey } from "@/lib/content/schemas";

const SECTION_LINKS: Partial<Record<HomepageSectionKey, { href: string; label: string }>> = {
  bestsellers: { href: "/admin/best-sellers", label: "Pick items" },
  menu: { href: "/admin/menu", label: "Edit menu" },
  offers: { href: "/admin/offers", label: "Manage offers" },
  why: { href: "/admin/why-hungru", label: "Edit points" },
  story: { href: "/admin/brand-story", label: "Edit story" },
  reviews: { href: "/admin/reviews", label: "Manage reviews" },
  contact: { href: "/admin/contact", label: "Edit details" },
};

type HeadingKey = "bestsellers" | "menu" | "offers" | "reviews" | "contact";
const HEADINGS: HeadingKey[] = ["bestsellers", "menu", "offers", "reviews", "contact"];

/** Renders "*word*" highlights the same way the website does, for the live preview. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="text-accent">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function HomepageEditor({
  hero,
  homepage,
  linkOptions,
  previews,
}: {
  hero: Hero;
  homepage: Homepage;
  linkOptions: LinkOptions;
  previews: Record<string, MediaPreview>;
}) {
  const form = useAdminForm({ hero, homepage }, (v) => saveDocuments({ hero: v.hero, homepage: v.homepage }));
  const { values, error } = form;
  const [newWord, setNewWord] = useState("");

  const setHero = <K extends keyof Hero>(key: K, value: Hero[K]) => form.set("hero", { ...values.hero, [key]: value });
  const setHome = <K extends keyof Homepage>(key: K, value: Homepage[K]) => form.set("homepage", { ...values.homepage, [key]: value });
  const h = values.hero;
  const hp = values.homepage;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        <Card title="Hero" description="The big first screen. Keep the headline short and punchy.">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="flex flex-col gap-5 lg:col-span-3">
              <TextField label="Sticker text" optional value={h.badge} onChange={(v) => setHero("badge", v)} error={error("hero.badge")} maxLength={60} />
              <TextField
                label="Headline"
                required
                value={h.headline}
                onChange={(v) => setHero("headline", v)}
                error={error("hero.headline")}
                maxLength={90}
                help="Tip: wrap a word in *asterisks* to highlight it, e.g. Pizza that *hits* different."
              />
              <TextField label="Supporting text" multiline rows={3} value={h.subtext} onChange={(v) => setHero("subtext", v)} error={error("hero.subtext")} maxLength={280} />
            </div>
            <div className="lg:col-span-2">
              <p className="mb-1.5 text-sm font-semibold text-stone-800">Preview</p>
              <div className="grain overflow-hidden rounded-xl bg-ink p-5 text-cream">
                {h.badge && <span className="inline-block -rotate-2 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink">{h.badge}</span>}
                <p className="font-display mt-3 text-4xl leading-[0.9] uppercase">
                  <Highlighted text={h.headline || "Your headline"} />
                </p>
                {h.subtext && <p className="mt-3 text-sm text-cream/75">{h.subtext}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary px-4 py-2 text-sm font-bold">{h.primaryCta.label || "…"}</span>
                  <span className="rounded-full px-4 py-2 text-sm font-bold ring-2 ring-cream/40">{h.secondaryCta.label || "…"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-stone-100 pt-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <TextField label="Main button text" required value={h.primaryCta.label} onChange={(v) => setHero("primaryCta", { ...h.primaryCta, label: v })} error={error("hero.primaryCta.label")} maxLength={40} />
              <LinkTargetField label="Main button goes to" value={h.primaryCta.target} onChange={(target) => setHero("primaryCta", { ...h.primaryCta, target })} options={linkOptions} error={error("hero.primaryCta.target.value")} />
            </div>
            <div className="flex flex-col gap-4">
              <TextField label="Second button text" required value={h.secondaryCta.label} onChange={(v) => setHero("secondaryCta", { ...h.secondaryCta, label: v })} error={error("hero.secondaryCta.label")} maxLength={40} />
              <LinkTargetField label="Second button goes to" value={h.secondaryCta.target} onChange={(target) => setHero("secondaryCta", { ...h.secondaryCta, target })} options={linkOptions} error={error("hero.secondaryCta.target.value")} />
            </div>
          </div>

          <div className="mt-6 border-t border-stone-100 pt-6">
            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">Hero visual</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["illustration", "Animated pizza", "Our signature cheese-pull illustration"],
                    ["image", "Your photo", "A big photo of your pizza"],
                    ["video", "Your video", "A short, silent looping clip"],
                  ] as const
                ).map(([type, label, desc]) => (
                  <label
                    key={type}
                    className={clsx(
                      "cursor-pointer rounded-xl border-2 p-3 transition-colors",
                      h.media.type === type ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-300",
                    )}
                  >
                    <input type="radio" name="hero-media" className="sr-only" checked={h.media.type === type} onChange={() => setHero("media", { ...h.media, type })} />
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-sm text-stone-500">{desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {h.media.type === "image" && (
              <div className="mt-4">
                <MediaPicker
                  label="Hero photo"
                  value={h.media.imageId}
                  preview={h.media.imageId ? previews[h.media.imageId] : null}
                  onChange={(id) => setHero("media", { ...h.media, imageId: id })}
                  help="A top-down or close-up pizza shot with a clean background works best. Without a photo, the animated pizza is shown."
                />
              </div>
            )}
            {h.media.type === "video" && (
              <div className="mt-4 flex flex-col gap-4">
                <MediaPicker
                  label="Hero video"
                  kind="video"
                  value={h.media.videoId}
                  preview={h.media.videoId ? previews[h.media.videoId] : null}
                  onChange={(id) => setHero("media", { ...h.media, videoId: id })}
                  help="MP4, under 20 MB (smaller loads faster on phones). It plays muted on loop."
                />
                <MediaPicker
                  label="Poster image"
                  optional
                  value={h.media.imageId}
                  preview={h.media.imageId ? previews[h.media.imageId] : null}
                  onChange={(id) => setHero("media", { ...h.media, imageId: id })}
                  help="Shown while the video loads and for visitors who prefer reduced motion."
                />
              </div>
            )}
          </div>
        </Card>

        <Card title="Sections" description="Drag to reorder. Switch off any section you don't want. Sections with no content (e.g. no offers) hide automatically.">
          <SortableList
            items={hp.sections}
            getId={(s) => s.key}
            label={(s) => HOMEPAGE_SECTION_LABELS[s.key]}
            onReorder={(sections) => setHome("sections", sections)}
            renderItem={(section, { handle }) => {
              const link = SECTION_LINKS[section.key];
              return (
                <div className={clsx("flex items-center gap-2 rounded-xl border bg-white py-1.5 pr-3 pl-1", section.enabled ? "border-stone-200" : "border-dashed border-stone-300 bg-stone-50")}>
                  {handle}
                  <span className={clsx("flex-1 font-semibold", !section.enabled && "text-stone-400")}>{HOMEPAGE_SECTION_LABELS[section.key]}</span>
                  {link && (
                    <Link href={link.href} className="hidden items-center gap-1 text-sm font-medium text-blue-700 hover:underline sm:inline-flex">
                      {link.label} <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                  <Switch
                    size="sm"
                    hideLabel
                    label={`Show ${HOMEPAGE_SECTION_LABELS[section.key]}`}
                    checked={section.enabled}
                    onChange={(enabled) => setHome("sections", hp.sections.map((s) => (s.key === section.key ? { ...s, enabled } : s)))}
                  />
                </div>
              );
            }}
          />
        </Card>

        <Card title="Scrolling marquee" description="Short words that scroll across the band under the hero.">
          <ul className="flex flex-wrap gap-2">
            {hp.marquee.items.map((word, i) => (
              <li key={`${word}-${i}`} className="flex items-center gap-1 rounded-full bg-stone-900 py-1 pr-1 pl-3 text-sm font-semibold text-white">
                {word}
                <button
                  type="button"
                  onClick={() => setHome("marquee", { items: hp.marquee.items.filter((_, j) => j !== i) })}
                  className="flex size-6 items-center justify-center rounded-full hover:bg-white/20"
                  aria-label={`Remove ${word}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add a word"
              aria-label="New marquee word"
              maxLength={40}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newWord.trim()) {
                    setHome("marquee", { items: [...hp.marquee.items, newWord.trim()].slice(0, 12) });
                    setNewWord("");
                  }
                }
              }}
              className="max-w-xs"
            />
            <Button
              variant="secondary"
              icon={<Plus className="size-4" />}
              disabled={!newWord.trim() || hp.marquee.items.length >= 12}
              onClick={() => {
                setHome("marquee", { items: [...hp.marquee.items, newWord.trim()] });
                setNewWord("");
              }}
            >
              Add
            </Button>
          </div>
        </Card>

        <Card title="Section headings">
          <div className="flex flex-col divide-y divide-stone-100">
            {HEADINGS.map((key) => (
              <details key={key} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold">
                  <span>
                    {HOMEPAGE_SECTION_LABELS[key]} <span className="font-normal text-stone-500">· {hp[key].heading}</span>
                  </span>
                  <span className="text-sm font-medium text-blue-700 group-open:hidden">Edit</span>
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TextField label="Small label" value={hp[key].eyebrow} onChange={(v) => setHome(key, { ...hp[key], eyebrow: v })} maxLength={40} error={error(`homepage.${key}.eyebrow`)} />
                  <TextField label="Heading" value={hp[key].heading} onChange={(v) => setHome(key, { ...hp[key], heading: v })} maxLength={90} error={error(`homepage.${key}.heading`)} />
                  <TextField label="Intro text" optional className="sm:col-span-2" value={hp[key].subtext} onChange={(v) => setHome(key, { ...hp[key], subtext: v })} maxLength={280} error={error(`homepage.${key}.subtext`)} />
                </div>
              </details>
            ))}
          </div>
        </Card>

        <Card title="Final call to action" description="The big closing banner at the bottom of the homepage.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Heading" value={hp.finalCta.heading} onChange={(v) => setHome("finalCta", { ...hp.finalCta, heading: v })} maxLength={90} error={error("homepage.finalCta.heading")} />
            <TextField label="Supporting text" optional value={hp.finalCta.subtext} onChange={(v) => setHome("finalCta", { ...hp.finalCta, subtext: v })} maxLength={200} />
            <TextField label="Button text" value={hp.finalCta.cta.label} onChange={(v) => setHome("finalCta", { ...hp.finalCta, cta: { ...hp.finalCta.cta, label: v } })} maxLength={40} error={error("homepage.finalCta.cta.label")} />
            <LinkTargetField
              label="Button goes to"
              value={hp.finalCta.cta.target}
              onChange={(target) => setHome("finalCta", { ...hp.finalCta, cta: { ...hp.finalCta.cta, target } })}
              options={linkOptions}
              error={error("homepage.finalCta.cta.target.value")}
            />
          </div>
        </Card>
      </div>
      <SaveBar dirty={form.dirty} saving={form.saving} onSave={() => form.submit()} onDiscard={() => form.reset()} savedAt={form.savedAt} />
    </form>
  );
}
