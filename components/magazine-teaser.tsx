import { localizeFirstPartyText } from "@/lib/market-html";
import { teaserText } from "@/lib/wordpress";

type MagazineTeaserProps = {
  entry: { excerpt?: string; content?: string };
  length: number;
  origin: string;
  className?: string;
};

// Renders nothing when the article has no usable teaser, so cards never show a one-line stub.
export function MagazineTeaser({ entry, length, origin, className }: MagazineTeaserProps) {
  const teaser = teaserText(entry, length);
  if (!teaser) return null;

  return <p className={className}>{localizeFirstPartyText(teaser, origin)}…</p>;
}
