import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AntiEyebrowEditorial } from "@/components/anti-eyebrow-editorial";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { MagazineDatingCta } from "@/components/magazine-dating-cta";
import { MagazineAnswerSummary } from "@/components/magazine-answer-summary";
import { MagazineVideo } from "@/components/magazine-video";
import { getAuthorProfile } from "@/lib/author-profiles";
import { buildMagazineArticleGraph } from "@/lib/editorial-entities";
import { getAnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";
import { serializeJsonLd } from "@/lib/json-ld";
import { getMagazineFeaturedImage } from "@/lib/magazine-featured-images";
import { getMagazineEditorialOverride } from "@/lib/magazine-editorial-overrides";
import { getMagazineVideo } from "@/lib/magazine-videos";
import { publicUrl } from "@/lib/markets";
import { buildPublishedAuthorProfileGraph, stripPublishedBookSchema } from "@/lib/published-book";
import { formatGermanDate, getMagazineEntryBySlug, getMagazineRouteEntries, stripHtml } from "@/lib/wordpress";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const entries = await getMagazineRouteEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) return {};
  const editorialOverride = getMagazineEditorialOverride(slug);
  const answerEngineEntry = getAnswerEnginePilotEntry(slug);

  return {
    title: `${entry.title} | dich-mit-stich Magazin`,
    description: answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? stripHtml(entry.excerpt || entry.content).slice(0, 155),
    alternates: { canonical: publicUrl("de", `/magazin/${slug}`) },
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getMagazineEntryBySlug(slug);
  if (!entry) notFound();

  const authorProfile = entry.authorSlug ? await getAuthorProfile(entry.authorSlug) : null;
  const authorHref = authorProfile?.profileUrl;
  const featuredImage = getMagazineFeaturedImage(entry.slug, {
    src: entry.featuredImage,
    alt: entry.featuredImageAlt || entry.title,
  });
  const magazineVideo = getMagazineVideo(entry.slug);
  const editorialOverride = getMagazineEditorialOverride(entry.slug);
  const answerEngineEntry = getAnswerEnginePilotEntry(entry.slug);
  const articleSummary = answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? stripHtml(entry.excerpt || entry.content).slice(0, 220);
  const articleGraph = buildMagazineArticleGraph({
    entry,
    description: articleSummary,
    authorProfile,
    featuredImage,
    pilotEntry: answerEngineEntry,
  });
  const publishedProfileGraph = buildPublishedAuthorProfileGraph({
    slug: entry.slug,
    title: entry.title,
    description: articleSummary,
    content: entry.content,
    modified: entry.modified,
    personImage: authorProfile?.imageUrl,
  });
  const pageGraph = publishedProfileGraph ?? articleGraph;
  const renderedContent = stripPublishedBookSchema(entry.content);
  const isPiercingArticle = [entry.title, entry.slug, ...entry.categories.flatMap((category) => [category.name, category.slug])]
    .join(" ")
    .toLocaleLowerCase("de")
    .includes("piercing");

  return (
    <main className="shell magazine-detail-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageGraph) }}
      />
      <nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">
        <Link href="/magazin">Magazin</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{entry.title}</span>
      </nav>

      <div className={`magazine-detail-cover${featuredImage ? "" : " magazine-detail-cover-text-only"}`}>
        <header className="hero-card hero-magazine hero-magazine-editorial magazine-detail-hero">
          <span className="eyebrow">
            {isPiercingArticle ? "Piercing-Ratgeber" : entry.type === "post" ? "Magazin-Artikel" : "Magazin-Ratgeber"}
          </span>
          <h1>{entry.title}</h1>
          <p className="magazine-detail-lead">{articleSummary}{(answerEngineEntry || editorialOverride) ? null : "…"}</p>
          <div className="meta-row magazine-detail-meta">
            {entry.authorName ? (
              <span>
                Von {authorHref ? <Link href={authorHref}>{entry.authorName}</Link> : entry.authorName}
              </span>
            ) : null}
            {entry.date ? <time dateTime={entry.date}>{formatGermanDate(entry.date)}</time> : null}
            {editorialOverride ? (
              <span>
                Fachlich aktualisiert: <time dateTime={editorialOverride.reviewedAt}>{editorialOverride.reviewedAtLabel}</time>
              </span>
            ) : null}
          </div>

          {entry.categories.length ? (
            <div className="magazine-detail-topics" aria-label="Themen dieses Beitrags">
              {entry.categories.map((category) => (
                <Link key={category.slug} className="chip" href={`/magazin/thema/${category.slug}`}>
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        {featuredImage ? (
          <section className="magazine-detail-media" aria-label="Beitragsbild">
            <figure className="article-hero-media">
              <Image
                src={featuredImage.src}
                alt={featuredImage.alt}
                width={1200}
                height={675}
                sizes="(max-width: 900px) 100vw, 1000px"
                priority
              />
            </figure>
          </section>
        ) : null}
      </div>

      {answerEngineEntry && editorialOverride?.kind !== "anti-eyebrow" ? (
        <MagazineAnswerSummary entry={answerEngineEntry} />
      ) : null}

      <section className="rich-content magazine-article-body">
        {editorialOverride?.kind === "anti-eyebrow" ? (
          <AntiEyebrowEditorial />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
        )}
      </section>

      {magazineVideo ? <MagazineVideo video={magazineVideo} /> : null}

      <MagazineDatingCta />

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
