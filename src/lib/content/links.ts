import { whatsappLink } from "@/lib/ordering/whatsapp";
import type { LinkTarget } from "./schemas";

type LinkContext = {
  contact: { phone: string; whatsapp: string };
  ordering: { whatsappNumber: string; phoneNumber: string };
};

export type ResolvedLink = { href: string; external: boolean };

/** Turns a CMS link target ("menu", "product: margherita", "url: https://…") into an href. */
export function resolveLink(target: LinkTarget, ctx: LinkContext): ResolvedLink {
  switch (target.type) {
    case "menu":
      return { href: "/menu", external: false };
    case "category":
      return { href: `/menu#${encodeURIComponent(target.value)}`, external: false };
    case "product":
      return { href: `/menu?item=${encodeURIComponent(target.value)}`, external: false };
    case "cart":
      return { href: "/cart", external: false };
    case "section":
      return { href: target.value && target.value !== "top" ? `/#${target.value}` : "/", external: false };
    case "url":
      return { href: target.value || "/", external: /^https?:\/\//i.test(target.value) };
    case "whatsapp": {
      const number = ctx.contact.whatsapp || ctx.ordering.whatsappNumber;
      return number ? { href: whatsappLink(number, target.value || undefined), external: true } : { href: "/menu", external: false };
    }
    case "phone": {
      const number = ctx.ordering.phoneNumber || ctx.contact.phone;
      return number ? { href: `tel:${number.replace(/[^\d+]/g, "")}`, external: true } : { href: "/menu", external: false };
    }
  }
}
