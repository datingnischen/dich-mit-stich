import assert from "node:assert/strict";
import test from "node:test";

const { sanitizeMagazineHtml } = await import("../lib/wordpress.ts");
const { marketizeSanitizedHtml } = await import("../lib/market-html.ts");

const WP_AUDIO = `<p><!-- audio-summary:start --></p>
<h2>Artikel kurz anhören</h2>
<p><audio controls preload="none" autoplay onplay="alert(1)"><source src="https://dich-mit-stich.de/magazin/wp-content/uploads/2026/05/polynesische-tribal-tattoo-audio-zusammenfassung.mp3" type="audio/mpeg">Dein Browser unterstützt das Audio-Element nicht.</audio><br />
<!-- audio-summary:end --></p>`;

test("the audio summary keeps a playable player pointing at the /cms-mag/ upload", () => {
  const html = marketizeSanitizedHtml(sanitizeMagazineHtml(WP_AUDIO), "de");
  assert.match(html, /<audio controls(?:="")? preload="none">/);
  assert.match(
    html,
    /<source src="https:\/\/dich-mit-stich\.de\/cms-mag\/wp-content\/uploads\/2026\/05\/polynesische-tribal-tattoo-audio-zusammenfassung\.mp3" type="audio\/mpeg" \/>/,
  );
  assert.doesNotMatch(html, /autoplay|onplay/);
});

test("audio sources must be https and typed as audio", () => {
  const html = sanitizeMagazineHtml('<audio><source src="javascript:alert(1)" type="text/html"></audio>');
  assert.doesNotMatch(html, /javascript:|text\/html/);
});
