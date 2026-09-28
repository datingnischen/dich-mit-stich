import { conversionUrl } from "./conversion-links.ts";
import { getIconyCityWidgetConfig, getIconyProjectKey } from "./icony-city-widgets.ts";
import { getMarket, publicUrl, TATTOO_SINGLES_LANDING_PATH, type MarketCode } from "./markets.ts";

/**
 * Google-Ads-Landingpage /tattoo-singles/kennenlernen/ auf DE, AT und CH.
 *
 * Message-Match: Jede Anzeigengruppe hängt ?v=<variante> an die Final-URL, optional ?stadt=<slug>
 * für Städte-Anzeigengruppen. Überschrift, Eyebrow und Live-Widget folgen dem Parameter, damit die
 * Seite genau das sagt, was die Anzeige versprochen hat. Unbekannte Werte fallen still auf den Standard.
 */

export const LANDING_VARIANTS = ["singles", "dating", "piercing", "frauen", "maenner", "partnersuche"] as const;

export type LandingVariant = (typeof LANDING_VARIANTS)[number];

export const DEFAULT_LANDING_VARIANT: LandingVariant = "singles";

/** Städte mit ICONY-Postleitzahl (lib/icony-city-widgets.ts) und ihrem Anzeigenamen. */
export const LANDING_CITY_LABELS: Record<MarketCode, Record<string, string>> = {
  de: {
    berlin: "Berlin",
    bochum: "Bochum",
    bonn: "Bonn",
    bremen: "Bremen",
    dortmund: "Dortmund",
    dresden: "Dresden",
    duisburg: "Duisburg",
    duesseldorf: "Düsseldorf",
    essen: "Essen",
    "frankfurt-am-main": "Frankfurt am Main",
    hamburg: "Hamburg",
    hannover: "Hannover",
    karlsruhe: "Karlsruhe",
    koeln: "Köln",
    leipzig: "Leipzig",
    mannheim: "Mannheim",
    muenchen: "München",
    muenster: "Münster",
    nuernberg: "Nürnberg",
    stuttgart: "Stuttgart",
    wuppertal: "Wuppertal",
  },
  at: {
    dornbirn: "Dornbirn",
    graz: "Graz",
    innsbruck: "Innsbruck",
    klagenfurt: "Klagenfurt",
    linz: "Linz",
    salzburg: "Salzburg",
    "sankt-poelten": "St. Pölten",
    villach: "Villach",
    wels: "Wels",
    wien: "Wien",
    "wiener-neustadt": "Wiener Neustadt",
  },
  ch: {
    basel: "Basel",
    bern: "Bern",
    "biel-bienne": "Biel/Bienne",
    genf: "Genf",
    lausanne: "Lausanne",
    lugano: "Lugano",
    luzern: "Luzern",
    "st-gallen": "St. Gallen",
    winterthur: "Winterthur",
    zuerich: "Zürich",
  },
};

type MarketCopy = {
  /** "in Deutschland" */
  countryPhrase: string;
  /** "von Berlin bis München" */
  cityRange: string;
  /** Postleitzahl für das Live-Widget ohne Städte-Parameter (grösste Stadt des Landes). */
  defaultCitySlug: string;
};

const MARKET_COPY: Record<MarketCode, MarketCopy> = {
  de: { countryPhrase: "in Deutschland", cityRange: "von Berlin bis München", defaultCitySlug: "berlin" },
  at: { countryPhrase: "in Österreich", cityRange: "von Wien bis Innsbruck", defaultCitySlug: "wien" },
  ch: { countryPhrase: "in der Schweiz", cityRange: "von Zürich bis Genf", defaultCitySlug: "zuerich" },
};

type VariantCopy = {
  eyebrow: (place: string) => string;
  headline: (countryPhrase: string) => string;
  cityHeadline: (city: string) => string;
  subline: string;
  /** Überschrift über dem Live-Widget ohne Stadt. */
  liveTitle: string;
};

const VARIANT_COPY: Record<LandingVariant, VariantCopy> = {
  singles: {
    eyebrow: (place) => `Tattoo-Singles ${place}`,
    headline: (countryPhrase) => `Tattoo-Singles ${countryPhrase} kennenlernen`,
    cityHeadline: (city) => `Tattoo-Singles in ${city} kennenlernen`,
    subline:
      "Die Singlebörse für Menschen mit Tinte: kostenlos anmelden, sehen, wer in deinem Umkreis online ist, und Leute treffen, die deine Tattoos feiern statt zu hinterfragen.",
    liveTitle: "Diese Tattoo-Singles sind gerade aktiv",
  },
  dating: {
    eyebrow: (place) => `Tattoo-Dating ${place}`,
    headline: () => "Tattoo-Dating, das zu deinem Stil passt",
    cityHeadline: (city) => `Tattoo-Dating in ${city}: Singles mit Tinte treffen`,
    subline:
      "Statt Massenbörse: Bei Dich mit Stich triffst du Singles, die Tattoos und Piercings lieben. Kostenlos registrieren und in wenigen Minuten sehen, wer in deiner Nähe ist.",
    liveTitle: "Wer ist gerade online?",
  },
  piercing: {
    eyebrow: (place) => `Piercing- & Tattoo-Singles ${place}`,
    headline: () => "Gepiercte und tätowierte Singles kennenlernen",
    cityHeadline: (city) => `Gepiercte und tätowierte Singles in ${city}`,
    subline:
      "Septum, Sleeve oder Fine Line: Hier musst du nichts erklären. Registriere dich kostenlos und lerne Singles kennen, die Körperschmuck genauso lieben wie du.",
    liveTitle: "Diese Singles sind gerade aktiv",
  },
  frauen: {
    eyebrow: (place) => `Tätowierte Frauen ${place}`,
    headline: () => "Tätowierte Frauen kennenlernen",
    cityHeadline: (city) => `Tätowierte Frauen in ${city} kennenlernen`,
    subline:
      "Lerne Frauen kennen, die Tattoos nicht nur mögen, sondern selbst tragen. Kostenlos anmelden, Profile aus deinem Umkreis sehen und ohne Umwege ins Gespräch kommen.",
    liveTitle: "Diese Frauen sind gerade aktiv",
  },
  maenner: {
    eyebrow: (place) => `Tätowierte Männer ${place}`,
    headline: () => "Tätowierte Männer kennenlernen",
    cityHeadline: (city) => `Tätowierte Männer in ${city} kennenlernen`,
    subline:
      "Lerne Männer kennen, die Tinte tragen und wissen, was ein gutes Motiv ausmacht. Kostenlos anmelden, Profile aus deinem Umkreis sehen und ohne Umwege ins Gespräch kommen.",
    liveTitle: "Diese Männer sind gerade aktiv",
  },
  partnersuche: {
    eyebrow: (place) => `Partnersuche für Tätowierte ${place}`,
    headline: () => "Partnersuche für Tätowierte",
    cityHeadline: (city) => `Partnersuche für Tätowierte in ${city}`,
    subline:
      "Eine Beziehung mit jemandem, der deine Leidenschaft teilt: Bei Dich mit Stich suchen Singles, die es ernst meinen. Kostenlos registrieren und in Ruhe umsehen.",
    liveTitle: "Diese Singles suchen gerade",
  },
};

export type LandingCity = { slug: string; label: string; postalCode: string };

export type LandingContent = {
  market: MarketCode;
  variant: LandingVariant;
  city: LandingCity | null;
  countryName: string;
  countryPhrase: string;
  cityRange: string;
  eyebrow: string;
  headline: string;
  subline: string;
  liveTitle: string;
  /** Gender, das das Live-Widget zuerst zeigt (Frauen-Anzeigengruppe zeigt Frauen). */
  liveGender: "women" | "men";
  /** Postleitzahl und Projekt für das ICONY-Live-Widget. */
  projectKey: string;
  postalCode: string;
  registrationUrl: string;
  canonical: string;
  title: string;
  description: string;
};

export function isLandingVariant(value: unknown): value is LandingVariant {
  return typeof value === "string" && (LANDING_VARIANTS as readonly string[]).includes(value);
}

/** Schweizer Schreibung: kein ß. Alle anderen Märkte bleiben unverändert. */
export function localizeLandingText(market: MarketCode, text: string): string {
  return market === "ch" ? text.replaceAll("ß", "ss") : text;
}

export function resolveLandingCity(market: MarketCode, slug: unknown): LandingCity | null {
  if (typeof slug !== "string") return null;
  const label = LANDING_CITY_LABELS[market][slug];
  const widget = label ? getIconyCityWidgetConfig(market, slug) : null;
  if (!label || !widget) return null;
  return { slug, label, postalCode: widget.postalCode };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type LandingSearchParams = Record<string, string | string[] | undefined>;

export function resolveLandingContent(market: MarketCode, searchParams: LandingSearchParams = {}): LandingContent {
  const requestedVariant = firstValue(searchParams.v);
  const variant = isLandingVariant(requestedVariant) ? requestedVariant : DEFAULT_LANDING_VARIANT;
  const city = resolveLandingCity(market, firstValue(searchParams.stadt));
  const marketCopy = MARKET_COPY[market];
  const copy = VARIANT_COPY[variant];
  const config = getMarket(market);
  const fallbackCity = resolveLandingCity(market, marketCopy.defaultCitySlug);
  if (!fallbackCity) throw new Error(`Landing default city missing for ${market}`);

  const t = (text: string) => localizeLandingText(market, text);
  const place = city ? `in ${city.label}` : marketCopy.countryPhrase;
  const headline = city ? copy.cityHeadline(city.label) : copy.headline(marketCopy.countryPhrase);

  return {
    market,
    variant,
    city,
    countryName: config.countryName,
    countryPhrase: marketCopy.countryPhrase,
    cityRange: marketCopy.cityRange,
    eyebrow: t(copy.eyebrow(place)),
    headline: t(headline),
    subline: t(copy.subline),
    liveTitle: city ? t(`Neue Singles in ${city.label} und Umgebung`) : t(copy.liveTitle),
    liveGender: variant === "maenner" ? "men" : "women",
    projectKey: getIconyProjectKey(market),
    postalCode: (city ?? fallbackCity).postalCode,
    registrationUrl: conversionUrl(publicUrl(market), "/registration/", "location"),
    canonical: publicUrl(market, TATTOO_SINGLES_LANDING_PATH),
    title: t(`${headline} – kostenlos registrieren`),
    description: t(
      `Tattoo-Singles ${marketCopy.countryPhrase} kennenlernen: kostenlos registrieren, Singles im Umkreis sehen und Menschen treffen, die Tattoos und Piercings lieben.`,
    ),
  };
}
