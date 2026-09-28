import assert from "node:assert/strict";
import test from "node:test";

const { applyCityCorrections } = await import("../lib/city-corrections.ts");

const city = (slug, overrides = {}) => ({
  market: "de",
  slug,
  title: "Alt",
  h1: "Alt",
  metaDescription: "Lead",
  heroTitle: "Lead",
  contentHtml: "<p>Text</p>",
  ...overrides,
});

test("corrected city headings replace title and H1 together", () => {
  const hamburg = applyCityCorrections(city("hamburg", { title: "Tattoo-Singles in Hamburg: Deine City-Guide für Alternative" }));
  assert.equal(hamburg.title, "Tattoo-Singles in Hamburg: die alternative Szene entdecken");
  assert.equal(hamburg.h1, hamburg.title);
  for (const slug of ["dresden", "duesseldorf", "leipzig", "nuernberg"]) {
    const corrected = applyCityCorrections(city(slug));
    assert.equal(corrected.h1, corrected.title, slug);
    assert.ok(corrected.title.length <= 60, slug);
  }
});

test("Nürnberg no longer calls itself the capital of Lower Saxony", () => {
  const lead = "Entdecke kreative Studios, alternative Hotspots und Events in der Landeshauptstadt Niedersachsens.";
  const nuernberg = applyCityCorrections(city("nuernberg", { metaDescription: lead, heroTitle: lead, contentHtml: `<p>${lead}</p>` }));
  for (const field of ["metaDescription", "heroTitle", "contentHtml"]) {
    assert.doesNotMatch(nuernberg[field], /Niedersachsen/, field);
    assert.match(nuernberg[field], /in der Frankenmetropole/, field);
  }
});

test("cities without a correction and other markets stay untouched", () => {
  const berlin = city("berlin");
  assert.equal(applyCityCorrections(berlin), berlin);
  const atHamburg = { ...city("hamburg"), market: "at" };
  assert.equal(applyCityCorrections(atHamburg), atHamburg);
});
