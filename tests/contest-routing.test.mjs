import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { resolveMarketRequest } from "../lib/markets.ts";
import { CONTEST_ADMIN_PATH, CONTEST_API_PATH, CONTEST_ENTRY_PATH, CONTEST_JOIN_PATH, CONTEST_PATH, CONTEST_RULES_PATH } from "../lib/contest/config.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("contest pages live under /tattoo-singles/contest/ for DE only", async () => {
  assert.equal(CONTEST_PATH, "/tattoo-singles/contest");
  for (const path of [
    "../app/tattoo-singles/contest/page.tsx",
    "../app/tattoo-singles/contest/mitmachen/page.tsx",
    "../app/tattoo-singles/contest/teilnehmer/[publicId]/page.tsx",
    "../app/tattoo-singles/contest/teilnahmebedingungen/page.tsx",
    "../app/tattoo-singles/contest/admin/page.tsx",
    "../app/tattoo-singles/contest/api/upload/route.ts",
    "../app/tattoo-singles/contest/api/entries/route.ts",
    "../app/tattoo-singles/contest/api/vote/route.ts",
    "../app/tattoo-singles/contest/api/admin/login/route.ts",
    "../app/tattoo-singles/contest/api/admin/moderate/route.ts",
  ]) {
    await access(new URL(path, import.meta.url));
  }

  // DE: prefix-free and /de-prefixed paths (nginx) pass through to the same route.
  assert.deepEqual(resolveMarketRequest(`${CONTEST_PATH}/`), { action: "rewrite", market: "de", pathname: `${CONTEST_PATH}/` });
  assert.deepEqual(resolveMarketRequest(`/de${CONTEST_JOIN_PATH}/`), { action: "rewrite", market: "de", pathname: `${CONTEST_JOIN_PATH}/` });
  // AT/CH: the contest is not offered there.
  assert.deepEqual(resolveMarketRequest(`/at${CONTEST_PATH}/`), { action: "not-found" });
  assert.deepEqual(resolveMarketRequest(`/ch${CONTEST_ENTRY_PATH}/abcdefgh/`), { action: "not-found" });
});

test("contest API requests are never slash-redirected (POST bodies must reach the route handler)", () => {
  for (const url of [
    `https://dich-mit-stich.vercel.app${CONTEST_API_PATH}/vote`,
    `https://dich-mit-stich.vercel.app/de${CONTEST_API_PATH}/upload`,
    `https://dich-mit-stich.vercel.app${CONTEST_API_PATH}/entries/`,
  ]) {
    const response = proxy(new NextRequest(url, { method: "POST" }));
    assert.notEqual(response.status, 308, url);
    assert.notEqual(response.status, 307, url);
  }
  // Regular contest pages keep the trailing-slash rule.
  const page = proxy(new NextRequest(`https://dich-mit-stich.vercel.app${CONTEST_PATH}`));
  assert.equal(page.status, 308);
  assert.match(page.headers.get("location"), /\/tattoo-singles\/contest\/$/);
});

test("CSP, image hosts, sitemap and robots know about the contest", async () => {
  const nextConfig = await read("../next.config.ts");
  assert.match(nextConfig, /connect-src 'self' https:\/\/dich-mit-stich\.de https:\/\/blob\.vercel-storage\.com https:\/\/\*\.public\.blob\.vercel-storage\.com/);
  assert.match(nextConfig, /hostname: "\*\.public\.blob\.vercel-storage\.com"/);

  const sitemap = await read("../lib/de-sitemap.ts");
  assert.match(sitemap, /CONTEST_PATH/);

  const robots = await read("../app/robots.ts");
  assert.match(robots, /CONTEST_ADMIN_PATH/);
  assert.match(robots, /CONTEST_API_PATH/);
  assert.equal(CONTEST_ADMIN_PATH, `${CONTEST_PATH}/admin`);
  assert.equal(CONTEST_RULES_PATH, `${CONTEST_PATH}/teilnahmebedingungen`);

  // Teilnehmer- und Admin-Seiten bleiben aus dem Index.
  for (const path of ["../app/tattoo-singles/contest/teilnehmer/[publicId]/page.tsx", "../app/tattoo-singles/contest/admin/page.tsx"]) {
    assert.match(await read(path), /index: false/);
  }
});

test("photos always carry alt text and e-mail addresses never reach public components", async () => {
  for (const path of ["../components/contest/entry-card.tsx", "../app/tattoo-singles/contest/teilnehmer/[publicId]/page.tsx"]) {
    const source = await read(path);
    assert.match(source, /alt=\{entryAltText\(entry\)\}/, path);
    assert.doesNotMatch(source, /entry\.email/, path);
  }
  const form = await read("../components/contest/entry-form.tsx");
  assert.match(form, /alt="Vorschau deines ausgewählten Fotos"/);
});
