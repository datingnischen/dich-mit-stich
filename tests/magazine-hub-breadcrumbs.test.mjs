import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const {
  MAGAZINE_HUBS,
  PIERCING_HUB,
  TATTOO_HUB,
  buildMagazineBreadcrumbTrail,
  extractHubChildSlugs,
  isHubTopic,
  isPiercingTopic,
} = await import("../lib/magazine-hubs.ts");

const PIERCING_HUB_HTML = `
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

const TATTOO_HUB_HTML = `
  <h3>Konkrete Tattoo Motive</h3>
  <ul>
    <li><a href="/magazin/liebes-tattoo/">Liebestattoos</a></li>
    <li><a href="https://dich-mit-stich.de/magazin/maori-tattoo/">Maori Tattoo</a></li>
    <li><a href="/magazin/narben-taetowieren">Narben tätowieren</a></li>
  </ul>
  <p>
    <a href="/magazin/tattoo-lexikon/">Diese Übersicht</a>
    <a href="https://evil.example/magazin/fake-tattoo/">Fremdseite</a>
  </p>
`;

test("a hub link list defines the articles one level below it", () => {
  const piercing = extractHubChildSlugs(PIERCING_HUB, PIERCING_HUB_HTML);

  assert.deepEqual([...piercing].sort(), ["conch-piercing", "helix-piercing", "rook-piercing"]);
  assert.equal(piercing.has(PIERCING_HUB.slug), false);
  assert.equal(piercing.has("fake-piercing"), false);

  const tattoo = extractHubChildSlugs(TATTOO_HUB, TATTOO_HUB_HTML);

  assert.deepEqual([...tattoo].sort(), ["liebes-tattoo", "maori-tattoo", "narben-taetowieren"]);
  assert.equal(tattoo.has(TATTOO_HUB.slug), false);
  assert.equal(tattoo.has("fake-tattoo"), false);

  assert.deepEqual([...extractHubChildSlugs(TATTOO_HUB)], []);
  assert.deepEqual([...extractHubChildSlugs(TATTOO_HUB, "")], []);
});

test("both magazine hubs are registered with their own path and label", () => {
  assert.deepEqual(MAGAZINE_HUBS.map((hub) => [hub.slug, hub.path, hub.label]), [
    ["piercingarten", "/magazin/piercingarten", "Piercingarten"],
    ["tattoo-lexikon", "/magazin/tattoo-lexikon", "Tattoo-Lexikon"],
  ]);
});

test("hub topics are recognised by slug, title, or category", () => {
  assert.equal(isPiercingTopic({ title: "Rook Piercing", slug: "rook-piercing", categories: [] }), true);
  assert.equal(
    isPiercingTopic({ title: "Pflege nach dem Stechen", slug: "pflege", categories: [{ name: "Piercing", slug: "piercing" }] }),
    true,
  );
  assert.equal(isPiercingTopic({ title: "Tattoo-Motive", slug: "tattoo-motive", categories: [] }), false);

  assert.equal(isHubTopic(TATTOO_HUB, { title: "Tattoo-Motive", slug: "tattoo-motive", categories: [] }), true);
  assert.equal(
    isHubTopic(TATTOO_HUB, { title: "Narben tätowieren", slug: "narben-taetowieren", categories: [] }),
    true,
    "not every German article about tattooing carries the word tattoo",
  );
  assert.equal(
    isHubTopic(TATTOO_HUB, {
      title: "Zombie-Boy",
      slug: "zombie-boy-rick-genest",
      categories: [{ name: "Tattoo Persönlichkeiten", slug: "tattoo-persoenlichkeiten" }],
    }),
    true,
  );
  assert.equal(isHubTopic(TATTOO_HUB, { title: "Rook Piercing", slug: "rook-piercing", categories: [] }), false);
});

test("detail pages hang below their hub, other magazine entries do not", () => {
  assert.deepEqual(
    buildMagazineBreadcrumbTrail({ slug: "rook-piercing", title: "Rook Piercing" }, { hub: PIERCING_HUB }),
    [
      { name: "Startseite", pathname: "/" },
      { name: "Magazin", pathname: "/magazin" },
      { name: PIERCING_HUB.label, pathname: PIERCING_HUB.path },
      { name: "Rook Piercing", pathname: "/magazin/rook-piercing" },
    ],
  );

  assert.deepEqual(
    buildMagazineBreadcrumbTrail({ slug: "liebes-tattoo", title: "Das Liebes-Tattoo" }, { hub: TATTOO_HUB }),
    [
      { name: "Startseite", pathname: "/" },
      { name: "Magazin", pathname: "/magazin" },
      { name: TATTOO_HUB.label, pathname: TATTOO_HUB.path },
      { name: "Das Liebes-Tattoo", pathname: "/magazin/liebes-tattoo" },
    ],
  );

  assert.deepEqual(
    buildMagazineBreadcrumbTrail({ slug: "tattoo-flirt", title: "Flirtfaktor Tattoo" }),
    [
      { name: "Startseite", pathname: "/" },
      { name: "Magazin", pathname: "/magazin" },
      { name: "Flirtfaktor Tattoo", pathname: "/magazin/tattoo-flirt" },
    ],
  );
});

test("a hub page ends its own trail under its short label", () => {
  for (const hub of MAGAZINE_HUBS) {
    assert.deepEqual(
      buildMagazineBreadcrumbTrail({ slug: hub.slug, title: `${hub.label} – Übersicht aller Themen` }),
      [
        { name: "Startseite", pathname: "/" },
        { name: "Magazin", pathname: "/magazin" },
        { name: hub.label, pathname: hub.path },
      ],
    );
  }
});

test("the hub lookup stays off the network for magazine entries without a matching topic", async () => {
  const source = await readSource("../lib/magazine-hubs.ts");
  const resolver = source.match(/export async function resolveMagazineHub[\s\S]*?\n}/)?.[0] || "";

  assert.match(resolver, /MAGAZINE_HUBS\.filter\(\(hub\) => hub\.slug !== entry\.slug && isHubTopic\(hub, entry\)\)/);
  assert.ok(resolver.indexOf("isHubTopic") < resolver.indexOf("loadHubChildSlugs"));
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

  assert.match(detail, /const hub = await resolveMagazineHub\(entry\);\s*const breadcrumbTrail = buildMagazineBreadcrumbTrail\(entry, \{ hub \}\);/);
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

test("the piercing overview lists every piercing type the hub links, A to Z", async () => {
  const { extractHubChildLinks } = await import("../lib/magazine-hubs.ts");
  const links = extractHubChildLinks(PIERCING_HUB, `
    ${PIERCING_HUB_HTML}
    <a href="/magazin/lippenpiercing">Lippenpiercing im Allgemeinen</a>
    <a href="/magazin/industrial-piercing">Industrial piercing</a>
    <a href="/magazin/rook-piercing"><img src="x.jpg" alt=""></a>
  `);

  assert.deepEqual(links, [
    { slug: "conch-piercing", label: "Conch-Piercing" },
    { slug: "helix-piercing", label: "Helix-Piercing" },
    { slug: "industrial-piercing", label: "Industrial Piercing" },
    { slug: "lippenpiercing", label: "Lippenpiercing" },
    { slug: "rook-piercing", label: "Rook Piercing" },
  ]);

  const [detail, hubs] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../lib/magazine-hubs.ts"),
  ]);
  assert.match(hubs, /piercing: PIERCING_HUB/);
  assert.match(detail, /getHubDirectoryForPage\(slug\)/);
  assert.match(detail, /Alle Piercings von A bis Z/);
});
