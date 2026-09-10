import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { TattooStudioDetail } from "@/components/tattoo-studio-detail";
import { publicUrl } from "@/lib/markets";
import { getTattooStudio, getTattooStudioCityGuide, getTattooStudioSlugs } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getTattooStudioSlugs("de").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const studio = getTattooStudio("de", slug);
  if (!studio) return {};
  return {
    title: `${studio.name} in ${studio.cityName}: Studio-Profil`,
    description: `${studio.name} in ${studio.cityName}: Stilrichtungen, Adresse, ${studio.websiteUrl ? "Website" : "Kontakthinweise"} und transparente redaktionelle Einordnung.`,
    alternates: { canonical: publicUrl("de", `/tattoo-studio/${slug}`) },
  };
}

export default async function TattooStudioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const studio = getTattooStudio("de", slug);
  if (!studio) notFound();
  const city = getTattooStudioCityGuide("de", studio.citySlug);
  if (!city) notFound();

  return (
    <SiteFrame market="de" sectionLive aid="location">
      <TattooStudioDetail studio={studio} city={city} market="de" />
    </SiteFrame>
  );
}
