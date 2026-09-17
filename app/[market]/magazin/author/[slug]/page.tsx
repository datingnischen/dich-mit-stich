import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineAuthor } from "@/components/magazine-author";
import { getAuthorProfile, getKnownAuthorSlugs } from "@/lib/author-profiles";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { localizeFirstPartyText } from "@/lib/market-html";
import { isMarketCode, publicUrl } from "@/lib/markets";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const slugs = await getKnownAuthorSlugs();
  return ["at", "ch"].flatMap((market) => slugs.map((slug) => ({ market, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const profile = await getAuthorProfile(slug);
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
  return <MagazineAuthor market={market} slug={slug} />;
}
