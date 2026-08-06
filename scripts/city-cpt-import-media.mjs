import { readFile } from "node:fs/promises";
import path from "node:path";

function fileParts(record) {
  const sourceName = record.imageUrl ? path.basename(new URL(record.imageUrl, "https://local.invalid").pathname) : "";
  const localName = record.imagePath ? path.basename(record.imagePath) : "";
  const sourceStem = sourceName.replace(/\.[^.]+$/, "");
  const extension = path.extname(localName || sourceName || ".jpg").toLowerCase() || ".jpg";
  const existingWpImage = /\/wp-content\/uploads\//.test(record.imageUrl || "");
  const slug = existingWpImage ? sourceStem : `dms-city-${record.market}-${record.slug}`;
  return { slug, filename: `${slug}${extension}` };
}

function mimeType(filename) {
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.webp$/i.test(filename)) return "image/webp";
  return "image/jpeg";
}

export async function resolveCityMedia(record, client, { readFileImpl = readFile } = {}) {
  const { slug, filename } = fileParts(record);
  const found = await client.json(
    `media?context=edit&slug=${encodeURIComponent(slug)}&per_page=10&_fields=id,slug,source_url`,
  );
  if (found.length) return Number(found[0].id);
  if (!record.imagePath) throw new Error(`No local image available for ${record.identity}`);

  const image = await readFileImpl(record.imagePath);
  const uploaded = await client.raw("media", {
    method: "POST",
    headers: {
      "Content-Type": mimeType(filename),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: image,
  });
  const mediaId = Number(uploaded.id);
  if (!mediaId) throw new Error(`Media upload returned no ID for ${record.identity}`);

  await client.json(`media/${mediaId}`, {
    method: "POST",
    body: {
      title: `${record.cityName} · Dich mit Stich Tattoo-Singles`,
      alt_text: record.imageAlt || record.h1 || record.title,
      caption: record.imageAttribution?.label || "",
      description: record.imageAttribution?.sourceUrl
        ? `Bildquelle: ${record.imageAttribution.sourceUrl}`
        : "",
    },
  });

  const verified = await client.json(
    `media/${mediaId}?context=edit&_fields=id,slug,source_url`,
  );
  if (Number(verified.id) !== mediaId || verified.slug !== slug || !verified.source_url) {
    throw new Error(`Media read-back verification failed for ${record.identity}`);
  }
  return mediaId;
}
