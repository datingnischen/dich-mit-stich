import type { Metadata } from "next";
import Link from "next/link";
import { EntryCard } from "@/components/contest/entry-card";
import { CONTEST_JOIN_PATH, CONTEST_PATH, CONTEST_ROUND, CONTEST_RULES_PATH, CONTEST_UNCONFIGURED_NOTE } from "@/lib/contest/config";
import { getContestSql, isContestConfigured } from "@/lib/contest/db";
import { countApproved, listRanking, type ContestEntry } from "@/lib/contest/repository";
import { conversionUrl } from "@/lib/conversion-links";
import { publicUrl } from "@/lib/markets";
import { brandedTitle } from "@/lib/seo-title";

export const revalidate = 60;

export const metadata: Metadata = {
  title: brandedTitle("Tattoo-Contest: Foto hochladen, Stimmen sammeln"),
  description:
    "Zeig dein Lieblingstattoo, sammle Stimmen und lande im Ranking: der Foto-Contest für tätowierte Singles bei Dich mit Stich. Mitmachen ist kostenlos.",
  alternates: { canonical: publicUrl("de", CONTEST_PATH) },
  openGraph: {
    title: CONTEST_ROUND.title,
    description: "Lade dein Lieblingstattoo hoch, teile deine Seite und sammle Stimmen. Jede Person kann einmal am Tag abstimmen.",
    url: publicUrl("de", CONTEST_PATH),
    type: "website",
  },
};

type RankingState = { available: true; entries: ContestEntry[]; total: number } | { available: false };

async function loadRanking(): Promise<RankingState> {
  if (!isContestConfigured()) return { available: false };
  try {
    const sql = getContestSql();
    const [entries, total] = await Promise.all([listRanking(sql), countApproved(sql)]);
    return { available: true, entries, total };
  } catch (error) {
    console.error("Contest: Ranking konnte nicht geladen werden", error);
    return { available: false };
  }
}

export default async function ContestHubPage() {
  const ranking = await loadRanking();
  const registrationUrl = conversionUrl(publicUrl("de"), "/registration/", "location");

  return (
    <main className="shell contest-shell">
      <section className="panel-card contest-hero">
        <span className="eyebrow eyebrow-brand">Tattoo-Contest · {CONTEST_ROUND.name}</span>
        <h1>{CONTEST_ROUND.title}</h1>
        <p className="contest-lead">
          Lade dein Lieblingsfoto mit Tattoo hoch, erzähl in ein paar Sätzen, wer du bist, und sammle Stimmen. Teile deine Seite
          mit Freunden und Followern, jede Person kann einmal am Tag für dich abstimmen.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href={`${CONTEST_JOIN_PATH}/`}>Jetzt mitmachen</Link>
          <a className="button button-secondary" href="#ranking">Zum Ranking</a>
        </div>
        <ul className="trust-points" aria-label="So läuft der Contest">
          <li>Foto und kurzer Text, in zwei Minuten eingereicht</li>
          <li>Freigabe durch die Redaktion, danach bist du im Ranking</li>
          <li>Teilen auf WhatsApp, Instagram und Facebook bringt Stimmen</li>
        </ul>
      </section>

      <section className="contest-steps" aria-label="So funktioniert es">
        <article className="panel-card contest-step">
          <span className="contest-step-index">1</span>
          <h2>Foto hochladen</h2>
          <p>Du bist auf dem Foto zu sehen, dein Tattoo auch. Dazu Name, Alter und ein paar Sätze über dich.</p>
        </article>
        <article className="panel-card contest-step">
          <span className="contest-step-index">2</span>
          <h2>Seite teilen</h2>
          <p>Nach der Freigabe bekommst du eine eigene Seite. Teile den Link in Story, Bio oder Gruppe.</p>
        </article>
        <article className="panel-card contest-step">
          <span className="contest-step-index">3</span>
          <h2>Stimmen sammeln</h2>
          <p>Jede Person kann einmal pro Tag für dich abstimmen. Die meisten Stimmen gewinnen.</p>
        </article>
      </section>

      <section className="panel-card contest-prize">
        <span className="eyebrow eyebrow-muted">Gewinn</span>
        <p>{CONTEST_ROUND.prize}</p>
        {CONTEST_ROUND.endsOn ? <p>Die Runde läuft bis {new Date(CONTEST_ROUND.endsOn).toLocaleDateString("de-DE", { dateStyle: "long" })}.</p> : null}
        <p className="contest-prize-rules">
          Es gelten die <Link href={`${CONTEST_RULES_PATH}/`}>Teilnahmebedingungen</Link>. Teilnahme ab 18 Jahren.
        </p>
      </section>

      <section id="ranking" className="contest-ranking" aria-labelledby="contest-ranking-title">
        <div className="contest-ranking-head">
          <h2 id="contest-ranking-title">Ranking</h2>
          {ranking.available && ranking.total > 0 ? (
            <p>{ranking.total} {ranking.total === 1 ? "Beitrag" : "Beiträge"} im Rennen. Stand wird jede Minute aktualisiert.</p>
          ) : null}
        </div>
        {!ranking.available ? (
          <p className="panel-card contest-empty">{CONTEST_UNCONFIGURED_NOTE}</p>
        ) : ranking.entries.length === 0 ? (
          <div className="panel-card contest-empty">
            <p>Noch keine freigegebenen Beiträge. Sei die erste Person im Ranking.</p>
            <div className="button-row">
              <Link className="button button-primary" href={`${CONTEST_JOIN_PATH}/`}>Jetzt mitmachen</Link>
            </div>
          </div>
        ) : (
          <div className="contest-grid">
            {ranking.entries.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} rank={index + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="panel-card contest-cta">
        <span className="eyebrow eyebrow-brand">Dich mit Stich</span>
        <h2>Tattoo-Singles kennenlernen</h2>
        <p>
          Der Contest ist der Anfang. Bei Dich mit Stich triffst du Singles, die Tinte genauso lieben wie du. Die Registrierung
          ist kostenlos.
        </p>
        <div className="button-row">
          <a className="button button-primary" href={registrationUrl}>Kostenlos registrieren</a>
          <Link className="button button-secondary" href="/tattoo-singles/">Tattoo-Singles in deiner Stadt</Link>
        </div>
      </section>
    </main>
  );
}
