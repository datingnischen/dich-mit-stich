# Codex-Auftrag: Social-Karten „Zahl der Woche“ (dich-mit-stich.de + ab50.de)

Angelegt am 2. November 2026 von Claude. Trello: Karte „Codex: Social-Karten Zahl der Woche (dich-mit-stich + ab50)“ (Board „Christian Aufgaben“, Liste „in Bearbeitung“).

Die Posts plant `Projects/datingnischen/zahl-der-woche/zahl_der_woche.py` aus `posts.json`. Texte und Zahlen stehen dort (Felder `zahl`, `kernaussage`, `quelle`). Nur diese Zahlen verwenden.

## Format für alle Karten

- JPEG (Instagram akzeptiert nur JPEG), 1080 × 1350 px (4:5), höchstens etwa 400 KB
- Aufbau: kleine Zeile „Zahl der Woche“ oben, darunter die Zahl sehr groß, darunter die Kernaussage in 1–3 Zeilen, unten klein die Quelle und die Domain
- Deutsche Beschriftung, mobil lesbar, kein Fließtext, keine Personenfotos, keine Logos Dritter (kein YouGov-, Parship- oder Destatis-Logo)
- Alle Karten einer Seite im selben Layout, damit sie im Feed als Serie erkennbar sind

## dich-mit-stich.de (Repo `dich-mit-stich`)

Farben aus dem Logo: Bordeaux `#67133c`, Rosé `#f5edf1`, Altrosa `#a8758a`. Dunkler Hintergrund mit Tattoo-Linienornament dezent am Rand ist erwünscht.

Ablage: `public/social/zahl-der-woche/<datei>`

| Datei | Zahl | Kernaussage | Quelle |
|---|---|---|---|
| `dms-2026-11-11.jpg` | 1 von 5 | Menschen in Deutschland ab 14 ist tätowiert | Universität Leipzig, Bundesgesundheitsblatt 2019 |
| `dms-2026-11-18.jpg` | 35 % | der Singles in Deutschland finden kleine Tattoos attraktiv | Parship/Innofact 2021, 3.653 Singles |
| `dms-2026-11-25.jpg` | 73 % | der Frauen sagen: Tattoos auf Männern können attraktiv sein | YouGov 2025, 1.115 Erwachsene in den USA |
| `dms-2026-12-02.jpg` | 34 % | finden es okay, jemanden wegen seiner Tattoos nicht zu daten | YouGov 2025, USA |

## ab50.de (Repo `datingnischen/ab50`, lokal `ab50-nextjs`)

Farben aus dem Logo (`app/ab-base.css`): Blau `#1c4e95`, Nachtblau `#0b2146`, Rot `#ad1d1d`, Hellblau `#e8eff9`, Creme `#faf7f2`. Ruhig und warm, große Schrift.

Ablage: `public/social/zahl-der-woche/<datei>`

| Datei | Zahl | Kernaussage | Quelle |
|---|---|---|---|
| `ab50-2026-11-12.jpg` | 1 von 10 | der 43- bis 55-Jährigen lebt in einer Partnerschaft mit zwei Wohnungen | Deutscher Alterssurvey 2023 (DZA) |
| `ab50-2026-11-19.jpg` | 80 % | der über 65-Jährigen in einer Partnerschaft mit zwei Wohnungen möchten eher nicht zusammenziehen | Deutscher Alterssurvey 2023 (DZA) |
| `ab50-2026-11-26.jpg` | 41.500 | Menschen ab 50 haben 2022 zum ersten Mal geheiratet – 2002 waren es 7.500 | Statistisches Bundesamt 2024 |
| `ab50-2026-12-03.jpg` | gut 20 % | aller Eheschließungen 2022 waren Ehen nach einer Scheidung | Statistisches Bundesamt |

Achtung ab50: Im Arbeitsordner können fremde, nicht committete Änderungen liegen. Nur die eigenen Bilddateien stagen.

## Prüfen, committen, pushen

Git-Autor und -Committer ausschließlich `christian@datingnischen.de`. In beiden Repos pushen und prüfen, dass die Bilder als `image/jpeg` erreichbar sind:

- https://dich-mit-stich.vercel.app/social/zahl-der-woche/dms-2026-11-11.jpg
- https://ab50-nextjs.vercel.app/social/zahl-der-woche/ab50-2026-11-12.jpg

Nicht selbst posten oder planen. Das Ergebnis als Kommentar in die Trello-Karte schreiben; Claude plant die Posts nach Christians Freigabe ein.
