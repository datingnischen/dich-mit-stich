import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineCategory } from "@/components/magazine-category";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { localizeFirstPartyText } from "@/lib/market-html";
import { getMarketMagazineCategories, getMarketMagazineCategoryBySlug } from "@/lib/market-magazine";
import { isMarketCode, publicUrl } from "@/lib/markets";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const [atCategories, chCategories] = await Promise.all([
    getMarketMagazineCategories("at"),
    getMarketMagazineCategories("ch"),
  ]);
  return [
    ...atCategories.map((category) => ({ market: "at", slug: category.slug })),
    ...chCategories.map((category) => ({ market: "ch", slug: category.slug })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const category = await getMarketMagazineCategoryBySlug(market, slug);
  if (!category) return {};
  return {
    title: `${category.name} im Tattoo-Magazin`,
    description: localizeFirstPartyText(
      category.description || `Beiträge aus dem Bereich ${category.name} im dich-mit-stich Magazin.`,
      publicUrl(market),
    ),
    alternates: { canonical: publicUrl(market, `/magazin/thema/${slug}`) },
    robots: marketEditorialRobots(market),
  };
}

export default async function MarketMagazineCategoryPage({ params }: PageProps) {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") notFound();
  if (!await getMarketMagazineCategoryBySlug(market, slug)) notFound();
  return <MagazineCategory market={market} slug={slug} />;
}
