import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getAuthorProfilePage, stripAuthorProfileDuplicates } from "../lib/author-profile-pages.ts";
import { BRAND_SAME_AS } from "../lib/site-entities.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

const BOOK_CONTENT = [
  "before",
  "<!-- dating-ohne-bullshit-book:start -->",
  '<section><img src="https://dich-mit-stich.de/magazin/wp-content/uploads/2026/08/dating-ohne-bullshit-cover.jpg" alt="Buchcover"><a href="https://www.amazon.de/dp/3696371211/">Amazon</a></section>',
  "<!-- dating-ohne-bullshit-book:end -->",
  "after",
].join("\n");

const AUTHOR_PROFILE = {
  slug: "redaktion",
  requestedSlug: "redaktion",
  name: "Christian M. Haas",
  role: "Datingexperte und Autor für tätowierte Singles",
  jobTitle: "Datingexperte",
  bio: "Bio",
  profileUrl: "/magazin/unser-datingexperte",
  facts: [],
  expertise: ["Tattoo Singles", "Online Dating"],
  socials: [{ platform: "xing", label: "XING", href: "https://www.xing.com/profile/ChristianM_Haas/web_profiles" }],
  sameAs: [
    "https://www.xing.com/profile/ChristianM_Haas/web_profiles",
    "https://datingnischen.de/christian/",
  ],
};

async function buildGraph(extra = {}) {
  const { buildPublishedAuthorProfileGraph } = await import(new URL("../lib/published-book.ts", import.meta.url).href);
  return buildPublishedAuthorProfileGraph({
    slug: "unser-datingexperte",
    title: "Christian M. Haas",
    description: "Kurzbeschreibung",
    modified: "2026-08-24T16:05:16",
    content: BOOK_CONTENT,
    personImage: "https://dich-mit-stich.vercel.app/app-assets/images/profiles/christian-m-haas-datingexperte.webp",
    ...extra,
  });
}

test("the expert profile graph is wired into the site entity graph", async () => {
  const graph = await buildGraph();
  const byType = Object.fromEntries(graph["@graph"].map((node) => [node["@type"], node]));

  assert.ok(byType.Organization, "operator entity is missing");
  assert.ok(byType.WebSite, "website entity is missing");
  assert.equal(byType.WebSite.publisher["@id"], byType.Organization["@id"]);
  assert.equal(byType.ProfilePage.isPartOf["@id"], byType.WebSite["@id"]);
  assert.equal(byType.Person.affiliation["@id"], byType.Organization["@id"]);
  assert.equal(byType.Person.mainEntityOfPage["@id"], byType.ProfilePage["@id"]);
  assert.deepEqual(byType.Brand.sameAs, [...BRAND_SAME_AS]);
  assert.match(byType.Person.publishingPrinciples, /\/ueber-uns\/expertenteam\/$/);
});

test("the expert Person node carries the author profile identity data", async () => {
  const graph = await buildGraph({ authorProfile: AUTHOR_PROFILE });
  const person = graph["@graph"].find((node) => node["@type"] === "Person");

  assert.equal(person.jobTitle, "Datingexperte");
  assert.deepEqual(person.knowsAbout, ["Tattoo Singles", "Online Dating"]);
  assert.ok(person.sameAs.includes("https://www.xing.com/profile/ChristianM_Haas/web_profiles"));
  assert.ok(person.sameAs.includes("https://datingnischen.de/christian/"));
});

test("the expert breadcrumb schema mirrors the rendered trail", async () => {
  const trail = [
    { name: "Startseite", pathname: "/" },
    { name: "Magazin", pathname: "/magazin" },
    { name: "Christian M. Haas", pathname: "/magazin/unser-datingexperte" },
  ];
  const graph = await buildGraph({ breadcrumb: trail });
  const breadcrumb = graph["@graph"].find((node) => node["@type"] === "BreadcrumbList");

  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => item.name),
    ["Startseite", "Magazin", "Christian M. Haas"],
  );
  assert.equal(breadcrumb.itemListElement[0].position, 1);
  assert.equal(breadcrumb.itemListElement[0].item, "https://dich-mit-stich.de/");
});

test("the book node states the edition, publisher and price it advertises on the page", async () => {
  const [graph, feature] = await Promise.all([buildGraph(), readSource("../components/published-book-feature.tsx")]);
  const book = graph["@graph"].find((node) => node["@type"] === "Book");
  const { PUBLISHED_BOOK } = await import(new URL("../lib/published-book.ts", import.meta.url).href);

  assert.equal(book.bookEdition, "1. Auflage");
  assert.equal(book.numberOfPages, 136);
  assert.equal(book.publisher["@type"], "Organization");
  assert.equal(book.publisher.name, "BoD – Books on Demand");
  assert.equal(book.offers["@type"], "Offer");
  assert.equal(book.offers.price, "12.99");
  assert.equal(book.offers.priceCurrency, "EUR");
  assert.equal(book.offers.url, "https://www.amazon.de/dp/3696371211/");

  // The offer has to be visible on the page, so both read from the same constant.
  assert.equal(PUBLISHED_BOOK.priceLabel, "12,99 €");
  assert.match(feature, /\{PUBLISHED_BOOK\.publisher\}/);
  assert.match(feature, /\{PUBLISHED_BOOK\.priceLabel\}/);
});

test("both author profile pages replace the truncated CMS excerpt with a two-sentence lead", async () => {
  const [detail, dePage, marketPage] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../app/[market]/magazin/[slug]/page.tsx"),
  ]);

  for (const slug of ["unser-datingexperte", "anne-schweitzer"]) {
    const page = getAuthorProfilePage(slug);
    assert.ok(page, `${slug} must be a registered author profile page`);
    assert.ok(page.lead.length <= 165, `${slug} lead is too long for a meta description: ${page.lead.length}`);
    // Split only on periods preceded by a word character, so initials like "M." do not count.
    const sentences = page.lead.split(/(?<=[a-zäöüß0-9)])\.\s+/);
    assert.equal(sentences.length, 2, `${slug} lead must be exactly two sentences`);
    assert.doesNotMatch(page.lead, /…|\.\.\.$/);
  }

  assert.match(detail, /authorProfilePage\?\.lead \?\? answerEngineEntry\?\.directAnswer/);
  assert.match(dePage, /authorProfilePage\?\.lead \?\? answerEngineEntry\?\.directAnswer/);
  assert.match(marketPage, /authorProfilePage\?\.lead \?\? answerEngineEntry\?\.directAnswer/);
});

test("the expert profile keeps its 5:4 cover and its imported vita links move into the contact card", async () => {
  const page = getAuthorProfilePage("unser-datingexperte");
  assert.equal(page.portraitCover, false);
  assert.equal(page.stripLeadingPortrait, false);
  assert.equal(page.authorSlug, "redaktion");
  assert.match(page.contactCard.websites[0].href, /datingnischen\.de\/christian/);

  const html = [
    "<p>Intro</p>",
    "<h2>Kontakt &amp; weitere Informationen</h2>",
    "<p>Vita:</p>",
    '<ul><li><a href="https://datingnischen.de/christian">Mehr</a></li></ul>',
    "<h2>Fazit</h2>",
    "<p>bleibt</p>",
  ].join("");

  const stripped = stripAuthorProfileDuplicates(html, page);
  assert.doesNotMatch(stripped, /Kontakt &amp; weitere Informationen/);
  assert.doesNotMatch(stripped, /datingnischen\.de/);
  assert.match(stripped, /<h2>Fazit<\/h2><p>bleibt<\/p>$/);
  assert.match(stripped, /^<p>Intro<\/p>/);
});

test("the author article list reuses the uniform magazine story grid", async () => {
  const [detail, css] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(detail, /className="magazine-story-grid"/);
  assert.match(detail, /className="article-card magazine-story-card"/);
  assert.match(detail, /className="magazine-story-media"/);
  // The ragged full-height thumbnail column is what made the list look broken.
  assert.doesNotMatch(detail, /author-article-card/);
  assert.match(css, /\.magazine-story-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/s);
});

test("author profiles expose XING and the vita domain as sameAs", async () => {
  const profiles = await readSource("../lib/author-profiles.ts");

  assert.match(profiles, /https:\/\/www\.xing\.com\/profile\/ChristianM_Haas\/web_profiles/);
  assert.match(profiles, /extraSameAs: \["https:\/\/datingnischen\.de\/christian\/"\]/);
  assert.match(profiles, /extraSameAs: \["https:\/\/www\.anne-schweitzer\.de\/", "https:\/\/www\.clemens-schweitzer\.de\/"\]/);
  assert.match(profiles, /sameAs: \[\.\.\.\(override\.socials \|\| \[\]\)\.map\(\(social\) => social\.href\), \.\.\.\(override\.extraSameAs \|\| \[\]\)\]/);
});
