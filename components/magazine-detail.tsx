import Image from "next/image";
import { notFound } from "next/navigation";
import { AntiEyebrowEditorial } from "@/components/anti-eyebrow-editorial";
import { AuthorProfileContact } from "@/components/author-profile-contact";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { MagazineBreadcrumb } from "@/components/magazine-breadcrumb";
import { MagazineDatingCta } from "@/components/magazine-dating-cta";
import { MagazineAnswerSummary } from "@/components/magazine-answer-summary";
import { MagazineVideo } from "@/components/magazine-video";
import { PublishedBookFeature } from "@/components/published-book-feature";
import { MagazineTeaser } from "@/components/magazine-teaser";
import { getAuthorProfilePage, stripAuthorProfileDuplicates } from "@/lib/author-profile-pages";
import { buildMagazineArticleGraph } from "@/lib/editorial-entities";
import { serializeJsonLd } from "@/lib/json-ld";
import { localizeFirstPartyText } from "@/lib/market-html";
import {
  getMarketMagazineAuthorPosts,
  getMarketMagazineAuthorProfile,
  getMarketMagazineDetailContext,
  getMarketMagazineEntryBySlug,
  getMarketMagazinePublishedProfileGraph,
} from "@/lib/market-magazine";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { buildMagazineBreadcrumbTrail, isPiercingHubChild, isPiercingTopic } from "@/lib/piercing-hub";
import { stripLegacyExpertPortrait, stripPublishedBookBlock, stripPublishedBookSchema } from "@/lib/published-book";
import { staticAsset } from "@/lib/static-asset";
import { formatGermanDate, teaserText } from "@/lib/wordpress";

const AUTHOR_ARTICLE_FALLBACK_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");

export async function MagazineDetail({ market, slug }: { market: MarketCode; slug: string }) {
  const entry = await getMarketMagazineEntryBySlug(market, slug);
  if (!entry) notFound();
  const detailContext = getMarketMagazineDetailContext(market, slug, {
    src: entry.featuredImage,
    alt: entry.featuredImageAlt || entry.title,
  });
  if (!detailContext) notFound();
  const isPiercingArticle = isPiercingTopic(entry);
  const breadcrumbTrail = buildMagazineBreadcrumbTrail(entry, {
    belowPiercingHub: await isPiercingHubChild(entry),
  });
  if (detailContext.quarantined) {
    return (
      <main className="shell magazine-detail-shell">
        <MagazineBreadcrumb market={market} trail={breadcrumbTrail} />
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
  const { featuredImage: defaultFeaturedImage, video: magazineVideo, editorialOverride, answerEngineEntry } = detailContext;
  const isPublishedExpertProfile = market === "de" && entry.slug === "unser-datingexperte";
  const authorProfilePage = getAuthorProfilePage(entry.slug);
  const authorProfilePosts = authorProfilePage
    ? await getMarketMagazineAuthorPosts(market, authorProfilePage.authorSlug)
    : [];
  const isAuthorProfileCover = isPublishedExpertProfile || Boolean(authorProfilePage);
  const featuredImage = isPublishedExpertProfile
    ? {
        src: staticAsset("/images/profiles/christian-m-haas-datingexperte.webp"),
        alt: "Christian M. Haas, Datingexperte und Autor",
      }
    : authorProfilePage
      ? { src: authorProfilePage.hero.src, alt: authorProfilePage.hero.alt }
      : defaultFeaturedImage;
  const articleSummary = localizeFirstPartyText(
    answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? teaserText(entry, 220),
    publicUrl(market),
  );
  const articleGraph = buildMagazineArticleGraph({
    entry,
    description: articleSummary,
    authorProfile,
    featuredImage,
    pilotEntry: answerEngineEntry,
    breadcrumb: breadcrumbTrail,
    market,
  });
  const publishedProfileGraph = getMarketMagazinePublishedProfileGraph(market, {
    slug: entry.slug,
    title: entry.title,
    description: articleSummary,
    content: entry.content,
    modified: entry.modified,
    personImage: isPublishedExpertProfile ? featuredImage?.src : authorProfile?.imageUrl,
    market,
  });
  const pageGraph = publishedProfileGraph ?? articleGraph;
  const contentWithoutSchema = stripPublishedBookSchema(entry.content);
  const renderedContent = isPublishedExpertProfile
    ? stripLegacyExpertPortrait(stripPublishedBookBlock(contentWithoutSchema))
    : authorProfilePage
      ? stripAuthorProfileDuplicates(contentWithoutSchema, authorProfilePage)
      : contentWithoutSchema;

  return (
    <main className="shell magazine-detail-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageGraph) }}
      />
      <MagazineBreadcrumb market={market} trail={breadcrumbTrail} />

      <div className={`magazine-detail-cover${featuredImage ? "" : " magazine-detail-cover-text-only"}${isAuthorProfileCover ? " magazine-detail-cover-profile" : ""}${authorProfilePage ? " magazine-detail-cover-portrait" : ""}`}>
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
                width={isPublishedExpertProfile ? 1402 : authorProfilePage ? authorProfilePage.hero.width : 1200}
                height={isPublishedExpertProfile ? 1122 : authorProfilePage ? authorProfilePage.hero.height : 675}
                sizes={isAuthorProfileCover ? "(max-width: 760px) 100vw, 460px" : "(max-width: 900px) 100vw, 1000px"}
                priority
                unoptimized={isPublishedExpertProfile}
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
        ) : (
          <MarketHtmlContent market={market} html={renderedContent} />
        )}
      </section>

      {authorProfilePage && authorProfile ? (
        <AuthorProfileContact profile={authorProfile} page={authorProfilePage} />
      ) : null}

      {authorProfilePage && authorProfilePosts.length ? (
        <section className="content-section">
          <div className="section-header">
            <span className="eyebrow">Aus dem Tattoo-Magazin</span>
            <h2>{authorProfilePage.articleListHeading}</h2>
          </div>
          <div className="stack-list">
            {authorProfilePosts.slice(0, 8).map((post) => (
              <MarketLink
                key={post.id}
                targetMarket={market}
                pathname={`/magazin/${post.slug}`}
                className="article-card article-card-rich author-article-card"
              >
                <div className="article-card-media">
                  <Image
                    src={post.featuredImage || AUTHOR_ARTICLE_FALLBACK_IMAGE}
                    alt={post.featuredImage ? post.featuredImageAlt || post.title : "Tätowiertes Paar – Dich mit Stich Magazin"}
                    width={360}
                    height={240}
                    sizes="(max-width: 760px) 112px, 150px"
                  />
                </div>
                <div className="article-card-copy">
                  <h3>{post.title}</h3>
                  <MagazineTeaser entry={post} length={170} origin={publicUrl(market)} />
                </div>
              </MarketLink>
            ))}
          </div>
        </section>
      ) : null}

      {isPublishedExpertProfile ? <PublishedBookFeature /> : null}

      {magazineVideo ? <MagazineVideo video={magazineVideo} /> : null}

      <MagazineDatingCta market={market} />

      {!publishedProfileGraph && !authorProfilePage && authorProfile ? (
        <section className="content-section">
          <ExpertTrustCard
            profile={authorProfile}
            market={market}
            aid="magazin"
            variant="compact"
            eyebrow={authorProfile.slug === "redaktion" ? "Autor & Datingexperte" : "Autorin im Magazin"}
            title={
              authorProfile.slug === "redaktion"
                ? "Hinter den Inhalten steht ein reales Expertenprofil statt anonymer Redaktions-Optik."
                : `Dieser Beitrag wurde von ${authorProfile.name} für das Tattoo-Magazin verfasst.`
            }
            primaryLabel={authorProfile.slug === "redaktion" ? "Zum Expertenprofil" : `Mehr über ${authorProfile.name}`}
          />
        </section>
      ) : null}
    </main>
  );
}
