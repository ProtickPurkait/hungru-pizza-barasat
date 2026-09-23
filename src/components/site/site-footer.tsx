import Link from "next/link";
import { resolveLink } from "@/lib/content/links";
import type { SiteContent } from "@/lib/content/types";
import { BrandLogo } from "./brand-logo";
import { CtaLink } from "./cta-link";
import { PLATFORM_NAMES, SocialIcon } from "./social-icons";

export function SiteFooter({ content, showArtNote }: { content: SiteContent; showArtNote: boolean }) {
  const { brand, footer, social, contact, ordering } = content;
  const year = new Date().getFullYear();
  return (
    <footer className="grain relative overflow-hidden bg-ink text-cream">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 pb-28 sm:px-6 md:pb-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label={`${brand.name} home`} className="inline-block">
              <BrandLogo name={brand.name} location={brand.location} logo={brand.logo} />
            </Link>
            {footer.text && <p className="mt-4 max-w-sm text-cream/70">{footer.text}</p>}
            {brand.tagline && <p className="font-display mt-4 text-2xl text-accent uppercase">{brand.tagline}</p>}
          </div>
          {footer.links.length > 0 && (
            <nav aria-label="Footer">
              <p className="text-xs font-extrabold tracking-[0.2em] text-cream/50 uppercase">Explore</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {footer.links.map((link, i) => (
                  <li key={i}>
                    <CtaLink link={resolveLink(link.target, { contact, ordering })} className="text-lg font-bold transition-colors hover:text-accent">
                      {link.label}
                    </CtaLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div>
            {(contact.phone || contact.email || contact.address) && (
              <>
                <p className="text-xs font-extrabold tracking-[0.2em] text-cream/50 uppercase">Say hi</p>
                <ul className="mt-4 flex flex-col gap-2.5 text-cream/80">
                  {contact.phone && (
                    <li>
                      <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="font-bold hover:text-accent">
                        {contact.phone}
                      </a>
                    </li>
                  )}
                  {contact.email && (
                    <li>
                      <a href={`mailto:${contact.email}`} className="hover:text-accent">
                        {contact.email}
                      </a>
                    </li>
                  )}
                  {contact.address && <li className="whitespace-pre-line">{contact.address}</li>}
                </ul>
              </>
            )}
            {footer.showSocial && social.links.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social media">
                {social.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label || PLATFORM_NAMES[link.platform]}
                      className="flex size-12 items-center justify-center rounded-full bg-cream/10 transition-colors hover:bg-accent hover:text-ink"
                    >
                      <SocialIcon platform={link.platform} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p aria-hidden className="font-display mt-14 text-[18vw] leading-[0.8] tracking-[-0.04em] text-cream/10 uppercase select-none md:text-[12vw]">
          {brand.name.split(" ")[0]}
        </p>
        <div className="mt-6 flex flex-col gap-2 border-t border-cream/10 pt-6 text-sm text-cream/50 sm:flex-row sm:justify-between">
          <p>
            © {year} {brand.name}
            {brand.location ? `, ${brand.location}` : ""}
          </p>
          {showArtNote && <p>Food illustrations are artwork, not photographs.</p>}
        </div>
      </div>
    </footer>
  );
}
