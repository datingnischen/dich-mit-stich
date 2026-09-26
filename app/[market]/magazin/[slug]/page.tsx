import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineDetail } from "@/components/magazine-detail";
import { getAuthorProfilePage } from "@/lib/author-profile-pages";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { magazineMetaTitle } from "@/lib/magazine-seo";
import { localizeFirstPartyText } from "@/lib/market-html";
import { getMarketMagazineDetailContext, getMarketMagazineEntryBySlug, getMarketMagazineRouteEntries } from "@/lib/market-magazine";
import { isMarketCode, publicUrl } from "@/lib/markets";
import { teaserText } from "@/lib/wordpress";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const [atEntries, chEntries] = await Promise.all([
    getMarketMagazineRouteEntries("at"),
    getMarketMagazineRouteEntries("ch"),
  ]);
  return [
    ...atEntries.map((entry) => ({ market: "at", slug: entry.slug })),
    ...chEntries.map((entry) => ({ market: "ch", slug: entry.slug })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const entry = await getMarketMagazineEntryBySlug(market, slug);
  if (!entry) return {};
  const detailContext = getMarketMagazineDetailContext(market, slug, {
    src: entry.featuredImage,
    alt: entry.featuredImageAlt || entry.title,
  });
  if (!detailContext) return {};
  const { quarantined, quarantineDescription, editorialOverride, answerEngineEntry } = detailContext;
  const authorProfilePage = getAuthorProfilePage(slug);
  return {
    title: magazineMetaTitle(entry),
    description: localizeFirstPartyText(
      quarantined
        ? quarantineDescription
        : authorProfilePage?.lead ?? entry.seoDescription ?? answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? teaserText(entry, 155),
      publicUrl(market),
    ),
    alternates: { canonical: publicUrl(market, `/magazin/${slug}`) },
    robots: marketEditorialRobots(market, quarantined),
  };
}

export default async function MarketMagazineDetailPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") notFound();
  if (!await getMarketMagazineEntryBySlug(market, slug)) notFound();
  return <MagazineDetail market={market} slug={slug} />;
}
