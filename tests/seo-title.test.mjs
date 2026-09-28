import assert from "node:assert/strict";
import test from "node:test";

const { brandedTitle } = await import("../lib/seo-title.ts");

test("titles that already name the brand skip the layout suffix (Seobility: Wortwiederholung)", () => {
  for (const title of [
    "Häufig gestellte Fragen zu Dich mit Stich",
    "Über Dich mit Stich",
    "Bewertungen und Erfahrungen zu Dich mit Stich",
    "Social Media von Dich mit Stich – Österreich",
  ]) {
    assert.deepEqual(brandedTitle(title), { absolute: title }, title);
  }
});

test("titles that would exceed about 60 characters with the suffix skip it", () => {
  for (const title of [
    "Tattoo-Singles in Deutschland – Singles nach Stadt",
    "Tattoo-Studios in Düsseldorf: redaktioneller Guide",
    "Tattoo Models und Schönheiten im Tattoo-Magazin",
    "Tätowierte und gepiercte Singles in Berlin – Dein Guide",
  ]) {
    assert.deepEqual(brandedTitle(title), { absolute: title }, title);
  }
});

test("short titles keep the brand suffix from the layout template", () => {
  assert.equal(brandedTitle("Tattoo-Studio-Guide für Deutschland"), "Tattoo-Studio-Guide für Deutschland");
  assert.equal(brandedTitle("Piercing im Tattoo-Magazin"), "Piercing im Tattoo-Magazin");
});
