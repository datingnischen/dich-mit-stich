import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import matter from "gray-matter";

// Christian, 4.11.2026: „Brauche individuell passende Titel.“ Kein <title>, in dem nur die Stadt wechselt.
const { brandedTitle } = await import("../lib/seo-title.ts");
const { getTattooStudioCities, getTattooStudioCitySeo } = await import("../lib/tattoo-studio-guide.ts");

const rendered = (title) => {
  const value = brandedTitle(title);
  return typeof value === "string" ? `${value} | Dich mit Stich` : value.absolute;
};

const guides = ["de", "at", "ch"].flatMap((market) => getTattooStudioCities(market));

test("every tattoo studio city guide has its own title and description", () => {
  assert.ok(guides.length >= 40, `nur ${guides.length} Stadtguides`);
  const titles = new Set();
  const descriptions = new Set();
  for (const guide of guides) {
    const id = `${guide.market}/${guide.slug}`;
    const seo = getTattooStudioCitySeo(guide);
    assert.ok(seo.custom, `${id}: Eintrag in data/tattoo-studio-seo.json fehlt`);
    const title = rendered(seo.metaTitle);
    assert.ok(title.length <= 60, `${id}: Titel ${title.length} Zeichen`);
    assert.ok(seo.metaTitle.includes(guide.cityName), `${id}: Stadtname fehlt im Titel`);
    assert.match(seo.metaTitle, /Tattoo-Studios/, `${id}: Keyword fehlt`);
    assert.doesNotMatch(seo.metaTitle, /Stadtguide$/, `${id}: alte Schablone`);
    assert.ok(!titles.has(seo.metaTitle), `${id}: Titel doppelt`);
    titles.add(seo.metaTitle);
    assert.ok(seo.description.length >= 110 && seo.description.length <= 155, `${id}: Description ${seo.description.length} Zeichen`);
    assert.ok(seo.description.includes(guide.cityName), `${id}: Stadtname fehlt in der Description`);
    assert.doesNotMatch(seo.description, /…|\.\.\./, `${id}: Description gekürzt`);
    assert.ok(!descriptions.has(seo.description), `${id}: Description doppelt`);
    descriptions.add(seo.description);
  }
});

test("studio city titles are not a template where only the city changes", () => {
  const skeletons = new Map();
  for (const guide of guides) {
    const skeleton = getTattooStudioCitySeo(guide).metaTitle.replace(guide.cityName, "X");
    skeletons.set(skeleton, (skeletons.get(skeleton) || 0) + 1);
  }
  for (const [skeleton, count] of skeletons) assert.equal(count, 1, `${count}× „${skeleton}“`);
});

test("studio city pages take title and description from the per-city SEO data", async () => {
  for (const file of ["../app/tattoo-studios/[city]/page.tsx", "../app/market-tattoo-studios/[market]/[city]/page.tsx"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /getTattooStudioCitySeo\(guide\)/, file);
    assert.doesNotMatch(source, /– Stadtguide`/, file);
  }
});

test("tattoo singles city pages have unique titles that are not a city-only template", async () => {
  const dir = new URL("../content/staedte/", import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".md") && !name.startsWith("_"));
  const titles = new Set();
  const skeletons = new Map();
  for (const name of files) {
    const { data } = matter(await readFile(new URL(name, dir), "utf8"));
    assert.ok(data.title.includes(data.cityName), `${name}: Stadtname fehlt im Titel`);
    assert.ok(!titles.has(data.title), `${name}: Titel doppelt`);
    titles.add(data.title);
    const skeleton = data.title.replace(data.cityName, "X");
    skeletons.set(skeleton, [...(skeletons.get(skeleton) || []), name]);
  }
  for (const [skeleton, names] of skeletons) assert.equal(names.length, 1, `„${skeleton}“: ${names.join(", ")}`);
});
