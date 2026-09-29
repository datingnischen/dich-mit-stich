#!/usr/bin/env node
/**
 * Baut die Google-Ads-Editor-Importdatei für die Ads-Landingpage /tattoo-singles/kennenlernen/.
 * Drei Suchkampagnen (DE, AT, CH), alle PAUSIERT: Import in Google Ads Editor → Konto wählen →
 * "Konto > Importieren > Aus Datei" → prüfen → veröffentlichen → im Web aktivieren.
 *
 *   node scripts/build-google-ads-import.mjs
 *
 * Die Final-URLs tragen ?v=<variante> (und &stadt=<slug>), damit H1 und Live-Widget der
 * Landingpage zur Anzeigengruppe passen (lib/landing-tattoo-singles.ts). Alle Texte werden gegen
 * die Google-Limits geprüft; ein Verstoß bricht den Build ab.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LIMITS = { headline: 30, description: 90, path: 15, keyword: 80 };

// Google Ads Editor und Web-Uploads lesen UTF-8 mit BOM und Windows-Zeilenenden am zuverlässigsten.
const BOM = String.fromCharCode(0xfeff);
const CRLF = String.fromCharCode(13, 10);
const LF = String.fromCharCode(10);

const LANDING_PATH = "/tattoo-singles/kennenlernen/";

export const MARKETS = {
  de: {
    campaign: "DMS DE - Tattoo-Singles kennenlernen",
    domain: "dich-mit-stich.de",
    location: "Germany",
    locationId: "2276",
    budget: "20.00",
    maxCpc: "0.80",
    country: "Deutschland",
    range: "von Berlin bis München",
    cities: [
      { slug: "berlin", label: "Berlin" },
      { slug: "hamburg", label: "Hamburg" },
      { slug: "muenchen", label: "München" },
      { slug: "koeln", label: "Köln" },
    ],
  },
  at: {
    campaign: "DMS AT - Tattoo-Singles kennenlernen",
    domain: "dich-mit-stich.at",
    location: "Austria",
    locationId: "2040",
    budget: "10.00",
    maxCpc: "1.00",
    country: "Österreich",
    range: "von Wien bis Innsbruck",
    cities: [
      { slug: "wien", label: "Wien" },
      { slug: "graz", label: "Graz" },
    ],
  },
  ch: {
    campaign: "DMS CH - Tattoo-Singles kennenlernen",
    domain: "dich-mit-stich.ch",
    location: "Switzerland",
    locationId: "2756",
    budget: "10.00",
    maxCpc: "1.00",
    country: "Schweiz",
    range: "von Zürich bis Genf",
    cities: [
      { slug: "zuerich", label: "Zürich" },
      { slug: "bern", label: "Bern" },
      { slug: "basel", label: "Basel" },
    ],
  },
};

/** Kampagnenweite Ausschlüsse (Wortgruppe). */
export const NEGATIVE_KEYWORDS = [
  "tattoo studio", "tattoostudio", "tätowierer", "tattoo entfernen", "tattoo entfernung", "tattoo vorlagen",
  "tattoo ideen", "tattoo motive", "tattoo bedeutung", "tattoo kosten", "tattoo preise", "tattoo pflege",
  "tattoo schmerzen", "tattoo creme", "tattoo maschine", "piercing stechen", "piercing kosten", "piercing entzündet",
  "job", "jobs", "ausbildung", "kurs", "porno", "porn", "sex", "escort", "nackt", "gratis download",
];

const SHARED_HEADLINES = (m) => [
  "Singlebörse für Tätowierte",
  "Kostenlos registrieren",
  "Singles in deiner Nähe",
  "Umkreissuche & Flirtradar",
  "Geprüfte Profile",
  "Über 20 Jahre Online-Dating",
  "Szene statt Massenbörse",
  "In 2 Minuten dabei",
  "Kein Abo, keine Kreditkarte",
  "Jetzt Singles finden",
  "Dich mit Stich",
  `Tattoo-Singles ${m.country}`,
];

const SHARED_DESCRIPTIONS = (m) => [
  "Singlebörse für Tätowierte: kostenlos anmelden und sehen, wer in deiner Nähe online ist.",
  "Hier fragt keiner, ob das Tattoo wehgetan hat. Geprüfte Profile, Umkreissuche, kostenlos.",
  `Tätowierte Singles ${m.range}. Registrieren, Profil anlegen, losflirten.`,
  "Über 20 Jahre Online-Dating, betrieben von der Icony GmbH. Profil jederzeit löschbar.",
];

/** Anzeigengruppen je Markt: Variante der Landingpage, angeheftete Überschrift 1, Keywords. */
function adGroups(m) {
  const land = { "Deutschland": "deutschland", "Österreich": "österreich", "Schweiz": "schweiz" }[m.country];
  const groups = [
    {
      name: "Tattoo Singles",
      variant: "singles",
      pinned: "Tattoo-Singles kennenlernen",
      extra: ["Frauen & Männer mit Tattoos"],
      descriptions: SHARED_DESCRIPTIONS(m),
      keywords: ["tattoo singles", "tätowierte singles", "singles mit tattoos", "tattoo singlebörse", "singlebörse für tätowierte", "tattoo single", `tattoo singles ${land}`],
    },
    {
      name: "Tattoo Dating",
      variant: "dating",
      pinned: "Tattoo-Dating nach deinem Stil",
      extra: ["Dating für Tätowierte", "Frauen & Männer mit Tattoos"],
      descriptions: SHARED_DESCRIPTIONS(m),
      keywords: ["tattoo dating", "dating für tätowierte", "tattoo dating seite", "tattoo dating app", `tattoo dating ${land}`, "dating mit tattoos"],
    },
    {
      name: "Piercing Singles",
      variant: "piercing",
      pinned: "Gepiercte Singles kennenlernen",
      extra: ["Septum, Sleeve oder Fine Line", "Tattoos & Piercings willkommen"],
      descriptions: [
        "Septum, Sleeve oder Fine Line: Hier musst du nichts erklären. Kostenlos registrieren.",
        ...SHARED_DESCRIPTIONS(m).slice(1),
      ],
      keywords: ["gepiercte singles", "piercing singles", "piercing dating", "gepiercte frauen kennenlernen", "gepiercte männer kennenlernen"],
    },
    {
      name: "Taetowierte Frauen",
      variant: "frauen",
      pinned: "Tätowierte Frauen kennenlernen",
      extra: ["Frauen mit Tattoos treffen", "Frauen in deiner Nähe"],
      descriptions: [
        "Frauen, die Tattoos nicht nur mögen, sondern selbst tragen. Jetzt kostenlos anmelden.",
        "Profile aus deinem Umkreis, geprüft vom Support-Team. Ohne Umwege ins Gespräch kommen.",
        ...SHARED_DESCRIPTIONS(m).slice(2),
      ],
      keywords: ["tätowierte frauen kennenlernen", "tätowierte frau kennenlernen", "tätowierte single frauen", "tattoo frauen dating", "frauen mit tattoos kennenlernen"],
    },
    {
      name: "Taetowierte Maenner",
      variant: "maenner",
      pinned: "Tätowierte Männer kennenlernen",
      extra: ["Männer mit Tattoos treffen", "Männer in deiner Nähe"],
      descriptions: [
        "Männer, die Tinte tragen und wissen, was ein gutes Motiv ist. Jetzt kostenlos anmelden.",
        "Profile aus deinem Umkreis, geprüft vom Support-Team. Ohne Umwege ins Gespräch kommen.",
        ...SHARED_DESCRIPTIONS(m).slice(2),
      ],
      keywords: ["tätowierte männer kennenlernen", "tätowierter mann kennenlernen", "tätowierte single männer", "tattoo männer dating", "männer mit tattoos kennenlernen"],
    },
    {
      name: "Partnersuche Taetowierte",
      variant: "partnersuche",
      pinned: "Partnersuche für Tätowierte",
      extra: ["Beziehung statt Zeitvertreib", "Singles, die es ernst meinen"],
      descriptions: [
        "Eine Beziehung mit jemandem, der deine Leidenschaft teilt. Kostenlos registrieren.",
        ...SHARED_DESCRIPTIONS(m).slice(1),
      ],
      keywords: ["partnersuche tätowierte", "partnersuche tattoo", "partner mit tattoos finden", "tätowierten partner finden", "tätowierte partnerin finden"],
    },
  ];

  for (const city of m.cities) {
    groups.push({
      name: `Stadt ${city.label}`,
      variant: "singles",
      city: city.slug,
      pinned: `Tattoo-Singles in ${city.label}`,
      extra: [`Tätowierte Singles ${city.label}`, `Singles aus ${city.label}`, `Wer in ${city.label} online ist`],
      descriptions: [
        `Tattoo-Singles aus ${city.label} kennenlernen: kostenlos anmelden und sehen, wer online ist.`,
        ...SHARED_DESCRIPTIONS(m).slice(1),
      ],
      keywords: [`tattoo singles ${city.label.toLowerCase()}`, `tätowierte singles ${city.label.toLowerCase()}`, `tattoo dating ${city.label.toLowerCase()}`],
    });
  }
  return groups;
}

/** Schweiz schreibt ohne ß (wie die Landingpage). */
function localize(market, text) {
  return market === "ch" ? text.replaceAll("ß", "ss") : text;
}

export function finalUrl(market, variant, city) {
  const url = new URL(`https://${MARKETS[market].domain}${LANDING_PATH}`);
  url.searchParams.set("v", variant);
  if (city) url.searchParams.set("stadt", city);
  return url.toString();
}

export const COLUMNS = [
  "Campaign", "Campaign Type", "Campaign Status", "Networks", "Languages", "Budget", "Budget type", "Bid Strategy Type",
  "Location", "Location ID",
  "Ad Group", "Ad Group Status", "Max CPC",
  "Keyword", "Criterion Type",
  "Ad type", "Status",
  ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`),
  "Headline 1 position",
  ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
  "Path 1", "Path 2", "Final URL",
];

export function buildRows() {
  const rows = [];
  for (const [market, m] of Object.entries(MARKETS)) {
    const t = (text) => localize(market, text);
    rows.push({
      "Campaign": m.campaign, "Campaign Type": "Search", "Campaign Status": "Paused", "Networks": "Google search",
      "Languages": "de", "Budget": m.budget, "Budget type": "Daily", "Bid Strategy Type": "Manual CPC",
    });
    rows.push({ "Campaign": m.campaign, "Location": m.location, "Location ID": m.locationId });
    for (const keyword of NEGATIVE_KEYWORDS) {
      rows.push({ "Campaign": m.campaign, "Keyword": t(keyword), "Criterion Type": "Negative Phrase" });
    }
    for (const group of adGroups(m)) {
      rows.push({ "Campaign": m.campaign, "Ad Group": group.name, "Ad Group Status": "Enabled", "Max CPC": m.maxCpc });
      for (const keyword of group.keywords) {
        for (const match of ["Phrase", "Exact"]) {
          rows.push({ "Campaign": m.campaign, "Ad Group": group.name, "Keyword": t(keyword), "Criterion Type": match, "Status": "Enabled" });
        }
      }
      const headlines = [...new Set([group.pinned, ...group.extra, ...SHARED_HEADLINES(m)].map(t))].slice(0, 15);
      const ad = {
        "Campaign": m.campaign, "Ad Group": group.name, "Ad type": "Responsive search ad", "Status": "Enabled",
        "Headline 1 position": "1",
        "Path 1": "Tattoo-Singles", "Path 2": group.city ? t(MARKETS[market].cities.find((c) => c.slug === group.city).label) : "Kostenlos",
        "Final URL": finalUrl(market, group.variant, group.city),
      };
      headlines.forEach((headline, index) => { ad[`Headline ${index + 1}`] = headline; });
      group.descriptions.slice(0, 4).map(t).forEach((description, index) => { ad[`Description ${index + 1}`] = description; });
      rows.push(ad);
    }
  }
  return rows;
}

export function validateRows(rows) {
  const problems = [];
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (/^Headline \d+$/.test(key) && value.length > LIMITS.headline) problems.push(`${key} > ${LIMITS.headline}: ${value}`);
      if (/^Description \d$/.test(key) && value.length > LIMITS.description) problems.push(`${key} > ${LIMITS.description}: ${value}`);
      if (/^Path \d$/.test(key) && value.length > LIMITS.path) problems.push(`${key} > ${LIMITS.path}: ${value}`);
      if (key === "Keyword" && value.length > LIMITS.keyword) problems.push(`Keyword > ${LIMITS.keyword}: ${value}`);
      if (row.Campaign?.startsWith("DMS CH") && typeof value === "string" && value.includes("ß")) problems.push(`CH mit ß: ${value}`);
      if (/!/.test(value) && /^(Headline|Description)/.test(key)) problems.push(`Ausrufezeichen: ${value}`);
    }
    if (row["Ad type"]) {
      const headlines = Object.keys(row).filter((key) => /^Headline \d+$/.test(key));
      const descriptions = Object.keys(row).filter((key) => /^Description \d$/.test(key));
      if (headlines.length < 3) problems.push(`${row["Ad Group"]}: zu wenige Titel`);
      if (descriptions.length < 2) problems.push(`${row["Ad Group"]}: zu wenige Beschreibungen`);
    }
  }
  return problems;
}

function csvCell(value = "") {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(rows) {
  const lines = [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((column) => csvCell(row[column])).join(","))];
  return `${BOM}${lines.join(CRLF)}${CRLF}`;
}

/**
 * Dateien für die Web-Massenbearbeitung (Google Ads → Tools → Massenaktionen → Uploads). Google
 * verlangt je Entität eine eigene Datei mit eigenen Spaltennamen (Vorlagen: support.google.com/google-ads/answer/10702525).
 * Reihenfolge beim Hochladen: Kampagnen → Anzeigengruppen → Keywords → Anzeigen. Ausschlüsse als Liste zum Einfügen.
 */
export function buildWebUploads(rows = buildRows()) {
  const campaigns = rows.filter((row) => row["Campaign Type"] === "Search").map((row) => {
    const location = rows.find((r) => r.Campaign === row.Campaign && r.Location);
    return {
      "Action": "Add", "Campaign status": "Paused", "Campaign": row.Campaign, "Campaign type": "Search",
      "Networks": "Google search", "Budget": row.Budget, "Budget type": "Daily", "Bid strategy type": "Manual CPC",
      "Language": "de", "Location": location.Location,
    };
  });
  const maxCpc = Object.fromEntries(Object.values(MARKETS).map((m) => [m.campaign, m.maxCpc]));
  const adGroupRows = rows.filter((row) => row["Ad Group Status"]).map((row) => ({
    "Action": "Add", "Campaign": row.Campaign, "Ad group": row["Ad Group"], "Status": "Enabled", "Default max. CPC": row["Max CPC"],
  }));
  const keywordRows = rows.filter((row) => row["Criterion Type"] === "Phrase" || row["Criterion Type"] === "Exact").map((row) => ({
    "Action": "Add", "Keyword status": "Enabled", "Campaign": row.Campaign, "Ad group": row["Ad Group"], "Keyword": row.Keyword,
    "Match Type": `${row["Criterion Type"]} match`, "Default max. CPC": maxCpc[row.Campaign],
  }));
  const adRows = rows.filter((row) => row["Ad type"]).map((row) => {
    const ad = { "Action": "Add", "Ad status": "Enabled", "Campaign": row.Campaign, "Ad group": row["Ad Group"], "Ad type": "Responsive search ad" };
    for (let i = 1; i <= 15; i += 1) if (row[`Headline ${i}`]) ad[`Headline ${i}`] = row[`Headline ${i}`];
    ad["Headline 1 position"] = "1";
    for (let i = 1; i <= 4; i += 1) if (row[`Description ${i}`]) ad[i === 1 ? "Description" : `Description ${i}`] = row[`Description ${i}`];
    ad["Path 1"] = row["Path 1"];
    ad["Path 2"] = row["Path 2"];
    ad["Final URL"] = row["Final URL"];
    return ad;
  });
  return { "1-kampagnen": campaigns, "2-anzeigengruppen": adGroupRows, "3-keywords": keywordRows, "4-anzeigen": adRows };
}

function rowsToCsv(list) {
  const columns = [...new Set(list.flatMap((row) => Object.keys(row)))];
  const lines = [columns.join(","), ...list.map((row) => columns.map((column) => csvCell(row[column])).join(","))];
  return `${BOM}${lines.join(CRLF)}${CRLF}`;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rows = buildRows();
  const problems = validateRows(rows);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  const target = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/google-ads/dich-mit-stich-kennenlernen-editor-import.csv");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, toCsv(rows), "utf8");
  const webDir = resolve(dirname(target), "web-upload");
  mkdirSync(webDir, { recursive: true });
  for (const [name, list] of Object.entries(buildWebUploads(rows))) {
    writeFileSync(resolve(webDir, `${name}.csv`), rowsToCsv(list), "utf8");
  }
  writeFileSync(resolve(webDir, "5-ausschluesse.txt"), `${NEGATIVE_KEYWORDS.map((k) => `"${k}"`).join(LF)}${LF}`, "utf8");
  writeFileSync(resolve(webDir, "5-ausschluesse-ch.txt"), `${NEGATIVE_KEYWORDS.map((k) => `"${localize("ch", k)}"`).join(LF)}${LF}`, "utf8");
  const ads = rows.filter((row) => row["Ad type"]).length;
  const keywords = rows.filter((row) => row["Criterion Type"] === "Phrase" || row["Criterion Type"] === "Exact").length;
  console.log(`${target}\n3 Kampagnen (pausiert), ${ads} Anzeigengruppen/RSAs, ${keywords} Keywords, ${NEGATIVE_KEYWORDS.length} Ausschlüsse je Kampagne`);
}
