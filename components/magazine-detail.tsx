import Image from "next/image";
import { notFound } from "next/navigation";
import { AntiEyebrowEditorial } from "@/components/anti-eyebrow-editorial";
import { ArticleCardMedia } from "@/components/article-card-media";
import { AuthorProfileContact } from "@/components/author-profile-contact";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { IconyMagazineWidgets } from "@/components/icony-magazine-widgets";
import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import { MagazineBreadcrumb } from "@/components/magazine-breadcrumb";
import { MagazineDatingCta } from "@/components/magazine-dating-cta";
import { MagazineAnswerSummary } from "@/components/magazine-answer-summary";
import { MagazineVideo } from "@/components/magazine-video";
import { PublishedBookFeature } from "@/components/published-book-feature";
import { ReadingProgress } from "@/components/reading-progress";
import { TattooLexikonMore } from "@/components/tattoo-lexikon-more";
import { TattooMotifArticle } from "@/components/tattoo-motif-article";
import { TattooMotifGlance } from "@/components/tattoo-motif-glance";
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
import { TATTOO_HUB, buildMagazineBreadcrumbTrail, getHubDirectoryForPage, isPiercingTopic, resolveMagazineHub } from "@/lib/magazine-hubs";
import { stripLegacyExpertPortrait, stripPublishedBookBlock, stripPublishedBookSchema } from "@/lib/published-book";
import { staticAsset } from "@/lib/static-asset";
import { buildTattooMotifSpotlight } from "@/lib/tattoo-motifs";
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
  const hub = await resolveMagazineHub(entry);
  const breadcrumbTrail = buildMagazineBreadcrumbTrail(entry, { hub });
  const hubDirectory = await getHubDirectoryForPage(slug);
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
  const authorProfileHero = authorProfilePage?.hero;
  const isAuthorProfileCover = isPublishedExpertProfile || Boolean(authorProfilePage);
  const featuredImage = isPublishedExpertProfile
    ? {
        src: staticAsset("/images/profiles/christian-m-haas-datingexperte.webp"),
        alt: "Christian M. Haas, Datingexperte und Autor",
      }
    : authorProfileHero
      ? { src: authorProfileHero.src, alt: authorProfileHero.alt }
      : defaultFeaturedImage;
  const articleSummary = localizeFirstPartyText(
    authorProfilePage?.lead ?? answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? teaserText(entry, 220),
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
    authorProfile,
    breadcrumb: breadcrumbTrail,
  });
  const pageGraph = publishedProfileGraph ?? articleGraph;
  const contentWithoutSchema = stripPublishedBookSchema(entry.content);
  const profileBody = authorProfilePage
    ? stripAuthorProfileDuplicates(contentWithoutSchema, authorProfilePage)
    : contentWithoutSchema;
  const renderedContent = isPublishedExpertProfile
    ? stripLegacyExpertPortrait(stripPublishedBookBlock(profileBody))
    : profileBody;
  const isTattooLexikonArticle = hub?.slug === TATTOO_HUB.slug && !editorialOverride && !authorProfilePage;
  const motifSpotlight = isTattooLexikonArticle
    ? buildTattooMotifSpotlight({ slug: entry.slug, title: entry.title, content: renderedContent })
    : null;

  return (
    <main className="shell magazine-detail-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageGraph) }}
      />
      {motifSpotlight ? <ReadingProgress targetSelector=".magazine-article-body" /> : null}
      <MagazineBreadcrumb market={market} trail={breadcrumbTrail} />

      <div className={`magazine-detail-cover${featuredImage ? "" : " magazine-detail-cover-text-only"}${isAuthorProfileCover ? " magazine-detail-cover-profile" : ""}${authorProfilePage?.portraitCover ? " magazine-detail-cover-portrait" : ""}${motifSpotlight && featuredImage ? " magazine-detail-cover-split" : ""}`}>
        <header className="hero-card hero-magazine hero-magazine-editorial magazine-detail-hero">
          <span className="eyebrow">
            {isPiercingArticle ? "Piercing-Ratgeber" : entry.type === "post" ? "Magazin-Artikel" : "Magazin-Ratgeber"}
          </span>
          <h1>{entry.title}</h1>
          <p className="magazine-detail-lead">{articleSummary}{(answerEngineEntry || editorialOverride || authorProfilePage) ? null : "…"}</p>
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
                width={isPublishedExpertProfile ? 1402 : authorProfileHero ? authorProfileHero.width : 1200}
                height={isPublishedExpertProfile ? 1122 : authorProfileHero ? authorProfileHero.height : 675}
                sizes={isAuthorProfileCover ? "(max-width: 760px) 100vw, 460px" : motifSpotlight ? "(max-width: 900px) 100vw, 400px" : "(max-width: 900px) 100vw, 1000px"}
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

      {motifSpotlight ? <TattooMotifGlance spotlight={motifSpotlight} /> : null}

      <section className="rich-content magazine-article-body">
        {editorialOverride?.kind === "anti-eyebrow" ? (
          <AntiEyebrowEditorial market={market} />
        ) : motifSpotlight ? (
          <TattooMotifArticle market={market} html={renderedContent} spotlight={motifSpotlight} />
        ) : (
          <MarketHtmlContent market={market} html={renderedContent} />
        )}
      </section>

      {hubDirectory ? (
        <section className="content-section magazine-hub-directory" aria-labelledby="magazine-hub-directory-heading">
          <div className="section-header magazine-section-heading">
            <span className="eyebrow">{hubDirectory.hub.label}</span>
            <h2 id="magazine-hub-directory-heading">Alle Piercings von A bis Z</h2>
            <p>
              Jede Piercingart mit eigenem Ratgeber – oder alle nach Körperstelle sortiert in der{" "}
              <MarketLink targetMarket={market} pathname={hubDirectory.hub.path}>Übersicht der Piercingarten</MarketLink>.
            </p>
          </div>
          <ul className="magazine-hub-directory-list">
            {hubDirectory.links.map((link) => (
              <li key={link.slug}>
                <MarketLink className="chip" targetMarket={market} pathname={`/magazin/${link.slug}`}>
                  {link.label}
                </MarketLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isPublishedExpertProfile ? <PublishedBookFeature /> : null}

      {authorProfilePage && authorProfile ? (
        <AuthorProfileContact profile={authorProfile} page={authorProfilePage} />
      ) : null}

      {authorProfilePage && authorProfilePosts.length ? (
        <section className="content-section">
          <div className="section-header magazine-section-heading">
            <span className="eyebrow">Aus dem Tattoo-Magazin</span>
            <h2>{authorProfilePage.articleListHeading}</h2>
          </div>
          <div className="magazine-story-grid">
            {authorProfilePosts.slice(0, 6).map((post) => (
              <MarketLink
                key={post.id}
                targetMarket={market}
                pathname={`/magazin/${post.slug}`}
                className="article-card magazine-story-card"
              >
                <ArticleCardMedia
                  imageUrl={post.featuredImage || AUTHOR_ARTICLE_FALLBACK_IMAGE}
                  alt={post.featuredImage ? post.featuredImageAlt || post.title : "Tätowiertes Paar – Dich mit Stich Magazin"}
                  fallbackLabel="Dich mit Stich Magazin"
                  fallbackTitle={post.title}
                  className="magazine-story-media"
                  sizes="(max-width: 900px) 100vw, 460px"
                />
                <div className="magazine-story-copy">
                  <span className="eyebrow eyebrow-muted">{post.categories[0]?.name || "Magazin"}</span>
                  <h3>{post.title}</h3>
                  {post.date ? (
                    <div className="meta-row magazine-story-meta">
                      <span>{formatGermanDate(post.date)}</span>
                    </div>
                  ) : null}
                </div>
              </MarketLink>
            ))}
          </div>
        </section>
      ) : null}

      {magazineVideo ? <MagazineVideo video={magazineVideo} /> : null}

      {motifSpotlight ? (
        <TattooLexikonMore market={market} slug={entry.slug} preferred={motifSpotlight.related} />
      ) : null}

      <IconyMagazineWidgets market={market} />

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
