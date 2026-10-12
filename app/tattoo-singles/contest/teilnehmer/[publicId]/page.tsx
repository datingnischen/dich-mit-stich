import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { entryAltText } from "@/components/contest/entry-card";
import { ShareButtons } from "@/components/contest/share-buttons";
import { VoteButton } from "@/components/contest/vote-button";
import { CONTEST_ENTRY_PATH, CONTEST_JOIN_PATH, CONTEST_PATH, CONTEST_ROUND } from "@/lib/contest/config";
import { getContestSql, isContestConfigured } from "@/lib/contest/db";
import { isPublicId } from "@/lib/contest/identity";
import { getEntryByPublicId, rankOf, type ContestEntry } from "@/lib/contest/repository";
import { conversionUrl } from "@/lib/conversion-links";
import { publicUrl } from "@/lib/markets";
import { brandedTitle } from "@/lib/seo-title";

export const revalidate = 60;
export const dynamicParams = true;

type PageProps = { params: Promise<{ publicId: string }> };

export function generateStaticParams() {
  return [];
}

async function loadEntry(publicId: string): Promise<{ entry: ContestEntry; rank: number | null } | null> {
  if (!isPublicId(publicId) || !isContestConfigured()) return null;
  try {
    const sql = getContestSql();
    const entry = await getEntryByPublicId(sql, publicId);
    if (!entry) return null;
    const rank = entry.status === "approved" ? await rankOf(sql, entry.id) : null;
    return { entry, rank };
  } catch (error) {
    console.error("Contest: Teilnehmerseite konnte nicht geladen werden", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = await params;
  const loaded = await loadEntry(publicId);
  if (!loaded || loaded.entry.status !== "approved") {
    return { title: brandedTitle("Tattoo-Contest"), robots: { index: false, follow: false } };
  }
  const { entry } = loaded;
  const title = `Stimm für ${entry.displayName} beim Tattoo-Contest`;
  const description = entry.caption.length > 150 ? `${entry.caption.slice(0, 147).trimEnd()}…` : entry.caption;
  return {
    title: brandedTitle(title),
    description,
    alternates: { canonical: publicUrl("de", `${CONTEST_ENTRY_PATH}/${entry.publicId}`) },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: publicUrl("de", `${CONTEST_ENTRY_PATH}/${entry.publicId}`),
      type: "article",
      images: [{ url: entry.photoUrl, alt: entryAltText(entry) }],
    },
    twitter: { card: "summary_large_image", title, description, images: [entry.photoUrl] },
  };
}

export default async function ContestEntryPage({ params }: PageProps) {
  const { publicId } = await params;
  const loaded = await loadEntry(publicId);
  if (!loaded) notFound();
  const { entry, rank } = loaded;

  if (entry.status !== "approved") {
    return (
      <main className="shell shell-narrow contest-shell">
        <section className="panel-card contest-hero contest-hero-compact">
          <span className="eyebrow eyebrow-muted">Tattoo-Contest</span>
          <h1>{entry.status === "pending" ? "Dieser Beitrag wird gerade geprüft" : "Dieser Beitrag ist nicht freigegeben"}</h1>
          <p className="contest-lead">
            {entry.status === "pending"
              ? "Die Redaktion schaut kurz drüber. Sobald der Beitrag freigegeben ist, erscheint er hier und im Ranking."
              : "Der Beitrag wurde nicht für den Contest freigegeben."}
          </p>
          <div className="button-row">
            <Link className="button button-primary" href={`${CONTEST_PATH}/`}>Zum Ranking</Link>
          </div>
        </section>
      </main>
    );
  }

  const pageUrl = publicUrl("de", `${CONTEST_ENTRY_PATH}/${entry.publicId}`);
  const registrationUrl = conversionUrl(publicUrl("de"), "/registration/", "location");

  return (
    <main className="shell contest-shell">
      <nav className="contest-breadcrumb" aria-label="Pfad">
        <Link href={`${CONTEST_PATH}/`}>Tattoo-Contest</Link> <span aria-hidden="true">›</span> {entry.displayName}
      </nav>
      <article className="panel-card contest-entry">
        <div className="contest-entry-media">
          <Image src={entry.photoUrl} alt={entryAltText(entry)} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
          {rank ? <span className="contest-rank-badge contest-rank-badge-large">Platz {rank}</span> : null}
        </div>
        <div className="contest-entry-copy">
          <span className="eyebrow eyebrow-brand">{CONTEST_ROUND.name}</span>
          <h1>
            {entry.displayName}
            <span className="contest-entry-meta">{entry.age}{entry.city ? ` · ${entry.city}` : ""}</span>
          </h1>
          <p className="contest-entry-caption">{entry.caption}</p>
          <VoteButton entryId={entry.id} displayName={entry.displayName} initialVotes={entry.votes} size="large" />
          <ShareButtons
            url={pageUrl}
            title={`Stimm für ${entry.displayName} beim Tattoo-Contest`}
            text={`Stimm für ${entry.displayName} beim Tattoo-Contest von Dich mit Stich:`}
          />
        </div>
      </article>

      <section className="contest-entry-actions">
        <div className="panel-card contest-cta">
          <h2>Auch mitmachen?</h2>
          <p>Lade dein Lieblingstattoo hoch und sammle selbst Stimmen.</p>
          <div className="button-row">
            <Link className="button button-primary" href={`${CONTEST_JOIN_PATH}/`}>Jetzt mitmachen</Link>
            <Link className="button button-secondary" href={`${CONTEST_PATH}/`}>Zum Ranking</Link>
          </div>
        </div>
        <div className="panel-card contest-cta">
          <h2>Tattoo-Singles kennenlernen</h2>
          <p>Bei Dich mit Stich triffst du Singles, die Tinte genauso lieben wie du. Kostenlos registrieren.</p>
          <div className="button-row">
            <a className="button button-primary" href={registrationUrl}>Kostenlos registrieren</a>
          </div>
        </div>
      </section>
    </main>
  );
}
