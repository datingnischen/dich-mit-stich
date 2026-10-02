import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { NextRequest } from "next/server.js";

import { handleWpRest, wpRestPreflight, wpRestResponse } from "../lib/wp-rest-compat.ts";

const root = new URL("../", import.meta.url);
const get = (route, query = "") => handleWpRest(route, new URLSearchParams(query));
const folder = (name) => readdirSync(new URL(`content/magazin/${name}/`, root)).filter((file) => file.endsWith(".md") && !file.startsWith("_"));
const postFiles = folder("beitraege");
const postCount = postFiles.length;

test("posts: Teaser-Abruf wie bei ICONY liefert drei Beiträge im WordPress-Format mit Gesamtzahl-Headern", () => {
  const result = get("/wp/v2/posts", "per_page=3&_embed=1&orderby=date&order=desc");
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 3);
  assert.equal(result.headers["X-WP-Total"], String(postCount));
  assert.equal(result.headers["X-WP-TotalPages"], String(Math.ceil(postCount / 3)));
  assert.match(result.headers.Link, /rel="next"/);

  const [first, second] = result.body;
  assert.ok(first.date >= second.date, "neueste zuerst");
  for (const post of result.body) {
    for (const key of ["id", "date", "date_gmt", "modified", "modified_gmt", "slug", "status", "type", "link", "title", "excerpt", "content", "featured_media", "categories", "author"]) {
      assert.ok(key in post, `${post.slug}: ${key}`);
    }
    assert.equal(post.status, "publish");
    assert.equal(post.type, "post");
    assert.equal(typeof post.title.rendered, "string");
    assert.equal(typeof post.author, "number", "author nur als ID");
    assert.equal(post.link, `https://dich-mit-stich.de/magazin/${post.slug}/`);
    assert.doesNotMatch(post.content.rendered, /(?:href|src)="\/(?!\/)/, "Links im Text absolut");
    assert.equal(post._embedded.author, undefined, "keine eingebetteten Autoren");
    assert.ok(Array.isArray(post._embedded["wp:term"]));
  }
});

test("posts: Beitragsbild mit source_url, alt_text und media_details, Datumsfelder stimmen", () => {
  const withImage = get("/wp/v2/posts", "slug=5-geschenkideen-fuer-taetowierte-gepiercte-frauen-und-maenner&_embed=1").body[0];
  assert.ok(withImage.featured_media > 0);
  const media = withImage._embedded["wp:featuredmedia"][0];
  assert.match(media.source_url, /^https:\/\/[^/]+\/app-assets\/magazin\/wp-content\/uploads\/2020\/12\/geschenke-fuer-taetowierte-gepiercte-singles\.jpg$/);
  assert.ok(media.alt_text.trim());
  assert.ok(media.media_details.width > 0 && media.media_details.height > 0);
  assert.equal(media.id, withImage.featured_media);

  assert.equal(media.media_details.sizes.full.source_url, media.source_url);
  assert.equal(media.mime_type, "image/jpeg");
  assert.equal(withImage.date, "2020-12-13T21:26:02");
  assert.equal(withImage.date_gmt, "2020-12-13T20:26:02", "Winterzeit: UTC+1");
  assert.equal(withImage.modified, "2026-08-05T00:03:12");
  assert.equal(withImage.modified_gmt, "2026-08-04T22:03:12", "Sommerzeit: UTC+2");
  assert.equal(withImage.id, 1071);

  const single = get(`/wp/v2/media/${withImage.featured_media}`);
  assert.equal(single.status, 200);
  assert.equal(single.body.source_url, media.source_url);
  assert.equal(get("/wp/v2/media").status, 404, "keine Mediathek-Liste");
  assert.equal(get("/wp/v2/media/999").status, 404);
});

test("posts: _fields, slug, categories, order, include, after und Paginierung verhalten sich wie WordPress", () => {
  const slim = get("/wp/v2/posts", "per_page=2&_fields=id,link,title.rendered,excerpt");
  assert.deepEqual(Object.keys(slim.body[0]).sort(), ["excerpt", "id", "link", "title"]);
  assert.deepEqual(Object.keys(slim.body[0].title), ["rendered"]);

  const embedded = get("/wp/v2/posts", "per_page=1&_embed&_fields=id,_embedded");
  assert.deepEqual(Object.keys(embedded.body[0]).sort(), ["_embedded", "id"]);

  const bySlug = get("/wp/v2/posts", "slug=tattoo-stile");
  assert.equal(bySlug.body.length, 1);
  assert.equal(bySlug.headers["X-WP-Total"], "1");

  const category = get("/wp/v2/categories", "slug=ratgeber").body[0];
  const inCategory = get("/wp/v2/posts", `categories=${category.id}&per_page=100`);
  assert.equal(inCategory.body.length, category.count);
  assert.ok(inCategory.body.every((post) => post.categories.includes(category.id)));

  const asc = get("/wp/v2/posts", "orderby=date&order=asc&per_page=2").body;
  assert.ok(asc[0].date <= asc[1].date);

  const include = get("/wp/v2/posts", `include=${asc[1].id},${asc[0].id}&orderby=include`).body;
  assert.deepEqual(include.map((post) => post.id), [asc[1].id, asc[0].id]);

  const after = get("/wp/v2/posts", "after=2024-01-01T00:00:00&per_page=100");
  assert.ok(after.body.every((post) => post.date > "2024-01-01T00:00:00"));
  assert.equal(get("/wp/v2/posts", "before=2000-01-01T00:00:00").body.length, 0);

  const search = get("/wp/v2/posts", "search=Geschenkideen");
  assert.ok(search.body.some((post) => post.slug === "5-geschenkideen-fuer-taetowierte-gepiercte-frauen-und-maenner"));

  const ids = new Set();
  const first = get("/wp/v2/posts", "per_page=100&page=1");
  const totalPages = Number(first.headers["X-WP-TotalPages"]);
  for (let page = 1; page <= totalPages; page += 1) {
    for (const post of get("/wp/v2/posts", `per_page=100&page=${page}`).body) ids.add(post.id);
  }
  assert.equal(ids.size, postCount, "alle Beiträge über die Seiten, ohne Dubletten");
  assert.equal(get("/wp/v2/posts", `per_page=100&page=${totalPages + 1}`).status, 400);

  const one = get(`/wp/v2/posts/${asc[0].id}`);
  assert.equal(one.status, 200);
  assert.equal(one.body.id, asc[0].id);
  assert.equal(get("/wp/v2/posts/999999999").status, 404);
});

test("nur Magazin-Beiträge: keine Seiten, keine Autoren, Unbekanntes ist 404", () => {
  const all = get("/wp/v2/posts", "per_page=100&_fields=id,type,slug");
  assert.ok(all.body.every((post) => post.type === "post"));
  const pageSlugs = folder("seiten").map((file) => file.replace(/\.md$/, ""));
  assert.ok(pageSlugs.length > 0);
  const slugs = new Set();
  for (let page = 1; page <= Number(all.headers["X-WP-TotalPages"]); page += 1) {
    for (const post of get("/wp/v2/posts", `per_page=100&page=${page}&_fields=slug`).body) slugs.add(post.slug);
  }
  assert.ok(pageSlugs.every((slug) => !slugs.has(slug)), "keine Seiten unter posts");

  for (const route of ["/wp/v2/users", "/wp/v2/users/1", "/wp/v2/pages", "/wp/v2/pages/1071", "/wp/v2/types", "/wp/v2/settings", "/wp/v2/search", "/foo/v1/bar", "/wp/v2/posts/1/revisions"]) {
    assert.equal(get(route).status, 404, route);
  }
  assert.equal(get("/wp/v2/tags").status, 200);
  assert.deepEqual(get("/wp/v2/tags").body, []);

  const serialized = JSON.stringify(get("/wp/v2/posts", "per_page=100&_embed=1").body);
  assert.doesNotMatch(serialized, /"_embedded":\{[^}]*"author"/);
  assert.doesNotMatch(serialized, /wp\/v2\/users/);
});

test("categories: Kategorien mit Anzahl und Live-Link", () => {
  const result = get("/wp/v2/categories", "per_page=100");
  assert.equal(result.status, 200);
  assert.ok(result.body.length >= 3);
  for (const category of result.body) {
    assert.ok(category.count > 0);
    assert.match(category.link, /^https:\/\/dich-mit-stich\.de\/magazin\/thema\//);
  }
  assert.equal(get(`/wp/v2/categories/${result.body[0].id}`).status, 200);
  assert.equal(get("/wp/v2/categories/999999").status, 404);
});

test("Response: CORS, Cache-Control, WP-Header, HEAD und OPTIONS", async () => {
  const response = wpRestResponse(get("/wp/v2/posts", "per_page=3"), "GET");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.match(response.headers.get("cache-control"), /max-age/);
  assert.equal(response.headers.get("x-wp-total"), String(postCount));
  assert.ok(Number(response.headers.get("x-wp-totalpages")) >= 1);
  assert.match(response.headers.get("access-control-expose-headers"), /X-WP-Total/);
  assert.equal((await response.json()).length, 3);

  const head = wpRestResponse(get("/wp/v2/posts", "per_page=3"), "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("x-wp-total"), String(postCount));
  assert.equal(await head.text(), "");

  const options = wpRestPreflight();
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), "*");

  assert.equal(wpRestResponse(get("/wp/v2/users")).status, 404);
});

test("proxy: wp-json und rest_route liefern JSON statt Slash-Umleitung, auch mit /de-Präfix von nginx", async () => {
  const { proxy } = await import("../proxy.ts");
  const request = (path, host = "dich-mit-stich.vercel.app") =>
    new NextRequest(`https://${host}${path}`, { headers: { host } });

  for (const base of ["cms-mag", "magazin"]) {
    const direct = proxy(request(`/${base}/wp-json/wp/v2/posts?per_page=3`));
    assert.notEqual(direct.status, 308, `${base}: keine Slash-Umleitung`);
    assert.equal(direct.headers.get("location"), null);

    const slash = proxy(request(`/${base}/wp-json/wp/v2/posts/?per_page=3`, "dich-mit-stich.de"));
    assert.equal(slash.headers.get("location"), null);

    const prefixed = proxy(request(`/de/${base}/wp-json/wp/v2/posts`, "dich-mit-stich.de"));
    assert.equal(prefixed.headers.get("location"), null);
    assert.match(prefixed.headers.get("x-middleware-rewrite") ?? "", new RegExp(`/${base}/wp-json/wp/v2/posts/?$`));

    for (const path of [`/${base}/?rest_route=/wp/v2/posts&per_page=3`, `/${base}/index.php?rest_route=/wp/v2/posts&per_page=3`, `/${base}?rest_route=/wp/v2/posts&per_page=3`, `/de/${base}/index.php?rest_route=/wp/v2/posts&per_page=3`]) {
      const target = proxy(request(path, "dich-mit-stich.de")).headers.get("x-middleware-rewrite") ?? "";
      assert.match(target, new RegExp(`/${base}/wp-json/wp/v2/posts/?[?]per_page=3$`), path);
      assert.doesNotMatch(target, /rest_route/);
    }
  }

  // Ohne rest_route bleibt /magazin eine normale Seite (Slash-Regel greift weiter).
  assert.equal(proxy(request("/magazin", "dich-mit-stich.de")).status, 308);
});

test("Route: Quelltext-Muster der Next.js-Routen und Dateiverfolgung", () => {
  for (const base of ["cms-mag", "magazin"]) {
    const route = readFileSync(new URL(`app/${base}/wp-json/[[...route]]/route.ts`, root), "utf8");
    assert.match(route, /handleWpRest/);
    assert.match(route, /export const HEAD = GET/);
    assert.match(route, /export function OPTIONS/);
    const config = readFileSync(new URL("next.config.ts", root), "utf8");
    assert.ok(config.includes(`"/${base}/wp-json/[[...route]]"`), `${base}: Dateiverfolgung`);
  }
  const lib = readFileSync(new URL("lib/wp-rest-compat.ts", root), "utf8");
  assert.doesNotMatch(lib, /loadMagazinePages|tattoo-studio|staedte/, "keine Seiten, Studios oder Städte");
});
