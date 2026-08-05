import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpertTrustCard } from "@/components/expert-trust-card";
import { getAuthorPosts, getAuthorProfile, getKnownAuthorSlugs } from "@/lib/author-profiles";
import { publicUrl } from "@/lib/markets";
import { stripHtml } from "@/lib/wordpress";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 1800;

export async function generateStaticParams() {
  const slugs = await getKnownAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAuthorProfile(slug);
  if (!profile) return {};

  return {
    title: `${profile.name} | dich-mit-stich Magazin`,
    description: profile.bio.slice(0, 155),
    alternates: { canonical: publicUrl("de", `/magazin/author/${slug}`) },
  };
}

export default async function MagazineAuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const [profile, posts] = await Promise.all([getAuthorProfile(slug), getAuthorPosts(slug)]);
  if (!profile) notFound();

  return (
    <main className="shell shell-narrow">
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
          <p>{profile.bio}</p>
          <div className="meta-row">
            <span>{profile.role}</span>
            <span>{posts.length} veröffentlichte Beiträge</span>
            <Link href="/magazin">Zum Magazin</Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <ExpertTrustCard
          profile={profile}
          eyebrow="Autorenprofil"
          title={`Hier findest du das Profil und die Magazin-Beiträge von ${profile.name}.`}
          primaryLabel="Zum Magazin"
          primaryHref="/magazin"
        />
      </section>

      {posts.length ? (
        <section className="content-section">
          <div className="section-header">
            <span className="eyebrow">Beiträge von {profile.name}</span>
            <h2>Aktuelle Artikel im Tattoo-Magazin</h2>
          </div>
          <div className="stack-list">
            {posts.slice(0, 8).map((post) => (
              <Link key={post.id} href={`/magazin/${post.slug}`} className="article-card">
                <h3>{post.title}</h3>
                <p>{stripHtml(post.excerpt || post.content).slice(0, 170)}…</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
