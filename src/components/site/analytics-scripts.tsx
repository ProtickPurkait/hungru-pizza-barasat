import Script from "next/script";
import type { Analytics } from "@/lib/content/schemas";

/** Loads GA4 / Plausible only when configured in Admin → Settings → Analytics. */
export function AnalyticsScripts({ analytics }: { analytics: Analytics }) {
  return (
    <>
      {analytics.ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics.ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(analytics.ga4Id)});`}
          </Script>
        </>
      )}
      {analytics.plausibleDomain && (
        <>
          <Script src="https://plausible.io/js/script.js" data-domain={analytics.plausibleDomain} strategy="afterInteractive" />
          <Script id="plausible-init" strategy="afterInteractive">
            {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};`}
          </Script>
        </>
      )}
    </>
  );
}
