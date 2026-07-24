import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { getAuthorProfile } from "@/lib/author-profiles";
import { getAllMagazineEntries, getMagazineEntryBySlug, stripHtml } from "@/lib/wordpress";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const entries = await getAllMagazineEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} | dich-mit-stich Magazin`,
    description: stripHtml(entry.excerpt || entry.content).slice(0, 155),
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) notFound();

  const authorProfile = entry.authorSlug ? await getAuthorProfile(entry.authorSlug) : null;
  const authorHref = authorProfile?.profileUrl;

  return (
    <main className="shell shell-narrow">
      <section className="hero-card hero-magazine hero-magazine-editorial">
        <span className="eyebrow">{entry.type === "post" ? "Magazin-Artikel" : "Magazin-Seite"}</span>
        <h1>{entry.title}</h1>
        <p>{stripHtml(entry.excerpt || entry.content).slice(0, 220)}…</p>
        <div className="meta-row">
          {entry.authorName ? (
            <span>
              Von {authorHref ? <Link href={authorHref}>{entry.authorName}</Link> : entry.authorName}
            </span>
          ) : null}
          {entry.date ? <span>{entry.date.slice(0, 10)}</span> : null}
          <Link href="https://dich-mit-stich.de/registration/">Kostenlos registrieren</Link>
        </div>
      </section>

      {entry.featuredImage ? (
        <section className="content-section">
          <figure className="article-hero-media">
            <img src={entry.featuredImage} alt={entry.featuredImageAlt || entry.title} loading="eager" decoding="async" />
          </figure>
        </section>
      ) : null}

      {entry.categories.length ? (
        <section className="content-section">
          <div className="chip-row">
            {entry.categories.map((category) => (
              <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rich-content">
        <div dangerouslySetInnerHTML={{ __html: entry.content }} />
      </section>

      {entry.slug !== "unser-datingexperte" && authorProfile ? (
        <section className="content-section">
          <ExpertTrustCard
            profile={authorProfile}
            eyebrow={authorProfile.slug === "redaktion" ? "Autor & Datingexperte" : "Autorin im Magazin"}
            title={
              authorProfile.slug === "redaktion"
                ? "Hinter den Inhalten steht ein reales Expertenprofil statt anonymer Redaktions-Optik."
                : `Dieser Beitrag wurde von ${authorProfile.name} für das Tattoo-Magazin verfasst.`
            }
            primaryLabel={authorProfile.slug === "redaktion" ? "Zum Expertenprofil" : "Zum Autorenprofil"}
          />
        </section>
      ) : null}
    </main>
  );
}
