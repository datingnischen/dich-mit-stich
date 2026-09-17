import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineCategory } from "@/components/magazine-category";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { localizeFirstPartyText } from "@/lib/market-html";
import { isMarketCode, publicUrl } from "@/lib/markets";
import { getMagazineCategories, getMagazineCategoryBySlug } from "@/lib/wordpress";

type PageProps = { params: Promise<{ market: string; slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const categories = await getMagazineCategories();
  return ["at", "ch"].flatMap((market) => categories.map((category) => ({ market, slug: category.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { market, slug } = await params;
  if (!isMarketCode(market) || market === "de") return {};
  const category = await getMagazineCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | dich-mit-stich Magazin`,
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
  return <MagazineCategory market={market} slug={slug} />;
}
