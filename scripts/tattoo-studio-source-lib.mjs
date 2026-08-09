const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  szlig: "ß",
  auml: "ä",
  Auml: "Ä",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (entity, name) => HTML_ENTITIES[name] ?? entity);
}

function textContent(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function slugify(value) {
  return textContent(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function headingBlock(source, level, heading) {
  const pattern = new RegExp(
    `<h${level}[^>]*>\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</h${level}>([\\s\\S]*?)(?=<h${level}\\b|$)`,
    "i",
  );
  return source.match(pattern)?.[1] || "";
}

function labeledList(block) {
  const fields = {};
  for (const match of block.matchAll(/<li[^>]*>\s*<strong[^>]*>(.*?)<\/strong>([\s\S]*?)<\/li>/gi)) {
    const label = textContent(match[1]).replace(/:$/, "").toLowerCase();
    fields[label] = textContent(match[2]).replace(/^:\s*/, "");
  }
  return fields;
}

function normalizeWebsite(value) {
  const candidate = String(value || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return candidate ? `https://${candidate}` : "";
}

function extractSection(source, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(<h2[^>]*>\\s*${escaped}\\s*</h2>[\\s\\S]*?)(?=<h2\\b|$)`, "i"));
  return match?.[1]?.trim() || "";
}

export function extractTattooStudioCityGuide(sourceHtml, { market, citySlug, sourceUrl }) {
  const country = String(market || "").toUpperCase();
  if (!["DE", "AT", "CH"].includes(country)) throw new Error(`Unsupported studio market ${market}`);
  if (!citySlug || !sourceUrl) throw new Error("Studio city source identity is incomplete");

  const article = sourceHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || sourceHtml;
  const h1 = textContent(article.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const cityName = h1.match(/Tattoo-Studios in (.+?)\s+[–-]/i)?.[1]?.trim();
  if (!cityName) throw new Error(`Could not resolve studio city name for ${country}:${citySlug}`);

  const studioArea = headingBlock(article, 2, `Tattoo-Studios in ${cityName}`);
  const studioMatches = [...studioArea.matchAll(/<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)];
  const studios = studioMatches.map((match) => {
    const name = textContent(match[1]);
    const block = match[2];
    const fields = labeledList(block);
    const websiteUrl = normalizeWebsite(fields.website || fields.webseite);
    const studioSlug = slugify(`${name}-${cityName}`);
    return {
      identity: `${country}:${citySlug}:${studioSlug}`,
      cityIdentity: `${country}:${citySlug}`,
      market: country.toLowerCase(),
      country,
      citySlug,
      cityName,
      slug: studioSlug,
      name,
      description: textContent(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || ""),
      websiteUrl,
      address: fields.adresse || "",
      contact: fields.kontakt || "",
      sourceUrl: websiteUrl || sourceUrl,
    };
  });

  const verifiedMatch = article.match(/zuletzt am\s+(\d{4}-\d{2}-\d{2})\s+geprüft/i);
  return {
    identity: `${country}:${citySlug}`,
    market: country.toLowerCase(),
    country,
    citySlug,
    cityName,
    title: h1,
    sourceUrl,
    editorialHtml: [
      extractSection(article, "Einleitung"),
      extractSection(article, `Tattoo-Szene in ${cityName}`),
      extractSection(article, `Beliebte Tattoo-Stile in ${cityName}`),
    ].filter(Boolean).join("\n"),
    selectionMethodHtml: extractSection(article, "Datenstand, Auswahl und Hinweise"),
    lastVerified: verifiedMatch?.[1] || "",
    studios,
  };
}
