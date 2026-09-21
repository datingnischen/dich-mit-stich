import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineAuthor } from "@/components/magazine-author";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { localizeFirstPartyText } from "@/lib/market-html";
import { getMarketMagazineAuthorProfile, getMarketMagazineAuthorSlugs } from "@/lib/market-magazine";
import { isMarketCode, publicUrl } from "@/lib/markets";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const [atSlugs, chSlugs] = await Promise.all([
    getMarketMagazineAuthorSlugs("at"),
    getMarketMagazineAuthorSlugs("ch"),
  ]);
  return [
    ...atSlugs.map((slug) => ({ market: "at", slug })),
    ...chSlugs.map((slug) => ({ market: "ch", slug })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const profile = await getMarketMagazineAuthorProfile(market, slug);
  if (!profile) return {};
  return {
    title: `${profile.name} | dich-mit-stich Magazin`,
    description: localizeFirstPartyText(profile.bio, publicUrl(market)).slice(0, 155),
    alternates: { canonical: publicUrl(market, profile.profileUrl) },
    robots: marketEditorialRobots(market),
  };
}

export default async function MarketMagazineAuthorPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") notFound();
  if (!await getMarketMagazineAuthorProfile(market, slug)) notFound();
  return <MagazineAuthor market={market} slug={slug} />;
}
