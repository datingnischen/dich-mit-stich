#!/usr/bin/env node
// Erzeugt Audio-Zusammenfassungen für Magazinbeiträge mit ElevenLabs und hängt sie in WordPress an.
// Aufruf: node --env-file=.env.local scripts/audio-summaries.mjs <texte.json> [--write] [--out=ordner]
//
// texte.json: { "<beitrags-slug>": "Sprechtext (ca. 120–140 Wörter, Du-Form, keine Werbe-/Heilversprechen)" }
// Ohne --write werden nur die MP3s lokal erzeugt (zum Probehören). Mit --write zusätzlich: Upload in die
// Mediathek, dem Beitrag zuordnen und den Audio-Block (<!-- audio-summary -->) an den Anfang setzen.
// Beiträge, die schon einen Audio-Block haben, bleiben unverändert. Vor dem Schreiben wird der Rohtext gesichert.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mDRP1h6KfUD1XAUJxqr0"; // Doreen – Clear and Dynamic
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v4"; // seit 2026-09-28 Standard (Christian)
const API = (route) => `https://dich-mit-stich.de/cms-mag/?rest_route=/wp/v2${route}`;
const UPLOADS = "https://dich-mit-stich.de/cms-mag/wp-content/uploads/";

const args = process.argv.slice(2);
const textsPath = args.find((arg) => !arg.startsWith("--"));
const write = args.includes("--write");
const outDir = args.find((arg) => arg.startsWith("--out="))?.slice(6) || path.join(os.tmpdir(), "dms-audio-summaries");
if (!textsPath || !process.env.ELEVENLABS_API_KEY) {
  console.error("Aufruf: node --env-file=.env.local scripts/audio-summaries.mjs <texte.json> [--write]  (ELEVENLABS_API_KEY nötig)");
  process.exit(1);
}
const texts = JSON.parse(fs.readFileSync(textsPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });
const auth = "Basic " + Buffer.from(`${process.env.DMS_WP_USERNAME}:${process.env.DMS_WP_APPLICATION_PASSWORD}`).toString("base64");

async function wp(route, init = {}) {
  const res = await fetch(API(route), { ...init, headers: { Authorization: auth, ...(init.headers || {}) } });
  const body = await res.json();
  if (!res.ok) throw new Error(`${route}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

function audioBlock(src) {
  return `<!-- audio-summary:start -->\n<h2>Artikel kurz anhören</h2>\n<p>Die wichtigsten Punkte kurz und verständlich zusammengefasst.</p>\n\n<audio controls preload="none">\n  <source src="${src}" type="audio/mpeg">\n  Dein Browser unterstützt das Audio-Element nicht.\n</audio>\n<!-- audio-summary:end -->\n\n`;
}

for (const [slug, text] of Object.entries(texts)) {
  const [post] = await wp(`/posts&slug=${encodeURIComponent(slug)}&context=edit&_fields=id,slug,content`);
  if (!post) { console.log(slug, "– Beitrag nicht gefunden"); continue; }
  if (post.content.raw.includes("audio-summary:start")) { console.log(slug, "– hat schon ein Audio, übersprungen"); continue; }

  const name = `${slug}-audio-zusammenfassung.mp3`;
  const file = path.join(outDir, name);
  const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, language_code: "de" }),
  });
  if (!tts.ok) { console.log(slug, "– ElevenLabs", tts.status, (await tts.text()).slice(0, 200)); continue; }
  fs.writeFileSync(file, Buffer.from(await tts.arrayBuffer()));
  console.log(slug, `– MP3 (${MODEL_ID}):`, file);
  if (!write) continue;

  fs.writeFileSync(path.join(outDir, `${slug}-backup.json`), JSON.stringify({ id: post.id, raw: post.content.raw }));
  const media = await wp("/media", {
    method: "POST",
    headers: { "Content-Type": "audio/mpeg", "Content-Disposition": `attachment; filename="${name}"` },
    body: fs.readFileSync(file),
  });
  await wp(`/media/${media.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post: post.id }) });
  // Bei Audio fehlt media_details.file; die Site-URL von WordPress ist fehlerhaft, darum Pfad aus source_url.
  const src = UPLOADS + new URL(media.source_url).pathname.replace(/^.*\/wp-content\/uploads\//, "");
  const head = await fetch(src, { method: "HEAD" });
  if (!head.ok) throw new Error(`${slug}: MP3 unter ${src} nicht erreichbar (${head.status})`);
  const next = audioBlock(src) + post.content.raw;
  const saved = await wp(`/posts/${post.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: next }) });
  console.log(slug, "– hochgeladen (Media", media.id + "), Beitrag aktualisiert:", saved.content.raw === next);
}
