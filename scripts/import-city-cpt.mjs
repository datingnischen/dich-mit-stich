#!/usr/bin/env node
import { readFile } from "node:fs/promises";

import { normalizeCityIdentity } from "./city-cpt-import-lib.mjs";
import { resolveCityMedia } from "./city-cpt-import-media.mjs";
import { loadCityManifest } from "./city-cpt-import-sources.mjs";
import { runCityImport } from "./city-cpt-import-wordpress.mjs";

const WP_BASE_URL = "https://dich-mit-stich.de/magazin/wp-json/wp/v2";
const args = new Set(process.argv.slice(2));
const valueArg = (prefix) => process.argv.slice(2).find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1);
const apply = args.has("--apply");
const status = valueArg("--status") || "publish";
const only = valueArg("--only") || "";
const credentialsFile = valueArg("--credentials-file");

if (!['publish', 'draft'].includes(status)) throw new Error(`Unsupported status ${status}`);
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
  throw new Error("Refusing city import while NODE_TLS_REJECT_UNAUTHORIZED disables trusted TLS");
}

let auth = {
  username: process.env.DMS_WP_USERNAME || "",
  password: process.env.DMS_WP_APPLICATION_PASSWORD || "",
};
if (credentialsFile) {
  const credentials = JSON.parse(await readFile(credentialsFile, "utf8"));
  auth = { username: credentials.username, password: credentials.password };
}
if (!auth.username || !auth.password) throw new Error("Missing WordPress application credentials");

let records = await loadCityManifest({ rootDir: process.cwd() });
if (only) records = records.filter((record) => record.identity === normalizeCityIdentity(only));
if (!records.length) throw new Error(`No city matched ${only || "the source inventory"}`);

const summary = await runCityImport({
  records,
  baseUrl: WP_BASE_URL,
  auth,
  apply,
  status,
  mediaResolver: resolveCityMedia,
});
console.log(JSON.stringify(summary, null, 2));
