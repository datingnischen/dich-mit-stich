import Image from "next/image";
import { notFound } from "next/navigation";
import { AntiEyebrowEditorial } from "@/components/anti-eyebrow-editorial";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { MagazineDatingCta } from "@/components/magazine-dating-cta";
import { MagazineAnswerSummary } from "@/components/magazine-answer-summary";
import { MagazineVideo } from "@/components/magazine-video";
import { buildMagazineArticleGraph } from "@/lib/editorial-entities";
import { serializeJsonLd } from "@/lib/json-ld";
import { localizeFirstPartyText } from "@/lib/market-html";
import {
  getMarketMagazineAuthorProfile,
  getMarketMagazineDetailContext,
  getMarketMagazineEntryBySlug,
  getMarketMagazinePublishedProfileGraph,
} from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { stripPublishedBookSchema } from "@/lib/published-book";
import { formatGermanDate, stripHtml } from "@/lib/wordpress";

export async function MagazineDetail({ market, slug }: { market: MarketCode; slug: string }) {
  const entry = await getMarketMagazineEntryBySlug(market, slug);
  if (!entry) notFound();
  const detailContext = getMarketMagazineDetailContext(market, slug, {
    src: entry.featuredImage,
    alt: entry.featuredImageAlt || entry.title,
  });
  if (!detailContext) notFound();
  if (detailContext.quarantined) {
    return (
      <main className="shell magazine-detail-shell">
        <nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">
          <MarketLink targetMarket={market} pathname="/magazin">Magazin</MarketLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{entry.title}</span>
        </nav>
        <section className="hero-card hero-magazine hero-magazine-editorial magazine-quarantine-hero">
          <span className="eyebrow">Redaktioneller Hinweis</span>
          <h1>{entry.title}</h1>
          <p className="magazine-detail-lead">{detailContext.quarantineDescription}</p>
          <p><MarketLink className="text-link" targetMarket={market} pathname="/magazin">Zu den aktuell verfügbaren Magazinbeiträgen →</MarketLink></p>
        </section>
      </main>
    );
  }

  const authorProfile = entry.authorSlug ? await getMarketMagazineAuthorProfile(market, entry.authorSlug) : null;
  const authorHref = authorProfile?.profileUrl;
  const { featuredImage, video: magazineVideo, editorialOverride, answerEngineEntry } = detailContext;
  const articleSummary = localizeFirstPartyText(
    answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? stripHtml(entry.excerpt || entry.content).slice(0, 220),
    publicUrl(market),
  );
  const articleGraph = buildMagazineArticleGraph({
    entry,
    description: articleSummary,
    authorProfile,
    featuredImage,
    pilotEntry: answerEngineEntry,
    market,
  });
  const publishedProfileGraph = getMarketMagazinePublishedProfileGraph(market, {
    slug: entry.slug,
    title: entry.title,
    description: articleSummary,
    content: entry.content,
    modified: entry.modified,
    personImage: authorProfile?.imageUrl,
    market,
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
        <MarketLink targetMarket={market} pathname="/magazin">Magazin</MarketLink>
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
                Von {authorHref ? <MarketLink targetMarket={market} pathname={authorHref}>{entry.authorName}</MarketLink> : entry.authorName}
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
                <MarketLink key={category.slug} className="chip" targetMarket={market} pathname={`/magazin/thema/${category.slug}`}>
                  {category.name}
                </MarketLink>
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
          <AntiEyebrowEditorial market={market} />
        ) : answerEngineEntry ? (
          <section className="panel-card magazine-editorial-review-note" aria-labelledby="legacy-review-heading">
            <h2 id="legacy-review-heading">Hinweis zur Langfassung</h2>
            <p>Die ältere Langfassung wird aktuell fachlich überarbeitet. Bis dahin veröffentlichen wir bewusst nur die oben belegte Kurzantwort und ihre Quellen.</p>
          </section>
        ) : (
          <MarketHtmlContent market={market} html={renderedContent} />
        )}
      </section>

      {magazineVideo ? <MagazineVideo video={magazineVideo} /> : null}

      <MagazineDatingCta market={market} />

      {!publishedProfileGraph && authorProfile ? (
        <section className="content-section">
          <ExpertTrustCard
            profile={authorProfile}
            market={market}
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
