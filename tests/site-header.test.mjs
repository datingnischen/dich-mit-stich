import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("mobile header menu opens inward and remains inside the viewport", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const mobileCss = cssBlock(css, "@media (max-width: 900px)");
  const panelRule = mobileCss.match(/\.header-menu-panel\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.match(panelRule, /right:\s*0/);
  assert.match(panelRule, /left:\s*auto/);
});
