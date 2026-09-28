import Script from "next/script";

import { googleAdsId } from "@/lib/google-ads";

/**
 * Google-Tag für Ads-Landingpages, nur aktiv, wenn NEXT_PUBLIC_GOOGLE_ADS_ID gesetzt ist.
 * Consent Mode v2 startet mit "denied": Ohne Einwilligung setzt gtag keine Cookies und sendet nur
 * cookielose Pings (modellierte Conversions). Eine Einwilligung kann später per
 * gtag('consent','update', …) aus einem Consent-Banner nachgereicht werden.
 * Die Registrierung selbst läuft auf ICONY (gleiche Domain); der Conversion-Pixel dort wird im
 * ICONY-Backend hinterlegt – hier zählt nur der Klick auf die Registrierung als Mikro-Conversion.
 */
export function GoogleAdsTag() {
  const id = googleAdsId();
  if (!id) return null;

  return (
    <>
      {/* Inline vor dem gtag.js-Laden: Consent-Default muss stehen, bevor die Bibliothek läuft. */}
      <script
        id="google-ads-consent"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
gtag('js',new Date());gtag('config','${id}');
document.addEventListener('click',function(event){var link=event.target&&event.target.closest?event.target.closest('a[data-lp-cta]'):null;if(link){gtag('event','lp_cta_click',{send_to:'${id}',cta:link.getAttribute('data-lp-cta')});}});`,
        }}
      />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}
