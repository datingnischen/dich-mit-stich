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

async function loadMarketNavigation() {
  try {
    return await import("../lib/market-navigation.ts");
  } catch (error) {
    assert.fail(`lib/market-navigation.ts must provide the preview click contract: ${error.message}`);
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

test("keeps every unprefixed frontend route prefix-free while resolving it to the DE content tree", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/"), {
    action: "rewrite",
    market: "de",
    pathname: "/",
  });
  assert.deepEqual(resolveMarketRequest("/magazin"), {
    action: "rewrite",
    market: "de",
    pathname: "/magazin",
  });
  assert.deepEqual(resolveMarketRequest("/tattoo-singles/bochum"), {
    action: "rewrite",
    market: "de",
    pathname: "/tattoo-singles/bochum",
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

test("gates untagged content while allowing the imported CH tattoo city family", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  assert.deepEqual(resolveMarketRequest("/at/magazin"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/magazin",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/zuerich"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-singles/ch/zuerich",
  });
  assert.deepEqual(resolveMarketRequest("/at/tattoo-singles/dornbirn"), {
    action: "market-content",
    market: "at",
    pathname: "/market-tattoo-singles/at/dornbirn",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-singles/ch",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-studios"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-studios/ch",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-studios/zuerich"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-studios/ch/zuerich",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-studio/example-zuerich"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-studio/ch/example-zuerich",
  });
  assert.deepEqual(resolveMarketRequest("/at/tattoo-studios"), {
    action: "placeholder",
    market: "at",
    pathname: "/market-preview/at",
    requestedPath: "/tattoo-studios",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/berlin"), {
    action: "placeholder",
    market: "ch",
    pathname: "/market-preview/ch",
    requestedPath: "/tattoo-singles/berlin",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/zuerich/more"), {
    action: "placeholder",
    market: "ch",
    pathname: "/market-preview/ch",
    requestedPath: "/tattoo-singles/zuerich/more",
  });
  assert.deepEqual(resolveMarketRequest("/de/market-tattoo-singles/ch/zuerich"), {
    action: "not-found",
  });
  assert.deepEqual(resolveMarketRequest("/de/market-tattoo-studios/ch/zuerich"), {
    action: "not-found",
  });
  assert.deepEqual(resolveMarketRequest("/ch/magazin"), {
    action: "placeholder",
    market: "ch",
    pathname: "/market-preview/ch",
    requestedPath: "/magazin",
  });
});

test("rejects prefix-free internal implementation routes before the DE fallback", async () => {
  const { resolveMarketRequest } = await loadMarkets();

  for (const pathname of [
    "/market-preview/ch",
    "/market-robots/ch",
    "/market-sitemap/ch",
    "/market-tattoo-singles/ch/zuerich",
    "/market-tattoo-studios/ch/zuerich",
    "/market-tattoo-studio/ch/sinkply-zuerich",
  ]) {
    assert.deepEqual(resolveMarketRequest(pathname), { action: "not-found" }, pathname);
  }
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

test("preview navigation intercepts only ordinary same-context clicks", async () => {
  const { shouldInterceptPreviewClick } = await loadMarketNavigation();
  const ordinary = {
    hostname: "dich-mit-stich.vercel.app",
    button: 0,
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: "",
    download: false,
  };

  assert.equal(shouldInterceptPreviewClick(ordinary), true);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, hostname: "dich-mit-stich.ch" }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, hostname: "preview.example.com" }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, button: 1 }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, ctrlKey: true }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, defaultPrevented: true }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, target: "_blank" }), false);
  assert.equal(shouldInterceptPreviewClick({ ...ordinary, download: true }), false);
});

test("only prefix-free internal paths are eligible for market preview routing", async () => {
  const { isPrefixFreeInternalPath } = await loadMarketNavigation();

  assert.equal(isPrefixFreeInternalPath("/tattoo-singles/zuerich"), true);
  assert.equal(isPrefixFreeInternalPath("/registration/"), true);
  assert.equal(isPrefixFreeInternalPath("/ch/tattoo-singles/zuerich"), false);
  assert.equal(isPrefixFreeInternalPath("/de/magazin"), false);
  assert.equal(isPrefixFreeInternalPath("/at/"), false);
  assert.equal(isPrefixFreeInternalPath("//example.com/path"), false);
  assert.equal(isPrefixFreeInternalPath("https://dich-mit-stich.ch/path"), false);
  assert.equal(isPrefixFreeInternalPath("javascript:alert(1)"), false);
});

test("Next.js proxy and public-domain canonical helpers are wired", async () => {
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8").catch(() => "");
  const sitemapSource = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");

  assert.match(proxySource, /resolveMarketRequest/);
  assert.match(proxySource, /NextResponse\.redirect/);
  assert.match(proxySource, /NextResponse\.rewrite/);
  assert.doesNotMatch(
    proxySource,
    /x-dms-rewrite-destination/,
    "the proxy must not trust or propagate a client-controllable rewrite marker",
  );
  assert.match(sitemapSource, /dich-mit-stich\.de/);
  assert.doesNotMatch(sitemapSource, /vercel\.app/);
});

test("every DE page family emits a prefix-free public-domain canonical", async () => {
  const expectations = [
    ["../app/page.tsx", /publicUrl\("de"\)/],
    ["../app/magazin/page.tsx", /publicUrl\("de", "\/magazin"\)/],
    ["../app/magazin/[slug]/page.tsx", /publicUrl\("de", `\/magazin\/\$\{slug\}`\)/],
    ["../app/magazin/thema/[slug]/page.tsx", /publicUrl\("de", `\/magazin\/thema\/\$\{slug\}`\)/],
    ["../app/magazin/author/[slug]/page.tsx", /publicUrl\("de", profile\.profileUrl\)/],
    ["../app/tattoo-singles/page.tsx", /publicUrl\("de", "\/tattoo-singles"\)/],
    ["../app/tattoo-singles/[slug]/page.tsx", /publicUrl\("de", `\/tattoo-singles\/\$\{slug\}`\)/],
    ["../app/tattoo-studios/page.tsx", /publicUrl\("de", "\/tattoo-studios"\)/],
    ["../app/tattoo-studios/[city]/page.tsx", /publicUrl\("de", `\/tattoo-studios\/\$\{city\}`\)/],
    ["../app/tattoo-studio/[slug]/page.tsx", /publicUrl\("de", `\/tattoo-studio\/\$\{slug\}`\)/],
  ];

  for (const [relativePath, pattern] of expectations) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, pattern, `${relativePath} must declare its public canonical`);
    assert.doesNotMatch(source, /vercel\.app/, `${relativePath} must not canonicalize to Vercel`);
  }
});

test("unfinished market areas are noindex while CH city SEO is handled explicitly", async () => {
  const previewSource = await readFile(new URL("../app/market-preview/[market]/page.tsx", import.meta.url), "utf8");
  const robotsSource = await readFile(new URL("../app/market-robots/[market]/route.ts", import.meta.url), "utf8");
  const sitemapSource = await readFile(new URL("../app/market-sitemap/[market]/route.ts", import.meta.url), "utf8");
  const shellSource = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");

  assert.match(previewSource, /index:\s*false/);
  assert.match(previewSource, /follow:\s*false/);
  assert.match(robotsSource, /Disallow:\s*\//);
  assert.match(robotsSource, /Allow:\s*\/tattoo-singles/);
  assert.match(robotsSource, /Allow:\s*\/tattoo-studios/);
  assert.match(robotsSource, /Allow:\s*\/tattoo-studio\//);
  assert.match(sitemapSource, /<urlset/);
  assert.match(sitemapSource, /chTattooCitySlugs/);

  // Reverse-proxy HTML must not expose Vercel's internal market prefixes.
  assert.match(previewSource, /<MarketLink[^>]*targetMarket="de"/);
  assert.match(previewSource, /<MarketLink[^>]*targetMarket="at"/);
  assert.match(previewSource, /<MarketLink[^>]*targetMarket="ch"/);
  assert.doesNotMatch(previewSource, /href=\{marketPreviewPath\(/);
  assert.match(shellSource, /<MarketLink[^>]*targetMarket=\{market\}/);
  assert.doesNotMatch(shellSource, /href=\{marketPreviewPath\(market\)\}/);
});


test("AT market preview exposes all imported Austria city pages", async () => {
  const previewSource = await readFile(new URL("../app/market-preview/[market]/page.tsx", import.meta.url), "utf8");

  assert.match(previewSource, /publicUrl\(market, "\/tattoo-singles"\)/);
  assert.match(previewSource, /publicUrl\(market, "\/registration\/"\)/);
  assert.match(previewSource, /pathname=\{`\/tattoo-singles\/\$\{city\.slug\}`\}/);
  assert.match(previewSource, /label: "Wien"/);
  assert.match(previewSource, /label: "Graz"/);
  assert.match(previewSource, /label: "Salzburg"/);
  assert.match(previewSource, /label: "Wels"/);
  assert.match(previewSource, /label: "Sankt Pölten"/);
  assert.match(previewSource, /label: "Wiener Neustadt"/);
});

test("DE sitemap includes the tattoo studio guide city and detail families", async () => {
  const sitemapSource = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(sitemapSource, /getTattooStudioCities/);
  assert.match(sitemapSource, /getTattooStudioSlugs/);
  assert.match(sitemapSource, /\$\{SITE_URL\}\/tattoo-studios/);
  assert.match(sitemapSource, /\$\{SITE_URL\}\/tattoo-studio\/\$\{slug\}/);
});

test("clean tattoo studio slugs preserve the previously published Prime Ink profile URL", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /prime-ink-tattoo-hannover-hannover/);
  assert.match(config, /destination:\s*"\/tattoo-studio\/prime-ink-tattoo-hannover"/);
  assert.match(config, /permanent:\s*true/);
});
