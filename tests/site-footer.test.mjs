import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

function cssBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Missing CSS marker: ${marker}`);
  const openingBrace = source.indexOf("{", markerIndex);
  let depth = 0;

  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`Unclosed CSS block: ${marker}`);
}

test("footer keeps its link diversity inside four intentional topic groups", async () => {
  const shell = await read("components/site-shell.tsx");

  assert.match(shell, /<footer className="site-footer-shell" id="site-footer">/);
  assert.match(shell, /className="footer-surface footer-surface-compact"/);
  assert.match(shell, /className="footer-compact-main"/);
  assert.match(shell, /className="footer-surface"/);
  assert.match(shell, /const footerGroups/);
  assert.match(shell, /className="footer-topic-group"/);
  assert.match(shell, /className="footer-topic-columns"/);

  for (const title of [
    "Tattoo-Motive",
    "Tattoo-Lexikon",
    "Piercings",
    "Über uns & Stories",
    "Tattoo-Studio-Guide",
    "Tattoo-Singles Städte",
    "Mitgliedschaft",
    "Service",
  ]) {
    assert.match(shell, new RegExp(`title: "${title}"`));
  }

  for (const group of ["Tattoo-Wissen", "Szene & Geschichten", "Guides vor Ort", "Mitmachen & Service"]) {
    assert.match(shell, new RegExp(`title: "${group.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}"`));
  }

  for (const link of [
    "Beliebte Tattoo Motive",
    "Übersicht aller Tattoo Themen",
    "Piercingarten",
    "Unser Expertenteam",
    "Studio-Guide Übersicht",
    "Tattoo-Singles Übersicht",
    "Kostenlos registrieren",
    "Datenschutz",
  ]) {
    assert.match(shell, new RegExp(`label: "${link}"`));
  }

  assert.match(shell, /Inspiration für dein Tattoo-Leben und deine Partnersuche/);
  assert.match(shell, /Tattoo-Singles, Stadt-Guides und Szene-Wissen direkt für dich/);
  assert.doesNotMatch(shell, /Magazin \+ Stadtseiten mit klarer Orientierung/);
  assert.doesNotMatch(shell, /Alle wichtigen Magazin-Menüpunkte auch direkt im Footer erreichbar/);
});

test("footer styles provide a cohesive responsive hierarchy without hiding navigation", async () => {
  const css = await read("app/globals.css");
  const mobileFooterCss = cssBlock(css, "@media (max-width: 900px)");

  assert.match(css, /\.site-footer-shell\s*\{[^}]*background:\s*#21191d/s);
  assert.match(css, /\.footer-topic-group\s*\{/);
  assert.match(css, /\.footer-topic-columns\s*\{/);
  assert.match(mobileFooterCss, /\.footer-link-grid[\s\S]*grid-template-columns:\s*1fr/s);
  assert.match(
    mobileFooterCss,
    /\.footer-surface:not\(\.footer-surface-compact\)\s*\{[^}]*padding-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom, 0px\)\);/s,
  );
  assert.doesNotMatch(mobileFooterCss, /\.footer-surface\s*\{[^}]*padding-bottom:/s);
  assert.doesNotMatch(css, /\.footer-column\s*\{[^}]*border-radius:\s*28px/s);
});
