export type MagazineFeaturedImage = {
  src: string;
  alt: string;
};

type MagazineFeaturedImageFallback = {
  src?: string;
  alt: string;
};

const featuredImageOverrides: Record<string, MagazineFeaturedImage> = {
  "anti-eyebrow-piercing": {
    src: "/images/magazine/anti-eyebrow-piercing-featured.svg",
    alt: "Redaktionelle Illustration der Anti-Eyebrow-Position unterhalb des äußeren Auges",
  },
  "christina-piercing": {
    src: "/images/magazine/christina-piercing-featured.webp",
    alt: "Roséfarbener Christina-Piercing-Schmuck auf bordeauxfarbenem Satin",
  },
  "venom-piercing": {
    src: "/images/magazine/venom-piercing-featured.webp",
    alt: "Zwei parallel gesetzte Zungen-Barbells mit roséfarbenen Kugeln als Venom-Piercing-Motiv",
  },
};

export function getMagazineFeaturedImage(
  slug: string,
  fallback: MagazineFeaturedImageFallback,
): MagazineFeaturedImage | null {
  const override = featuredImageOverrides[slug];
  if (override) return override;
  return fallback.src ? { src: fallback.src, alt: fallback.alt } : null;
}
