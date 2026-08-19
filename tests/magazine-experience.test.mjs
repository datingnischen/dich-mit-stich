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

test("normal magazine entries use a structured editorial detail layout", async () => {
  const [detail, css] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../app/globals.css"),
  ]);

  assert.match(detail, /formatGermanDate/);
  assert.match(detail, /const isPiercingArticle = \[entry\.title, entry\.slug/);
  assert.match(detail, /className="[^"]*magazine-detail-shell[^"]*"/);
  assert.match(detail, /className="magazine-breadcrumb" aria-label="Brotkrümelnavigation"/);
  assert.match(detail, /className="[^"]*magazine-detail-hero[^"]*"/);
  assert.match(detail, /className="magazine-detail-topics"/);
  assert.match(detail, /className="magazine-detail-media"/);

  assert.match(detail, /className="rich-content magazine-article-body"/);
  assert.doesNotMatch(detail, /entry\.date\.slice\(0, 10\)/);

  assert.match(detail, /className=\{`magazine-detail-cover\$\{featuredImage \? "" : " magazine-detail-cover-text-only"\}`\}/);
  assert.ok(detail.indexOf("magazine-detail-hero") > detail.indexOf("magazine-detail-cover"));
  assert.ok(detail.indexOf("magazine-detail-media") > detail.indexOf("magazine-detail-hero"));
  assert.match(css, /\.magazine-detail-cover\s*\{[^}]*width:\s*min\(1000px,\s*100%\)[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.magazine-detail-cover\s*\{[^}]*box-shadow:/s);
  assert.match(css, /\.magazine-detail-hero\s*\{[^}]*width:\s*100%[^}]*border-radius:\s*0/s);
  assert.match(css, /\.magazine-detail-media\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.magazine-detail-media \.article-hero-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9[^}]*border-radius:\s*0/s);
  assert.match(css, /\.magazine-detail-cover-text-only \.magazine-detail-hero\s*\{[^}]*border-radius:/s);
  assert.match(css, /\.magazine-detail-shell\s*\{[^}]*width:/s);
  assert.match(css, /\.magazine-detail-hero\s*\{/);
  assert.match(css, /\.magazine-article-body\s*\{[^}]*max-width:\s*760px/s);
  assert.match(css, /\.magazine-article-body\s+h2\s*\{[^}]*font-size:/s);
  assert.match(css, /\.magazine-article-body\s*:\s*where\(p,\s*ul,\s*ol\)\s*\{[^}]*line-height:/s);
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
  const flirtradarImage = await readFile(
    new URL("../public/brand/flirtradar-umkreissuche.png", import.meta.url),
  );
  const declaredDimensions = component.match(
    /width=\{(\d+)\}[\s\S]*height=\{(\d+)\}/,
  );
  assert.ok(declaredDimensions, "Flirtradar Image must declare intrinsic dimensions");
  assert.deepEqual(
    declaredDimensions.slice(1).map(Number),
    [flirtradarImage.readUInt32BE(16), flirtradarImage.readUInt32BE(20)],
  );
  assert.match(component, /https:\/\/dich-mit-stich\.de\/suche\/\?AID=magazin/);
  assert.doesNotMatch(component, /https:\/\/dich-mit-stich\.de\/registration\/\?AID=magazin/);
  assert.match(component, /alt="Flirtradar mit Umkreissuche für Tattoo- und Piercing-Singles"/);
  assert.match(component, /aria-labelledby="magazine-dating-title"/);
});

test("Anti-Eyebrow pilot replaces unsafe legacy guidance with sourced editorial content", async () => {
  const [detail, editorial, registry, featuredImages, featuredAsset] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../components/anti-eyebrow-editorial.tsx"),
    readSource("../lib/magazine-editorial-overrides.ts"),
    readSource("../lib/magazine-featured-images.ts"),
    readSource("../public/images/magazine/anti-eyebrow-piercing-featured.svg"),
  ]);

  assert.match(detail, /getMagazineEditorialOverride\(entry\.slug\)/);
  assert.match(detail, /getMagazineEditorialOverride\(slug\)/);
  assert.match(detail, /description:\s*answerEngineEntry\?\.directAnswer\s*\?\?\s*editorialOverride\?\.summary/);
  assert.match(detail, /<AntiEyebrowEditorial \/>/);
  assert.match(detail, /editorialOverride\?\.summary/);
  assert.match(registry, /"anti-eyebrow-piercing":\s*\{/);
  assert.match(registry, /Professionell planen, schonend pflegen und Warnzeichen richtig einordnen/);
  assert.match(registry, /reviewedAt:\s*"2026-08-12"/);
  assert.match(detail, /Fachlich aktualisiert:/);

  assert.match(editorial, /Was ist ein Anti-Eyebrow-Piercing\?/);
  assert.match(editorial, /Schmuck und professionelle Planung/);
  assert.match(editorial, /Heilung und alltagstaugliche Pflege/);
  assert.match(editorial, /Wann du Hilfe holen solltest/);
  assert.match(editorial, /https:\/\/safepiercing\.org\/aftercare\//);
  assert.match(editorial, /https:\/\/safepiercing\.org\/jewelry-for-initial-piercings\//);
  assert.match(editorial, /https:\/\/www\.nhs\.uk\/conditions\/infected-piercings\//);
  assert.match(editorial, /rel="noopener noreferrer nofollow"/);
  assert.match(editorial, /\/magazin\/surface-piercing/);
  assert.match(editorial, /\/magazin\/augenbrauen-piercing/);
  assert.match(editorial, /\/magazin\/piercingarten/);
  assert.doesNotMatch(editorial, /stark eitert, ist das ganz normal/i);
  assert.doesNotMatch(editorial, /Schmerzen beim Stechen:\s*schwer/i);
  assert.doesNotMatch(editorial, /40\s*[–-]\s*80\s*EUR/i);

  assert.match(featuredImages, /"anti-eyebrow-piercing":\s*\{/);
  assert.match(featuredImages, /anti-eyebrow-piercing-featured\.svg/);
  assert.doesNotMatch(featuredAsset, /<text\b/);
});

test("matching magazine entries render an approved responsive YouTube video before conversion", async () => {
  const [detail, component, registry, css] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../components/magazine-video.tsx"),
    readSource("../lib/magazine-videos.ts"),
    readSource("../app/globals.css"),
  ]);

  assert.match(detail, /getMagazineVideo\(entry\.slug\)/);
  assert.match(detail, /magazineVideo \? <MagazineVideo video=\{magazineVideo\} \/> : null/);
  assert.ok(detail.indexOf("<MagazineVideo") > detail.indexOf('className="rich-content"'));
  assert.ok(detail.indexOf("<MagazineVideo") < detail.indexOf("<MagazineDatingCta />"));
  assert.match(registry, /"christina-piercing":\s*\{/);
  assert.match(registry, /videoId:\s*"p4-qTtyMegM"/);
  assert.match(registry, /"conch-piercing":\s*\{/);
  assert.match(registry, /videoId:\s*"r4n8QoYg9kk"/);
  assert.match(component, /https:\/\/www\.youtube-nocookie\.com\/embed\/\$\{video\.videoId\}/);
  assert.match(component, /title=\{video\.embedTitle\}/);
  assert.match(component, /loading="lazy"/);
  assert.match(css, /\.magazine-video-frame\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
});

test("Christina magazine detail replaces the legacy diagram with a local editorial feature image", async () => {
  const detail = await readSource("../app/magazin/[slug]/page.tsx");

  assert.match(detail, /import \{ getMagazineFeaturedImage \} from "@\/lib\/magazine-featured-images"/);
  assert.match(detail, /getMagazineFeaturedImage\(entry\.slug, \{[\s\S]*src: entry\.featuredImage,[\s\S]*alt: entry\.featuredImageAlt \|\| entry\.title,[\s\S]*\}\)/);
  assert.match(detail, /src=\{featuredImage\.src\}/);
  assert.match(detail, /alt=\{featuredImage\.alt\}/);
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

test("magazine details expose visible answer-engine context and article JSON-LD", async () => {
  const [detail, answerSummary] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../components/magazine-answer-summary.tsx"),
  ]);

  assert.match(detail, /getAnswerEnginePilotEntry\(entry\.slug\)/);
  assert.match(detail, /<MagazineAnswerSummary entry=\{answerEngineEntry\} \/>/);
  assert.match(detail, /buildMagazineArticleGraph\(/);
  assert.match(detail, /type="application\/ld\+json"/);
  assert.match(detail, /serializeJsonLd\(articleGraph\)/);
  assert.match(answerSummary, /rel="noopener noreferrer nofollow"/);
});

test("author profiles enrich the same canonical person entity used by articles", async () => {
  const [authorPage, entities] = await Promise.all([
    readSource("../app/magazin/author/[slug]/page.tsx"),
    readSource("../lib/editorial-entities.ts"),
  ]);

  assert.match(authorPage, /buildAuthorProfileGraph\(profile\)/);
  assert.match(authorPage, /alternates:\s*\{ canonical: publicUrl\("de", profile\.profileUrl\) \}/);
  assert.match(authorPage, /type="application\/ld\+json"/);
  assert.match(authorPage, /serializeJsonLd\(profileGraph\)/);
  assert.match(entities, /authorEntityId\(profile\.profileUrl\)/);
  assert.match(entities, /publisher:\s*\{\s*"@id": EDITORIAL_ENTITY_IDS\.operator\s*\}/s);
  assert.doesNotMatch(entities, /worksFor|parentOrganization|founder:/);
});

test("JSON-LD serialization cannot break out of its script element", async () => {
  const [detail, authorPage] = await Promise.all([
    readSource("../app/magazin/[slug]/page.tsx"),
    readSource("../app/magazin/author/[slug]/page.tsx"),
  ]);

  assert.match(detail, /serializeJsonLd\(articleGraph\)/);
  assert.match(authorPage, /serializeJsonLd\(profileGraph\)/);
  assert.doesNotMatch(detail, /__html:\s*JSON\.stringify/);
  assert.doesNotMatch(authorPage, /__html:\s*JSON\.stringify/);
});

test("pilot direct answers stay consistent across metadata, hero and schema", async () => {
  const detail = await readSource("../app/magazin/[slug]/page.tsx");

  assert.match(detail, /const answerEngineEntry = getAnswerEnginePilotEntry\(slug\);/);
  assert.match(detail, /description:\s*answerEngineEntry\?\.directAnswer/);
  assert.match(detail, /\{\(answerEngineEntry \|\| editorialOverride\) \? null : "…"\}/);
});

test("article dateModified keeps the latest CMS or editorial change", async () => {
  const entities = await readSource("../lib/editorial-entities.ts");

  assert.match(entities, /dateModified:\s*latestIsoDate\(entry\.modified, pilotEntry\?\.reviewedAt, entry\.date\)/);
});
