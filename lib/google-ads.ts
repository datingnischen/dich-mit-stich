/** Google-Ads-Konto-ID (AW-…) aus NEXT_PUBLIC_GOOGLE_ADS_ID; ohne gültige ID bleibt das Tag und die CSP-Erweiterung aus. */
const GOOGLE_ADS_ID_PATTERN = /^AW-\d{6,}$/;

export function googleAdsId(value: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID): string | null {
  const id = value?.trim() ?? "";
  return GOOGLE_ADS_ID_PATTERN.test(id) ? id : null;
}

/** Zusätzliche CSP-Quellen je Direktive, sobald das Google-Tag aktiv ist (gtag.js, Conversion-Pings, Remarketing-Frame). */
export const GOOGLE_ADS_CSP_SOURCES: Record<string, string[]> = {
  "script-src": ["https://www.googletagmanager.com"],
  "connect-src": [
    "https://www.googletagmanager.com",
    "https://www.google.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://pagead2.googlesyndication.com",
  ],
  "frame-src": ["https://td.doubleclick.net"],
};

export function withGoogleAdsOrigins(directives: string[], enabled = googleAdsId() !== null): string[] {
  if (!enabled) return directives;
  return directives.map((directive) => {
    const name = directive.split(" ", 1)[0];
    const extra = GOOGLE_ADS_CSP_SOURCES[name];
    return extra ? `${directive} ${extra.join(" ")}` : directive;
  });
}
