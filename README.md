# Dich mit Stich – Next.js/Vercel-Migration

Headless-Frontend für `dich-mit-stich.de`, `.at` und `.ch`. WordPress liefert Magazin-Inhalte; Legacy-/ICONY-Ziele bleiben für Login und Registrierung zuständig.

## Markt-Routing

| Vercel-Pfad | Öffentliche Domain | Status |
| --- | --- | --- |
| `/de/...` | `https://dich-mit-stich.de/...` | Inhalte aktiv |
| `/at/...` | `https://dich-mit-stich.at/...` | Bereitschaftsseite, `noindex` |
| `/ch/...` | `https://dich-mit-stich.ch/...` | Bereitschaftsseite, `noindex` |

`proxy.ts` setzt die Trennung zwischen internen Vercel-Pfaden und öffentlichen Reverse-Proxy-URLs um:

- Vercel `/magazin` → permanenter Redirect auf `/de/magazin`
- Vercel `/de/magazin` → internes Rewrite auf den bestehenden DE-Contentbaum
- `/at/...` und `/ch/...` → sichere Markt-Platzhalter, solange `contentEnabled` deaktiviert ist
- Framework-Assets, `/_next/image` und APIs bleiben unberührt

Öffentliche Canonicals sind immer präfixlos auf der Landesdomain. Interne Contentlinks bleiben ebenfalls präfixlos, damit Reverse-Proxy-Besucher auf ihrer Landesdomain bleiben.

Zentrale Konfiguration: [`lib/markets.ts`](./lib/markets.ts)

## Entwicklung

```bash
npm install
npm run dev
```

Danach insbesondere prüfen:

- `http://localhost:3000/` → `/de`
- `http://localhost:3000/de/magazin`
- `http://localhost:3000/at/magazin`
- `http://localhost:3000/ch/tattoo-singles/berlin`
- `http://localhost:3000/de/robots.txt`
- `http://localhost:3000/ch/sitemap.xml`

## Qualitätsgates

```bash
npm test
npm run lint
npx tsc --noEmit
npm run check:wordpress-budget
npm run build
```

Die Marktrouting-Verträge liegen in `tests/market-routing.test.mjs`.

## Lokale TLS-Inspection

In Netzen mit Fortinet oder vergleichbarer TLS-Inspection darf die Zertifikatsprüfung nicht deaktiviert werden. Die kontrolliert verifizierte öffentliche Unternehmens-/Appliance-CA wird nur lokal eingebunden:

```bash
NODE_EXTRA_CA_CERTS="/absoluter/pfad/zur/ca.pem" npm run build
```

CA-Dateien und lokale Diagnoseartefakte sind nicht Teil des Repositories.

## Dokumentation

Die vollständige Architektur- und Reverse-Proxy-Checkliste liegt im Obsidian-Vault:

- `08 Playbooks/Mehrmarkt- und Sprachlogik – ein CMS, mehrere Länder sauber ausspielen.md`
- `04 CMS + WordPress + ICONY/dich-mit-stich.de – Next.js-Vercel-Migration.md`
