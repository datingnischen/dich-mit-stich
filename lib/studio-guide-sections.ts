import { anchor, dedupeIds, splitH2Sections, splitNamedList, type CityGuideItem } from "./city-guide.ts";

/**
 * The editorial text of a studio city guide follows a loose pattern: intro, the local scene,
 * popular styles, what to check before booking and a summary. Each part gets its own layout.
 */

/** Attribute on links that set the style filter of the studio list, e.g. data-studio-style="fineline". */
export const STUDIO_STYLE_TRIGGER = "data-studio-style";

export type StudioGuideKind = "intro" | "scene" | "styles" | "checklist" | "summary" | "prose";

export type StudioGuideSection = {
  id: string;
  kind: StudioGuideKind;
  heading: string;
  leadHtml: string;
  items: CityGuideItem[];
  restHtml: string;
};

const KIND_PATTERNS: [RegExp, StudioGuideKind][] = [
  [/^einleitung$/i, "intro"],
  [/zusammenfassung|^fazit/i, "summary"],
  [/tattoo-szene/i, "scene"],
  [/stile/i, "styles"],
  [/worauf|prüfen|achten|fehler|vorbereit|so prüfen wir/i, "checklist"],
];

export function studioGuideKind(heading: string, index: number): StudioGuideKind {
  const kind = KIND_PATTERNS.find(([pattern]) => pattern.test(heading))?.[1];
  if (kind) return kind;
  // "Tattoo-Studio in Berlin auswählen" opens the newer guides and works as their intro.
  return index === 0 && /auswählen/i.test(heading) ? "intro" : "prose";
}

export function parseStudioGuide(html = ""): { introHtml: string; sections: StudioGuideSection[] } {
  const { introHtml, sections } = splitH2Sections(html);
  return {
    introHtml,
    sections: dedupeIds(
      sections
        .map(({ heading, body }, index) => ({
          id: anchor(heading, index),
          kind: studioGuideKind(heading, index),
          heading,
          ...splitNamedList(body),
        }))
        .filter((section) => section.leadHtml || section.items.length || section.restHtml),
    ),
  };
}

type StudioWithStyles = { styles: { slug: string; label: string }[] };

/** Studio style slugs mentioned in a style card title such as "Realistic und Black & Grey". */
export function stylesInTitle(title: string, studios: StudioWithStyles[]) {
  // "Fine Line", "Neo-Traditional" and "Oldschool" all name the same styles as the studio data.
  const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9äöü&]/g, "");
  const haystack = squash(title);
  const slugs = new Set<string>();
  for (const studio of studios) {
    for (const style of studio.styles) {
      if (haystack.includes(squash(style.label))) slugs.add(style.slug);
    }
  }
  return [...slugs];
}

/** All styles of a city with the number of studios naming them, most common first. */
export function studioStyleCounts(studios: StudioWithStyles[]) {
  const counts = new Map<string, { slug: string; label: string; count: number }>();
  for (const studio of studios) {
    for (const style of new Map(studio.styles.map((entry) => [entry.slug, entry])).values()) {
      const entry = counts.get(style.slug) ?? { ...style, count: 0 };
      entry.count += 1;
      counts.set(style.slug, entry);
    }
  }
  return [...counts.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "de"));
}
