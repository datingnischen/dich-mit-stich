// Schreibt data/magazin-bilder.json: Breite, Höhe und Dateigröße der Titelbilder (JPG, PNG, WebP) der Magazin-Beiträge
// für media_details im WP-kompatiblen REST-Endpunkt. Aufruf nach neuen Titelbildern: node scripts/build-magazine-image-sizes.mjs
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const dir = join(root, "content", "magazin", "beitraege");

function webpSize(buffer) {
  const type = buffer.toString("ascii", 12, 16);
  if (type === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (type === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (type === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  return null;
}

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function imageSize(buffer) {
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return webpSize(buffer);
  if (buffer.readUInt32BE(0) === 0x89504e47) return pngSize(buffer);
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return jpegSize(buffer);
  return null;
}

const result = {};
for (const file of readdirSync(dir).filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
  const { data } = matter(readFileSync(join(dir, file), "utf8"));
  if (!data.image || result[data.image]) continue;
  const path = join(root, "public", decodeURIComponent(String(data.image)));
  if (!existsSync(path)) continue;
  const buffer = readFileSync(path);
  const size = imageSize(buffer);
  if (size) result[data.image] = { ...size, bytes: buffer.length };
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(root, "data", "magazin-bilder.json"), `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`${Object.keys(sorted).length} Bilder`);
