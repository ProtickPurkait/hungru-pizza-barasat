import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSiteData } from "@/lib/content/get-site-content";

let fontData: Promise<Buffer | null> | null = null;
function loadFont() {
  // Latin subset of Bricolage Grotesque ExtraBold (SIL Open Font License).
  fontData ??= readFile(path.join(process.cwd(), "src/app/og/bricolage-800.ttf")).catch(() => null);
  return fontData;
}

/** Branded social-sharing image, used when the owner hasn't uploaded one in Admin → SEO. */
export async function GET() {
  const { content } = await getSiteData();
  const { brand, hero } = content;
  const headline = hero.headline.replace(/\*/g, "");
  const font = await loadFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(circle at 78% 55%, #ff7a1a 0%, #141110 55%)",
          color: "#fff3df",
          fontFamily: font ? "Bricolage" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: brand.colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
            }}
          >
            <svg width="46" height="46" viewBox="0 0 60 60">
              <path d="M30 56 L6 10 Q30 0 54 10 Z" fill="#ffcf5c" stroke="#141110" strokeWidth="3" strokeLinejoin="round" />
              <path d="M6 10 Q30 0 54 10 L51 16 Q30 7 9 16 Z" fill="#d98b3a" stroke="#141110" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="26" cy="22" r="5" fill="#b3261e" />
              <circle cx="37" cy="30" r="4" fill="#b3261e" />
              <circle cx="29" cy="39" r="3.5" fill="#b3261e" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, textTransform: "uppercase" }}>{brand.name}</span>
            {brand.location && <span style={{ fontSize: 22, letterSpacing: 6, opacity: 0.7, textTransform: "uppercase" }}>{brand.location}</span>}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, lineHeight: 0.92, letterSpacing: 1, textTransform: "uppercase", maxWidth: 820 }}>
          {headline}
        </div>
        <div style={{ display: "flex" }}>
          <span
            style={{
              background: brand.colors.primary,
              color: "#fff",
              padding: "18px 36px",
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 800,
              textTransform: "uppercase",
              boxShadow: `6px 6px 0 0 ${brand.colors.accent}`,
            }}
          >
            Order now
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: "Bricolage", data: font, weight: 800, style: "normal" }] : undefined,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}
