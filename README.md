# Dich mit Stich – Next.js/Vercel-Migration

Headless-Frontend für `dich-mit-stich.de`, `.at` und `.ch`. Alle Inhalte (Magazin, Seiten, Autoren, Tattoo-Singles-Stadtseiten) liegen als Dateien im Repo, WordPress wird nicht mehr abgefragt; Legacy-/ICONY-Ziele bleiben für Login und Registrierung zuständig.

## Inhalte (ohne WordPress)

Seit 2026-10-02 liest die App keine WordPress-REST-API mehr, weder zur Laufzeit noch beim Build:

| Inhalt | Ort |
| --- | --- |
| Beiträge (54) | `content/magazin/beitraege/<slug>.md` (Frontmatter + HTML; SEO-Titel/Description aus AIOSEO in `seoTitle`/`description`) |
| Seiten (67, u. a. Hubs, Motiv-Lexikon, Autorenprofile) | `content/magazin/seiten/<slug>.md` |
| Tattoo-Singles-Stadtseiten (36) | `content/staedte/<markt>-<stadt>.md` |
| Kategorien, Autoren | `data/magazin-kategorien.json`, `data/magazin-autoren.json` |
| Bilder, Audio | `public/magazin/wp-content/uploads/…` (Pfad wie früher in WordPress; Auslieferung vom Asset-Host) |
| WordPress-Slug-Inventar (Stand 2026-10-02) | `data/wordpress-inventar.json` |

Loader: `lib/magazine.ts` (Abfrage-API), `lib/magazine-text.ts` (Typen, Textwerkzeuge), `lib/magazine-content.ts`, `lib/city-pages.ts`. Die Breadcrumb-Ebene unter `/magazin/piercingarten` und `/magazin/tattoo-lexikon` ergibt sich aus der Linkliste der jeweiligen Hub-Seite in `content/magazin/seiten/`. Neuer Beitrag = Datei anlegen, committen, pushen. Audio-Zusammenfassungen: `node --env-file=.env.local scripts/audio-summaries.mjs <texte.json> --write`.

Die Einmalwerkzeuge der Ablösung stehen in `scripts/export-wordpress.mjs`, `scripts/download-wp-uploads.mjs`, `scripts/import-wordpress.mjs`, der Vorher/Nachher-Vergleich in `scripts/crawl-routes.mjs` und `scripts/compare-routes.mjs`; die alten WordPress-Schreibskripte liegen unter `archiv/wordpress-abloesung/`. Nach redaktionellen Korrekturen den Import nicht erneut laufen lassen.

### WordPress-kompatibler Endpunkt für ICONY

ICONY (Heiko Grossmann) liest auf den Plattform-Startseiten drei Magazin-Teaser im WP-Format. Der Endpunkt wird aus den
Magazin-Beiträgen erzeugt (`lib/wp-rest-compat.ts`, `app/cms-mag/wp-json/…`, `app/magazin/wp-json/…`, Umleitung von `?rest_route=` in `proxy.ts`):

- `https://dich-mit-stich.de/cms-mag/wp-json/wp/v2/posts?per_page=3&_embed=1` und gleichwertig `/magazin/wp-json/wp/v2/posts`
  (außerdem `/posts/<id>`, `/categories`, `/tags`, `/media/<id>`)
- `…/cms-mag/?rest_route=/wp/v2/posts` und `…/cms-mag/index.php?rest_route=/wp/v2/posts` (ebenso unter `/magazin/`)
- Parameter: `per_page`, `page`, `_embed`, `_fields`, `orderby`, `order`, `categories`, `slug`, `search`, `include`, `after`/`before`;
  Header `X-WP-Total`, `X-WP-TotalPages`, CORS `*`, `Cache-Control`; OPTIONS/HEAD.
- Nur Magazin-**Beiträge** (`content/magazin/beitraege`). Keine Seiten (Hubs, Lexikon, Autorenprofile), keine Tattoo-Studios oder Städte,
  kein `/wp/v2/users` (404), `author` nur als ID, kein `_embedded.author`. `link` ist die Live-URL `https://dich-mit-stich.de/magazin/<slug>/`,
  Bild-URLs kommen vom Asset-Host (`/app-assets/…`).
- **nginx/ICONY:** `/cms-mag/wp-json/` und `/magazin/wp-json/` (außerdem `/cms-mag/` bzw. `/magazin/` mit `rest_route` sowie `…/index.php`) müssen
  wie die Seitenrouten an Vercel durchgereicht werden. nginx ruft Vercel mit `/de/…` auf; beides geht (Slash am Ende wird nicht erzwungen).
- Bildmaße kommen aus `data/magazin-bilder.json`; nach neuen Titelbildern `node scripts/build-magazine-image-sizes.mjs` ausführen.

## Markt-Routing

| Vercel-Pfad | Öffentliche Domain | Status |
| --- | --- | --- |
| `/de/...` | `https://dich-mit-stich.de/...` | Inhalte aktiv |
| `/at/...` | `https://dich-mit-stich.at/...` | Bereitschaftsseite, `noindex` |
| `/ch/...` | `https://dich-mit-stich.ch/...` | 10 Tattoo-Stadtseiten aktiv; übrige Bereiche `noindex` |

`proxy.ts` setzt die Trennung zwischen internen Vercel-Pfaden und öffentlichen Reverse-Proxy-URLs um:

- Vercel `/magazin` → permanenter Redirect auf `/de/magazin`
- Vercel `/de/magazin` → internes Rewrite auf den bestehenden DE-Contentbaum
- `/at/...` und nicht freigegebene `/ch/...`-Pfade → sichere Markt-Platzhalter
- `/ch/tattoo-singles` und die 10 importierten CH-Städte → eigener statischer CH-Contentbaum
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
npm run build
```

Die Marktrouting-Verträge liegen in `tests/market-routing.test.mjs`. Die CH-Stadtseiten werden als geprüfter Snapshot aus ICONY importiert:

```bash
npm run import:cities:ch
```

Der Import erwartet exakt zehn freigegebene Städte, speichert die Bilder lokal unter `public/cities/ch/` und verändert unveränderte Dateien nicht.

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
