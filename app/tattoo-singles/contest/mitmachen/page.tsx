import type { Metadata } from "next";
import Link from "next/link";
import { EntryForm } from "@/components/contest/entry-form";
import { CONTEST_JOIN_PATH, CONTEST_PATH, CONTEST_ROUND, CONTEST_RULES_PATH, CONTEST_UNCONFIGURED_NOTE } from "@/lib/contest/config";
import { isContestConfigured } from "@/lib/contest/db";
import { publicUrl } from "@/lib/markets";
import { brandedTitle } from "@/lib/seo-title";

export const metadata: Metadata = {
  title: brandedTitle("Beim Tattoo-Contest mitmachen"),
  description:
    "Foto hochladen, kurz vorstellen, Stimmen sammeln: So nimmst du am Tattoo-Contest von Dich mit Stich teil. Kostenlos, ab 18 Jahren.",
  alternates: { canonical: publicUrl("de", CONTEST_JOIN_PATH) },
  robots: { index: false, follow: true },
};

export default function ContestJoinPage() {
  const configured = isContestConfigured();
  return (
    <main className="shell shell-narrow contest-shell">
      <nav className="contest-breadcrumb" aria-label="Pfad">
        <Link href={`${CONTEST_PATH}/`}>Tattoo-Contest</Link> <span aria-hidden="true">›</span> Mitmachen
      </nav>
      <section className="panel-card contest-hero contest-hero-compact">
        <span className="eyebrow eyebrow-brand">{CONTEST_ROUND.name}</span>
        <h1>Mach mit beim Tattoo-Contest</h1>
        <p className="contest-lead">
          Ein Foto, ein paar Sätze, fertig. Nach der Freigabe bekommst du deine eigene Seite zum Teilen. Es gelten die{" "}
          <Link href={`${CONTEST_RULES_PATH}/`}>Teilnahmebedingungen</Link>.
        </p>
      </section>
      {configured ? <EntryForm /> : <p className="panel-card contest-empty">{CONTEST_UNCONFIGURED_NOTE}</p>}
    </main>
  );
}
