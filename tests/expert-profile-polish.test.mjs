import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const detail = readFileSync(new URL("../components/magazine-detail.tsx", import.meta.url), "utf8");
const bookFeature = readFileSync(new URL("../components/published-book-feature.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("published expert profile uses the supplied local portrait at a compact responsive size", () => {
  assert.equal(existsSync(new URL("../public/images/profiles/christian-m-haas-datingexperte.webp", import.meta.url)), true);
  assert.match(detail, /christian-m-haas-datingexperte\.webp/);
  assert.match(detail, /magazine-detail-cover-profile/);
  assert.match(detail, /unoptimized=\{isPublishedExpertProfile\}/);
  assert.match(css, /\.magazine-detail-cover-profile\s*\{[\s\S]*grid-template-columns/);
  assert.match(css, /\.magazine-detail-cover-profile \.article-hero-media\s*\{[\s\S]*aspect-ratio:\s*5\s*\/\s*4/);
});

test("published book is rendered as a dedicated product feature with a local cover", () => {
  assert.equal(existsSync(new URL("../public/images/books/dating-ohne-bullshit-cover.webp", import.meta.url)), true);
  assert.match(detail, /<PublishedBookFeature \/>/);
  assert.match(bookFeature, /dating-ohne-bullshit-cover\.webp/);
  assert.match(bookFeature, /Kein Datingratgeber/);
  assert.match(bookFeature, /Buch bei Amazon ansehen/);
  assert.match(bookFeature, /target="_blank"/);
  assert.match(bookFeature, /rel="noopener noreferrer nofollow"/);
  assert.match(css, /\.published-book-feature\s*\{/);
  assert.match(css, /\.published-book-cover\s*\{/);
});
