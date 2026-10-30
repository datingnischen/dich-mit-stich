import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Vorlage: agent-skills/templates/icony-ga4. LAYOUT und HOSTS je App anpassen.
const LAYOUT = "../app/layout.tsx";
const HOSTS = ["dich-mit-stich.de", "dich-mit-stich.at", "dich-mit-stich.ch"];

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8").catch(() => "");
}

test("ICONY-GA4 lädt nur mit ICONY-Consent und ohne eigenen Banner", async () => {
  const component = await source("../components/icony-ga4.tsx");
  assert.match(component, /localStorage\.getItem\("ccp_state"\)/);
  assert.match(component, /acceptedAll === true/);
  assert.match(component, /ICONY_CCP_GOOGLE_ANALYTICS = 1/);
  assert.match(component, /if \(!id \|\| !hasIconyAnalyticsConsent\(readConsent\(\)\)\) return;/);
  assert.match(component, /send_page_view: false/);
  assert.doesNotMatch(component, /<Script/);
});

test("ICONY-GA4 kennt die Domains dieser App und ist im Layout eingebunden", async () => {
  const component = await source("../components/icony-ga4.tsx");
  for (const host of HOSTS) assert.match(component, new RegExp(`"${host.replace(/\./g, "\\.")}": "G-[A-Z0-9]+"`));
  const layout = await source(LAYOUT);
  assert.match(layout, /<IconyGa4 \/>/);
});

test("CSP erlaubt ICONY-GA4 (gtag.js, Messpings, Pixel)", async () => {
  const { default: createNextConfig } = await import(new URL("../next.config.ts", import.meta.url).href);
  const rules = await createNextConfig("phase-production-build").headers();
  const csp = rules.flatMap((rule) => rule.headers).find((header) => header.key.toLowerCase() === "content-security-policy")?.value;
  assert.ok(csp);
  const directives = new Map(csp.split(";").map((directive) => {
    const [name, ...values] = directive.trim().split(/\s+/);
    return [name, values];
  }));
  const required = {
    "script-src": ["https://www.googletagmanager.com"],
    "connect-src": ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com"],
    "img-src": ["https://*.google-analytics.com", "https://*.googletagmanager.com"],
  };
  for (const [name, sources] of Object.entries(required)) {
    for (const value of sources) assert.ok(directives.get(name)?.includes(value), `${name} muss ${value} erlauben`);
  }
});
