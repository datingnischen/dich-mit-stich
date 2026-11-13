#!/usr/bin/env node
// Natürliche Zeitstempel für neue oder überarbeitete Magazinbeiträge (Frontmatter published/updated, Ortszeit Europe/Berlin).
// Nie runde Uhrzeiten oder dieselbe Uhrzeit für alle Beiträge eintragen: Die Werte erscheinen in JSON-LD, Sitemap
// und /magazin/wp-json. Höchstens zwei Beiträge je Erscheinungstag (tests/magazine-timestamps.test.mjs), sonst einen
// freien Tag davor wählen. Aufruf:
//   node scripts/zeitstempel.mjs <slug> [JJJJ-MM-TT]           neuer Beitrag (published = updated)
//   node scripts/zeitstempel.mjs <slug> [JJJJ-MM-TT] --update  nur updated für eine Überarbeitung
import { randomInt } from "node:crypto";

const [slug, dayArg] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const update = process.argv.includes("--update");
if (!slug) {
  console.error("Aufruf: node scripts/zeitstempel.mjs <slug> [JJJJ-MM-TT] [--update]");
  process.exit(1);
}

// Stundengewichte: kaum früh morgens, Schwerpunkte vormittags, nachmittags und abends.
const HOURS = [[7, 2], [8, 5], [9, 8], [10, 10], [11, 9], [12, 6], [13, 6], [14, 8], [15, 9], [16, 8], [17, 7], [18, 6], [19, 7], [20, 8], [21, 6], [22, 3]]
  .flatMap(([hour, weight]) => Array(weight).fill(hour));
const pad = (n) => String(n).padStart(2, "0");
const berlinParts = (instant) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
}).formatToParts(instant).map((part) => [part.type, part.value]));
const localIso = (p) => `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;

const now = new Date();
const day = dayArg || localIso(berlinParts(now)).slice(0, 10);
let minute = randomInt(60);
if (minute === 0 || minute === 30) minute += 7;
let local = `${day}T${pad(HOURS[randomInt(HOURS.length)])}:${pad(minute)}:${pad(1 + randomInt(59))}`;
if (local > localIso(berlinParts(now))) {
  // Nie in der Zukunft: heute zufällig 20 bis 140 Minuten vor jetzt.
  local = localIso(berlinParts(new Date(now.getTime() - (20 + randomInt(120)) * 60_000 - randomInt(59) * 1000)));
}

// Offset Europe/Berlin an diesem Zeitpunkt (für Dateien, die Werte mit +01:00/+02:00 speichern).
const naive = Date.parse(`${local}Z`);
const offsetAt = (instant) => Date.parse(`${localIso(berlinParts(new Date(instant)))}Z`) - instant;
const offsetHours = offsetAt(naive - offsetAt(naive)) / 3_600_000;

if (!update) console.log(`published: "${local}"`);
console.log(`updated: "${local}"`);
console.log(`# mit Offset, falls die Datei Offsets nutzt: ${local}+0${offsetHours}:00`);
if (!slug.match(/^[a-z0-9-]+$/)) console.error(`Hinweis: ungewöhnlicher Slug „${slug}“`);
