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

/** Lead for the Piercingarten hub; its WordPress intro only says that it is an overview. */
export const PIERCING_HUB_LEAD =
  "Von Anti-Eyebrow bis Zungenpiercing: alle Piercingarten nach Körperstelle sortiert – Gesicht, Mund, Ohr, Körper und Intim. Jede Art hat ihren eigenen Ratgeber zu Position, Schmuck und Wirkung.";

type PiercingRegion = { key: string; short: string; pattern: RegExp; text: string };

const PIERCING_REGIONS: PiercingRegion[] = [
  {
    key: "gesicht",
    short: "Gesicht",
    pattern: /gesicht/i,
    text: "Augenbraue, Nase, Wange, Kinn: Piercings, die man sofort sieht – vom dezenten Nostril bis zum Bridge zwischen den Augen.",
  },
  {
    key: "mund",
    short: "Mund",
    pattern: /mund|lippe/i,
    text: "Lippe, Zunge, Lippenbändchen: die größte Gruppe – vom Labret und Medusa bis zu Paaren wie Snakebite oder Venom.",
  },
  {
    key: "ohr",
    short: "Ohr",
    pattern: /ohr/i,
    text: "Vom Ohrläppchen bis in den Knorpel: Helix, Tragus, Daith oder Industrial lassen sich zu einem ganzen Ohr-Setup kombinieren.",
  },
  {
    key: "koerper",
    short: "Körper",
    pattern: /körper|koerper/i,
    text: "Bauchnabel, Brustwarze und Surface-Piercings, die flach unter der Haut liegen.",
  },
  {
    key: "intim",
    short: "Intim",
    pattern: /intim/i,
    text: "Für Frauen und Männer, vom Christina bis zum Prinz Albert. Hier zählen die Erfahrung des Piercers und Hygiene besonders.",
  },
];

/** Short name and intro for a body-region group, matched on its heading ("Ohrpiercings" → Ohr). */
export function piercingRegion(heading: string) {
  const region = PIERCING_REGIONS.find((candidate) => candidate.pattern.test(heading));
  return {
    key: region?.key ?? guideAnchor(heading),
    short: region?.short ?? (heading.replace(/s?piercings$/i, "") || heading),
    text: region?.text,
  };
}

/** One anchor per region, shared by the hero picker, the jump bar and the region banner. */
export function piercingRegionAnchor(heading: string) {
  return `piercingarten-${piercingRegion(heading).key}`;
}

// Only the last heading: its content may not open another heading, or the match starts at the first one.
const TRAILING_HEADING = /<h([2-4])\b[^>]*>(?:(?!<h[1-6]\b)[\s\S])*?<\/h\1>\s*$/i;
const IMAGE_PARAGRAPH = /<p\b[^>]*>\s*(?:<a\b[^>]*>\s*)?<img\b[^>]*>\s*(?:<\/a>\s*)?<\/p>/gi;

/**
 * The prose before a hub list ends with that list's heading and illustration. The region banner
 * shows both, so the prose drops them: every image-only paragraph after the last text block, and
 * then the heading they followed.
 */
export function stripGroupIntro(html: string) {
  let rest = html.replace(/\s+$/, "");
  let previous = "";
  while (previous !== rest) {
    previous = rest;
    const lastImage = [...rest.matchAll(IMAGE_PARAGRAPH)].pop();
    if (lastImage && lastImage.index + lastImage[0].length === rest.length) {
      rest = rest.slice(0, lastImage.index).replace(/\s+$/, "");
    }
    rest = rest.replace(TRAILING_HEADING, "").replace(/\s+$/, "");
  }
  return rest;
}

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
