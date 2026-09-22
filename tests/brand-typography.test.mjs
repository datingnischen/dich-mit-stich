import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const FONT_FACE_PATTERN = /@font-face\s*\{[^}]*\}/g;
const URL_PATTERN = /url\(\s*["']?([^"')]+)["']?\s*\)/g;

async function loadGlobalStyles() {
  return readFile(new URL("../app/globals.css", import.meta.url), "utf8");
}

test("brand webfonts are served by the app instead of the legacy ICONY host", async () => {
  const css = await loadGlobalStyles();
  const externalSources = [];

  for (const block of css.match(FONT_FACE_PATTERN) ?? []) {
    for (const [, url] of block.matchAll(URL_PATTERN)) {
      if (/^https?:\/\//i.test(url)) {
        externalSources.push(url);
      }
    }
  }

  assert.deepEqual(
    externalSources,
    [],
    `@font-face must not load fonts from another origin, because the Content-Security-Policy only allows the app's own asset origin. Found: ${externalSources.join(", ")}`,
  );
});

function bodyFontStack(css) {
  for (const [, selectors, block] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const targetsBody = selectors.split(",").some((selector) => selector.trim() === "body");
    if (!targetsBody) {
      continue;
    }

    const declaration = block.match(/font-family:\s*([^;]+);/);
    if (declaration) {
      return declaration[1].trim();
    }
  }
  return null;
}

test("the body font stack uses the self-hosted Open Sans variable", async () => {
  const css = await loadGlobalStyles();
  const stack = bodyFontStack(css);

  assert.ok(stack, "app/globals.css must declare a font-family for the body element");
  assert.match(
    stack,
    /^var\(--font-open-sans\)/,
    "the body font stack must start from the next/font variable so the self-hosted Open Sans is applied",
  );
});

test("the root layout exposes the Open Sans variable on the document element", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.match(layout, /Open_Sans/, "app/layout.tsx must load Open Sans through next/font/google");
  assert.match(layout, /variable:\s*"--font-open-sans"/, "Open Sans must be exposed as --font-open-sans");
  assert.match(
    layout,
    /<html[^>]*className={`[^`]*\$\{openSans\.variable\}/,
    "the Open Sans variable must be applied to the html element",
  );
});
