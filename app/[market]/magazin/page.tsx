import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineOverview } from "@/components/magazine-overview";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { isMarketCode, publicUrl } from "@/lib/markets";

export const revalidate = 900;

export function generateStaticParams() {
  return [{ market: "at" }, { market: "ch" }];
}

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") return {};
  return {
    title: "Flirtradar: Tattoo-, Piercing- & Szene-Magazin",
    description: "Tattoo-Wissen, Piercing-Ratgeber, Motive und echte Geschichten: Entdecke fundierte Artikel für Menschen mit eigenem Stil.",
    alternates: { canonical: publicUrl(market, "/magazin") },
    robots: marketEditorialRobots(market),
  };
}

export default async function MarketMagazineOverviewPage({ params }: { params: Promise<{ market: string }> }) {
  const market = (await params).market;
  if (!isMarketCode(market) || market === "de") notFound();
  return <MagazineOverview market={market} />;
}
