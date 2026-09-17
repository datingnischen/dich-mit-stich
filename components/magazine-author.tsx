import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketLink } from "@/components/market-link";
import { getAuthorPosts, getAuthorProfile } from "@/lib/author-profiles";
import { buildAuthorProfileGraph } from "@/lib/editorial-entities";
import { serializeJsonLd } from "@/lib/json-ld";
import { localizeFirstPartyText } from "@/lib/market-html";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { stripHtml } from "@/lib/wordpress";

const AUTHOR_ARTICLE_FALLBACK_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");

export async function MagazineAuthor({ market, slug }: { market: MarketCode; slug: string }) {
  const [profile, posts] = await Promise.all([getAuthorProfile(slug), getAuthorPosts(slug)]);
  if (!profile) notFound();
  const profileGraph = buildAuthorProfileGraph(profile, market);

  return (
    <main className="shell shell-narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileGraph) }}
      />
      <section className="hero-card hero-magazine hero-magazine-editorial author-hero-inline">
        <div className="author-hero-inline-media">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={profile.name}
              width={300}
              height={300}
              sizes="(max-width: 760px) 140px, 180px"
              className="author-hero-inline-photo"
              priority
            />
          ) : (
            <div className="expert-card-avatar-fallback" aria-hidden="true">
              {profile.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}
        </div>
        <div className="author-hero-inline-copy">
          <span className="eyebrow">Autorin & Autor im Magazin</span>
          <h1>{profile.name}</h1>
          <p>{localizeFirstPartyText(profile.bio, publicUrl(market))}</p>
          <div className="meta-row">
            <span>{profile.role}</span>
            <span>{posts.length} veröffentlichte Beiträge</span>
            <MarketLink targetMarket={market} pathname="/magazin">Zum Magazin</MarketLink>
          </div>
        </div>
      </section>

      {posts.length ? (
        <section className="content-section">
          <div className="section-header">
            <span className="eyebrow">Beiträge von {profile.name}</span>
            <h2>Aktuelle Artikel im Tattoo-Magazin</h2>
          </div>
          <div className="stack-list">
            {posts.slice(0, 8).map((post) => (
              <MarketLink key={post.id} targetMarket={market} pathname={`/magazin/${post.slug}`} className="article-card article-card-rich author-article-card">
                {post.featuredImage ? (
                  <div className="article-card-media">
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      width={360}
                      height={240}
                      sizes="(max-width: 760px) 112px, 150px"
                    />
                  </div>
                ) : (
                  <div className="article-card-media">
                    <Image
                      src={AUTHOR_ARTICLE_FALLBACK_IMAGE}
                      alt="Tätowiertes Paar – Dich mit Stich Magazin"
                      width={360}
                      height={240}
                      sizes="(max-width: 760px) 112px, 150px"
                    />
                  </div>
                )}
                <div className="article-card-copy">
                  <h3>{post.title}</h3>
                  <p>{localizeFirstPartyText(stripHtml(post.excerpt || post.content).slice(0, 170), publicUrl(market))}…</p>
                </div>
              </MarketLink>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
