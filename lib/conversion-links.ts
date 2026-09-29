/**
 * Registrierungs-AIDs. Regel: `magazin` im Magazin/Ratgeber, `location` überall sonst.
 * Einzige Ausnahme: die Google-Ads-Landingpage /tattoo-singles/kennenlernen/ zählt mit eigener AID,
 * damit ICONY Ads-Registrierungen getrennt ausweist. Jede AID muss im ICONY-Backend angelegt sein.
 */
export const ADS_LANDING_AID = "gads-kennenlernen";

export type ConversionAid = "location" | "magazin" | typeof ADS_LANDING_AID;

/** Setzt die AID auf einen beliebigen ICONY-Link (z. B. Profilkarten aus dem Aktivitäten-Widget). */
export function withAid(href: string, aid: ConversionAid): string {
  try {
    const url = new URL(href);
    url.searchParams.set("AID", aid);
    return url.toString();
  } catch {
    return href;
  }
}

export function conversionPathname(pathname: string, aid?: ConversionAid) {
  if (aid === "magazin" && (pathname === "/" || pathname === "/registration/")) {
    return "/suche/";
  }
  return pathname;
}

export function conversionUrl(origin: string, pathname: string, aid?: ConversionAid) {
  const url = new URL(origin);
  const convertedPath = conversionPathname(pathname, aid);
  url.pathname = convertedPath === "/" || convertedPath === "/suche/"
    ? convertedPath
    : `/${convertedPath.replace(/^\/+|\/+$/g, "")}/`; // ICONY leitet /registration ohne "/" per 301 weiter und verliert dabei die AID
  url.search = "";
  if (aid) url.searchParams.set("AID", aid);
  return url.toString();
}
