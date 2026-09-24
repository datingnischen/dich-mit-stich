import { decodeHtmlEntities } from "./wordpress.ts";

/**
 * The /magazin/piercing overview article. Its WordPress text stays as written; the page adds a
 * complete lead, key figures, a timeline and a checklist, all taken from that same text.
 */
export const PIERCING_GUIDE_SLUG = "piercing";

export const PIERCING_GUIDE = {
  lead:
    "Vom Ohrloch der Pharaonen bis zum Helix im Großstadtstudio: wie das Piercing vom Ritual zum Modetrend wurde, wie heute gestochen wird und was du über Schmerzen und Heilung wissen solltest.",
  facts: [
    { value: "5 Mio.+", label: "Menschen in Deutschland sind gepierct" },
    { value: "1550 v. Chr.", label: "Ohrlöcher im alten Ägypten" },
    { value: "1 Woche – 12 Monate", label: "Heilungsdauer je nach Körperstelle" },
  ],
  timeline: [
    { when: "um 1550 v. Chr.", title: "Ägypten", text: "Ohrlöcher werden Mode – sichtbar noch auf der Totenmaske des Tutanchamun." },
    { when: "1960er", title: "Hippies", text: "Nasen- und Ohrpiercings kommen aus Indien in die westliche Kultur." },
    { when: "1975", title: "Los Angeles", text: "Das erste Piercing-Studio öffnet, in den 80ern wird Piercing in Kalifornien zum Trend." },
    { when: "1990er", title: "Punk & Techno", text: "Augenbraue, Lippe, Wange: Piercings werden Teil der Jugendkultur." },
    { when: "2017", title: "Uni Leipzig", text: "Rund ein Drittel der Frauen zwischen 14 und 34 Jahren ist gepierct." },
  ],
  checklist: [
    "Ins Studio statt zur Ohrlochpistole – die lässt sich nicht vollständig desinfizieren.",
    "Beratung einfordern: Der Piercer ist dazu verpflichtet.",
    "Einverständniserklärung unterschreiben, bei Minderjährigen die Erziehungsberechtigten.",
    "Betäubende Spritzen darf nur medizinisches Fachpersonal setzen.",
    "Pflege ernst nehmen: Hygiene entscheidet mit über die Heilungsdauer.",
  ],
} as const;

export type GuideSection = { id: string; heading: string; html: string };

const HEADING = /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi;

function plainText(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function guideAnchor(heading: string) {
  return heading
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cuts the article at its h2/h3 headings; text before the first heading is the intro. */
export function splitGuideSections(html = ""): { intro: string; sections: GuideSection[] } {
  const matches = [...html.matchAll(HEADING)];
  if (!matches.length) return { intro: html, sections: [] };

  const intro = html.slice(0, matches[0].index);
  const sections = matches.map((match, index) => {
    const end = index + 1 < matches.length ? matches[index + 1].index : html.length;
    const heading = plainText(match[1]);
    return { id: guideAnchor(heading) || `abschnitt-${index + 1}`, heading, html: html.slice(match.index, end) };
  });

  return { intro, sections };
}

/** Short navigation labels; the WordPress headings are full sentences. */
export function guideNavLabel(heading: string) {
  const labels: [RegExp, string][] = [
    [/^traditionelle/i, "Tradition"],
    [/^spirituelle/i, "Rituale"],
    [/^modeph/i, "Westliche Kultur"],
    [/^wie kommt/i, "Beim Piercer"],
    [/^schmerzen/i, "Schmerzen"],
    [/^heilung/i, "Heilung"],
  ];
  return labels.find(([pattern]) => pattern.test(heading))?.[1] ?? heading;
}
