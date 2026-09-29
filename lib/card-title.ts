// Seobility flags link texts that are too long. Titles like "Floral Sleeve Tattoo – Rosen und Blätter – fein
// schattiert, besonders harmonisch als Full Sleeve" link only their head; the tail stays visible as plain text.
export const MAX_CARD_LINK_TEXT = 60;

export function splitCardTitle(title: string): [head: string, tail: string | null] {
  if (title.length <= MAX_CARD_LINK_TEXT) return [title, null];
  const dash = title.indexOf(" – ");
  if (dash <= 0) return [title, null];
  return [title.slice(0, dash), title.slice(dash + 3)];
}
