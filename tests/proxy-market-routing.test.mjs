import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server.js";
import { proxy } from "../proxy.ts";

const REENTRY_HEADER = "x-dms-market-rewrite";

test("market proxy permits only its own rewrite re-entry token", () => {
  const first = proxy(new NextRequest("https://dich-mit-stich.vercel.app/at/tattoo-studios"));
  assert.equal(first.headers.get("x-middleware-rewrite"), "https://dich-mit-stich.vercel.app/market-tattoo-studios/at");
  assert.equal(first.headers.get("x-robots-tag"), "noindex, nofollow");

  const token = first.headers.get(`x-middleware-request-${REENTRY_HEADER}`);
  assert.ok(token, "the internal rewrite must carry a private re-entry token");

  const accepted = proxy(new NextRequest("https://dich-mit-stich.vercel.app/market-tattoo-studios/at", {
    headers: { [REENTRY_HEADER]: token },
  }));
  assert.equal(accepted.headers.get("x-middleware-next"), "1");

  const spoofed = proxy(new NextRequest("https://dich-mit-stich.vercel.app/market-tattoo-studios/at", {
    headers: { [REENTRY_HEADER]: "caller-controlled" },
  }));
  assert.equal(spoofed.status, 404);

  const direct = proxy(new NextRequest("https://dich-mit-stich.vercel.app/market-tattoo-studios/at"));
  assert.equal(direct.status, 404);

  const production = proxy(new NextRequest("https://dich-mit-stich.de/magazin"));
  assert.equal(production.headers.get("x-robots-tag"), null);

  const proxiedPreview = proxy(new NextRequest("http://127.0.0.1:3010/tattoo-studios", {
    headers: { host: "dich-mit-stich.vercel.app" },
  }));
  assert.equal(proxiedPreview.headers.get("x-robots-tag"), "noindex, nofollow");

  const dottedPreview = proxy(new NextRequest("https://dich-mit-stich.vercel.app./tattoo-studios"));
  assert.equal(dottedPreview.headers.get("x-robots-tag"), "noindex, nofollow");

  const dottedProxiedPreview = proxy(new NextRequest("http://127.0.0.1:3010/tattoo-studios", {
    headers: { host: "dich-mit-stich.vercel.app.:443" },
  }));
  assert.equal(dottedProxiedPreview.headers.get("x-robots-tag"), "noindex, nofollow");
});
