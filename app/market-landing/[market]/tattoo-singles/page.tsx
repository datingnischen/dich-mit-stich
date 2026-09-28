import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GoogleAdsTag } from "@/components/google-ads-tag";
import { TattooSinglesLanding } from "@/components/tattoo-singles-landing";
import { resolveLandingContent, type LandingSearchParams } from "@/lib/landing-tattoo-singles";
import { isMarketCode, type MarketCode } from "@/lib/markets";
import { brandedTitle } from "@/lib/seo-title";

import "../../../landing-tattoo-singles.css";

/**
 * Google-Ads-Landingpage. Öffentlich unter /tattoo-singles/kennenlernen/ auf dich-mit-stich.de, .at
 * und .ch; proxy.ts schreibt dorthin um (lib/markets.ts). Ohne Menü, ohne Ausstiege, noindex – die
 * indexierte Städte-Übersicht bleibt /tattoo-singles/.
 */

type PageProps = {
  params: Promise<{ market: string }>;
  searchParams: Promise<LandingSearchParams>;
};

function landingMarket(value: string): MarketCode {
  if (!isMarketCode(value)) notFound();
  return value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const market = landingMarket((await params).market);
  const content = resolveLandingContent(market, await searchParams);

  return {
    title: brandedTitle(content.title),
    description: content.description,
    alternates: { canonical: content.canonical },
    // Ads-Seite: nicht indexieren, damit sie nicht mit /tattoo-singles/ konkurriert. AdsBot ignoriert noindex.
    robots: { index: false, follow: true },
  };
}

export default async function TattooSinglesLandingPage({ params, searchParams }: PageProps) {
  const market = landingMarket((await params).market);
  const content = resolveLandingContent(market, await searchParams);

  return (
    <>
      <GoogleAdsTag />
      <TattooSinglesLanding content={content} />
    </>
  );
}
