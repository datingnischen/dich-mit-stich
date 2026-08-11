export type MagazineFeaturedImage = {
  src: string;
  alt: string;
};

type MagazineFeaturedImageFallback = {
  src?: string;
  alt: string;
};

const featuredImageOverrides: Record<string, MagazineFeaturedImage> = {
  "christina-piercing": {
    src: "/images/magazine/christina-piercing-featured.webp",
    alt: "Roséfarbener Christina-Piercing-Schmuck auf bordeauxfarbenem Satin",
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
