import type { AuthorSocialPlatform } from "@/lib/author-profiles";
import { staticAsset } from "@/lib/static-asset";

// Die Icon-Pfade liegen als Dateien in public/icons/social/: inline standen sie auf jeder
// Artikelseite doppelt (HTML + RSC) und drückten das Text-HTML-Verhältnis (Trello #1252).
export function AuthorSocialIcon({ platform }: { platform: AuthorSocialPlatform }) {
  return (
    <span
      className="author-social-icon"
      aria-hidden="true"
      style={{ backgroundImage: `url(${staticAsset(`/icons/social/${platform}.svg`)})` }}
    />
  );
}
