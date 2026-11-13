import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import matter from "gray-matter";
import { loadMarketTeaserSource } from "../lib/wp-market-teasers.ts";

// Zeitstempel erscheinen in JSON-LD, Sitemap und /magazin/wp-json. Sie dürfen nicht nach Automatik aussehen:
// keine runden Uhrzeiten, keine gemeinsamen Sekunden, keine Sammel-Aktualisierungen, höchstens zwei Beiträge je Erscheinungstag.
// Neue Werte: node scripts/zeitstempel.mjs <slug> [JJJJ-MM-TT] [--update]
const root = new URL("../", import.meta.url);
const COLLECTIONS = [{ name: "Magazin", dirs: ["content/magazin/beitraege", "content/magazin/seiten"] }];
// Datumsgebundene Beiträge, die am selben Tag erscheinen dürfen (Begründung je Eintrag).
const FIXED = [];
const isFixed = (slug) => FIXED.some((rule) => (rule instanceof RegExp ? rule.test(slug) : rule === slug));

const read = (dir) => readdirSync(new URL(`${dir}/`, root))
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .map((file) => ({ slug: file.replace(/\.md$/, ""), ...matter(readFileSync(new URL(`${dir}/${file}`, root), "utf8")).data }))
  .filter((entry) => entry.published)
  .map((entry) => ({ ...entry, published: String(entry.published instanceof Date ? entry.published.toISOString().slice(0, 10) : entry.published), updated: String(entry.updated instanceof Date ? entry.updated.toISOString().slice(0, 10) : entry.updated ?? entry.published) }));
const collections = COLLECTIONS.map((collection) => ({ ...collection, entries: collection.dirs.flatMap(read) }));

const berlinOffsetHours = (local) => {
  const year = Number(local.slice(0, 4));
  const lastSunday = (month) => {
    const day = new Date(Date.UTC(year, month + 1, 0));
    day.setUTCDate(day.getUTCDate() - day.getUTCDay());
    return day.toISOString().slice(0, 10);
  };
  return local >= `${lastSunday(2)}T02:00:00` && local < `${lastSunday(9)}T03:00:00` ? 2 : 1;
};
const toGmt = (local) => new Date(Date.parse(`${local}Z`) - berlinOffsetHours(local) * 3_600_000).toISOString().slice(0, 19);
const isRound = (stamp) => /T\d\d:(00|30):00$/.test(stamp) || /T00:00:\d\d$/.test(stamp);
const local = (value) => value.slice(0, 19);
const nowBerlin = (() => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
})();

test("Offsets passen zur Berliner Ortszeit, updated nie vor published, nichts in der Zukunft", () => {
  for (const { entries } of collections) {
    for (const entry of entries) {
      for (const field of ["published", "updated"]) {
        const value = entry[field];
        assert.match(value, /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?)?$/, `${entry.slug} ${field}: Format ${value}`);
        const offset = value.match(/([+-]\d{2}):00$/)?.[1];
        if (offset) assert.equal(Number(offset), berlinOffsetHours(local(value)), `${entry.slug} ${field}: Offset passt nicht zu ${local(value)}`);
        assert.ok(local(value) <= nowBerlin, `${entry.slug} ${field} liegt in der Zukunft`);
      }
      assert.ok(local(entry.updated) >= local(entry.published), `${entry.slug}: updated vor published`);
    }
  }
});

test("Zeitstempel ab 2026 sind nicht rund und nicht doppelt", () => {
  for (const { name, entries } of collections) {
    const seen = new Map();
    for (const entry of entries) {
      for (const field of ["published", "updated"]) {
        const stamp = local(entry[field]);
        if (stamp < "2026" || stamp.length === 10) continue;
        assert.ok(!isRound(stamp), `${name} ${entry.slug} ${field}: runde Uhrzeit ${stamp}`);
        if (field === "updated" && stamp === local(entry.published)) continue;
        assert.ok(!seen.has(stamp), `${name} ${entry.slug} ${field}: gleiche Sekunde wie ${seen.get(stamp)}`);
        seen.set(stamp, entry.slug);
      }
    }
  }
});

test("keine Sammel-Aktualisierung vieler Beiträge am selben Tag", () => {
  for (const { name, entries } of collections) {
    const limit = entries.length < 30 ? 4 : 8;
    const perDay = new Map();
    for (const entry of entries) {
      const day = entry.updated.slice(0, 10);
      if (day > entry.published.slice(0, 10) && day >= "2026") perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    for (const [day, count] of perDay) assert.ok(count <= limit, `${name}: ${count} Beiträge mit updated am ${day}`);
  }
});

test("höchstens zwei Beiträge je Erscheinungstag (Ausnahmen nur datumsgebunden)", () => {
  for (const { name, entries } of collections) {
    const perDay = new Map();
    for (const entry of entries) {
      const day = entry.published.slice(0, 10);
      perDay.set(day, [...(perDay.get(day) ?? []), entry.slug]);
    }
    for (const [day, slugs] of perDay) {
      const fixed = slugs.filter(isFixed).length;
      assert.ok(slugs.length <= Math.max(2, fixed), `${name}: ${slugs.length} Beiträge am ${day}: ${slugs.join(", ")}`);
    }
  }
});

test("AT/CH-Teaser der WP-Schnittstelle: keine runden Zeiten, GMT stimmt, höchstens zwei je Tag", () => {
  for (const market of ["at", "ch"]) {
    const perDay = new Map();
    for (const post of loadMarketTeaserSource(market).posts) {
      for (const [stamp, gmt] of [[post.date, post.dateGmt], [post.modified, post.modifiedGmt]]) {
        assert.ok(!isRound(stamp), `${market} ${post.slug}: runde Uhrzeit ${stamp}`);
        assert.equal(gmt, toGmt(stamp), `${market} ${post.slug}: GMT`);
      }
      const day = post.date.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    for (const [day, count] of perDay) assert.ok(count <= 2, `${market}: ${count} Teaser am ${day}`);
  }
});
