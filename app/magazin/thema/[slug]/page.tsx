import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMagazineCategories, getMagazineCategoryBySlug, getMagazineEntriesForCategory, stripHtml } from "@/lib/wordpress";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getMagazineCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getMagazineCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} | dich-mit-stich Magazin`,
    description: category.description || `Beiträge aus dem Bereich ${category.name} im dich-mit-stich Magazin.`,
  };
}

export default async function MagazineCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, entries] = await Promise.all([
    getMagazineCategoryBySlug(slug),
    getMagazineEntriesForCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine">
        <span className="eyebrow">Magazin-Thema</span>
        <h1>{category.name}</h1>
        <p>
          {category.description ||
            `Hier findest du die wichtigsten Artikel und Ratgeber aus dem Bereich ${category.name}.`}
        </p>
      </section>

      <section className="content-section">
        <div className="stack-list">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/magazin/${entry.slug}`} className="article-card">
              <h2>{entry.title}</h2>
              <p>{stripHtml(entry.excerpt || entry.content).slice(0, 180)}…</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
