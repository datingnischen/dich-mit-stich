import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
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
});

test("footer styles provide a cohesive responsive hierarchy without hiding navigation", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /\.site-footer-shell\s*\{[^}]*background:\s*#21191d/s);
  assert.match(css, /\.footer-topic-group\s*\{/);
  assert.match(css, /\.footer-topic-columns\s*\{/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.footer-link-grid[\s\S]*grid-template-columns:\s*1fr/s);
  assert.doesNotMatch(css, /\.footer-column\s*\{[^}]*border-radius:\s*28px/s);
});
