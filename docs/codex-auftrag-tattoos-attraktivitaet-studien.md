# Codex-Auftrag: Titelbild + 3 Infografiken „Machen Tattoos attraktiv?“ (dich-mit-stich.de)

Angelegt am 31. Oktober 2026 von Claude. Trello: Karte „Codex: Titelbild + 3 Infografiken Tattoo-Studien dich-mit-stich.de“ (Board „Christian Aufgaben“, Liste „in Bearbeitung“).

- Repo: `datingnischen/dich-mit-stich`, Branch `main` (Artikel seit Commit `7706a7c`)
- Beitrag: `content/magazin/beitraege/tattoos-attraktivitaet-studien.md`, live unter https://dich-mit-stich.de/magazin/tattoos-attraktivitaet-studien/
- Ablage aller Dateien: `public/magazin/wp-content/uploads/2026/10/`
- Farben aus dem Logo bzw. `app/globals.css`: Brand `#67133c`, Brand soft `#f5edf1`, Text `#494949`, Linien `#eaeaea`, Hintergrund weiß. Keine Logos oder Markenzeichen Dritter (kein Parship-, YouGov- oder Pew-Logo).

## 1. Titelbild

- Datei: `tattoos-attraktivitaet-studien.webp`, 1200 × 800 px, WebP, höchstens etwa 200 KB
- Motiv: Zwei Menschen Anfang 30 beim ersten Date in einem Café, eine Person mit sichtbaren Tattoos am Unterarm, beide lachen, natürliches Licht, realistisch. Kein Text im Bild, nichts Anzügliches, keine Gesichtstattoos.
- Frontmatter ergänzen: `image: /magazin/wp-content/uploads/2026/10/tattoos-attraktivitaet-studien.webp` und `imageAlt` passend zum Motiv (nie leer)

## 2. Infografiken

Jeweils WebP, 1200 px breit, Höhe nach Bedarf, mobil lesbar (große Ziffern), deutsche Beschriftung. Quelle klein unten in der Grafik. Zahlen nur wie hier angegeben.

### Grafik A: Tätowierte Singles und Tattoo-Sympathie nach Alter

- Datei: `tattoo-singles-deutschland-alter.webp`
- Inhalt: gruppierte Balken je Altersgruppe, „tätowiert“ und „finden kleine Tattoos attraktiv“: 18–29: 15 % / 44 %; 30–39: 19 % / 42 %; 40–49: 20 % / 43 %; 50–59: 12 % / 32 %; ab 60: 6 % / 21 %. Gesamt: 14 % / 35 %.
- Quelle: „Parship/Innofact, Juli 2021, 3.653 Singles in Deutschland“
- Einbinden direkt nach der ersten Tabelle unter „Deutschland“
- Alt-Text: „Balkendiagramm: Von den Singles in Deutschland sind 14 Prozent tätowiert und 35 Prozent finden kleine Tattoos attraktiv, bei unter 50-Jährigen über 40 Prozent, ab 60 Jahren 21 Prozent“

### Grafik B: Wer Tattoos attraktiv findet

- Datei: `tattoos-attraktiv-taetowierte-vs-nicht-taetowierte.webp`
- Inhalt: zwei Balkenpaare, „Tätowierte wirken attraktiver“ / „weniger attraktiv“: Befragte ohne Tattoo 10,2 % / 35,4 %; Befragte mit Tattoo 26,0 % / 5,5 %. Untertitel: „Die meisten sehen keinen Unterschied.“
- Quelle: „Morlock & Morlock, Cureus 2023, 3.033 Erwachsene in den USA“
- Einbinden direkt nach der Tabelle unter „Wer selbst tätowiert ist, sieht Tattoos anders“
- Alt-Text: „Diagramm: 35,4 Prozent der Befragten ohne Tattoo finden Tätowierte weniger attraktiv, nur 10,2 Prozent attraktiver; bei Tätowierten finden 26 Prozent Tätowierte attraktiver und 5,5 Prozent weniger attraktiv“

### Grafik C: Was ein Tattoo in Experimenten verändert

- Datei: `tattoo-experimente-wirkung-maenner-frauen.webp`
- Inhalt: zwei Spalten „Tätowierte Männer“ und „Tätowierte Frauen“ mit Pfeilen (↑ höher, ↓ niedriger, = kein Unterschied):
  - Männer (Galbarczyk & Ziomkiewicz 2017, 2.584 Teilnehmende): männlicher ↑, dominanter ↑, aggressiver ↑, aus Sicht von Frauen gesünder ↑, aus Sicht von Frauen attraktiver =, aus Sicht von Frauen als Partner und Vater ↓, aus Sicht von Männern attraktiver ↑
  - Frauen: angesprochen von Männern häufiger und schneller ↑, attraktiver = (Guéguen 2013); stärker und unabhängiger ↑, andere Eigenschaften ↓ (Broussard & Harton 2018)
  - Fußzeile: „Gesichtstattoos: in allen Gruppen am schlechtesten bewertet (Weiler u. a. 2024)“
- Einbinden direkt vor der Überschrift „Wie belastbar sind die Ergebnisse?“
- Alt-Text: „Übersicht: In Experimenten wirken tätowierte Männer männlicher und dominanter, aber für Frauen nicht attraktiver; tätowierte Frauen werden häufiger angesprochen, aber nicht als attraktiver bewertet“

Einbinden im HTML des Artikels als:

```html
<figure><img src="/magazin/wp-content/uploads/2026/10/<datei>.webp" alt="<Alt-Text>" width="1200" height="<Höhe>" loading="lazy" /></figure>
```

Tabellen im Text bleiben stehen. In „Genutzte Quellen“ ergänzen: „Titelbild: KI-generiertes Symbolbild. Infografiken: eigene Darstellung nach den genannten Studien.“

## Prüfen, committen, pushen

```bash
npm test
```

Git-Autor und -Committer ausschließlich `christian@datingnischen.de` (`git var GIT_AUTHOR_IDENT` / `git var GIT_COMMITTER_IDENT`). Danach pushen, live prüfen (Bilder laden mit 200 auch hinter dem ICONY-nginx) und das Ergebnis als Kommentar in die Trello-Karte schreiben.
