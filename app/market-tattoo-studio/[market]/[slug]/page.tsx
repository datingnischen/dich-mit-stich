import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TattooStudioDetail } from "@/components/tattoo-studio-detail";
import { publicUrl } from "@/lib/markets";
import {
  getTattooStudio,
  getTattooStudioCityGuide,
  getTattooStudioSlugs,
  isTattooStudioMarket,
  TATTOO_STUDIO_MARKETS,
} from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export function generateStaticParams() {
  return TATTOO_STUDIO_MARKETS.flatMap((market) =>
    getTattooStudioSlugs(market).map((slug) => ({ market, slug })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isTattooStudioMarket(market)) return { robots: { index: false, follow: false } };
  const studio = getTattooStudio(market, slug);
  if (!studio) return { robots: { index: false, follow: false } };
  return {
    title: `${studio.name} in ${studio.cityName}: Studio-Profil`,
    description: `${studio.name} in ${studio.cityName}: Stilrichtungen, Adresse, Website und transparente redaktionelle Einordnung.`,
    alternates: { canonical: publicUrl(market, `/tattoo-studio/${slug}`) },
    robots: { index: false, follow: true },
  };
}

export default async function MarketTattooStudioDetailPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isTattooStudioMarket(market)) notFound();
  const studio = getTattooStudio(market, slug);
  if (!studio) notFound();
  const city = getTattooStudioCityGuide(market, studio.citySlug);
  if (!city) notFound();

  return <TattooStudioDetail studio={studio} city={city} market={market} />;
}
