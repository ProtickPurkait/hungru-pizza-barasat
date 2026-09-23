import Link from "next/link";
import type { ReactNode } from "react";
import type { ResolvedLink } from "@/lib/content/links";

/** Renders a CMS-resolved destination as a Next link (internal) or anchor (external / tel / WhatsApp). */
export function CtaLink({
  link,
  className,
  children,
  ariaLabel,
}: {
  link: ResolvedLink;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  if (link.external) {
    const newTab = link.href.startsWith("http");
    return (
      <a
        href={link.href}
        className={className}
        aria-label={ariaLabel}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
