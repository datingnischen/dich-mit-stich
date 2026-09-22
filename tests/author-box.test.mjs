import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getAuthorProfilePage,
  isAuthorProfilePageSlug,
  stripAuthorProfileDuplicates,
} from "../lib/author-profile-pages.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Anne Schweitzer always points at her own magazine profile page", async () => {
  const [profiles, config] = await Promise.all([
    readSource("../lib/author-profiles.ts"),
    readSource("../next.config.ts"),
  ]);

  assert.match(profiles, /"anne-schweitzer":\s*\{[\s\S]*?profileUrl:\s*"\/magazin\/anne-schweitzer"/);
  assert.doesNotMatch(profiles, /profileUrl:\s*"\/magazin\/author\/anne-schweitzer"/);
  assert.match(
    config,
    /source:\s*"\/magazin\/author\/anne-schweitzer",\s*destination:\s*"\/magazin\/anne-schweitzer",\s*permanent:\s*true/,
  );
});

test("author profiles carry a job title, expertise topics and social profiles", async () => {
  const profiles = await readSource("../lib/author-profiles.ts");

  assert.match(profiles, /jobTitle:\s*"Tattoo Artist"/);
  assert.match(profiles, /jobTitle:\s*"Datingexperte"/);
  assert.match(profiles, /expertise:\s*\["Old School", "Black & White", "Dotwork", "Modern Style"\]/);
  assert.match(profiles, /https:\/\/www\.instagram\.com\/tattoostudio_schweitzer\//);
  assert.match(profiles, /https:\/\/www\.facebook\.com\/TattooStudio\.Anne\.Clemens\.Schweitzer/);
  assert.match(profiles, /https:\/\/www\.youtube\.com\/user\/schweitzerclemens/);
  assert.match(profiles, /https:\/\/www\.instagram\.com\/datingnischen\//);
});

test("the author box renders identity, expertise chips and social icons", async () => {
  const [card, css] = await Promise.all([
    readSource("../components/expert-trust-card.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(card, /author-box panel-card\$\{compact \? " author-box-compact" : ""\}/);
  assert.match(card, /className="author-box-jobtitle"/);
  assert.match(card, /className="author-box-expertise"/);
  assert.match(card, /<AuthorSocialIcon platform=\{social\.platform\} \/>/);
  assert.match(card, /rel="noopener noreferrer nofollow"/);
  assert.match(card, /const profilePath = primaryHref \|\| profile\.profileUrl;/);
  assert.match(css, /\.author-box-body\s*\{[\s\S]*?grid-template-columns/);
  assert.match(css, /\.author-box-expertise li\s*\{/);
  assert.match(css, /\.author-box-socials a\s*\{/);
});

test("magazine articles close with the compact author box", async () => {
  const [detail, card, css] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../components/expert-trust-card.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(detail, /variant="compact"/);
  assert.match(card, /const compact = variant === "compact";/);
  assert.match(card, /\{compact \? null : \(\s*<div className="author-box-intro">/);
  assert.match(card, /\{compact \? null : \(\s*<ul className="expert-facts"/);
  assert.match(css, /\.author-box-compact \.author-box-body\s*\{[^}]*grid-template-columns:\s*116px/s);
  assert.match(css, /\.author-box-compact \.author-box-media img\s*\{[^}]*max-width:\s*116px/s);
});

test("the person schema exposes expertise and social profiles", async () => {
  const entities = await readSource("../lib/editorial-entities.ts");

  assert.match(entities, /knowsAbout: profile\.expertise\.length \? profile\.expertise : undefined/);
  assert.match(entities, /sameAs: profile\.sameAs\.length \? profile\.sameAs : undefined/);
  assert.match(entities, /sameAs: authorProfile\.sameAs\.length/);
});

test("the Anne Schweitzer profile page gets an undistorted portrait and first-party contact blocks", async () => {
  const [detail, css] = await Promise.all([
    readSource("../components/magazine-detail.tsx"),
    readSource("../app/globals.css"),
  ]);

  const page = getAuthorProfilePage("anne-schweitzer");
  assert.ok(page, "anne-schweitzer must be registered as an author profile page");
  assert.equal(page.hero.width, 1201);
  assert.equal(page.hero.height, 1197);
  assert.match(page.hero.src, /Anne-Schweitzer-Tattoo-Expertin\.jpg$/);
  assert.equal(isAuthorProfilePageSlug("old-school-tattoos"), false);

  assert.match(detail, /<AuthorProfileContact profile=\{authorProfile\} page=\{authorProfilePage\} \/>/);
  assert.match(detail, /stripAuthorProfileDuplicates\(contentWithoutSchema, authorProfilePage\)/);
  assert.match(detail, /!publishedProfileGraph && !authorProfilePage && authorProfile/);
  assert.match(css, /\.magazine-detail-cover-portrait \.article-hero-media\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/s);
});

test("the imported profile body drops the duplicated portrait, studio and social lists", () => {
  const page = getAuthorProfilePage("anne-schweitzer");
  const html = [
    '<article class="author-profile">',
    '<figure><img src="https://example.test/Anne-Profilbild-185x300.jpg" alt="" /></figure>',
    "<p>Anne Schweitzer ist seit Jahrzehnten eine feste Größe.</p>",
    "<h2>Studio &amp; Kontakt</h2>",
    "<p>Steinweg 1<br />34117 Kassel</p>",
    "<h2>Folgen Sie Anne Schweitzer</h2>",
    '<ul><li><a href="https://www.instagram.com/tattoostudio_schweitzer/">Instagram</a></li></ul>',
    "<h2>Zusammenfassung</h2>",
    "<p>Bleibt erhalten.</p>",
    "</article>",
  ].join("");

  const stripped = stripAuthorProfileDuplicates(html, page);

  assert.doesNotMatch(stripped, /<figure/);
  assert.doesNotMatch(stripped, /Studio &amp; Kontakt/);
  assert.doesNotMatch(stripped, /Folgen Sie/);
  assert.doesNotMatch(stripped, /instagram\.com/);
  assert.match(stripped, /<h2>Zusammenfassung<\/h2>/);
  assert.match(stripped, /Bleibt erhalten\./);
  assert.match(stripped, /<\/article>$/);
});

test("untouched bodies survive the profile strip unchanged", () => {
  const page = getAuthorProfilePage("anne-schweitzer");
  const html = "<article><p>Kein Portrait, kein Studio.</p><h2>Fazit</h2><p>Text.</p></article>";

  assert.equal(stripAuthorProfileDuplicates(html, page), html);
});
