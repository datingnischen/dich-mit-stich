import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadFaq() {
  try {
    return await import("../lib/faq.ts");
  } catch (error) {
    assert.fail(`lib/faq.ts must provide the migrated FAQ contract: ${error.message}`);
  }
}

test("migrates the complete existing DE FAQ inventory", async () => {
  const { FAQ_PATH, faqSections, faqAnswerText } = await loadFaq();

  assert.equal(FAQ_PATH, "/faq");
  assert.equal(faqSections.length, 8);
  assert.deepEqual(faqSections.map((section) => section.title), [
    "Allgemeines über dich-mit-stich.de",
    "Erfahrungen & Seriosität von dich-mit-stich.de",
    "Anmeldung, Mitgliedschaft & Kosten",
    "Nutzung & Funktionen",
    "Profil & persönliche Einstellungen",
    "Sicherheit & Datenschutz",
    "Konto & Support",
    "Transparenz & häufige Rückfragen zu dich-mit-stich.de",
  ]);

  const items = faqSections.flatMap((section) => section.items);
  assert.equal(items.length, 25);
  for (const expectedQuestion of [
    "An wen richtet sich dich-mit-stich.de?",
    "Gibt es externe Bewertungen zu dich-mit-stich.de?",
    "Wie kann ich Premium kündigen?",
    "Gibt es eine redaktionelle Profilprüfung?",
    "Wie schützt ihr meine Daten?",
    "Ist dich-mit-stich.de eine Abo-Abzocke?",
    "Gibt es bei dich-mit-stich.de Fake-Profile oder Bots?",
  ]) {
    assert.ok(items.some((item) => item.question === expectedQuestion), `${expectedQuestion} must be retained`);
  }

  const serialized = JSON.stringify(faqSections);
  assert.doesNotMatch(serialized, /web\.archive\.org|registration\/\?user=|static-cms\.icony-hosting/i);
  assert.match(serialized, /\/kontakt\/k%C3%BCndigen/);
  assert.match(serialized, /\/redaktionelle-kontrolle\.html/);
  assert.match(serialized, /\/unsere-erfolgsgeschichten\.html/);
  assert.ok(items.every((item) => faqAnswerText(item.answer).length > 20));
});

test("builds FAQPage schema from every migrated question", async () => {
  const { buildFaqGraph, faqSections } = await loadFaq();
  const graph = buildFaqGraph();
  const faqNode = graph["@graph"].find((node) => node["@type"] === "FAQPage");
  const expectedCount = faqSections.flatMap((section) => section.items).length;

  assert.equal(graph["@context"], "https://schema.org");
  assert.equal(faqNode.url, "https://dich-mit-stich.de/faq");
  assert.equal(faqNode.mainEntity.length, expectedCount);
  assert.ok(faqNode.mainEntity.every((entity) => entity["@type"] === "Question"));
  assert.ok(faqNode.mainEntity.every((entity) => entity.acceptedAnswer["@type"] === "Answer"));
});

test("publishes the FAQ as a DE-only Vercel content route", async () => {
  const { resolveMarketRequest } = await import("../lib/markets.ts");

  assert.deepEqual(resolveMarketRequest("/faq"), { action: "rewrite", market: "de", pathname: "/faq" });
  assert.deepEqual(resolveMarketRequest("/de/faq"), { action: "rewrite", market: "de", pathname: "/faq" });
  assert.deepEqual(resolveMarketRequest("/at/faq"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/faq",
  });
});

test("wires FAQ rendering, metadata, navigation and sitemap", async () => {
  const [route, component, shell, sitemap, css] = await Promise.all([
    readFile(new URL("../app/faq/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/faq-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(route, /alternates:\s*\{\s*canonical:\s*publicUrl\("de", FAQ_PATH\)/);
  assert.match(component, /buildFaqGraph/);
  assert.match(component, /serializeJsonLd/);
  assert.match(component, /<details/);
  assert.match(component, /<summary/);
  assert.match(component, /<SiteFrame market="de" sectionLive>/);
  assert.match(shell, /\{ label: "FAQ", href: "\/faq" \}/);
  assert.doesNotMatch(shell, /label: "FAQ", href: "https:\/\/dich-mit-stich\.de\/faq\//);
  assert.match(sitemap, /FAQ_PATH/);
  assert.match(css, /\.faq-section/);
  assert.match(css, /\.faq-item summary:focus-visible/);
});
