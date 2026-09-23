import type { Metadata } from "next";
import { MenuBrowser } from "@/components/site/menu-browser";
import { TrackView } from "@/components/site/track-view";
import { getSiteData } from "@/lib/content/get-site-content";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSiteData();
  const where = content.brand.location ? ` in ${content.brand.location}` : "";
  return {
    title: "Menu",
    description: `Browse the ${content.brand.name} menu${where}: pizzas, sides and drinks with prices. Customise and order in a few taps.`,
    alternates: { canonical: "/menu" },
  };
}

export default function MenuPage() {
  return (
    <>
      <TrackView event="menu_view" />
      <MenuBrowser />
    </>
  );
}
