import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const responsiveImageFiles = [
  "../app/tattoo-singles/page.tsx",
  "../app/tattoo-singles/[slug]/page.tsx",
  "../app/magazin/page.tsx",
  "../app/magazin/[slug]/page.tsx",
  "../app/magazin/thema/[slug]/page.tsx",
];

test("city and magazine routes use responsive Next.js images", async () => {
  for (const relativePath of responsiveImageFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, /import Image from ["']next\/image["']/, `${relativePath} must import next/image`);
    assert.doesNotMatch(source, /<img\b/, `${relativePath} must not render raw img tags`);
    assert.match(source, /\bsizes=/, `${relativePath} must declare responsive sizes`);
  }
});

test("author pages keep one prominent profile and show responsive article thumbnails", async () => {
  const source = await readFile(new URL("../app/magazin/author/[slug]/page.tsx", import.meta.url), "utf8");

  assert.match(source, /author-hero-inline/);
  assert.doesNotMatch(source, /ExpertTrustCard/);
  assert.match(source, /post\.featuredImage \?/);
  assert.match(source, /className="article-card-media"/);
  assert.match(source, /alt=\{post\.featuredImageAlt \|\| post\.title\}/);
  assert.match(source, /sizes="\(max-width: 760px\) 112px, 150px"/);
  assert.match(source, /className="article-card-copy"/);
});

test("Next.js allows optimized images from the WordPress media host", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /remotePatterns/);
  assert.match(config, /dich-mit-stich\.de/);
});
