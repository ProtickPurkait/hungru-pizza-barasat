import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

// Fallback fonts are metric-matched in globals.css (Arial, Liberation Sans and Roboto, incl. the condensed
// display width), so next/font's Arial-only fallback is switched off.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  adjustFontFallback: false,
});

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

/** The web font's own family name, without the fallback next/font appends (Turbopack ignores adjustFontFallback). */
const face = (font: { style: { fontFamily: string } }) => font.style.fontFamily.split(",")[0].trim();

const fontVars = { "--font-bricolage": face(display), "--font-dm-sans": face(sans) } as React.CSSProperties;

export const metadata: Metadata = {
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#141110",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className="antialiased" style={fontVars} suppressHydrationWarning>
      <head>
        {/* Lets scroll-reveal styles apply only when JavaScript is running (content stays visible without JS). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh bg-cream text-ink">{children}</body>
    </html>
  );
}
