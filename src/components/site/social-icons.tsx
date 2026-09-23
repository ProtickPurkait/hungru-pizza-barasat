import { Globe, MapPin, MessageCircle, type LucideProps } from "lucide-react";
import type { SOCIAL_PLATFORMS } from "@/lib/content/schemas";

type Platform = (typeof SOCIAL_PLATFORMS)[number];

// Brand glyphs (lucide no longer ships brand icons). Simple, recognisable paths.
function Instagram(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function Facebook(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  );
}
function XLogo(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.2l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.8L17.5 3zm-1.1 16.2h1.7L7.2 4.7H5.4l11 14.5z" />
    </svg>
  );
}
function YouTube(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}
function Letter({ letter, ...props }: LucideProps & { letter: string }) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--color-ink)" fontFamily="system-ui, sans-serif">
        {letter}
      </text>
    </svg>
  );
}

export const PLATFORM_NAMES: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  google: "Google",
  zomato: "Zomato",
  swiggy: "Swiggy",
  whatsapp: "WhatsApp",
  website: "Website",
  other: "Link",
};

export function SocialIcon({ platform, ...props }: { platform: Platform } & LucideProps) {
  switch (platform) {
    case "instagram":
      return <Instagram aria-hidden {...props} />;
    case "facebook":
      return <Facebook aria-hidden {...props} />;
    case "youtube":
      return <YouTube aria-hidden {...props} />;
    case "x":
      return <XLogo aria-hidden {...props} />;
    case "google":
      return <MapPin aria-hidden {...props} />;
    case "zomato":
      return <Letter letter="Z" aria-hidden {...props} />;
    case "swiggy":
      return <Letter letter="S" aria-hidden {...props} />;
    case "whatsapp":
      return <MessageCircle aria-hidden {...props} />;
    default:
      return <Globe aria-hidden {...props} />;
  }
}
