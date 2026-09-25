import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadAboutPages() {
  try {
    return await import("../lib/about-pages.ts");
  } catch (error) {
    assert.fail(`lib/about-pages.ts must provide the Dich-mit-Stich about-page contract: ${error.message}`);
  }
}

test("defines the canonical Dich-mit-Stich about hierarchy for every market", async () => {
  const { ABOUT_PATHS, ABOUT_SLUGS, getAboutPage } = await loadAboutPages();

  assert.deepEqual(ABOUT_SLUGS, ["expertenteam", "erfolgsgeschichten", "kooperationen", "bewertungen", "social-media"]);
  assert.deepEqual(ABOUT_PATHS, [
    "/ueber-uns",
    "/ueber-uns/expertenteam",
    "/ueber-uns/erfolgsgeschichten",
    "/ueber-uns/kooperationen",
    "/ueber-uns/bewertungen",
    "/ueber-uns/social-media",
  ]);

  for (const market of ["de", "at", "ch"]) {
    for (const slug of [null, ...ABOUT_SLUGS]) {
      const page = getAboutPage(market, slug);
      assert.ok(page, `${market}/${slug ?? "root"} must exist`);
      assert.equal(page.market, market);
      assert.equal(page.path, slug ? `/ueber-uns/${slug}` : "/ueber-uns");
      assert.match(page.title, /Dich mit Stich|Expertenteam|Erfolgsgeschichten|Kooperationen|Bewertungen|Social Media/);
      assert.doesNotMatch(JSON.stringify(page), /elFlirt|www\.elflirt/i);
    }
  }

  assert.equal(getAboutPage("de", "geschichte"), null);
  assert.equal(getAboutPage("ch", "presseberichte"), null);
});

test("every data-driven About registration CTA carries location attribution", async () => {
  const { ABOUT_SLUGS, getAboutPage } = await loadAboutPages();

  for (const market of ["de", "at", "ch"]) {
    for (const slug of [null, ...ABOUT_SLUGS]) {
      const page = getAboutPage(market, slug);
      const links = [
        page.primaryCta,
        page.secondaryCta,
        ...page.cards.map((card) => card.link),
        ...(page.detailSections ?? []).map((section) => section.cta),
      ].filter(Boolean);

      for (const link of links) {
        const url = new URL(link.href, `https://dich-mit-stich.${market === "de" ? "de" : market}`);
        if (url.pathname.replace(/\/$/, "") === "/registration") {
          assert.equal(url.searchParams.get("AID"), "location", `${market}/${slug ?? "root"}: ${link.label}`);
        }
      }
    }
  }
});

test("routes the complete about hierarchy to live DE, AT and CH pages", async () => {
  const { ABOUT_PATHS } = await loadAboutPages();
  const { resolveMarketRequest } = await import("../lib/markets.ts");

  for (const path of ABOUT_PATHS) {
    assert.deepEqual(resolveMarketRequest(path), {
      action: "rewrite",
      market: "de",
      pathname: path,
    });
    assert.deepEqual(resolveMarketRequest(`/de${path}`), {
      action: "rewrite",
      market: "de",
      pathname: path,
    });
    assert.deepEqual(resolveMarketRequest(`/at${path}`), {
      action: "market-content",
      market: "at",
      pathname: `/at${path}`,
    });
    assert.deepEqual(resolveMarketRequest(`/ch${path}`), {
      action: "market-content",
      market: "ch",
      pathname: `/ch${path}`,
    });
  }

  assert.deepEqual(resolveMarketRequest("/market-about/ch"), { action: "not-found" });
  assert.deepEqual(resolveMarketRequest("/at/ueber-uns/geschichte"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/ueber-uns/geschichte",
  });
});

test("builds a market-isolated AboutPage entity graph", async () => {
  const { buildAboutPageGraph, getAboutPage } = await loadAboutPages();

  for (const market of ["de", "at", "ch"]) {
    const page = getAboutPage(market, "expertenteam");
    const graph = buildAboutPageGraph(page);
    const serialized = JSON.stringify(graph);
    const domain = market === "de" ? "dich-mit-stich.de" : `dich-mit-stich.${market}`;

    assert.equal(graph["@context"], "https://schema.org");
    assert.ok(graph["@graph"].some((node) => node["@type"] === "AboutPage"));
    assert.match(serialized, new RegExp(`https://${domain.replace(".", "\\.")}/ueber-uns/expertenteam`));
    if (market !== "de") assert.doesNotMatch(serialized, /https:\/\/dich-mit-stich\.de/);
    assert.doesNotMatch(serialized, /worksFor|parentOrganization|owner/);
  }
});

test("summarizes the complete live cooperation offer on the consolidated page", async () => {
  const { getAboutPage } = await loadAboutPages();
  const page = getAboutPage("at", "kooperationen");
  const serialized = JSON.stringify(page);

  assert.ok(Array.isArray(page.detailSections));
  assert.ok(page.detailSections.length >= 3);
  for (const marker of [
    "Tattoo- und Piercing-Studios",
    "Creator und Influencer",
    "Tattoo-Shops",
    "35 %",
    "Lifetime-Provision",
    "Adcell",
    "personalisierter Partnerlink",
    "QR-Code",
  ]) {
    assert.match(serialized, new RegExp(marker), `cooperation content must include ${marker}`);
  }
  assert.match(serialized, /https:\/\/www\.adcell\.de\/partnerprogramme\/7003\//);
  assert.match(serialized, /mailto:christian@datingnischen\.de/);

  const partnerProgram = page.detailSections.find((section) => section.eyebrow === "Partnerprogramm");
  assert.deepEqual(partnerProgram?.cta, {
    label: "Jetzt beim Partnerprogramm anmelden",
    href: "https://www.adcell.de/partnerprogramme/7003/",
    external: true,
  });
});

test("success stories link to the DE magazine from every market with published preview images", async () => {
  const { getAboutPage } = await loadAboutPages();

  for (const market of ["de", "at", "ch"]) {
    const page = getAboutPage(market, "erfolgsgeschichten");
    assert.equal(page.cards.length, 3);
    assert.deepEqual(
      page.cards.map((card) => card.link?.href),
      [
        "/magazin/pascal-und-stephanie",
        "/magazin/katharina-und-philip",
        "/magazin/andreas-und-do",
      ],
    );
    for (const card of page.cards) {
      assert.equal(card.link?.external, undefined);
      assert.equal(card.link?.market, "de");
      assert.match(card.image?.src ?? "", /^https:\/\/dich-mit-stich\.de\/magazin\/wp-content\/uploads\//);
      assert.ok(card.image?.alt);
    }
  }

  const component = await readFile(new URL("../components/about-page.tsx", import.meta.url), "utf8");
  assert.match(component, /import Image from "next\/image"/);
  assert.match(component, /about-card-image/);
  assert.match(component, /sizes=/);
});

test("expert cards link to preview-aware profiles and show the published author portraits", async () => {
  const { getAboutPage } = await loadAboutPages();

  for (const market of ["de", "at", "ch"]) {
    const page = getAboutPage(market, "expertenteam");
    assert.deepEqual(
      page.cards.slice(0, 2).map((card) => card.link?.href),
      ["/magazin/unser-datingexperte", "/magazin/author/anne-schweitzer"],
    );
    for (const card of page.cards.slice(0, 2)) {
      assert.equal(card.link?.external, undefined);
      assert.match(card.image?.src ?? "", /^https:\/\/dich-mit-stich\.de\/magazin\/wp-content\/uploads\//);
      assert.ok(card.image?.alt);
    }
    assert.deepEqual(page.cards[2].image, {
      src: "/brand/icony-gmbh-logo.png",
      alt: "Icony GmbH",
      fit: "contain",
    });
    assert.deepEqual(page.cards[2].link, {
      label: "Icony GmbH besuchen",
      href: "https://www.icony.com/",
      external: true,
    });
  }

  await assert.doesNotReject(
    import("node:fs/promises").then(({ access }) => access(new URL("../public/brand/icony-gmbh-logo.png", import.meta.url))),
  );

  const [component, css] = await Promise.all([
    readFile(new URL("../components/about-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /about-card-image-contain/);
  assert.match(component, /staticAsset\(card\.image\.src\)/);
  assert.match(component, /unoptimized=\{card\.image\.fit === "contain"\}/);
  assert.match(css, /\.about-card-image-contain img[\s\S]*object-fit:\s*contain/);
});

test("wires reusable rendered pages with canonical metadata and safe external links", async () => {
  const paths = [
    "../components/about-page.tsx",
    "../app/ueber-uns/page.tsx",
    "../app/ueber-uns/[slug]/page.tsx",
    "../app/[market]/ueber-uns/page.tsx",
    "../app/[market]/ueber-uns/[slug]/page.tsx",
  ];
  const sources = await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  const combined = sources.join("\n");

  assert.match(combined, /buildAboutPageGraph/);
  assert.match(combined, /serializeJsonLd/);
  assert.match(combined, /publicUrl\(page\.market, page\.path\)/);
  assert.match(combined, /<MarketLink/);
  assert.match(combined, /nofollow noopener noreferrer/);
  assert.match(combined, /<SiteFrame market=\{page\.market\} sectionLive>/);
  assert.match(combined, /page\.detailSections/);
  assert.match(combined, /about-detail-section/);
  assert.match(combined, /section\.cta \? <PageLink className="button button-primary"/);
  assert.doesNotMatch(combined, /section\.cta \? <PageLink className="button button-secondary"/);
  assert.doesNotMatch(combined, /elFlirt|vercel\.app/i);
});

test("provides a responsive elFlirt-inspired about composition in the Dich-mit-Stich design system", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const selector of [
    ".about-hero",
    ".about-highlight-row",
    ".about-topic-grid",
    ".about-topic-card",
    ".about-split-section",
    ".about-final-cta",
  ]) {
    assert.match(css, new RegExp(selector.replace(".", "\\.")));
  }

  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.about-hero[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.about-topic-card:focus-visible/);
});

test("publishes the about hierarchy through sitemaps, crawl rules and navigation", async () => {
  const [mainSitemap, marketSitemap, marketRobots, shell] = await Promise.all([
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/market-sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/market-robots/[market]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(mainSitemap, /ABOUT_PATHS/);
  assert.match(marketSitemap, /ABOUT_PATHS/);
  assert.match(marketRobots, /Allow: \/ueber-uns/);
  assert.match(shell, /Über uns/);
  for (const slug of ["expertenteam", "erfolgsgeschichten", "kooperationen", "bewertungen", "social-media"]) {
    assert.match(shell, new RegExp(`/ueber-uns/${slug}`));
  }
});

test("redirects legacy trust URLs to exact destinations in the new hierarchy", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const expected = [
    ["/magazin/expertenteam", "/ueber-uns/expertenteam"],
    ["/magazin/thema/erfolgsgeschichten", "/ueber-uns/erfolgsgeschichten"],
    ["/social-media", "/ueber-uns/social-media"],
    ["/bewertungen-und-erfahrungen", "/ueber-uns/bewertungen"],
    ["/wir-suchen", "/ueber-uns/kooperationen"],
    ["/kooperation-mit-tattoo-studios", "/ueber-uns/kooperationen"],
    ["/kooperation-mit-influencern", "/ueber-uns/kooperationen"],
  ];

  for (const [source, destination] of expected) {
    assert.match(config, new RegExp(`source: \\"${source}\\"[\\s\\S]{0,100}destination: \\"${destination}\\"`));
  }
  assert.doesNotMatch(config, /source: "\/unsere-erfolgsgeschichten\.html"/);
});

test("overview tiles open with an emotional full-bleed image in every market", async () => {
  const { getAboutPage } = await loadAboutPages();
  const { existsSync } = await import("node:fs");

  for (const market of ["de", "at", "ch"]) {
    const page = getAboutPage(market, null);
    assert.equal(page.cards.length, 5);
    for (const card of page.cards) {
      assert.equal(card.image?.bleed, true, `${market}: ${card.title}`);
      assert.match(card.image.src, /^\/about\/dich-mit-stich-ueber-uns-[a-z-]+\.webp$/);
      assert.ok(card.image.alt, `${market}: ${card.title} needs alt text`);
      assert.ok(existsSync(new URL(`../public${card.image.src}`, import.meta.url)), card.image.src);
    }
  }

  const component = await readFile(new URL("../components/about-page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /card\.image\?\.bleed/);
  assert.match(css, /\.about-card-image-bleed::after/);
});

test("the reviews page embeds the ICONY registration form in its try-it-yourself card on every market", async () => {
  const { getAboutPage } = await import("../lib/about-pages.ts");
  for (const market of ["de", "at", "ch"]) {
    const card = getAboutPage(market, "bewertungen").cards.find((entry) => entry.eyebrow === "Selbst ausprobieren");
    assert.equal(card.widget, "icony-registration");
    assert.equal(card.link, undefined, "an iframe must not sit inside a card link");
  }
  const source = await readFile(new URL("../components/about-page.tsx", import.meta.url), "utf8");
  assert.match(source, /buildIconyRegistrationFrame\(market, "location"\)/);
});
