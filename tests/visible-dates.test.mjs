import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { visibleEntryDate, formatGermanDateLong } = await import("../lib/wordpress.ts");
const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("feste Seiten zeigen kein Datum, Artikel das Aenderungsdatum", () => {
  assert.equal(visibleEntryDate({ type: "page", date: "2025-11-12T10:00:00", modified: "2026-01-02T10:00:00" }), undefined);
  assert.equal(visibleEntryDate({ type: "post", date: "2025-11-12T10:00:00", modified: "2026-01-02T10:00:00" }), "2026-01-02T10:00:00");
  assert.equal(visibleEntryDate({ type: "post", date: "2025-11-12T10:00:00" }), "2025-11-12T10:00:00");
  assert.equal(formatGermanDateLong("2025-11-12T10:00:00"), "12. November 2025");
});

test("sichtbare Datumsausgaben laufen ueber visibleEntryDate", async () => {
  const files = ["home-page", "magazine-category", "magazine-overview", "magazine-detail"];
  for (const name of files) {
    const source = await readSource(`../components/${name}.tsx`);
    assert.doesNotMatch(source, /formatGermanDate\((?:entry|post|featuredPost|featuredEntry|latestDate)\.date\)/, name);
    assert.doesNotMatch(source, /Zuletzt aktualisiert/, name);
    assert.match(source, /Aktualisiert/, name);
  }
  const detail = await readSource("../components/magazine-detail.tsx");
  assert.match(detail, /Aktualisiert am <time dateTime=\{entryUpdatedDate\}>\{formatGermanDateLong\(entryUpdatedDate\)\}<\/time>/);
});

test("JSON-LD behaelt datePublished und dateModified", async () => {
  const entities = await readSource("../lib/editorial-entities.ts");
  assert.match(entities, /datePublished: entry\.date/);
  assert.match(entities, /dateModified:/);
});
