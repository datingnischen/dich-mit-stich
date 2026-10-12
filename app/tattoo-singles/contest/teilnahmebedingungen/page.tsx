import type { Metadata } from "next";
import Link from "next/link";
import { CONTEST_LIMITS, CONTEST_PATH, CONTEST_ROUND, CONTEST_RULES_PATH } from "@/lib/contest/config";
import { publicUrl } from "@/lib/markets";
import { brandedTitle } from "@/lib/seo-title";

export const metadata: Metadata = {
  title: brandedTitle("Teilnahmebedingungen Tattoo-Contest"),
  description:
    "Teilnahmebedingungen und Datenschutzhinweise zum Tattoo-Contest von Dich mit Stich: Teilnahme ab 18, Bildrechte, Abstimmung, Gewinn und Löschung.",
  alternates: { canonical: publicUrl("de", CONTEST_RULES_PATH) },
  robots: { index: false, follow: true },
};

export default function ContestRulesPage() {
  return (
    <main className="shell shell-narrow contest-shell">
      <nav className="contest-breadcrumb" aria-label="Pfad">
        <Link href={`${CONTEST_PATH}/`}>Tattoo-Contest</Link> <span aria-hidden="true">›</span> Teilnahmebedingungen
      </nav>
      <article className="panel-card contest-rules">
        <span className="eyebrow eyebrow-muted">{CONTEST_ROUND.name}</span>
        <h1>Teilnahmebedingungen und Datenschutzhinweise</h1>

        <h2>1. Veranstalter</h2>
        <p>
          Veranstalter des Tattoo-Contests ist der Betreiber von Dich mit Stich, siehe{" "}
          <a href="https://dich-mit-stich.de/impressum.html">Impressum</a>. Der Contest steht in keiner Verbindung zu Meta
          (Instagram, Facebook), WhatsApp oder anderen Plattformen, auf denen Beiträge geteilt werden.
        </p>

        <h2>2. Teilnahme</h2>
        <ul>
          <li>Teilnehmen kann jede natürliche Person ab {CONTEST_LIMITS.minAge} Jahren mit Wohnsitz in Deutschland, Österreich oder der Schweiz.</li>
          <li>Die Teilnahme ist kostenlos und unabhängig von einer Mitgliedschaft bei Dich mit Stich.</li>
          <li>Eingereicht werden ein Foto, auf dem die teilnehmende Person selbst mit Tattoo zu sehen ist, sowie Name oder Nickname, Alter, optional Ort und ein kurzer Text.</li>
          <li>Je Person ist ein Beitrag pro Runde zulässig. Mehrfacheinreichungen können entfernt werden.</li>
          <li>Mitarbeitende des Veranstalters sind von der Teilnahme ausgeschlossen.</li>
        </ul>

        <h2>3. Inhalte und Rechte am Foto</h2>
        <ul>
          <li>Mit dem Upload bestätigst du, dass du alle Rechte am Foto hast, selbst darauf abgebildet bist und keine weiteren Personen erkennbar sind, die nicht eingewilligt haben.</li>
          <li>Du räumst dem Veranstalter das einfache, zeitlich auf die Laufzeit des Contests und eine angemessene Nachlaufzeit beschränkte Recht ein, Foto, Name/Nickname, Alter, Ort und Text auf dich-mit-stich.de im Rahmen des Contests zu zeigen (Ranking, Teilnehmerseite, Vorschau beim Teilen).</li>
          <li>Eine Nutzung in Werbeanzeigen oder auf anderen Kanälen erfolgt nur nach gesonderter Zustimmung.</li>
          <li>Nicht zulässig sind Nacktheit, sexualisierte Darstellungen, Gewalt, verfassungsfeindliche Symbole, Beleidigungen, Werbung, Links und Fotos ohne Person. Fotos von Minderjährigen sind ausgeschlossen.</li>
          <li>Jeder Beitrag wird vor der Veröffentlichung von der Redaktion geprüft. Ein Anspruch auf Veröffentlichung besteht nicht; die Redaktion kann Beiträge ohne Angabe von Gründen ablehnen oder entfernen.</li>
        </ul>

        <h2>4. Abstimmung</h2>
        <ul>
          <li>Abstimmen kann jede Besucherin und jeder Besucher der Seite, einmal pro Beitrag und Tag. Technisch wird dafür ein Cookie gesetzt (siehe Datenschutz).</li>
          <li>Manipulationen, etwa automatisierte Stimmen, gekaufte Stimmen oder das Umgehen der Tagesgrenze, führen zum Ausschluss. Auffällige Stimmen können gestrichen werden.</li>
          <li>Der Stand im Ranking wird regelmäßig aktualisiert; die Platzierung bei Rundenende ist maßgeblich.</li>
        </ul>

        <h2>5. Gewinn</h2>
        <ul>
          <li>{CONTEST_ROUND.prize}</li>
          <li>Gewinnt der Beitrag mit den meisten gültigen Stimmen bei Rundenende. Bei Gleichstand entscheidet die frühere Freigabe.</li>
          <li>Die Gewinnerin oder der Gewinner wird per E-Mail benachrichtigt. Meldet sich die Person nicht innerhalb von 14 Tagen, rückt der nächste Platz nach.</li>
          <li>Eine Barauszahlung ist ausgeschlossen. Der Rechtsweg ist ausgeschlossen.</li>
        </ul>

        <h2>6. Datenschutz</h2>
        <ul>
          <li>Öffentlich sichtbar sind Foto, Name/Nickname, Alter, Ort und Text. Die E-Mail-Adresse wird nicht veröffentlicht und nur für Rückfragen, Moderation und die Gewinnbenachrichtigung verwendet.</li>
          <li>Zur Vermeidung von Missbrauch speichern wir zu jedem Beitrag und jeder Stimme einen verschlüsselten Hash der IP-Adresse (keine Klartext-IP) sowie bei Beiträgen den Browser-Typ.</li>
          <li>Für die Abstimmung setzen wir ein technisch notwendiges Cookie mit einer zufälligen Kennung (Laufzeit 12 Monate), damit Stimmen pro Tag gezählt werden können. Es dient keiner Werbung.</li>
          <li>Die Daten werden auf Servern unseres Hosting-Anbieters Vercel (Datenbank Neon, Dateispeicher Vercel Blob) in der EU verarbeitet.</li>
          <li>Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) für Foto und Text sowie unser berechtigtes Interesse an einer fairen Abstimmung (Art. 6 Abs. 1 lit. f DSGVO) für die Missbrauchsschutz-Daten.</li>
          <li>Du kannst deinen Beitrag jederzeit entfernen lassen: Schreib an die im <a href="https://dich-mit-stich.de/impressum.html">Impressum</a> genannte Adresse. Nach Rundenende werden Beiträge spätestens nach drei Monaten gelöscht.</li>
          <li>Weitere Informationen stehen in der <a href="https://dich-mit-stich.de/datenschutz.html">Datenschutzerklärung</a>.</li>
        </ul>

        <h2>7. Änderungen und Abbruch</h2>
        <p>
          Der Veranstalter kann den Contest bei technischen Problemen, Manipulation oder aus rechtlichen Gründen anpassen, unterbrechen
          oder beenden. Änderungen werden auf der Contest-Seite bekannt gegeben.
        </p>

        <div className="button-row">
          <Link className="button button-secondary" href={`${CONTEST_PATH}/`}>Zurück zum Contest</Link>
        </div>
      </article>
    </main>
  );
}
