# Magazin-Bausteine (`mag-*`)

Seit 31. Oktober 2026. Christian: Artikel sollen nicht „so stupide textlastig“ sein, „Häufige Fragen als FAQ-Section“, Tabellen schöner darstellen.

Die Bausteine stehen als HTML mit Klassen `mag-*` direkt im Beitrag (`content/magazin/beitraege/*.md`). `lib/market-html.ts` lässt nur diese Klassen durch, Inline-Style nur `width:<0–100>%` an `span.mag-bar`. Gestaltung: `app/magazine-blocks.css`. Musterartikel: `tattoos-attraktivitaet-studien.md`.

| Baustein | Wofür | Gerüst |
|---|---|---|
| Kennzahlen | „Das Wichtigste in Kürze“ mit großen Zahlen | `div.mag-stats > p.mag-stat > strong.mag-stat-value + span.mag-stat-label + small.mag-stat-source` |
| Hinweisbox | Kurzfazit, Einordnung, Grenzen | `aside.mag-callout > p.mag-callout-title + p/ul` |
| Balkendiagramm | Prozentwerte statt Tabelle, 1–2 Reihen | `figure.mag-chart > figcaption.mag-chart-title + p.mag-chart-sub + p.mag-chart-legend > span.mag-legend(.mag-legend-b)` und je Zeile `div.mag-chart-row > span.mag-chart-label + div.mag-chart-bars > span.mag-bar-track > span.mag-bar(.mag-bar-b)[style=width:44%] + span.mag-bar-value`, am Ende `small.mag-source` |
| 100-%-Balken | Zustimmung/Ablehnung/unsicher | `figure.mag-split > figcaption.mag-chart-title + div.mag-split-bar > span.mag-bar / .mag-bar-b / .mag-bar-c` + Legende mit `.mag-legend-c` |
| Infografik | Codex-Grafiken | `figure.mag-figure > img` |
| Rohdaten | Tabelle zur Grafik, zugeklappt | `details.mag-data > summary + div.mag-table > table` |
| Studienkarten | Experimente/Quellen im Überblick | `div.mag-studies > section.mag-study > p.mag-study-meta > span.mag-chip …, h3, p, small.mag-source` |
| Vergleich | zwei Gruppen mit ↑ ↓ = | `div.mag-compare > div.mag-compare-card > h3 + ul.mag-effects > li.mag-up / .mag-down / .mag-same` |
| Schritte | Tipps, Anleitungen | `ol.mag-steps > li > h3 + p` |
| Fazit | farbige Abschlussbox | `section.mag-verdict > h2 + p` |
| FAQ | „Häufige Fragen“ als Akkordeon, erzeugt FAQPage-Schema | `section.mag-faq > h2 + details.mag-faq-item > summary + div.mag-faq-answer > p` |

Regeln:
- Jeder neue Artikel nutzt mindestens Kennzahlen oder Hinweisbox, ein visuelles Element pro Hauptabschnitt und die FAQ-Section.
- Zahlen in Diagrammen nur mit Quelle (`small.mag-source`). Tabellen nicht ersatzlos löschen, sondern als `details.mag-data` unter die Grafik.
- Quellenblock am Ende bleibt „Stand, Quellen &amp; Transparenz“ und wird automatisch eingeklappt.
