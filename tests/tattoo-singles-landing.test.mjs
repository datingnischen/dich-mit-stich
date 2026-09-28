import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";
import { resolveLandingContent, LANDING_VARIANTS, LANDING_CITY_LABELS } from "../lib/landing-tattoo-singles.ts";
import { resolveMarketRequest, TATTOO_SINGLES_LANDING_PATH } from "../lib/markets.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the Ads landing page lives next to the indexed city hub on all three markets", () => {
  assert.equal(TATTOO_SINGLES_LANDING_PATH, "/tattoo-singles/kennenlernen");

  // DE: with and without the /de prefix nginx adds, with and without trailing slash
  for (const pathname of ["/tattoo-singles/kennenlernen", "/tattoo-singles/kennenlernen/", "/de/tattoo-singles/kennenlernen/"]) {
    assert.deepEqual(resolveMarketRequest(pathname), { action: "rewrite", market: "de", pathname: "/market-landing/de/tattoo-singles" }, pathname);
  }
  assert.deepEqual(resolveMarketRequest("/at/tattoo-singles/kennenlernen/"), {
    action: "market-content",
    market: "at",
    pathname: "/market-landing/at/tattoo-singles",
  });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/kennenlernen"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-landing/ch/tattoo-singles",
  });

  // The city hub and the city pages keep their routes.
  assert.deepEqual(resolveMarketRequest("/tattoo-singles/"), { action: "rewrite", market: "de", pathname: "/tattoo-singles/" });
  assert.deepEqual(resolveMarketRequest("/ch/tattoo-singles/zuerich"), {
    action: "market-content",
    market: "ch",
    pathname: "/market-tattoo-singles/ch/zuerich",
  });

  // The internal rewrite target never becomes a public route.
  for (const pathname of ["/market-landing/de/tattoo-singles", "/de/market-landing/de/tattoo-singles", "/at/market-landing/at/tattoo-singles"]) {
    assert.deepEqual(resolveMarketRequest(pathname), { action: "not-found" }, pathname);
  }
});

test("proxy rewrites the landing page internally and keeps query parameters for message match", () => {
  const de = proxy(new NextRequest("https://dich-mit-stich.vercel.app/de/tattoo-singles/kennenlernen/?v=frauen&stadt=berlin&gclid=abc"));
  assert.equal(de.headers.get("x-middleware-rewrite"), "https://dich-mit-stich.vercel.app/market-landing/de/tattoo-singles/?v=frauen&stadt=berlin&gclid=abc");

  const ch = proxy(new NextRequest("https://dich-mit-stich.vercel.app/ch/tattoo-singles/kennenlernen/?v=dating"));
  assert.equal(ch.headers.get("x-middleware-rewrite"), "https://dich-mit-stich.vercel.app/market-landing/ch/tattoo-singles/?v=dating");

  const slash = proxy(new NextRequest("https://dich-mit-stich.vercel.app/at/tattoo-singles/kennenlernen?v=singles"));
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get("location"), "https://dich-mit-stich.at/tattoo-singles/kennenlernen/?v=singles");

  assert.equal(proxy(new NextRequest("https://dich-mit-stich.vercel.app/market-landing/de/tattoo-singles/")).status, 404);
});

test("landing content follows the ad group variant and the city parameter", () => {
  const base = resolveLandingContent("de");
  assert.equal(base.variant, "singles");
  assert.equal(base.headline, "Tattoo-Singles in Deutschland kennenlernen");
  assert.equal(base.registrationUrl, "https://dich-mit-stich.de/registration/?AID=location");
  assert.equal(base.canonical, "https://dich-mit-stich.de/tattoo-singles/kennenlernen/");
  assert.equal(base.postalCode, "10115");
  assert.equal(base.liveGender, "women");

  const women = resolveLandingContent("de", { v: "frauen", stadt: "koeln" });
  assert.equal(women.headline, "Tätowierte Frauen in Köln kennenlernen");
  assert.equal(women.city?.label, "Köln");
  assert.equal(women.postalCode, "50667");
  assert.equal(women.liveTitle, "Neue Singles in Köln und Umgebung");

  const men = resolveLandingContent("at", { v: "maenner" });
  assert.equal(men.headline, "Tätowierte Männer kennenlernen");
  assert.equal(men.liveGender, "men");
  assert.equal(men.registrationUrl, "https://dich-mit-stich.at/registration/?AID=location");
  assert.equal(men.postalCode, "1010");

  // Unknown values fall back silently: Ads may append anything.
  const unknown = resolveLandingContent("de", { v: "xyz", stadt: "atlantis", gclid: "123" });
  assert.equal(unknown.variant, "singles");
  assert.equal(unknown.city, null);
  const arrays = resolveLandingContent("de", { v: ["dating", "frauen"] });
  assert.equal(arrays.variant, "dating");

  for (const variant of LANDING_VARIANTS) {
    for (const market of ["de", "at", "ch"]) {
      const content = resolveLandingContent(market, { v: variant });
      assert.ok(content.headline.length > 10, `${market}/${variant} headline`);
      assert.ok(content.title.length > 10, `${market}/${variant} title`);
    }
  }
});

test("Swiss copy never uses ß and every widget city has a label", () => {
  for (const variant of LANDING_VARIANTS) {
    for (const stadt of [undefined, "zuerich", "genf"]) {
      const content = resolveLandingContent("ch", { v: variant, stadt });
      for (const text of [content.headline, content.subline, content.eyebrow, content.liveTitle, content.title, content.description]) {
        assert.doesNotMatch(text, /ß/, `${variant}/${stadt}: ${text}`);
      }
    }
  }
  const ch = resolveLandingContent("ch", { stadt: "zuerich" });
  assert.equal(ch.headline, "Tattoo-Singles in Zürich kennenlernen");
  assert.equal(ch.registrationUrl, "https://dich-mit-stich.ch/registration/?AID=location");

  for (const [market, labels] of Object.entries(LANDING_CITY_LABELS)) {
    for (const slug of Object.keys(labels)) {
      assert.ok(resolveLandingContent(market, { stadt: slug }).city, `${market}/${slug} has an ICONY postcode`);
    }
  }
});

test("landing page source: noindex, no site navigation, one conversion target, live domain legal links", () => {
  const page = read("../app/market-landing/[market]/tattoo-singles/page.tsx");
  assert.match(page, /robots: \{ index: false/);
  assert.doesNotMatch(page, /SiteFrame|SiteHeader|SiteFooter/);
  assert.doesNotMatch(page, /marketLanguageAlternates/, "noindex pages must not carry hreflang");

  const component = read("../components/tattoo-singles-landing.tsx");
  assert.doesNotMatch(component, /SiteFrame|SiteHeader|SiteFooter|MarketLink|from "next\/link"/, "no navigation off the landing page");
  assert.match(component, /publicUrl\(market, "\/impressum\.html"\)/);
  assert.match(component, /publicUrl\(market, "\/datenschutz\.html"\)/);
  assert.match(component, /buildIconyRegistrationFrame\(market, "location"\)/);
  assert.doesNotMatch(component, /garantiert|100 ?%|sicherste|höchste/i, "no advertising guarantees");
  assert.match(component, /data-lp-cta="sticky"/);
  assert.match(component, /data-lp-cta="hero"/);

  const proxySource = read("../proxy.ts");
  assert.match(proxySource, /market-\(\?:preview\|robots\|sitemap\|about\|landing\|/);
});

test("Google Ads tag and CSP extension stay off without a valid account id", async () => {
  const { googleAdsId, withGoogleAdsOrigins } = await import("../lib/google-ads.ts");
  assert.equal(googleAdsId(undefined), null);
  assert.equal(googleAdsId(""), null);
  assert.equal(googleAdsId("G-12345678"), null, "only Ads ids, no Analytics ids");
  assert.equal(googleAdsId("AW-1234567890"), "AW-1234567890");

  const directives = ["default-src 'self'", "frame-src https://js.icony.com", "connect-src 'self'"];
  assert.deepEqual(withGoogleAdsOrigins(directives, false), directives);
  const extended = withGoogleAdsOrigins(directives, true);
  assert.equal(extended[0], "default-src 'self'");
  assert.equal(extended[1], "frame-src https://js.icony.com https://td.doubleclick.net");
  assert.match(extended[2], /^connect-src 'self' https:\/\/www\.googletagmanager\.com /);

  const tag = read("../components/google-ads-tag.tsx");
  assert.match(tag, /consent','default'/);
  assert.match(tag, /ad_storage:'denied'/);
  assert.doesNotMatch(tag, /beforeInteractive/);
});
