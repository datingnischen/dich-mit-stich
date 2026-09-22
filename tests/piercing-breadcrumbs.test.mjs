import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const {
  PIERCING_HUB_LABEL,
  PIERCING_HUB_PATH,
  PIERCING_HUB_SLUG,
  buildMagazineBreadcrumbTrail,
  extractPiercingHubChildSlugs,
  isPiercingTopic,
} = await import("../lib/piercing-hub.ts");

const HUB_HTML = `
  <h3>Ohrpiercings</h3>
  <ul>
    <li><a href="/magazin/rook-piercing/">Rook Piercing</a></li>
    <li><a title="Conch" href="https://dich-mit-stich.de/magazin/conch-piercing/">Conch-Piercing</a></li>
    <li><a href="/magazin/helix-piercing">Helix-Piercing</a></li>
  </ul>
  <p>
    <a href="/magazin/piercingarten/">Diese Übersicht</a>
    <a href="/magazin/thema/piercing/">Thema Piercing</a>
    <a href="/magazin/author/redaktion/">Redaktion</a>
    <a href="https://safepiercing.org/aftercare/" rel="noopener noreferrer nofollow">APP</a>
    <a href="https://evil.example/magazin/fake-piercing/">Fremdseite</a>
  </p>
`;

test("the Piercingarten hub link list defines the articles one level below it", () => {
  const slugs = extractPiercingHubChildSlugs(HUB_HTML);

  assert.deepEqual([...slugs].sort(), ["conch-piercing", "helix-piercing", "rook-piercing"]);
  assert.equal(slugs.has(PIERCING_HUB_SLUG), false);
  assert.equal(slugs.has("fake-piercing"), false);
  assert.deepEqual([...extractPiercingHubChildSlugs()], []);
  assert.deepEqual([...extractPiercingHubChildSlugs("")], []);
});

test("piercing articles are recognised by slug, title, or category", () => {
  assert.equal(isPiercingTopic({ title: "Rook Piercing", slug: "rook-piercing", categories: [] }), true);
  assert.equal(
    isPiercingTopic({ title: "Pflege nach dem Stechen", slug: "pflege", categories: [{ name: "Piercing", slug: "piercing" }] }),
    true,
  );
  assert.equal(isPiercingTopic({ title: "Tattoo-Motive", slug: "tattoo-motive", categories: [] }), false);
});

test("piercing detail pages hang below the Piercingarten hub, other magazine entries do not", () => {
  const child = buildMagazineBreadcrumbTrail(
    { slug: "rook-piercing", title: "Rook Piercing" },
    { belowPiercingHub: true },
  );

  assert.deepEqual(child, [
    { name: "Startseite", pathname: "/" },
    { name: "Magazin", pathname: "/magazin" },
    { name: PIERCING_HUB_LABEL, pathname: PIERCING_HUB_PATH },
    { name: "Rook Piercing", pathname: "/magazin/rook-piercing" },
  ]);

  assert.deepEqual(
    buildMagazineBreadcrumbTrail({ slug: PIERCING_HUB_SLUG, title: "Piercingarten" }),
    [
      { name: "Startseite", pathname: "/" },
      { name: "Magazin", pathname: "/magazin" },
      { name: PIERCING_HUB_LABEL, pathname: PIERCING_HUB_PATH },
    ],
  );

  assert.deepEqual(
    buildMagazineBreadcrumbTrail({ slug: "tattoo-motive", title: "Tattoo-Motive" }),
    [
      { name: "Startseite", pathname: "/" },
      { name: "Magazin", pathname: "/magazin" },
      { name: "Tattoo-Motive", pathname: "/magazin/tattoo-motive" },
    ],
  );
});

test("the hub lookup stays off the network for magazine entries without a piercing topic", async () => {
  const source = await readSource("../lib/piercing-hub.ts");
  const guard = source.match(/export async function isPiercingHubChild[\s\S]*?\n}/)?.[0] || "";

  assert.match(guard, /if \(entry\.slug === PIERCING_HUB_SLUG \|\| !isPiercingTopic\(entry\)\) return false;/);
  assert.ok(guard.indexOf("isPiercingTopic") < guard.indexOf("loadPiercingHubChildSlugs"));
});

test("the breadcrumb renders as an ordered list and marks the current page", async () => {
  const component = await readSource("../components/magazine-breadcrumb.tsx");

  assert.match(component, /<nav className="magazine-breadcrumb" aria-label="Brotkrümelnavigation">/);
  assert.match(component, /<ol>/);
  assert.match(component, /aria-current=\{isCurrent \? "page" : undefined\}/);
  assert.match(component, /isCurrent \? item\.name :/);
});

test("every magazine surface renders the shared breadcrumb trail", async () => {
  const [detail, category, about] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../components/magazine-category.tsx"),
    readSource("../components/about-page.tsx"),
  ]);

  for (const source of [detail, category, about]) {
    assert.match(source, /<MagazineBreadcrumb/);
    assert.doesNotMatch(source, /<nav className="magazine-breadcrumb"/);
  }

  assert.match(detail, /buildMagazineBreadcrumbTrail\(entry, \{\s*belowPiercingHub: await isPiercingHubChild\(entry\),\s*\}\)/);
  assert.equal((detail.match(/<MagazineBreadcrumb market=\{market\} trail=\{breadcrumbTrail\} \/>/g) || []).length, 2);
});

test("the article graph publishes the visible trail as a BreadcrumbList", async () => {
  const [entities, detail, css] = await Promise.all([
    readSource("../lib/editorial-entities.ts"),
    readSource("../components/magazine-detail.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(entities, /const breadcrumbId = `\$\{canonical\}#breadcrumb`;/);
  assert.match(entities, /breadcrumb: hasBreadcrumb \? \{ "@id": breadcrumbId \} : undefined,/);
  assert.match(entities, /"@type": "BreadcrumbList"/);
  assert.match(entities, /position: index \+ 1,/);
  assert.match(entities, /item: publicUrl\(market, item\.pathname\),/);
  assert.match(detail, /breadcrumb: breadcrumbTrail,/);

  assert.match(css, /\.magazine-breadcrumb ol\s*\{[^}]*list-style:\s*none/s);
  assert.match(css, /\.magazine-breadcrumb li:not\(:last-child\)::after\s*\{[^}]*content:\s*"\/"/s);
});
