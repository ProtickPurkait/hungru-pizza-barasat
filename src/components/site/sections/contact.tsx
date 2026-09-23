import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { SiteContent } from "@/lib/content/types";
import { groupedHours, hoursConfigured } from "@/lib/hours";
import { whatsappLink } from "@/lib/ordering/whatsapp";
import { MapArt, MapFacade } from "../map-facade";
import { OpenStatus } from "../open-status";
import { Reveal } from "../reveal";
import { SectionHeading } from "../section-heading";
import { PLATFORM_NAMES, SocialIcon } from "../social-icons";

export function hasContactInfo(contact: SiteContent["contact"]) {
  return Boolean(
    contact.address || contact.phone || contact.whatsapp || contact.email || contact.mapsUrl || hoursConfigured(contact.hours),
  );
}

export function ContactSection({
  heading,
  contact,
  social,
  brandName,
}: {
  heading: { eyebrow: string; heading: string; subtext: string };
  contact: SiteContent["contact"];
  social: SiteContent["social"];
  brandName: string;
}) {
  if (!hasContactInfo(contact)) return null;
  const hours = hoursConfigured(contact.hours) ? groupedHours(contact.hours) : [];
  const hasMap = Boolean(contact.mapEmbedUrl || contact.mapsUrl);

  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-cream-2 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="contact-heading" {...heading} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-4">
            {contact.address && (
              <div className="rounded-[1.75rem] bg-white p-6 ring-2 ring-ink shadow-[5px_5px_0_0_var(--color-ink)]">
                <p className="flex items-center gap-2 text-sm font-extrabold tracking-widest text-primary uppercase">
                  <MapPin className="size-4" aria-hidden /> Address
                </p>
                <address className="mt-2 text-xl leading-snug font-bold whitespace-pre-line not-italic">{contact.address}</address>
                {contact.mapsUrl && (
                  <a
                    href={contact.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-extrabold tracking-wide text-cream uppercase"
                  >
                    <Navigation className="size-4" aria-hidden /> Get directions
                  </a>
                )}
              </div>
            )}
            {(contact.phone || contact.whatsapp || contact.email) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                    className="group flex items-center gap-4 rounded-[1.5rem] bg-primary p-5 text-white ring-2 ring-ink shadow-[4px_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Phone className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold tracking-widest uppercase opacity-80">Call us</span>
                      <span className="block truncate text-lg font-extrabold">{contact.phone}</span>
                    </span>
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={whatsappLink(contact.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-[1.5rem] bg-basil p-5 text-white ring-2 ring-ink shadow-[4px_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <MessageCircle className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold tracking-widest uppercase opacity-80">WhatsApp</span>
                      <span className="block truncate text-lg font-extrabold">Chat with us</span>
                    </span>
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-4 rounded-[1.5rem] bg-white p-5 ring-2 ring-ink sm:col-span-2"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink/5">
                      <Mail className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 truncate text-lg font-bold">{contact.email}</span>
                  </a>
                )}
              </div>
            )}
            {hours.length > 0 && (
              <div className="rounded-[1.75rem] bg-ink p-6 text-cream ring-2 ring-ink">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-extrabold tracking-widest text-accent uppercase">
                    <Clock className="size-4" aria-hidden /> Opening hours
                  </p>
                  <OpenStatus hours={contact.hours} />
                </div>
                <dl className="mt-4 flex flex-col gap-2">
                  {hours.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-cream/10 pb-2 last:border-0">
                      <dt className="font-bold">{row.label}</dt>
                      <dd className={row.value === "Closed" ? "font-bold text-cream/50" : "text-right font-semibold tabular-nums"}>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {contact.hours.note && <p className="mt-3 text-sm text-cream/60">{contact.hours.note}</p>}
              </div>
            )}
            {social.links.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Social media">
                {social.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-4 font-bold ring-2 ring-ink transition-colors hover:bg-ink hover:text-cream"
                    >
                      <SocialIcon platform={link.platform} className="size-5" />
                      {link.label || PLATFORM_NAMES[link.platform]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
          {hasMap && (
            <Reveal
              index={1}
              className="relative min-h-[22rem] overflow-hidden rounded-[2rem] ring-2 ring-ink shadow-[6px_6px_0_0_var(--brand-primary)] lg:min-h-full"
            >
              {contact.mapEmbedUrl ? (
                <MapFacade embedUrl={contact.mapEmbedUrl} label={brandName} />
              ) : (
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-full min-h-[22rem] w-full items-center justify-center"
                >
                  <MapArt />
                  <span className="relative z-10 flex flex-col items-center gap-3">
                    <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white ring-4 ring-cream shadow-xl transition-transform group-hover:-translate-y-1">
                      <MapPin className="size-8" aria-hidden />
                    </span>
                    <span className="rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold tracking-wide text-cream uppercase">
                      Open in Google Maps
                    </span>
                  </span>
                </a>
              )}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
