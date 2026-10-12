import assert from "node:assert/strict";
import test from "node:test";

import { blobPathnameFromUrl, isAllowedBlobUrl, validateEntryInput } from "../lib/contest/validation.ts";
import { clientIp, isPublicId, newPublicId, tokensMatch } from "../lib/contest/identity.ts";

const valid = {
  displayName: "  Mara  ",
  age: "29",
  city: "Leipzig",
  caption: "Mein Ärmel erzählt die Geschichte meiner Reisen.",
  email: "Mara@Example.com",
  photoUrl: "https://abc123.public.blob.vercel-storage.com/contest/foto-xyz.jpg",
  consentTerms: true,
  consentImage: "on",
};

test("accepts a complete entry and normalizes whitespace, age and e-mail", () => {
  const result = validateEntryInput(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.displayName, "Mara");
  assert.equal(result.value.age, 29);
  assert.equal(result.value.email, "mara@example.com");
  assert.equal(result.value.city, "Leipzig");
});

test("rejects minors, links, missing consent and foreign photo hosts with German messages", () => {
  for (const [patch, pattern] of [
    [{ age: "17" }, /ab 18/],
    [{ displayName: "M" }, /Namen/],
    [{ caption: "Schau auf www.example.com" }, /Links/],
    [{ caption: "kurz" }, /mindestens 10/],
    [{ email: "keine-mail" }, /E-Mail/],
    [{ photoUrl: "https://evil.example.com/contest/x.jpg" }, /Foto/],
    [{ photoUrl: "https://abc.public.blob.vercel-storage.com/other/x.jpg" }, /Foto/],
    [{ consentTerms: false }, /Teilnahmebedingungen/],
    [{ consentImage: undefined }, /Foto zu sehen/],
    [{ city: "x".repeat(61) }, /Ort/],
  ]) {
    const result = validateEntryInput({ ...valid, ...patch });
    assert.equal(result.ok, false, JSON.stringify(patch));
    assert.match(result.error, pattern);
  }
});

test("blob URLs must be https, on a Vercel Blob host and inside the contest folder", () => {
  assert.equal(isAllowedBlobUrl("https://abc.public.blob.vercel-storage.com/contest/a.jpg"), true);
  assert.equal(isAllowedBlobUrl("http://abc.public.blob.vercel-storage.com/contest/a.jpg"), false);
  assert.equal(isAllowedBlobUrl("https://public.blob.vercel-storage.com/contest/a.jpg"), false);
  assert.equal(isAllowedBlobUrl("https://abc.public.blob.vercel-storage.com/contest/a.jpg?download=1"), false);
  assert.equal(isAllowedBlobUrl("https://abc.public.blob.vercel-storage.com.evil.example/contest/a.jpg"), false);
  assert.equal(blobPathnameFromUrl("https://abc.public.blob.vercel-storage.com/contest/foto%20x.jpg"), "contest/foto x.jpg");
});

test("public ids are 8 unambiguous characters; tokens compare safely; client IP comes from x-forwarded-for", () => {
  const id = newPublicId(() => 0.5);
  assert.equal(id.length, 8);
  assert.equal(isPublicId(id), true);
  assert.equal(isPublicId("abcdefg1"), false, "digit 1 is excluded");
  assert.equal(isPublicId("ABCDEFGH"), false);

  assert.equal(tokensMatch("secret", "secret"), true);
  assert.equal(tokensMatch("secret", "Secret"), false);
  assert.equal(tokensMatch("", "secret"), false);
  assert.equal(tokensMatch("secret", undefined), false);

  assert.equal(clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" })), "203.0.113.5");
  assert.equal(clientIp(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
  assert.equal(clientIp(new Headers()), "unknown");
});
