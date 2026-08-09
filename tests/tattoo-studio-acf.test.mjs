import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function json(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("WordPress guide plugin registers REST-enabled studio and city-guide CPTs", async () => {
  const plugin = await readFile(new URL("wordpress/tattoo-studio-guide/dms-tattoo-studio-guide.php", root), "utf8");
  assert.match(plugin, /register_post_type\(\s*'tattoo_studio'/);
  assert.match(plugin, /register_post_type\(\s*'tattoo_studio_city'/);
  assert.match(plugin, /'show_in_rest'\s*=>\s*true/);
  assert.match(plugin, /'rest_base'\s*=>\s*'tattoo-studios'/);
  assert.match(plugin, /'rest_base'\s*=>\s*'tattoo-studio-cities'/);
  assert.match(plugin, /acf\/settings\/load_json/);
});

test("ACF field groups expose the required structured guide contract", async () => {
  const studio = await json("wordpress/tattoo-studio-guide/acf-json/group_dms_tattoo_studio.json");
  const city = await json("wordpress/tattoo-studio-guide/acf-json/group_dms_tattoo_studio_city.json");
  const studioNames = new Set(studio.fields.map((field) => field.name));
  const cityNames = new Set(city.fields.map((field) => field.name));

  for (const name of [
    "studio_id", "studio_name", "studio_country", "studio_region", "studio_city_id",
    "studio_city_slug", "studio_city", "studio_address", "website_url", "contact_summary",
    "editorial_summary", "tattoo_styles", "source_url", "last_verified",
    "verification_status", "paid_placement", "claimed_by_studio", "schema_type",
  ]) assert.ok(studioNames.has(name), `missing studio field ${name}`);

  for (const name of [
    "guide_city_id", "guide_city_name", "guide_city_slug", "guide_country", "guide_region",
    "source_url", "last_verified", "selection_method", "schema_type",
  ]) assert.ok(cityNames.has(name), `missing city field ${name}`);

  assert.deepEqual(studio.location[0][0], {
    param: "post_type",
    operator: "==",
    value: "tattoo_studio",
  });
  assert.deepEqual(city.location[0][0], {
    param: "post_type",
    operator: "==",
    value: "tattoo_studio_city",
  });
});

test("Hannover pilot manifest contains one guide and ten unique structured studios", async () => {
  const manifest = await json("data/tattoo-studio-guide-hannover.json");
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.guide.identity, "DE:hannover");
  assert.equal(manifest.studios.length, 10);
  assert.equal(new Set(manifest.studios.map((studio) => studio.identity)).size, 10);
  assert.ok(manifest.studios.every((studio) => studio.acf.studio_city_id === "DE:hannover"));
  assert.ok(manifest.studios.every((studio) => studio.acf.last_verified === "2026-06-07"));
});
