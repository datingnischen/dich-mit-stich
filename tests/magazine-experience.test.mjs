import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("magazine overview uses broad editorial grids without equal-height split panels", async () => {
  const source = await readSource("../app/magazin/page.tsx");

  assert.match(source, /className="magazine-story-grid"/);
  assert.match(source, /className="magazine-guide-grid"/);
  assert.match(source, /className="article-card magazine-story-card"/);
  assert.match(source, /className="article-card magazine-guide-card"/);
  assert.doesNotMatch(source, /<section className="grid-two">/);
  assert.doesNotMatch(source, /Aktuelle Magazinbeiträge für deinen Einstieg/);
  assert.doesNotMatch(source, /Artikel kurz anhören/);
  assert.match(source, /registration\/\?AID=magazin/);
});

test("normal magazine entries render one reusable Flirtradar conversion after editorial content", async () => {
  const [detail, component] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../components/magazine-dating-cta.tsx"),
  ]);

  assert.match(detail, /import \{ MagazineDatingCta \} from "@\/components\/magazine-dating-cta"/);
  assert.equal((detail.match(/<MagazineDatingCta \/>/g) || []).length, 1);
  assert.ok(detail.indexOf("<MagazineDatingCta />") > detail.indexOf('className="rich-content"'));
  assert.ok(detail.indexOf("<MagazineDatingCta />") < detail.indexOf("<ExpertTrustCard"));
  assert.doesNotMatch(detail, /registration\/">Kostenlos registrieren/);

  assert.match(component, /staticAsset\("\/brand\/flirtradar-umkreissuche\.png"\)/);
  assert.match(component, /registration\/\?AID=magazin/);
  assert.match(component, /alt="Flirtradar mit Umkreissuche für Tattoo- und Piercing-Singles"/);
  assert.match(component, /aria-labelledby="magazine-dating-title"/);
});

test("magazine cards and Flirtradar conversion have explicit responsive layouts", async () => {
  const css = await readSource("../app/globals.css");

  assert.match(css, /\.magazine-story-grid,\s*\.magazine-guide-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.magazine-story-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/s);
  assert.match(css, /\.magazine-guide-card\s*\{[^}]*grid-template-columns:\s*160px\s+minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.magazine-dating-cta\s*\{[^}]*grid-template-columns:/s);

  const mobileStart = css.indexOf("@media (max-width: 900px)");
  const mobileCss = css.slice(mobileStart);
  assert.match(mobileCss, /\.magazine-story-grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobileCss, /\.magazine-guide-grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobileCss, /\.magazine-dating-cta[\s\S]*grid-template-columns:\s*1fr/);
});
