import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadMarkets() {
  try {
    return await import("../lib/markets.ts");
  } catch (error) {
    assert.fail(`lib/markets.ts must provide the market contract: ${error.message}`);
  }
}

test("supports the three documented markets and public domains", async () => {
  const { MARKET_CODES, getMarket, publicUrl } = await loadMarkets();

  assert.deepEqual(MARKET_CODES, ["de", "at", "ch"]);
  assert.equal(getMarket("de").domain, "dich-mit-stich.de");
  assert.equal(getMarket("at").domain, "dich-mit-stich.at");
  assert.equal(getMarket("ch").domain, "dich-mit-stich.ch");
  assert.equal(publicUrl("de", "/magazin"), "https://dich-mit-stich.de/magazin");
  assert.equal(publicUrl("ch", "/magazin"), "https://dich-mit-stich.ch/magazin");
});

test("redirects every unprefixed frontend route to the DE preview namespace", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/"), {
    action: "redirect",
    market: "de",
    pathname: "/de",
  });
  assert.deepEqual(resolveMarketRequest("/magazin"), {
    action: "redirect",
    market: "de",
    pathname: "/de/magazin",
  });
  assert.deepEqual(resolveMarketRequest("/tattoo-singles/bochum"), {
    action: "redirect",
    market: "de",
    pathname: "/de/tattoo-singles/bochum",
  });
});

test("rewrites DE preview routes to the existing content tree", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/de"), {
    action: "rewrite",
    market: "de",
    pathname: "/",
  });
  assert.deepEqual(resolveMarketRequest("/de/magazin/pascal-und-stephanie"), {
    action: "rewrite",
    market: "de",
    pathname: "/magazin/pascal-und-stephanie",
  });
});

test("gates untagged content in AT and CH instead of leaking DE pages", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/at/magazin"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/magazin",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/berlin"), {
    action: "placeholder",
    market: "ch",
    pathname: "/market-preview/ch",
    requestedPath: "/tattoo-singles/berlin",
  });
});

test("keeps framework assets outside market redirects and handles SEO endpoints explicitly", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/_next/image"), { action: "pass" });
  assert.deepEqual(resolveMarketRequest("/app-assets/_next/static/app.js"), { action: "pass" });
  assert.deepEqual(resolveMarketRequest("/favicon.ico"), { action: "pass" });
  assert.deepEqual(resolveMarketRequest("/de/sitemap.xml"), {
    action: "rewrite",
    market: "de",
    pathname: "/sitemap.xml",
  });
  assert.deepEqual(resolveMarketRequest("/ch/robots.txt"), {
    action: "market-robots",
    market: "ch",
    pathname: "/market-robots/ch",
  });
  assert.deepEqual(resolveMarketRequest("/at/sitemap.xml"), {
    action: "market-sitemap",
    market: "at",
    pathname: "/market-sitemap/at",
  });
});

test("Next.js proxy and public-domain canonical helpers are wired", async () => {
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8").catch(() => "");
  const sitemapSource = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");

  assert.match(proxySource, /resolveMarketRequest/);
  assert.match(proxySource, /NextResponse\.redirect/);
  assert.match(proxySource, /NextResponse\.rewrite/);
  assert.match(sitemapSource, /dich-mit-stich\.de/);
  assert.doesNotMatch(sitemapSource, /vercel\.app/);
});

test("every DE page family emits a prefix-free public-domain canonical", async () => {
  const expectations = [
    ["../app/page.tsx", /publicUrl\("de"\)/],
    ["../app/magazin/page.tsx", /publicUrl\("de", "\/magazin"\)/],
    ["../app/magazin/[slug]/page.tsx", /publicUrl\("de", `\/magazin\/\$\{slug\}`\)/],
    ["../app/magazin/thema/[slug]/page.tsx", /publicUrl\("de", `\/magazin\/thema\/\$\{slug\}`\)/],
    ["../app/magazin/author/[slug]/page.tsx", /publicUrl\("de", `\/magazin\/author\/\$\{slug\}`\)/],
    ["../app/tattoo-singles/page.tsx", /publicUrl\("de", "\/tattoo-singles"\)/],
    ["../app/tattoo-singles/[slug]/page.tsx", /publicUrl\("de", `\/tattoo-singles\/\$\{slug\}`\)/],
  ];

  for (const [relativePath, pattern] of expectations) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, pattern, `${relativePath} must declare its public canonical`);
    assert.doesNotMatch(source, /vercel\.app/, `${relativePath} must not canonicalize to Vercel`);
  }
});

test("unfinished markets are noindex and have dedicated robots and sitemap handlers", async () => {
  const previewSource = await readFile(new URL("../app/market-preview/[market]/page.tsx", import.meta.url), "utf8");
  const robotsSource = await readFile(new URL("../app/market-robots/[market]/route.ts", import.meta.url), "utf8");
  const sitemapSource = await readFile(new URL("../app/market-sitemap/[market]/route.ts", import.meta.url), "utf8");

  assert.match(previewSource, /index:\s*false/);
  assert.match(previewSource, /follow:\s*false/);
  assert.match(robotsSource, /Disallow:\s*\//);
  assert.match(sitemapSource, /<urlset/);
});
