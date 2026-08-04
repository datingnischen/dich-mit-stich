import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const wordpressSource = await readFile(new URL("../lib/wordpress.ts", import.meta.url), "utf8");

test("paginated WordPress requests stay below the Next.js 2 MB cache limit", () => {
  assert.doesNotMatch(wordpressSource, /per_page:\s*100/);
  assert.match(wordpressSource, /per_page:\s*25/);
});
