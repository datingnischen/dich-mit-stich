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
import { PiercingGuideArticle, PiercingRegionPicker, PiercingTypeDirectory } from "@/components/piercing-guide";
import { PublishedBookFeature } from "@/components/published-book-feature";
import { ReadingProgress } from "@/components/reading-progress";
import { MagazineHubOverview } from "@/components/magazine-hub-overview";
import { MotifMore } from "@/components/motif-more";
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
import { PIERCING_HUB, TATTOO_HUB, buildMagazineBreadcrumbTrail, extractHubChildGroups, getHubDirectoryForPage, isPiercingTopic, resolveMagazineHub } from "@/lib/magazine-hubs";
import { PIERCING_GUIDE, PIERCING_GUIDE_SLUG, PIERCING_HUB_LEAD } from "@/lib/piercing-guide";
import { stripLegacyExpertPortrait, stripPublishedBookBlock, stripPublishedBookSchema } from "@/lib/published-book";
import { staticAsset } from "@/lib/static-asset";
import { buildTattooMotifSpotlight, motifTopicForSlug } from "@/lib/tattoo-motifs";
import { formatGermanDate, formatGermanDateLong, teaserText, visibleEntryDate } from "@/lib/wordpress";

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
  const isPiercingGuide = entry.slug === PIERCING_GUIDE_SLUG && !editorialOverride && !answerEngineEntry;
  const isPiercingHubPage = entry.slug === PIERCING_HUB.slug && !editorialOverride && !answerEngineEntry;
  const articleSummary = localizeFirstPartyText(
    authorProfilePage?.lead ?? answerEngineEntry?.directAnswer ?? editorialOverride?.summary ?? (isPiercingGuide ? PIERCING_GUIDE.lead : isPiercingHubPage ? PIERCING_HUB_LEAD : teaserText(entry, 220)),
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
  const entryUpdatedDate = visibleEntryDate(entry);
  const contentWithoutSchema = stripPublishedBookSchema(entry.content);
  const profileBody = authorProfilePage
    ? stripAuthorProfileDuplicates(contentWithoutSchema, authorProfilePage)
    : contentWithoutSchema;
  const renderedContent = isPublishedExpertProfile
    ? stripLegacyExpertPortrait(stripPublishedBookBlock(profileBody))
    : profileBody;
  // Hub articles plus profiled articles the hubs do not link (the Tribal and Sleeve series, Flesh Tunnel).
  const motifTopic = editorialOverride || authorProfilePage
    ? null
    : hub?.slug === TATTOO_HUB.slug
      ? "tattoo"
      : hub?.slug === PIERCING_HUB.slug
        ? "piercing"
        : motifTopicForSlug(entry.slug);
  const motifSpotlight = motifTopic
    ? buildTattooMotifSpotlight({ slug: entry.slug, title: entry.title, content: renderedContent }, motifTopic)
    : null;
  // The Piercingarten hub opens with its body regions instead of a single stretched thumbnail.
  const piercingRegions = isPiercingHubPage ? extractHubChildGroups(PIERCING_HUB, renderedContent, "Körperpiercings") : [];
  const hubOverviewTopic = entry.slug === TATTOO_HUB.slug ? "tattoo" : entry.slug === PIERCING_HUB.slug ? "piercing" : null;

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
          <p className="magazine-detail-lead">{articleSummary}{(answerEngineEntry || editorialOverride || authorProfilePage || isPiercingGuide || isPiercingHubPage) ? null : "…"}</p>
          <div className="meta-row magazine-detail-meta">
            {entry.authorName ? (
              <span>
                Von {authorHref ? <MarketLink targetMarket={market} pathname={authorHref}>{entry.authorName}</MarketLink> : entry.authorName}
              </span>
            ) : null}
            {entryUpdatedDate ? <span>Aktualisiert am <time dateTime={entryUpdatedDate}>{formatGermanDateLong(entryUpdatedDate)}</time></span> : null}
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

        {piercingRegions.length ? (
          <PiercingRegionPicker groups={piercingRegions} />
        ) : featuredImage ? (
          <section className="magazine-detail-media" aria-label="Beitragsbild">
            <figure className="article-hero-media">
              <Image
                src={staticAsset(featuredImage.src)}
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

      {/* Pilot articles already open with a direct answer, so they skip the second summary box. */}
      {motifSpotlight && !answerEngineEntry ? <TattooMotifGlance spotlight={motifSpotlight} /> : null}

      <section className="rich-content magazine-article-body">
        {editorialOverride?.kind === "anti-eyebrow" ? (
          <AntiEyebrowEditorial market={market} />
        ) : motifSpotlight ? (
          <TattooMotifArticle market={market} html={renderedContent} spotlight={motifSpotlight} />
        ) : isPiercingGuide ? (
          <PiercingGuideArticle market={market} html={renderedContent} typeCount={hubDirectory?.links.length ?? 0} />
        ) : hubOverviewTopic ? (
          <MagazineHubOverview market={market} html={renderedContent} topic={hubOverviewTopic} />
        ) : (
          <MarketHtmlContent market={market} html={renderedContent} />
        )}
      </section>

      {hubDirectory ? (
        <PiercingTypeDirectory
          market={market}
          hub={hubDirectory.hub}
          groups={hubDirectory.groups}
          total={hubDirectory.links.length}
        />
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
                  {visibleEntryDate(post) ? (
                    <div className="meta-row magazine-story-meta">
                      <span>Aktualisiert {formatGermanDate(visibleEntryDate(post))}</span>
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
        <MotifMore market={market} slug={entry.slug} topic={motifTopic ?? "tattoo"} preferred={motifSpotlight.related} />
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
