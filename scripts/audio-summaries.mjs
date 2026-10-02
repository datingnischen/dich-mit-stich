#!/usr/bin/env node
// Erzeugt Audio-Zusammenfassungen für Magazinbeiträge mit ElevenLabs und legt sie im Repo ab (kein WordPress mehr).
// Aufruf: node --env-file=.env.local scripts/audio-summaries.mjs <texte.json> [--write] [--out=ordner] [--reuse]
//
// texte.json: { "<beitrags-slug>": "Sprechtext (ca. 120–140 Wörter, Du-Form, keine Werbe-/Heilversprechen)" }
// Ohne --write werden nur die MP3s lokal erzeugt (zum Probehören). Mit --write zusätzlich: MP3 nach
// public/magazin/wp-content/uploads/<Jahr>/<Monat>/ kopieren und den Audio-Block an den Anfang von
// content/magazin/beitraege/<slug>.md setzen. Beiträge, die schon einen Audio-Block haben, bleiben unverändert.
// --reuse nimmt eine schon erzeugte MP3 aus dem Ausgabeordner, statt erneut Credits zu verbrauchen.
// Danach committen und pushen; Vercel baut die Seite neu (Datei-Pfad der MP3 steht im Beitrag).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mDRP1h6KfUD1XAUJxqr0"; // Doreen – Clear and Dynamic
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v4"; // seit 2026-09-28 Standard (Christian)
const UPLOADS_PATH = "/magazin/wp-content/uploads/";

const args = process.argv.slice(2);
const textsPath = args.find((arg) => !arg.startsWith("--"));
const write = args.includes("--write");
const reuse = args.includes("--reuse");
const outDir = args.find((arg) => arg.startsWith("--out="))?.slice(6) || path.join(os.tmpdir(), "dms-audio-summaries");
if (!textsPath || !process.env.ELEVENLABS_API_KEY) {
  console.error("Aufruf: node --env-file=.env.local scripts/audio-summaries.mjs <texte.json> [--write]  (ELEVENLABS_API_KEY nötig)");
  process.exit(1);
}
const texts = JSON.parse(fs.readFileSync(textsPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

function audioBlock(src) {
  return `<h2>Artikel kurz anhören</h2>\n<p>Die wichtigsten Punkte kurz und verständlich zusammengefasst.</p>\n<p><audio controls preload="none"><source src="${src}" type="audio/mpeg" />Dein Browser unterstützt das Audio-Element nicht.</audio></p>\n`;
}

for (const [slug, text] of Object.entries(texts)) {
  const articleFile = path.join("content", "magazin", "beitraege", `${slug}.md`);
  if (!fs.existsSync(articleFile)) { console.log(slug, "– Beitrag nicht gefunden"); continue; }
  const raw = fs.readFileSync(articleFile, "utf8");
  if (raw.includes("<audio")) { console.log(slug, "– hat schon ein Audio, übersprungen"); continue; }

  const name = `${slug}-audio-zusammenfassung.mp3`;
  const file = path.join(outDir, name);
  if (reuse && fs.existsSync(file)) {
    console.log(slug, "– vorhandene MP3:", file);
  } else {
    const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL_ID, language_code: "de" }),
    });
    if (!tts.ok) { console.log(slug, "– ElevenLabs", tts.status, (await tts.text()).slice(0, 200)); continue; }
    fs.writeFileSync(file, Buffer.from(await tts.arrayBuffer()));
    console.log(slug, `– MP3 (${MODEL_ID}):`, file);
  }
  if (!write) continue;

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const target = path.join("public", ...UPLOADS_PATH.split("/").filter(Boolean), ...folder.split("/"), name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);

  // Körper beginnt nach dem Frontmatter (zweites "---"); Zeilenenden der Datei bleiben erhalten.
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const close = raw.indexOf(`${eol}---${eol}`, 3);
  if (!raw.startsWith("---") || close < 0) throw new Error(`${slug}: kein Frontmatter gefunden`);
  const bodyStart = close + `${eol}---${eol}`.length;
  const block = audioBlock(`${UPLOADS_PATH}${folder}/${name}`).replace(/\n/g, eol);
  fs.writeFileSync(articleFile, raw.slice(0, bodyStart) + block + raw.slice(bodyStart));
  console.log(slug, "– MP3 abgelegt:", target, "– Audio-Block im Beitrag gesetzt");
}
