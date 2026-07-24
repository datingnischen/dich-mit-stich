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

  const featuredEntry = entries[0];
  const remainingEntries = entries.slice(1);

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine hero-magazine-editorial">
        <span className="eyebrow">Magazin-Thema</span>
        <h1>{category.name}</h1>
        <p>
          {category.description ||
            `Hier findest du die wichtigsten Artikel, Storys und Szene-Ratgeber aus dem Bereich ${category.name}.`}
        </p>
      </section>

      {featuredEntry ? (
        <section className="content-section">
          <Link href={`/magazin/${featuredEntry.slug}`} className="editorial-feature-card">
            {featuredEntry.featuredImage ? (
              <div className="editorial-feature-media">
                <img src={featuredEntry.featuredImage} alt={featuredEntry.featuredImageAlt || featuredEntry.title} loading="eager" decoding="async" />
              </div>
            ) : null}
            <div className="editorial-feature-copy">
              <span className="eyebrow">Featured aus {category.name}</span>
              <h3>{featuredEntry.title}</h3>
              <p>{stripHtml(featuredEntry.excerpt || featuredEntry.content).slice(0, 220)}…</p>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="content-section">
        <div className="stack-list">
          {remainingEntries.map((entry) => (
            <Link key={entry.id} href={`/magazin/${entry.slug}`} className="article-card article-card-rich">
              {entry.featuredImage ? (
                <div className="article-card-media">
                  <img src={entry.featuredImage} alt={entry.featuredImageAlt || entry.title} loading="lazy" decoding="async" />
                </div>
              ) : null}
              <div className="article-card-copy">
                <h2>{entry.title}</h2>
                <p>{stripHtml(entry.excerpt || entry.content).slice(0, 180)}…</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
