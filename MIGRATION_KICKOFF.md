# Dich mit Stich – Vercel Migration Kickoff

Stand: 2026-07-24

## Repo
- GitHub: `https://github.com/datingnischen/dich-mit-stich.git`
- Lokaler Pfad: `/root/dich-mit-stich`
- Geplanter SSH-Remote: `git@github-dich-mit-stich:datingnischen/dich-mit-stich.git`

## Quellsysteme
- Live-Startseite / Hauptseite aktuell auf ICONY:
  - `https://dich-mit-stich.de/`
- WordPress-Magazin vorhanden:
  - `https://dich-mit-stich.de/magazin/`
- WordPress REST erreichbar:
  - `https://dich-mit-stich.de/magazin/wp-json/wp/v2/pages?per_page=1`

## Bereits verifiziert
- GitHub-Repo existiert öffentlich und ist aktuell leer (`main`, Size 0).
- Lokales Repo geklont und auf SSH-Deploy-Key-Remote vorbereitet.
- Startseite nutzt klar ICONY-Assets (`static2.icony-hosting.de`).
- Magazin ist ein separates WordPress-System.

## Migrationsziel
- Headless/Vercel-Frontend als neue öffentliche Ebene.
- ICONY-Frontend schrittweise ablösen.
- WordPress-Magazin als Content-Quelle weiterverwenden.
- Später: weitere Inhalte aus ICONY in eine saubere Next.js/Vercel-Struktur überführen.

## Playbook – empfohlene Reihenfolge
1. Deploy-Key in GitHub-Repo hinterlegen.
2. Repo push-fähig machen und ersten Commit setzen.
3. Next.js/Vercel-Grundgerüst aufsetzen.
4. Startseite visuell/inhaltlich aus ICONY nachbauen.
5. Magazin-Listing und Magazin-Detailseiten an WordPress anbinden.
6. SEO-Basis aufsetzen:
   - Canonical
   - Sitemap
   - robots
   - OpenGraph
7. Vercel-Projekt verbinden und erste öffentliche Vorschau deployen.
8. Danach schrittweise weitere ICONY-Routen migrieren.

## Nächster technischer Step
- Deploy-Key bei GitHub eintragen, dann kann ich direkt den ersten Projekt-Commit + Vercel-Basis aufsetzen.
