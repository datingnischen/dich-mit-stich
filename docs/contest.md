# Tattoo-Contest (Foto-Voting) – Betrieb und Einrichtung

Pfad: `https://dich-mit-stich.de/tattoo-singles/contest/` (nur DE). Trello: https://trello.com/c/r0dxIRED
Design: `docs/superpowers/specs/2026-10-12-tattoo-contest-design.md`

## Was es tut
- Teilnehmende laden unter `/tattoo-singles/contest/mitmachen/` ein Foto (wird im Browser auf 1600 px verkleinert und direkt
  zu Vercel Blob hochgeladen) plus Name, Alter, Ort, Text und E-Mail hoch. Der Beitrag ist zunächst `pending`.
- Moderation unter `/tattoo-singles/contest/admin/` (Zugangstoken): freigeben, ablehnen, löschen (löscht auch das Foto).
- Freigegebene Beiträge erscheinen im Ranking auf dem Hub (alle 60 s neu gebaut) und auf der eigenen Teilnehmerseite
  `/tattoo-singles/contest/teilnehmer/<id>/` mit Vote-Button, Teilen-Leiste und OG-Bild.
- Abstimmung: 1 Stimme je Besucher (Cookie `dms_contest_voter`) je Beitrag und Tag, maximal 50 Stimmen je IP und Tag,
  maximal 3 Einreichungen je IP und Tag. Grenzen und Texte: `lib/contest/config.ts`.

## Einmalige Einrichtung im Vercel-Dashboard (Projekt dich-mit-stich)
1. **Neon Postgres:** Storage → Create → Marketplace → Neon, Region **Frankfurt (eu-central-1)**, Free-Plan, mit dem Projekt
   verbinden. Die Integration setzt `DATABASE_URL` (Pooled-Verbindung ist in Ordnung, der HTTP-Treiber nutzt sie).
2. **Vercel Blob:** Storage → Create → Blob, Region **fra1**, Zugriff `public`, mit dem Projekt verbinden. Setzt
   `BLOB_READ_WRITE_TOKEN`.
3. **Geheimnisse** unter Settings → Environment Variables (Production und Preview):
   - `CONTEST_SECRET`: zufällige Zeichenkette, mindestens 32 Zeichen (Hashes für Cookie und IP).
   - `CONTEST_ADMIN_TOKEN`: Zugangstoken für die Moderation, mindestens 12 Zeichen.
4. Redeploy auslösen. Beim ersten Datenbankzugriff legt die App die Tabellen an (`lib/contest/schema.ts`, idempotent).
   Alternativ vorab: `vercel env pull .env.local` und `node --env-file=.env.local scripts/contest-migrate.mjs`.
5. Admin öffnen: `https://dich-mit-stich.de/tattoo-singles/contest/admin/` (oder auf dich-mit-stich.vercel.app).

Ohne diese Variablen rendern Hub und Formular den Hinweis „Der Contest startet in Kürze“; Build und Tests laufen trotzdem.

## Betrieb
- Runde, Gewinn-Text und Enddatum: `CONTEST_ROUND` in `lib/contest/config.ts` (Datei ändern, pushen).
- Rechtliche Texte: `app/tattoo-singles/contest/teilnahmebedingungen/page.tsx` (rechtliche Prüfung offen, siehe Trello).
- Beiträge löschen auf Wunsch der Person: Admin → Löschen (Datenbank + Blob). Nach Rundenende Beiträge nach spätestens
  drei Monaten löschen (Zusage in den Teilnahmebedingungen).
- Verwaiste Blobs (Upload ohne gespeicherten Beitrag) räumt noch niemand automatisch auf; bei Bedarf im Vercel-Dashboard
  unter Storage → Blob → Ordner `contest/` prüfen.
- Kosten: Neon Free (1 GB, 100 Compute-Stunden/Monat; Datenbank schläft nach 5 Minuten ein), Blob nutzungsbasiert im
  Cent-Bereich. Steigt die Compute-Zeit über das Freikontingent, Launch-Plan ohne Grundgebühr.

## Technik
- `lib/contest/db.ts` – Neon-HTTP-Client (`sql.query`), Schema beim ersten Zugriff; Tests nutzen PGlite mit derselben
  Schnittstelle (`tests/contest-repository.test.mjs`).
- `lib/contest/repository.ts` – Einträge, Stimmen (`ON CONFLICT DO NOTHING` für Duplikate), Ranking, Moderation.
- `lib/contest/validation.ts` – Formularregeln, Blob-URL-Prüfung (nur `*.public.blob.vercel-storage.com/contest/`).
- `lib/contest/service.ts` – Cookies, Admin-Prüfung (Cookie trägt nur einen Hash des Tokens), IP-Hash.
- API unter `app/tattoo-singles/contest/api/…`; `proxy.ts` nimmt sie von der Slash-Umleitung aus (auch mit `/de`-Präfix).
- CSP `connect-src` erlaubt die Blob-Hosts, `images.remotePatterns` den Blob-Ordner `contest/`.
- nginx vor der Live-Domain: `/tattoo-singles/` wird komplett an Vercel durchgereicht; die Fotos gehen am nginx vorbei
  direkt zu Blob, es bleiben kleine JSON-POSTs. Live prüfen: Beitrag einreichen, Stimme abgeben, Admin-Login.
