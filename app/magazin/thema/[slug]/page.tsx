import type { Metadata } from "next";
import { MagazineCategory } from "@/components/magazine-category";
import { marketEditorialRobots } from "@/lib/editorial-metadata";
import { publicUrl } from "@/lib/markets";
import { getMagazineCategories, getMagazineCategoryBySlug } from "@/lib/wordpress";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 1800;

export async function generateStaticParams() {
  const categories = await getMagazineCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getMagazineCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} im Tattoo-Magazin`,
    description: category.description || `Beiträge aus dem Bereich ${category.name} im dich-mit-stich Magazin.`,
    alternates: { canonical: publicUrl("de", `/magazin/thema/${slug}`) },
    robots: marketEditorialRobots("de"),
  };
}

export default async function MagazineCategoryPage({ params }: PageProps) {
  return <MagazineCategory market="de" slug={(await params).slug} />;
}
