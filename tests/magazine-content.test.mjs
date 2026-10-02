import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// Die App liest alle Inhalte aus Dateien im Repo (kein WordPress mehr). Diese Tests sichern die Ablösung ab:
// Anzahl und Slugs wie im WordPress-Inventar vom 2026-10-02, keine WP-Reste, alle Bilder vorhanden, Alt-Texte gesetzt.
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "data", "wordpress-inventar.json"), "utf8"));
const { getMagazinePosts, getMagazinePages, getMagazineRouteEntries, getMagazineCategories, getMagazineEntryBySlug, getMagazineEntriesForCategory } =
  await import("../lib/magazine.ts");
const { getCityOverview, getCityPage, getCitySlugs } = await import("../lib/city-pages.ts");
const { getAuthorProfile, getKnownAuthorSlugs } = await import("../lib/author-profiles.ts");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const contentFiles = [...walk(path.join(root, "content")), ...walk(path.join(root, "data"))].filter(
  (file) => !file.endsWith("wordpress-inventar.json"),
);

test("every WordPress post and page of the inventory is served with the same slug", async () => {
  const posts = await getMagazinePosts();
  const pages = await getMagazinePages();
  assert.equal(posts.length, inventory.beitraege.length);
  assert.equal(pages.length, inventory.seiten.length);
  assert.deepEqual(posts.map((post) => post.slug).sort(), inventory.beitraege.map((post) => post.slug).sort());
  assert.deepEqual(pages.map((page) => page.slug).sort(), inventory.seiten.map((page) => page.slug).sort());
  assert.equal((await getMagazineRouteEntries()).length, inventory.beitraege.length + inventory.seiten.length);
  assert.ok(posts.every((post) => post.type === "post") && pages.every((page) => page.type === "page"));
});

test("categories, authors and their post counts match the inventory", async () => {
  const categories = await getMagazineCategories();
  assert.deepEqual(
    categories.map((category) => [category.slug, category.count]).sort(),
    inventory.kategorien.map((category) => [category.slug, category.count]).sort(),
  );
  for (const category of categories) {
    assert.equal((await getMagazineEntriesForCategory(category.slug)).length, category.count, category.slug);
  }
  const authors = await getKnownAuthorSlugs();
  assert.deepEqual(authors.sort(), inventory.autoren.map((author) => author.slug).sort());
  for (const slug of authors) assert.ok(await getAuthorProfile(slug), `Profil ${slug}`);
});

test("the city pages of all three markets match the inventory", async () => {
  const bySlug = (market) => inventory.staedte.filter((city) => city.stadt.startsWith(`${market.toUpperCase()}:`)).map((city) => city.stadt.split(":")[1]);
  for (const market of ["de", "at", "ch"]) {
    assert.deepEqual((await getCitySlugs(market)).sort(), bySlug(market).sort(), market);
    const overview = await getCityOverview(market);
    assert.equal(overview.cityLinks.length, bySlug(market).length);
  }
  const berlin = await getCityPage("de", "berlin");
  assert.ok(berlin.contentHtml.length > 1000);
  assert.match(berlin.imageUrl, /^https:\/\/.+\/magazin\/wp-content\/uploads\//);
  assert.ok(berlin.imageAlt);
  assert.equal(await getCityPage("at", "berlin"), null);
});

test("details carry SEO title and description from AIOSEO; lists stay light", async () => {
  const detail = await getMagazineEntryBySlug("tattoo-studio");
  assert.ok(detail.content.length > 1000);
  assert.ok(detail.seoTitle && detail.seoTitle.length <= 60, "SEO-Titel höchstens 60 Zeichen");
  assert.ok(detail.seoDescription);
  assert.doesNotMatch(detail.seoTitle, /\|\s*Tattoo-Magazin/);
  const listed = (await getMagazinePosts()).find((post) => post.slug === "tattoo-studio");
  assert.equal(listed.content, "");
});

test("no WordPress leftovers in the content files", () => {
  for (const file of contentFiles.filter((name) => /\.(md|json)$/.test(name))) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /cms-mag|wp-json|rest_route|<!--more-->|ngg_shortcode/, file);
  }
});

test("every upload the content refers to exists in public/", () => {
  const missing = [];
  for (const file of contentFiles.filter((name) => /\.(md|json)$/.test(name))) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/\/magazin\/wp-content\/uploads\/[^\s"'<>),]+/g)) {
      const relative = decodeURIComponent(match[0]);
      if (!fs.existsSync(path.join(root, "public", relative))) missing.push(`${path.basename(file)}: ${relative}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("every image has an alt text; articles with a featured image name it", async () => {
  for (const file of contentFiles.filter((name) => name.endsWith(".md"))) {
    const text = fs.readFileSync(file, "utf8");
    for (const tag of text.match(/<img\b[^>]*>/g) ?? []) {
      assert.match(tag, /\balt="[^"]*\S[^"]*"/, `${path.basename(file)}: ${tag.slice(0, 100)}`);
    }
  }
  for (const entry of [...(await getMagazinePosts()), ...(await getMagazinePages())]) {
    if (entry.featuredImage) assert.ok(entry.featuredImageAlt, `${entry.slug}: Beitragsbild ohne Alt-Text`);
  }
});

test("all articles that carry an audio player point at an existing MP3", async () => {
  let withAudio = 0;
  for (const post of await getMagazinePosts()) {
    const full = await getMagazineEntryBySlug(post.slug);
    if (!full.content.includes("<audio")) continue;
    withAudio += 1;
    const src = full.content.match(/<source src="([^"]+\.mp3)"/)?.[1];
    assert.ok(src, `${post.slug}: Audio ohne MP3-Quelle`);
    const relative = decodeURIComponent(new URL(src).pathname.replace(/^\/app-assets/, ""));
    assert.ok(fs.existsSync(path.join(root, "public", relative)), `${post.slug}: ${relative}`);
  }
  assert.ok(withAudio >= 14, `Audio-Beiträge: ${withAudio}`);
});

test("the app no longer calls WordPress at runtime or build", () => {
  const sources = [...walk(path.join(root, "lib")), ...walk(path.join(root, "app")), ...walk(path.join(root, "components"))].filter((file) => /\.(ts|tsx)$/.test(file));
  for (const file of sources) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /rest_route|wp-json|WORDPRESS_(?:BASE_URL|ORIGIN|UPLOADS_URL|REST)|\/wp\/v2|cms-mag\/\?/, file);
    assert.doesNotMatch(text, /\bfetch\(/, `${file} ruft fetch() auf`);
  }
  const config = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  assert.doesNotMatch(config, /hostname: "dich-mit-stich\.de"/);
});
