# Tattoo-Contest (Foto-Voting) – Design, Stand 2026-10-12

Trello: https://trello.com/c/r0dxIRED (Idee: tätowierte Singles laden ihr Lieblingsfoto mit kurzem Text hoch,
Besucher voten, es entsteht ein Ranking; Teilnehmer teilen ihre Seite auf Instagram/Facebook und bringen Reichweite).

## Entscheidungen (Christian, 2026-10-12)
- Pfad `dich-mit-stich.de/tattoo-singles/contest/` (nginx reicht `/tattoo-singles/` bereits an Vercel durch, ICONY unbeteiligt).
- Datenbank Neon Postgres über den Vercel-Marktplatz (Free-Plan), Fotos in Vercel Blob.
- Eigenentwicklung in dieser App, kein WordPress-Plugin.
- Nur Markt DE; AT/CH liefern für `/tattoo-singles/contest/` weiterhin 404 (Resolver unverändert).

## Standardwerte, die Christian ändern kann (`lib/contest/config.ts`)
- Rundenname, Gewinn-Text (Standard: „Der Gewinn wird vor Ende der Runde bekannt gegeben“), optionales Enddatum.
- Stimmen: 1 Stimme je Besucher (Cookie) je Teilnehmer je Tag; maximal 50 Stimmen je IP je Tag.
- Einreichungen: maximal 3 je IP je Tag; Foto JPEG/PNG/WebP, im Browser auf max. 1600 px verkleinert, Obergrenze 6 MB.

## Komponenten
- `lib/contest/db.ts` – `SqlClient`-Schnittstelle (`(text, params) => rows`), Produktion Neon-HTTP-Treiber (`sql.query`),
  Tests PGlite. Schema wird beim ersten Zugriff je Prozess per `CREATE TABLE IF NOT EXISTS` sichergestellt (`ensureSchema`).
- `lib/contest/schema.ts` – Tabellen `contest_entries` (public_id, display_name, age, city, caption, email intern,
  photo_url, photo_pathname, status pending/approved/rejected, consent-Flags, ip_hash, Zeitstempel) und
  `contest_votes` (entry_id, voter_hash, vote_day, ip_hash; UNIQUE entry_id+voter_hash+vote_day).
- `lib/contest/repository.ts` – createEntry, getEntryByPublicId, listRanking (approved, Stimmen per COUNT),
  castVote (ON CONFLICT DO NOTHING → „heute schon abgestimmt“), IP-Tageslimits, Moderation (approve/reject/delete), listPending.
- `lib/contest/validation.ts` – Feldregeln (Name 2–40, Alter ≥ 18, Text ≤ 300, E-Mail, Einwilligungen), Blob-URL-Prüfung
  (Host `*.public.blob.vercel-storage.com`, Pfad `/contest/`), Verifikation per `head()` gegen den eigenen Store.
- `lib/contest/identity.ts` – Voter-Cookie `dms_contest_voter` (httpOnly, 1 Jahr), Hashes mit `CONTEST_SECRET`, IP aus `x-forwarded-for`.
- Seiten (SiteFrame DE, AID `location`):
  - `/tattoo-singles/contest/` Hub: Erklärung, Ranking-Grid mit Vote-Button, CTA Mitmachen, CTA Registrierung, Regeln. `revalidate = 60`.
  - `/tattoo-singles/contest/mitmachen/` Formular (Client): Foto mit Vorschau + Verkleinerung, Client-Upload zu Blob,
    danach POST Eintrag. Erfolg: Hinweis „wird geprüft“, Link zur eigenen Seite.
  - `/tattoo-singles/contest/teilnehmer/[publicId]/` Teilnehmerseite: Foto, Text, Stimmen, Vote-Button, Teilen
    (WhatsApp, Facebook, Link kopieren, Instagram-Hinweis), OG-Bild = Foto, `noindex`. Nicht freigegeben → Hinweisseite.
  - `/tattoo-singles/contest/teilnahmebedingungen/` Regeln + Datenschutzhinweis (rechtliche Prüfung offen, Trello).
  - `/tattoo-singles/contest/admin/` Moderation: Login per `CONTEST_ADMIN_TOKEN` (httpOnly-Cookie), Liste offener
    Einreichungen mit Freigeben/Ablehnen, freigegebene mit Löschen (Blob wird mitgelöscht). `noindex`, dynamisch.
- API (Route Handler, JSON, deutsch): `api/upload/` (handleUpload-Token), `api/entries/` POST, `api/vote/` POST,
  `api/admin/login/`, `api/admin/logout/`, `api/admin/moderate/`.
- Infrastruktur: `proxy.ts` nimmt `/(de/)?tattoo-singles/contest/api/` von der Slash-Umleitung aus; CSP `connect-src`
  um `https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com` erweitert; `images.remotePatterns`
  um `*.public.blob.vercel-storage.com`; Sitemap DE + Hub; robots lässt den Pfad zu, Admin/Teilnehmer `noindex`.
- Ohne `DATABASE_URL`/`BLOB_READ_WRITE_TOKEN` (z. B. lokaler Build) rendern Hub und Formular einen „startet bald“-Zustand,
  Build und Tests brechen nicht.

## Fehlerbehandlung
- API-Antworten `{ ok: false, error: "<deutsch>" }` mit 400/401/404/409/429/503; Datenbank nicht erreichbar → 503.
- Doppelte Stimme → 409 mit Hinweis; IP-Limit → 429.
- Blob-Upload ohne anschließenden Eintrag bleibt als Waise liegen (später Aufräumjob, nicht MVP).

## Tests (`npm test`)
- `tests/contest-repository.test.mjs` (PGlite): Schema idempotent, Eintrag pending, Freigabe → Ranking, Stimme einmal pro Tag,
  Duplikat abgelehnt, IP-Limit, Ablehnung/Löschung.
- `tests/contest-validation.test.mjs`: Feldregeln, Blob-URL-Prüfung.
- `tests/contest-routing.test.mjs`: Proxy ohne Slash-Redirect für API, CSP/remotePatterns, Sitemap, Seiten vorhanden, AT/CH 404.

## Einrichtung (Christian, Vercel-Dashboard) – siehe `docs/contest.md`
1. Storage → Marketplace → Neon (Region Frankfurt) mit Projekt dich-mit-stich verbinden (setzt `DATABASE_URL`).
2. Storage → Blob Store (Region fra1) verbinden (setzt `BLOB_READ_WRITE_TOKEN`).
3. Env `CONTEST_SECRET` (zufällig, ≥ 32 Zeichen) und `CONTEST_ADMIN_TOKEN` setzen, Redeploy.
4. Admin unter `/tattoo-singles/contest/admin/` öffnen, Schema entsteht automatisch.
