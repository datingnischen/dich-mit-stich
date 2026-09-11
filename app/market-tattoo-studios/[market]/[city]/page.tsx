import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TattooStudioCityGuide, tattooStudioCityDescription } from "@/components/tattoo-studio-city-guide";
import { publicUrl } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import {
  getTattooStudioCities,
  getTattooStudioCityGuide,
  isTattooStudioMarket,
  TATTOO_STUDIO_MARKETS,
} from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string; city: string }> };

export function generateStaticParams() {
  return TATTOO_STUDIO_MARKETS.flatMap((market) =>
    getTattooStudioCities(market).map((city) => ({ market, city: city.slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, city } = await params;
  if (!isTattooStudioMarket(market)) return { robots: { index: false, follow: false } };
  const guide = getTattooStudioCityGuide(market, city);
  if (!guide) return { robots: { index: false, follow: false } };

  const title = `Tattoo-Studios in ${guide.cityName}: redaktioneller Guide`;
  const description = tattooStudioCityDescription(guide.cityName, guide.studios.length);
  const url = publicUrl(market, `/tattoo-studios/${city}`);
  const imageUrl = guide.imageUrl ? staticAsset(guide.imageUrl) : null;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: `Tattoo-Studio-Guide für ${guide.cityName}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function MarketTattooStudioCityPage({ params }: PageProps) {
  const { market, city } = await params;
  if (!isTattooStudioMarket(market)) notFound();
  const guide = getTattooStudioCityGuide(market, city);
  if (!guide) notFound();

  return <TattooStudioCityGuide guide={guide} market={market} />;
}
