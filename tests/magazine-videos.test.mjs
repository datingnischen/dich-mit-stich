import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getMagazineVideo } from "../lib/magazine-videos.ts";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

/** The registry is a plain object literal, so the slugs are readable straight from the source. */
async function readRegistry() {
  const source = await readSource("../lib/magazine-videos.ts");
  const body = source.slice(source.indexOf("const magazineVideos"), source.indexOf("export function getMagazineVideo"));
  return [...body.matchAll(/"([a-z0-9-]+)": \{\s*videoId: "([\w-]+)"/g)].map(([, slug, videoId]) => ({ slug, videoId }));
}

test("every mapped article resolves to a YouTube id of the right shape", async () => {
  const registry = await readRegistry();

  assert.ok(registry.length >= 17, `expected the channel mapping, got ${registry.length} entries`);
  for (const { slug, videoId } of registry) {
    assert.match(videoId, /^[\w-]{11}$/, `${slug} has a malformed video id`);
    assert.equal(getMagazineVideo(slug)?.videoId, videoId);
  }
});

test("no video is pinned to two different articles", async () => {
  const registry = await readRegistry();
  const seen = new Map();

  for (const { slug, videoId } of registry) {
    assert.equal(seen.get(videoId), undefined, `${videoId} is already used by ${seen.get(videoId)}`);
    seen.set(videoId, slug);
  }
});

test("the piercing and tattoo articles that have a video actually carry it", async () => {
  const expected = {
    "rook-piercing": "q_mA5A7F4sE",
    "septum-piercing": "vG8VdAVOWa0",
    "tragus-piercing": "6GXf4hKS5WA",
    "helix-piercing": "8lRrFRJQ2H4",
    "daith-piercing": "nJKK6iryQMM",
    "industrial-piercing": "hCaRdr5atyg",
    "orbital-piercing": "OGkd3VD4Ce0",
    "prinz-albert-piercing": "xvE4QhRWWW8",
    "christina-piercing": "p4-qTtyMegM",
    "conch-piercing": "r4n8QoYg9kk",
    "old-school-tattoos": "KXMrJED2EGU",
    "japanische-tattoos": "P5uKLhT7JHc",
  };

  for (const [slug, videoId] of Object.entries(expected)) {
    assert.equal(getMagazineVideo(slug)?.videoId, videoId, `${slug} lost its video`);
  }
});

test("articles without a matching channel video stay without an embed", () => {
  for (const slug of ["lippenpiercing", "intimpiercing", "tattoo-entfernen", "unser-datingexperte"]) {
    assert.equal(getMagazineVideo(slug), null);
  }
});

test("each entry carries the copy the embed needs", async () => {
  const registry = await readRegistry();

  for (const { slug } of registry) {
    const video = getMagazineVideo(slug);
    assert.ok(video.title.length > 10, `${slug} needs a headline`);
    assert.ok(video.description.length > 30, `${slug} needs a description`);
    assert.ok(video.embedTitle.length > 10, `${slug} needs an iframe title`);
  }
});
