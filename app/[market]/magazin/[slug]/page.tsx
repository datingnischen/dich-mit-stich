import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineDetail } from "@/components/magazine-detail";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { getAnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { getMagazineQuarantineDescription, isMagazineArticleQuarantined } from "@/lib/magazine-content-safety";
import { getMagazineEditorialOverride } from "@/lib/magazine-editorial-overrides";
import { localizeFirstPartyText } from "@/lib/market-html";
import { isMarketCode, publicUrl } from "@/lib/markets";
import { getMagazineEntryBySlug, getMagazineRouteEntries, stripHtml } from "@/lib/wordpress";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const entries = await getMagazineRouteEntries();
  return ["at", "ch"].flatMap((market) => entries.map((entry) => ({ market, slug: entry.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) return {};
  const quarantined = isMagazineArticleQuarantined(slug);
  const editorialOverride = getMagazineEditorialOverride(slug);
  const answerEngineEntry = getAnswerEnginePilotEntry(slug);
  return {
    title: `${entry.title} | dich-mit-stich Magazin`,
    description: localizeFirstPartyText(
      quarantined ? getMagazineQuarantineDescription() : answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? stripHtml(entry.excerpt || entry.content).slice(0, 155),
      publicUrl(market),
    ),
    alternates: { canonical: publicUrl(market, `/magazin/${slug}`) },
    robots: marketEditorialRobots(market, quarantined),
  };
}

export default async function MarketMagazineDetailPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") notFound();
  return <MagazineDetail market={market} slug={slug} />;
}
