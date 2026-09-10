import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { TattooStudioCityGuide, tattooStudioCityDescription } from "@/components/tattoo-studio-city-guide";
import { publicUrl } from "@/lib/markets";
import { getTattooStudioCities, getTattooStudioCityGuide } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return getTattooStudioCities("de").map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) return {};

  const title = `Tattoo-Studios in ${guide.cityName}: redaktioneller Guide`;
  const description = tattooStudioCityDescription(guide.cityName, guide.studios.length);
  const url = publicUrl("de", `/tattoo-studios/${city}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      ...(guide.imageUrl ? { images: [{ url: guide.imageUrl, alt: `Tattoo-Studio-Guide für ${guide.cityName}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(guide.imageUrl ? { images: [guide.imageUrl] } : {}),
    },
  };
}

export default async function TattooStudioCityPage({ params }: PageProps) {
  const { city } = await params;
  const guide = getTattooStudioCityGuide("de", city);
  if (!guide) notFound();

  return (
    <SiteFrame market="de" sectionLive aid="location">
      <TattooStudioCityGuide guide={guide} market="de" />
    </SiteFrame>
  );
}
