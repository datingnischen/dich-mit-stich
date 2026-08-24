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
  assert.equal(book.image, "https://dich-mit-stich.de/magazin/wp-content/uploads/2026/08/dating-ohne-bullshit-cover.jpg");
});

test("ordinary pages and incomplete CMS blocks stay graph-free", async () => {
  assert.equal(existsSync(modulePath), true, "published book graph helper is missing");
  const { buildPublishedAuthorProfileGraph } = await import(modulePath.href);
  assert.equal(buildPublishedAuthorProfileGraph({ slug: "ratgeber", title: "Ratgeber", description: "", content: "Dating ohne Bullshit" }), null);
  assert.equal(buildPublishedAuthorProfileGraph({ slug: "unser-datingexperte", title: "Christian", description: "", content: "Dating ohne Bullshit" }), null);
});

test("magazine profile route selects the CMS-gated profile graph", () => {
  const source = readFileSync(new URL("../app/magazin/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /buildPublishedAuthorProfileGraph\s*\(/);
  assert.match(source, /publishedProfileGraph\s*\?\?\s*articleGraph/);
});
