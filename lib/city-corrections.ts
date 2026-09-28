// Gezielte Korrekturen an Stadtseiten aus dem WordPress-CPT, solange sie dort nicht gepflegt sind.
// Seobility (2026-09-28): Begriffe aus der H1 fehlten im Text; Hamburg war grammatisch falsch,
// Nürnberg nannte sich „Landeshauptstadt Niedersachsens“ (aus Hannover kopiert).
type CityCorrection = {
  /** Ersetzt Seitentitel und H1 gemeinsam; nur Begriffe, die auch im Text der Seite stehen. */
  heading?: string;
  /** Textersetzungen in allen sichtbaren Feldern der Stadtseite. */
  replace?: ReadonlyArray<readonly [string, string]>;
};

const CITY_CORRECTIONS: Record<string, CityCorrection> = {
  "de:hamburg": { heading: "Tattoo-Singles in Hamburg: die alternative Szene entdecken" },
  "de:dresden": { heading: "Singles in Dresden: Tattoo-Studios und Subkultur-Hotspots" },
  "de:duesseldorf": { heading: "Singles in Düsseldorf: Tattoo-Studios und Treffpunkte" },
  "de:leipzig": { heading: "Singles in Leipzig: Tattoo-Studios und Subkultur-Hotspots" },
  "de:nuernberg": {
    heading: "Tattoo-Singles in Nürnberg: kreative Studios und Hotspots",
    replace: [["in der Landeshauptstadt Niedersachsens", "in der Frankenmetropole"]],
  },
};

type CorrectableCity = {
  market: string;
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  heroTitle: string;
  contentHtml: string;
};

export function applyCityCorrections<T extends CorrectableCity>(city: T): T {
  const correction = CITY_CORRECTIONS[`${city.market}:${city.slug}`];
  if (!correction) return city;

  const fix = (value: string) =>
    (correction.replace || []).reduce((text, [from, to]) => text.split(from).join(to), value);

  return {
    ...city,
    title: correction.heading || fix(city.title),
    h1: correction.heading || fix(city.h1),
    metaDescription: fix(city.metaDescription),
    heroTitle: fix(city.heroTitle),
    contentHtml: fix(city.contentHtml),
  };
}
