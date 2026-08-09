#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { runTattooStudioImport } from "./tattoo-studio-import-wordpress.mjs";

const args = new Set(process.argv.slice(2));
const valueArg = (prefix) => process.argv.slice(2).find((arg) => arg.startsWith(`${prefix}=`))?.slice(prefix.length + 1);
const apply = args.has("--apply");
const status = valueArg("--status") || "draft";
const baseUrl = valueArg("--base-url") || "https://dich-mit-stich.de/wp-json/wp/v2";
const credentialsFile = valueArg("--credentials-file");
const manifestPath = resolve(process.cwd(), valueArg("--manifest") || "data/tattoo-studio-guide-hannover.json");

if (!["draft", "publish"].includes(status)) throw new Error(`Unsupported tattoo studio status ${status}`);
if (!baseUrl.startsWith("https://")) throw new Error("Tattoo studio WordPress base URL must use HTTPS");
if (new URL(baseUrl).hostname !== "dich-mit-stich.de") throw new Error("Refusing an unexpected tattoo studio WordPress host");
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
  throw new Error("Refusing tattoo studio import while trusted TLS is disabled");
}

let auth = {
  username: process.env.DMS_STUDIO_WP_USERNAME || "",
  password: process.env.DMS_STUDIO_WP_APPLICATION_PASSWORD || "",
};
if (credentialsFile) {
  const credentials = JSON.parse(await readFile(credentialsFile, "utf8"));
  auth = { username: credentials.username || "", password: credentials.password || "" };
}
if (!auth.username || !auth.password) throw new Error("Missing tattoo studio WordPress application credentials");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.schemaVersion !== 1 || !manifest.guide || !Array.isArray(manifest.studios)) {
  throw new Error("Unsupported tattoo studio pilot manifest");
}

const summary = await runTattooStudioImport({
  guideRecords: [manifest.guide],
  studioRecords: manifest.studios,
  baseUrl,
  auth,
  apply,
  status,
});
console.log(JSON.stringify(summary, null, 2));
