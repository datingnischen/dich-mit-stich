import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const modulePath = new URL("../lib/published-book.ts", import.meta.url);

test("published Christian profile emits a bounded ProfilePage/Person/Book graph", async () => {
  assert.equal(existsSync(modulePath), true, "published book graph helper is missing");
  const { buildPublishedAuthorProfileGraph } = await import(modulePath.href);
  const graph = buildPublishedAuthorProfileGraph({
    slug: "unser-datingexperte",
    title: "Christian M. Haas",
    description: "Datingexperte für tätowierte Singles",
    modified: "2026-08-24T16:05:16",
    content: `before
<!-- dating-ohne-bullshit-book:start -->
<section><img src="https://dich-mit-stich.de/magazin/wp-content/uploads/2026/08/dating-ohne-bullshit-cover.jpg" alt="Buchcover Dating ohne Bullshit von Christian M. Haas"><a href="https://www.amazon.de/dp/3696371211/">Amazon</a></section>
<!-- dating-ohne-bullshit-book:end -->
after`,
  });

  assert.ok(graph);
  const types = graph["@graph"].map((node) => node["@type"]);
  assert.ok(types.includes("BreadcrumbList"));
  assert.ok(types.includes("ProfilePage"));
  assert.ok(types.includes("Person"));
  assert.ok(types.includes("Book"));
  assert.ok(!types.includes("Article"));

  const person = graph["@graph"].find((node) => node["@type"] === "Person");
  const book = graph["@graph"].find((node) => node["@type"] === "Book");
  assert.equal(book.author["@id"], person["@id"]);
  assert.equal(book.isbn, "9783696371210");
  assert.equal(book.datePublished, "2026-08-21");
  assert.equal(book.url, "https://www.amazon.de/dp/3696371211/");
  assert.equal(book.image, "https://dich-mit-stich.vercel.app/app-assets/images/books/dating-ohne-bullshit-cover.webp");
});

test("ordinary pages and incomplete CMS blocks stay graph-free", async () => {
  assert.equal(existsSync(modulePath), true, "published book graph helper is missing");
  const { buildPublishedAuthorProfileGraph } = await import(modulePath.href);
  assert.equal(buildPublishedAuthorProfileGraph({ slug: "ratgeber", title: "Ratgeber", description: "", content: "Dating ohne Bullshit" }), null);
  assert.equal(buildPublishedAuthorProfileGraph({ slug: "unser-datingexperte", title: "Christian", description: "", content: "Dating ohne Bullshit" }), null);
});

test("magazine profile route selects the CMS-gated profile graph", () => {
  const source = [
    readFileSync(new URL("../app/magazin/[slug]/page.tsx", import.meta.url), "utf8"),
    readFileSync(new URL("../components/magazine-detail.tsx", import.meta.url), "utf8"),
  ].join("\n");
  assert.match(source, /getMarketMagazinePublishedProfileGraph\(market,/);
  assert.match(source, /publishedProfileGraph\s*\?\?\s*articleGraph/);
  assert.match(source, /stripPublishedBookSchema\(entry\.content\)/);
});

test("CMS Book schema is removed from rendered content to avoid duplicate nodes", async () => {
  const { stripPublishedBookSchema } = await import(modulePath.href);
  const content = 'before<!-- dating-ohne-bullshit-schema:start --><script type="application/ld+json">{"@type":"Book"}</script><!-- dating-ohne-bullshit-schema:end -->after';
  assert.equal(stripPublishedBookSchema(content), "beforeafter");
});

test("CMS book feature block can be replaced by the polished local component", async () => {
  const { stripPublishedBookBlock } = await import(modulePath.href);
  const marked = "before<!-- dating-ohne-bullshit-book:start --><section>legacy book</section><!-- dating-ohne-bullshit-book:end -->after";
  assert.equal(stripPublishedBookBlock(marked), "beforeafter");

  const unmarked = 'before<section><img src="https://example.com/cover.jpg" alt="Dating ohne Bullshit"><h2>Dating ohne Bullshit</h2><p>ISBN 978-3-6963-7121-0</p><a href="https://www.amazon.de/dp/3696371211/">Amazon</a></section>after';
  assert.equal(stripPublishedBookBlock(unmarked), "beforeafter");
});

test("legacy low-resolution expert portrait is removed from the polished profile body", async () => {
  const { stripLegacyExpertPortrait } = await import(modulePath.href);
  const content = 'before<p><img src="https://dich-mit-stich.de/magazin/wp-content/uploads/2025/08/Christian-M-Haas-200x300.png" alt="Datingexperte" width="200" height="300"></p><h2>Profil</h2>';
  assert.equal(stripLegacyExpertPortrait(content), "before<h2>Profil</h2>");
});
