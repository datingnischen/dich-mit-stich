import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { extractTattooStudioCityGuide } from "../scripts/tattoo-studio-source-lib.mjs";

const fixture = await readFile(new URL("./fixtures/tattoo-studios-hannover.html", import.meta.url), "utf8");
const berlinFixture = await readFile(new URL("./fixtures/tattoo-studios-berlin.html", import.meta.url), "utf8");

test("extractTattooStudioCityGuide creates ten structured Hannover studio records", () => {
  const guide = extractTattooStudioCityGuide(fixture, {
    market: "DE",
    citySlug: "hannover",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  });

  assert.equal(guide.identity, "DE:hannover");
  assert.equal(guide.cityName, "Hannover");
  assert.doesNotMatch(guide.title, /\bbesten\b/i);
  assert.equal(guide.studios.length, 10);
  assert.deepEqual(guide.studios.map((studio) => studio.name), [
    "Monkey Ink",
    "Ink Junkies Tattoo",
    "Laves Tattoo Studio",
    "Prime Ink Tattoo Hannover",
    "Left Hand Path Tattoo",
    "Watchink Tattoo",
    "Blut Haut Ink",
    "A Hurricane Ink Tattoo & Piercing",
    "Arvadon Tattoo Studio",
    "TATS Studio",
  ]);

  for (const studio of guide.studios) {
    assert.match(studio.identity, /^DE:hannover:[a-z0-9-]+$/);
    assert.equal(studio.cityIdentity, "DE:hannover");
    assert.ok(studio.description.length > 80, studio.name);
    assert.match(studio.websiteUrl, /^https:\/\//, studio.name);
    assert.ok(studio.address.length > 8, studio.name);
    assert.ok(studio.sourceUrl.startsWith("https://"), studio.name);
  }
});

test("extractTattooStudioCityGuide preserves editorial transparency and source identity", () => {
  const guide = extractTattooStudioCityGuide(fixture, {
    market: "DE",
    citySlug: "hannover",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hannover/",
  });

  assert.match(guide.editorialHtml, /Tattoo-Szene in Hannover/);
  assert.match(guide.selectionMethodHtml, /keine bezahlte Platzierung/);
  assert.equal(guide.lastVerified, "2026-06-07");
  assert.equal(guide.sourceUrl, "https://dich-mit-stich.de/tattoo-studios/hannover/");
});

test("extractTattooStudioCityGuide rejects input without an article boundary", () => {
  assert.throws(() => extractTattooStudioCityGuide(`
    <h1>Tattoo-Studios in Teststadt – Ausgewählte Studios</h1>
    <h2>Tattoo-Studios in Teststadt</h2>
    <p>Inhalt ohne Artikelgrenze.</p>
  `, {
    market: "DE",
    citySlug: "teststadt",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/teststadt/",
  }), /article boundary/i);
});

test("extractTattooStudioCityGuide excludes WordPress entry footer links from editorial content", () => {
  const guide = extractTattooStudioCityGuide(`
    <article>
      <header class="entry-header">
        <h1>Tattoo-Studios in Teststadt – Ausgewählte Studios</h1>
      </header>
      <div class="post-content">
        <div class="entry-content clearfix">
          <h2>Tattoo-Studios in Teststadt</h2>
          <p>Einleitung zur lokalen Studiosuche.</p>
          <h3>Teststudio</h3>
          <p>Ein ausführlicher redaktioneller Beschreibungstext zum Teststudio.</p>
          <ul><li><strong>Adresse:</strong> Teststraße 1, 12345 Teststadt</li></ul>
          <h2>Tattoo-Szene in Teststadt</h2>
          <p>Dieser redaktionelle Stadttext muss erhalten bleiben.</p>
        </div><!-- .entry-content -->
      </div><!-- .post-content -->
      <footer class="entry-footer">
        <a href="https://dich-mit-stich.de/tattoo-studios/kategorie/tattoo-studios/">Tattoo-Studios</a>
    </article>
  `, {
    market: "DE",
    citySlug: "teststadt",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/teststadt/",
  });

  assert.match(guide.editorialHtml, /Dieser redaktionelle Stadttext muss erhalten bleiben/);
  assert.doesNotMatch(guide.editorialHtml, /entry-footer|entry-content|post-content|kategorie\/tattoo-studios|<\/div>|<!--/);
});

test("extractTattooStudioCityGuide rejects structural footer markers inside article content", () => {
  assert.throws(() => extractTattooStudioCityGuide(`
    <article>
      <h1>Tattoo-Studios in Teststadt – Ausgewählte Studios</h1>
      <h2>Tattoo-Studios in Teststadt</h2>
      <p>Einleitung zur lokalen Studiosuche.</p>
      <h3>Teststudio</h3>
      <p>Ein ausführlicher redaktioneller Beschreibungstext zum Teststudio.</p>
      <ul><li><strong>Adresse:</strong> Teststraße 1, 12345 Teststadt</li></ul>
      <h2>Tattoo-Szene in Teststadt</h2>
      <p>Redaktioneller Stadttext.</p>
      <div class="entry-footer">
        <a href="https://dich-mit-stich.de/tattoo-studios/kategorie/tattoo-studios/">Tattoo-Studios</a>
      </div>
    </article>
  `, {
    market: "DE",
    citySlug: "teststadt",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/teststadt/",
  }), /structural footer/i);
});

test("extractTattooStudioCityGuide rejects stray footer closing tags and comments", () => {
  for (const marker of ["</footer>", "<!-- .entry-footer -->", "<!-- footer -->"]) {
    assert.throws(() => extractTattooStudioCityGuide(`
      <article>
        <h1>Tattoo-Studios in Teststadt – Ausgewählte Studios</h1>
        <h2>Tattoo-Studios in Teststadt</h2>
        <p>Einleitung zur lokalen Studiosuche.</p>
        <h3>Teststudio</h3>
        <p>Ein ausführlicher redaktioneller Beschreibungstext zum Teststudio.</p>
        <ul><li><strong>Adresse:</strong> Teststraße 1, 12345 Teststadt</li></ul>
        <h2>Tattoo-Szene in Teststadt</h2>
        <p>Redaktioneller Stadttext.</p>
        ${marker}
      </article>
    `, {
      market: "DE",
      citySlug: "teststadt",
      sourceUrl: "https://dich-mit-stich.de/tattoo-studios/teststadt/",
    }), /structural footer/i, marker);
  }
});

test("extractTattooStudioCityGuide supports Berlin list markup without inventing unverified studios or websites", () => {
  const sourceUrl = "https://dich-mit-stich.de/tattoo-studios/berlin/";
  const guide = extractTattooStudioCityGuide(berlinFixture, {
    market: "DE",
    citySlug: "berlin",
    sourceUrl,
  });

  assert.equal(guide.identity, "DE:berlin");
  assert.equal(guide.cityName, "Berlin");
  assert.doesNotMatch(guide.title, /\bbesten\b/i);
  assert.doesNotMatch(guide.editorialHtml, /\bdie besten Tattoo-Studios\b/i);
  assert.match(guide.title, /Ausgewählte Adressen entdecken/);
  assert.deepEqual(guide.studios.map((studio) => studio.name), [
    "AKA Berlin",
    "Bläckfisk Tattoo Co.",
    "Good Old Times Tattoo Berlin",
    "Iron City Tattoo",
    "Leon Tattoo / Berlin Ink Tattooing",
    "OMEN Tattoo Berlin",
    "Pechschwarz Tattoo",
  ]);
  assert.equal(guide.studios.find((studio) => studio.name === "AKA Berlin").slug, "aka-berlin");
  assert.equal(guide.studios.find((studio) => studio.name === "Good Old Times Tattoo Berlin").slug, "good-old-times-tattoo-berlin");
  assert.ok(!guide.studios.some((studio) => studio.name.includes("Tempel München")));

  const unverifiedWebsite = guide.studios.find((studio) => studio.name === "Bläckfisk Tattoo Co.");
  assert.equal(unverifiedWebsite.websiteUrl, "");
  assert.equal(unverifiedWebsite.sourceUrl, sourceUrl);
  assert.match(unverifiedWebsite.description, /Studio in Berlin-Kreuzberg öffentlich gelistet/);
  assert.equal(guide.lastVerified, "2026-06-07");
});

test("extractTattooStudioCityGuide prefers structured prose lists over a trailing advice heading", () => {
  const source = `
    <article>
      <h1>Tattoo-Studios in Düsseldorf – Die besten Tattoo-Studios finden</h1>
      <h2>Einleitung</h2><p>Lokale Einleitung.</p>
      <h2>Tattoo-Szene in Düsseldorf</h2><p>Lokale Szene.</p>
      <h2>Beliebte Tattoo-Stile in Düsseldorf</h2><p>Lokale Stile.</p>
      <h2>Tattoo-Studios in Düsseldorf</h2>
      <ul>
        <li><strong>Bomnal Studio</strong> – Akademiestraße 7, 40213 Düsseldorf. Webseite: bomnalstudio.com. Kontakt: über das Booking-Formular. Contemporary Tattoo Studio mit Fineline und Realistic. ([bomnalstudio.com](https://www.bomnalstudio.com/de/))</li>
        <li><strong>Tattoowahn</strong> – Heresbachstraße 21, 40223 Düsseldorf. Webseite: tattoowahn.de. Kontakt: 0211 30205599, info@tattoowahn.de. Das Studio nennt Portrait und Cover-up. ([tattoowahn.de](https://www.tattoowahn.de/))</li>
      </ul>
      <h3>So gelingt die Anfrage beim Tattoo-Studio</h3>
      <p>Allgemeine Hinweise für Anfragen.</p>
      <h2>Datenstand, Auswahl und Hinweise</h2>
      <p>Diese Übersicht wurde zuletzt am 2026-06-07 geprüft.</p>
    </article>`;
  const guide = extractTattooStudioCityGuide(source, {
    market: "DE",
    citySlug: "duesseldorf",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/duesseldorf/",
  });

  assert.equal(guide.studios.length, 2);
  assert.deepEqual(guide.studios.map((studio) => studio.name), ["Bomnal Studio", "Tattoowahn"]);
  assert.equal(guide.studios[0].address, "Akademiestraße 7, 40213 Düsseldorf");
  assert.equal(guide.studios[0].websiteUrl, "https://bomnalstudio.com");
  assert.equal(guide.studios[0].sourceUrl, "https://bomnalstudio.com");
  assert.equal(guide.studios[0].contact, "über das Booking-Formular");
  assert.match(guide.studios[0].description, /Contemporary Tattoo Studio/);
});

test("extractTattooStudioCityGuide separates break-delimited fields from heading descriptions", () => {
  const source = `
    <article>
      <h1>Tattoo-Studios in Hamburg – Die besten Tattoo-Studios finden</h1>
      <h2>Einleitung</h2><p>Lokale Einleitung.</p>
      <h2>Tattoo-Szene in Hamburg</h2><p>Lokale Szene.</p>
      <h2>Beliebte Tattoo-Stile in Hamburg</h2><p>Lokale Stile.</p>
      <h2>Tattoo-Studios in Hamburg</h2>
      <h3>Endless Pain – St. Pauli</h3>
      <p><strong>Adresse:</strong> Erichstraße 1, 20359 Hamburg<br><strong>Website:</strong> endlesspain.com<br><strong>Kontakt:</strong> 040 / 310170, info@endlesspain.com</p>
      <p>Endless Pain gehört zu den bekannten Adressen auf St. Pauli und nennt Walk-ins als Möglichkeit.</p>
      <h3>KODIAK TATTOO – Ottensen</h3>
      <p><strong>Adresse:</strong> Friedensallee 7–9, 22765 Hamburg-Ottensen<br><strong>Website:</strong> kodiaktattoo.com<br><strong>Kontakt:</strong> 040 / 80603684</p>
      <p>KODIAK TATTOO positioniert sich mit zeitgenössischer Tattoo-Kunst. ([kodiaktattoo.com](https://kodiaktattoo.com/))</p>
      <h3>Worauf bei der Studioauswahl in Hamburg zu achten ist</h3>
      <p>Allgemeiner Ratgebertext ohne Studio-Kontaktdaten.</p>
      <h2>Worauf bei der Studioauswahl in Hamburg geachtet werden sollte</h2><p>Portfolio und Beratung sorgfältig vergleichen.</p>
      <h2>Kurze Zusammenfassung</h2><p>Hamburg bietet unterschiedliche Studios und Stile.</p>
      <h2>Datenstand, Auswahl und Hinweise</h2><p>Zuletzt am 2026-06-07 geprüft.</p>
    </article>`;
  const guide = extractTattooStudioCityGuide(source, {
    market: "DE",
    citySlug: "hamburg",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/hamburg/",
  });

  assert.equal(guide.studios.length, 2);
  assert.equal(guide.studios[0].address, "Erichstraße 1, 20359 Hamburg");
  assert.equal(guide.studios[0].websiteUrl, "https://endlesspain.com");
  assert.equal(guide.studios[0].contact, "040 / 310170, info@endlesspain.com");
  assert.equal(guide.studios[0].description, "Endless Pain gehört zu den bekannten Adressen auf St. Pauli und nennt Walk-ins als Möglichkeit.");
  assert.equal(guide.studios[1].description, "KODIAK TATTOO positioniert sich mit zeitgenössischer Tattoo-Kunst.");
  assert.match(guide.editorialHtml, /Worauf bei der Studioauswahl in Hamburg/);
  assert.match(guide.editorialHtml, /Kurze Zusammenfassung/);
  assert.match(guide.editorialHtml, /Allgemeiner Ratgebertext ohne Studio-Kontaktdaten/);
});

test("extractTattooStudioCityGuide combines nested phone and email fields", () => {
  const source = `
    <article>
      <h1>Tattoo-Studios in Dresden – Die besten Tattoo-Studios finden</h1>
      <h2>Einleitung</h2><p>Lokale Einleitung.</p>
      <h2>Tattoo-Szene in Dresden</h2><p>Lokale Szene.</p>
      <h2>Beliebte Tattoo-Stile in Dresden</h2><p>Lokale Stile.</p>
      <h2>Tattoo-Studios in Dresden</h2>
      <h3>INKEREI Tattoo &amp; Piercing</h3>
      <p>Studio in der Dresdner Neustadt.</p>
      <ul><li><strong>Webseite:</strong> <a href="https://inkerei.com">inkerei.com</a></li><li><strong>Adresse 1:</strong> Bischofsweg 18, 01097 Dresden-Neustadt</li><li><strong>Adresse 2:</strong> Neustadt, Dresden</li><li><strong>Telefon:</strong> 0351 8742687</li><li><strong>E-Mail:</strong> info@inkerei.com</li></ul>
      <h2>Datenstand, Auswahl und Hinweise</h2><p>Zuletzt am 2026-06-07 geprüft.</p>
    </article>`;
  const guide = extractTattooStudioCityGuide(source, {
    market: "DE",
    citySlug: "dresden",
    sourceUrl: "https://dich-mit-stich.de/tattoo-studios/dresden/",
  });

  assert.equal(guide.studios.length, 1);
  assert.equal(guide.studios[0].address, "Bischofsweg 18, 01097 Dresden-Neustadt; Neustadt, Dresden");
  assert.equal(guide.studios[0].contact, "0351 8742687, info@inkerei.com");
});

test("extractTattooStudioCityGuide fails closed on multiple or missing website prose", () => {
  const source = `
    <article>
      <h1>Tattoo-Studios in Bochum – Die besten Tattoo-Studios finden</h1>
      <h2>Einleitung</h2><p>Lokale Einleitung.</p>
      <h2>Tattoo-Szene in Bochum</h2><p>Lokale Szene.</p>
      <h2>Beliebte Tattoo-Stile in Bochum</h2><p>Lokale Stile.</p>
      <h2>Tattoo-Studios in Bochum</h2>
      <h3>Beautiful Minds Tattoo</h3>
      <p><strong>Adresse:</strong> Oststraße 39, 44866 Bochum<br><strong>Website:</strong> beautifulmindstattoo.com und tattoo-bochum.de<br><strong>Kontakt:</strong> 02327 9606362</p>
      <p>Studio in Bochum-Wattenscheid.</p>
      <h3>Studio ohne Website</h3>
      <p><strong>Adresse:</strong> Musterstraße 1, 44787 Bochum<br><strong>Website:</strong> aktuell keine eigene Website auffindbar<br><strong>Kontakt:</strong> telefonisch</p>
      <p>Öffentlich gelistetes Studio.</p>
      <h2>Datenstand, Auswahl und Hinweise</h2><p>Zuletzt am 2026-06-07 geprüft.</p>
    </article>`;
  const sourceUrl = "https://dich-mit-stich.de/tattoo-studios/bochum/";
  const guide = extractTattooStudioCityGuide(source, { market: "DE", citySlug: "bochum", sourceUrl });

  assert.equal(guide.studios[0].websiteUrl, "");
  assert.equal(guide.studios[0].sourceUrl, sourceUrl);
  assert.equal(guide.studios[1].websiteUrl, "");
  assert.equal(guide.studios[1].sourceUrl, sourceUrl);
});

test("captured German legacy corpus preserves the reviewed per-city studio counts", async () => {
  const expected = {
    berlin: 7, bochum: 9, bonn: 9, bremen: 10, dortmund: 10, dresden: 10, duisburg: 10,
    duesseldorf: 10, essen: 10, "frankfurt-am-main": 10, hamburg: 10, hannover: 10, karlsruhe: 10,
    koeln: 10, leipzig: 10, muenchen: 10, muenster: 11, nuernberg: 9, stuttgart: 10, wuppertal: 9,
  };
  let total = 0;
  for (const [citySlug, expectedCount] of Object.entries(expected)) {
    const sourceHtml = await readFile(new URL(`../data/legacy/tattoo-studios-de/${citySlug}.html`, import.meta.url), "utf8");
    const guide = extractTattooStudioCityGuide(sourceHtml, {
      market: "de",
      citySlug,
      sourceUrl: `https://dich-mit-stich.de/tattoo-studios/${citySlug}/`,
    });
    assert.equal(guide.studios.length, expectedCount, citySlug);
    total += guide.studios.length;
  }
  assert.equal(total, 194);
});
