import { decodeHtmlEntities, stripHtml } from "./wordpress.ts";
import { firstPartyInternalPath } from "./market-html.ts";

/**
 * City pages come from WordPress as one long HTML block: an intro, then h2 sections that are
 * mostly "<strong>Name</strong> – text" lists. This splits that block into themed sections so
 * the page can show them as cards instead of a wall of bullet points.
 */

export type CityGuideTheme =
  | "studios"
  | "cities"
  | "hotspots"
  | "events"
  | "nightlife"
  | "streetart"
  | "shopping"
  | "culture"
  | "history"
  | "dating"
  | "scene";

export type CityGuideItem = {
  name: string;
  address: string;
  /** Sanitized HTML from WordPress, safe to render as is. */
  html: string;
};

export type CityGuideSection = {
  id: string;
  theme: CityGuideTheme;
  heading: string;
  /** Paragraphs before the list, sanitized HTML. */
  leadHtml: string;
  items: CityGuideItem[];
  /** Everything that is neither lead nor card list, sanitized HTML. */
  restHtml: string;
};

export type CityGuide = {
  introHtml: string;
  sections: CityGuideSection[];
  relatedCitySlugs: string[];
  hasStudioSection: boolean;
};

export const CITY_GUIDE_THEMES: Record<CityGuideTheme, { label: string; unit: [string, string] }> = {
  studios: { label: "Tattoo-Studios", unit: ["Studio", "Studios"] },
  cities: { label: "Weitere Städte", unit: ["Stadt", "Städte"] },
  hotspots: { label: "Hotspots", unit: ["Hotspot", "Hotspots"] },
  events: { label: "Events", unit: ["Event", "Events"] },
  nightlife: { label: "Nachtleben", unit: ["Club & Bar", "Clubs & Bars"] },
  streetart: { label: "Street Art", unit: ["Spot", "Spots"] },
  shopping: { label: "Mode & Shops", unit: ["Shop", "Shops"] },
  culture: { label: "Kunst & Kultur", unit: ["Tipp", "Tipps"] },
  history: { label: "Geschichte", unit: ["Kapitel", "Kapitel"] },
  dating: { label: "Flirt-Tipps", unit: ["Tipp", "Tipps"] },
  scene: { label: "Szene", unit: ["Tipp", "Tipps"] },
};

const THEME_PATTERNS: [RegExp, CityGuideTheme][] = [
  [/andere interessante st|weitere st[aä]dte|ähnliche st/i, "cities"],
  [/tattoo-studio|studios\b/i, "studios"],
  [/nachtleben|bars?\b|club|kneipe|restaurant/i, "nightlife"],
  [/event|festival|veranstaltung|freiluft/i, "events"],
  [/street ?art|urban/i, "streetart"],
  [/mode|shop/i, "shopping"],
  [/geschichte/i, "history"],
  [/kunst|kultur(?!-hot)/i, "culture"],
  [/tipps|dating|partnersuche|flirt|kennenlernen|kino/i, "dating"],
  [/hotspot|subkultur|szene|orte|locations|treff/i, "hotspots"],
];

const H2 = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
const LIST = /<ul[^>]*>([\s\S]*?)<\/ul>/i;
const LIST_ITEM = /<li[^>]*>([\s\S]*?)<\/li>/gi;
const DASH = /^\s*(?:&ndash;|&mdash;|[–—-]|&#8211;|&#8212;)\s*/;

function plainText(html: string) {
  return decodeHtmlEntities(stripHtml(html)).replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

export function cityGuideTheme(heading: string): CityGuideTheme {
  return THEME_PATTERNS.find(([pattern]) => pattern.test(heading))?.[1] ?? "scene";
}

function anchor(heading: string, index: number) {
  const slug = heading
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-");
  return slug || `abschnitt-${index + 1}`;
}

/** Drops empty paragraphs, rules and the legacy "Bildquelle: https://…" footer. */
function tidy(html: string) {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/<p>\s*Bildquelle:[\s\S]*?<\/p>/gi, "")
    .replace(/<hr\s*\/?>/gi, "")
    .replace(/<p>(?:&nbsp;|\s)+/gi, "<p>")
    .trim();
}

function parseItem(html: string): CityGuideItem | null {
  const match = html.match(/^\s*<(strong|b)>([\s\S]*?)<\/\1>([\s\S]*)$/i);
  if (!match) return null;
  let rest = match[3].replace(DASH, "");
  let address = "";
  const addressMatch = rest.match(/^\s*<em>([\s\S]*?)<\/em>\s*(?:<br\s*\/?>)?/i);
  if (addressMatch && /\d/.test(addressMatch[1])) {
    address = plainText(addressMatch[1]);
    rest = rest.slice(addressMatch[0].length);
  }
  rest = rest.replace(/^\s*(?:<br\s*\/?>\s*)+/i, "").replace(DASH, "").trim();
  const name = plainText(match[2]).replace(/[:–-]\s*$/, "").trim();
  if (!name) return null;
  return { name, address, html: rest };
}

function linkedCitySlugs(html: string) {
  const slugs: string[] = [];
  for (const match of html.matchAll(/<a[^>]*href="([^"]+)"/gi)) {
    const path = firstPartyInternalPath(decodeHtmlEntities(match[1]));
    const slug = path?.match(/^\/tattoo-singles\/([a-z0-9-]+)\/?$/i)?.[1];
    if (slug && !slugs.includes(slug)) slugs.push(slug.toLowerCase());
  }
  return slugs;
}

function parseSection(heading: string, body: string, index: number): CityGuideSection {
  const theme = cityGuideTheme(heading);
  const listMatch = body.match(LIST);
  let leadHtml = body;
  let items: CityGuideItem[] = [];
  let restHtml = "";

  if (listMatch && listMatch.index !== undefined) {
    const parsed = [...listMatch[1].matchAll(LIST_ITEM)].map((item) => parseItem(item[1]));
    // Only turn a list into cards when every entry has a name; anything else stays prose.
    if (parsed.length && parsed.every(Boolean)) {
      items = parsed as CityGuideItem[];
      leadHtml = body.slice(0, listMatch.index);
      restHtml = body.slice(listMatch.index + listMatch[0].length);
    }
  }

  return {
    id: anchor(heading, index),
    theme,
    heading,
    leadHtml: tidy(leadHtml),
    items,
    restHtml: tidy(restHtml),
  };
}

export function parseCityGuide(html = ""): CityGuide {
  const matches = [...html.matchAll(H2)];
  const introHtml = tidy(matches.length ? html.slice(0, matches[0].index) : html);
  const relatedCitySlugs: string[] = [];
  let hasStudioSection = false;
  const sections: CityGuideSection[] = [];

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : html.length;
    const body = html.slice(start, end);
    const heading = plainText(match[1]);
    const section = parseSection(heading, body, index);

    // Studios have their own guide pages and other cities get their own card row, so neither
    // is repeated as a section.
    if (section.theme === "studios") {
      hasStudioSection = true;
      return;
    }
    if (section.theme === "cities") {
      relatedCitySlugs.push(...linkedCitySlugs(body).filter((slug) => !relatedCitySlugs.includes(slug)));
      return;
    }
    if (!section.leadHtml && !section.items.length && !section.restHtml) return;
    sections.push(section);
  });

  const usedIds = new Set<string>();
  for (const section of sections) {
    let id = section.id;
    for (let n = 2; usedIds.has(id); n += 1) id = `${section.id}-${n}`;
    section.id = id;
    usedIds.add(id);
  }

  return { introHtml, sections, relatedCitySlugs, hasStudioSection };
}

export function cityGuideUnit(theme: CityGuideTheme, count: number) {
  const [one, many] = CITY_GUIDE_THEMES[theme].unit;
  return count === 1 ? one : many;
}
