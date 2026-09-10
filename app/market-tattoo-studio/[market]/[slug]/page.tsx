import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TattooStudioDetail } from "@/components/tattoo-studio-detail";
import { publicUrl } from "@/lib/markets";
import { getTattooStudio, getTattooStudioCityGuide, getTattooStudioSlugs } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export function generateStaticParams() {
  return getTattooStudioSlugs("ch").map((slug) => ({ market: "ch", slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (market !== "ch") return { robots: { index: false, follow: false } };
  const studio = getTattooStudio("ch", slug);
  if (!studio) return { robots: { index: false, follow: false } };
  return {
    title: `${studio.name} in ${studio.cityName}: Studio-Profil`,
    description: `${studio.name} in ${studio.cityName}: Stilrichtungen, Adresse, Website und transparente redaktionelle Einordnung.`,
    alternates: { canonical: publicUrl("ch", `/tattoo-studio/${slug}`) },
    robots: { index: false, follow: true },
  };
}

export default async function SwissTattooStudioDetailPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (market !== "ch") notFound();
  const studio = getTattooStudio("ch", slug);
  if (!studio) notFound();
  const city = getTattooStudioCityGuide("ch", studio.citySlug);
  if (!city) notFound();

  return <TattooStudioDetail studio={studio} city={city} market="ch" />;
}
