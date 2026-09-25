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

test("AT/CH header menu links Tattoo-Singles and Tattoo-Studios", async () => {
  const shell = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  const discover = shell.match(/const discoverLinks: NavLink\[\] = \[([\s\S]*?)\];/)?.[1] ?? "";

  assert.match(discover, /href: "\/tattoo-singles"/);
  assert.match(discover, /href: "\/tattoo-studios"/);
  assert.match(shell, /config\.contentEnabled \? headerMenuGroups : sectionMenuGroups/);
});

test("AT/CH singles overview links to the studio guide", async () => {
  const page = await readFile(new URL("../app/market-tattoo-singles/[market]/page.tsx", import.meta.url), "utf8");

  assert.match(page, /<StudioGuideCrosslink market="at" \/>/);
  assert.match(page, /<StudioGuideCrosslink market="ch" \/>/);
});
