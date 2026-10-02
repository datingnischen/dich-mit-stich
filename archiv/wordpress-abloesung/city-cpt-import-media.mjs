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
  if (/\.jpe?g$/i.test(filename)) return "image/jpeg";
  if (/\.png$/i.test(filename)) return "image/png";
  if (/\.webp$/i.test(filename)) return "image/webp";
  throw new Error(`Unsupported image extension: ${filename}`);
}

function validateImage(image, filename) {
  if (!Buffer.isBuffer(image)) throw new Error(`Image reader returned non-buffer data for ${filename}`);
  if (image.length > 10 * 1024 * 1024) throw new Error(`Image exceeds 10 MiB limit: ${filename}`);
  const valid = /\.jpe?g$/i.test(filename)
    ? image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
    : /\.png$/i.test(filename)
      ? image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : /\.webp$/i.test(filename)
        ? image.subarray(0, 4).toString("ascii") === "RIFF" && image.subarray(8, 12).toString("ascii") === "WEBP"
        : false;
  if (!valid) throw new Error(`Invalid ${mimeType(filename).split("/")[1].toUpperCase()} image data: ${filename}`);
}

function rawField(value) {
  return value && typeof value === "object" && "raw" in value ? value.raw : value;
}

function expectedMetadata(record) {
  return {
    title: `${record.cityName} · Dich mit Stich Tattoo-Singles`,
    alt_text: String(record.imageAlt || record.h1 || record.title || "").trim(),
    caption: record.imageAttribution?.label || "",
    description: record.imageAttribution?.sourceUrl
      ? `Bildquelle: ${record.imageAttribution.sourceUrl}`
      : "",
  };
}

function mediaMismatches(record, media, mediaId, slug, filename) {
  const metadata = expectedMetadata(record);
  const verifiedName = path.basename(new URL(media.source_url || "", "https://local.invalid").pathname);
  const checks = {
    id: Number(media.id) === mediaId,
    slug: media.slug === slug,
    source_url: verifiedName.toLowerCase() === filename.toLowerCase(),
    title: rawField(media.title) === metadata.title,
    alt_text: media.alt_text === metadata.alt_text,
    caption: rawField(media.caption) === metadata.caption,
    description: rawField(media.description) === metadata.description,
  };
  return Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
}

async function updateAndVerifyMetadata(record, client, mediaId, slug, filename) {
  const metadata = expectedMetadata(record);
  await client.json(`media/${mediaId}`, { method: "POST", body: metadata });
  const verified = await client.json(
    `media/${mediaId}?context=edit&_fields=id,slug,source_url,title,alt_text,caption,description`,
  );
  const failed = mediaMismatches(record, verified, mediaId, slug, filename);
  if (failed.length) {
    throw new Error(`Media read-back verification failed for ${record.identity}: ${failed.join(", ")}`);
  }
  return mediaId;
}

export async function resolveCityMedia(record, client, { readFileImpl = readFile } = {}) {
  const { slug, filename } = fileParts(record);
  const found = await client.json(
    `media?context=edit&slug=${encodeURIComponent(slug)}&per_page=10&_fields=id,slug,source_url,title,alt_text,caption,description`,
  );
  if (found.length > 1) throw new Error(`Multiple media matches for ${record.identity}`);
  if (found.length) {
    const foundName = path.basename(new URL(found[0].source_url, "https://local.invalid").pathname);
    if (found[0].slug !== slug || foundName.toLowerCase() !== filename.toLowerCase()) {
      throw new Error(`Media slug collision for ${record.identity}`);
    }
    const mediaId = Number(found[0].id);
    if (!mediaMismatches(record, found[0], mediaId, slug, filename).length) return mediaId;
    return updateAndVerifyMetadata(record, client, mediaId, slug, filename);
  }
  if (!record.imagePath) throw new Error(`No local image available for ${record.identity}`);

  const image = await readFileImpl(record.imagePath);
  validateImage(image, filename);
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

  return updateAndVerifyMetadata(record, client, mediaId, slug, filename);
}
