import test from "node:test";
import assert from "node:assert/strict";
import { getAnswerEnginePilotEntries } from "../lib/magazine-answer-engine.ts";
import { latestIsoDate, serializeJsonLd } from "../lib/json-ld.ts";

test("answer-engine pilot is bounded and source-backed without unsupported cover-up citations", () => {
  const entries = [...getAnswerEnginePilotEntries()];
  const ids = entries.map((entry) => entry.cmsId);
  const slugs = entries.map((entry) => entry.slug);

  assert.equal(entries.length, 9);
  assert.equal(new Set(ids).size, entries.length);
  assert.equal(new Set(slugs).size, entries.length);
  assert.deepEqual(entries.map((entry) => entry.priority), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.ok(entries.some((entry) => entry.cmsId === 879 && entry.slug === "wie-gefaehrlich-tattoo"));
  assert.ok(!slugs.includes("cover-up-tattoos"));
  assert.equal(entries.filter((entry) => entry.cluster === "tattoo").length, 4);
  assert.equal(entries.filter((entry) => entry.cluster === "piercing").length, 5);

  for (const entry of entries) {
    assert.ok(entry.why.length >= 30, `${entry.slug} needs a durable pilot rationale`);
    assert.ok(entry.directAnswer.length >= 120, `${entry.slug} needs a substantive direct answer`);
    assert.ok(entry.keyFacts.length >= 3, `${entry.slug} needs at least three key facts`);
    assert.match(entry.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(entry.sources.length >= 1, `${entry.slug} needs at least one primary source`);
    for (const source of entry.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(source.name.length >= 12);
    }
  }
});

test("JSON-LD serializer escapes HTML script boundaries", () => {
  const separators = String.fromCodePoint(0x2028, 0x2029);
  const serialized = serializeJsonLd({ headline: "</script><script>alert('&')</script>", separator: separators });

  assert.ok(!serialized.includes(String.fromCodePoint(0x2028)));
  assert.ok(!serialized.includes(String.fromCodePoint(0x2029)));
  assert.doesNotMatch(serialized, /[<>&]/u);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.deepEqual(JSON.parse(serialized), {
    headline: "</script><script>alert('&')</script>",
    separator: separators,
  });
});

test("latestIsoDate keeps the newest valid CMS or editorial modification", () => {
  assert.equal(latestIsoDate("2026-08-14", "2026-09-01T12:00:00"), "2026-09-01T12:00:00");
  assert.equal(latestIsoDate("2026-09-01T12:00:00", "2026-08-14"), "2026-09-01T12:00:00");
  assert.equal(latestIsoDate(undefined, "invalid", "2026-08-14"), "2026-08-14");
});
