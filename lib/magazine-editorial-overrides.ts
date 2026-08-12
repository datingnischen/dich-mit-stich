export type MagazineEditorialOverride = {
  kind: "anti-eyebrow";
  summary: string;
  reviewedAt: string;
  reviewedAtLabel: string;
};

const editorialOverrides: Record<string, MagazineEditorialOverride> = {
  "anti-eyebrow-piercing": {
    kind: "anti-eyebrow",
    summary: "Professionell planen, schonend pflegen und Warnzeichen richtig einordnen: der aktualisierte Ratgeber zum Anti-Eyebrow-Piercing.",
    reviewedAt: "2026-08-12",
    reviewedAtLabel: "12.08.2026",
  },
};

export function getMagazineEditorialOverride(slug: string): MagazineEditorialOverride | null {
  return editorialOverrides[slug] ?? null;
}
