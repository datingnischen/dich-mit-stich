const STYLE_PATTERNS = [
  ["black-and-grey", /black\s*(?:and|&)\s*grey|black\s*[- ]?and\s*[- ]?grey/i],
  ["blackwork", /blackwork/i],
  ["cover-up", /cover[ -]?ups?/i],
  ["fineline", /fine\s*line/i],
  ["linework", /linework/i],
  ["neo-traditional", /neo[ -]?traditional/i],
  ["ornamental", /ornamental/i],
  ["realistic", /realistic|realismus/i],
  ["traditional", /(?<!neo[ -])traditional/i],
  ["anime", /anime/i],
  ["maori", /maori/i],
  ["mandala", /mandala/i],
];

function normalizeMarket(market) {
  const country = String(market || "").toUpperCase();
  if (!["DE", "AT", "CH"].includes(country)) throw new Error(`Unsupported tattoo studio market ${market}`);
  return country;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function assertHttpsUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(String(value || ""));
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error(`${label} must be a valid HTTPS URL`);
  }
}

function clauseAround(text, index, length) {
  const delimiters = /[,.!;:\n]/g;
  let start = 0;
  let end = text.length;
  for (const match of text.matchAll(delimiters)) {
    if (match.index < index) start = match.index + 1;
    else if (match.index >= index + length) {
      end = match.index;
      break;
    }
  }
  return text.slice(start, end);
}

export function inferTattooStyles(value) {
  const text = String(value || "");
  return STYLE_PATTERNS
    .filter(([, pattern]) => {
      const matches = [...text.matchAll(new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`))];
      if (!matches.length) return false;
      const negated = matches.some((match) => {
        const clause = clauseAround(text, match.index, match[0].length);
        return /\b(?:nicht|nie)\s+(?:angeboten|verfügbar)|\bkein(?:e|en|er|es)?\b/i.test(clause);
      });
      return !negated;
    })
    .map(([slug]) => slug)
    .sort();
}

export function buildTattooStudioRecord(studio, guide) {
  const country = normalizeMarket(studio.country || guide.country);
  if (!studio.identity || !studio.slug || !studio.name || !studio.cityName || !studio.sourceUrl) {
    throw new Error(`Incomplete tattoo studio source ${studio.identity || studio.name || "unknown"}`);
  }
  if (studio.cityIdentity !== guide.identity) {
    throw new Error(`Tattoo studio ${studio.identity} does not belong to ${guide.identity}`);
  }
  assertHttpsUrl(studio.websiteUrl, `Tattoo studio website for ${studio.identity}`);
  assertHttpsUrl(studio.sourceUrl, `Tattoo studio source for ${studio.identity}`);
  assertHttpsUrl(guide.sourceUrl, `Tattoo studio guide source for ${guide.identity}`);

  return {
    ...studio,
    country,
    market: country.toLowerCase(),
    wpSlug: `${country.toLowerCase()}-${studio.citySlug}-${studio.slug}`,
    title: studio.name,
    contentHtml: `<p>${escapeHtml(studio.description)}</p>`,
    acf: {
      studio_id: studio.identity,
      studio_name: studio.name,
      studio_country: country,
      studio_region: "Niedersachsen",
      studio_city_id: guide.identity,
      studio_city_slug: studio.citySlug,
      studio_city: studio.cityName,
      studio_address: studio.address,
      website_url: studio.websiteUrl,
      contact_summary: studio.contact,
      editorial_summary: studio.description,
      tattoo_styles: inferTattooStyles(studio.description),
      source_url: studio.sourceUrl,
      last_verified: guide.lastVerified,
      verification_status: "editorial",
      paid_placement: false,
      claimed_by_studio: false,
      schema_type: "TattooParlor",
    },
  };
}

export function buildTattooStudioCityRecord(guide) {
  const country = normalizeMarket(guide.country);
  if (!guide.identity || !guide.citySlug || !guide.cityName || !guide.editorialHtml || !guide.sourceUrl) {
    throw new Error(`Incomplete tattoo studio city guide ${guide.identity || guide.citySlug || "unknown"}`);
  }
  assertHttpsUrl(guide.sourceUrl, `Tattoo studio guide source for ${guide.identity}`);
  return {
    ...guide,
    country,
    market: country.toLowerCase(),
    wpSlug: `${country.toLowerCase()}-${guide.citySlug}`,
    contentHtml: [guide.editorialHtml, guide.selectionMethodHtml].filter(Boolean).join("\n"),
    acf: {
      guide_city_id: guide.identity,
      guide_city_name: guide.cityName,
      guide_city_slug: guide.citySlug,
      guide_country: country,
      guide_region: country === "DE" && guide.citySlug === "hannover" ? "Niedersachsen" : "",
      source_url: guide.sourceUrl,
      last_verified: guide.lastVerified,
      selection_method: guide.selectionMethodHtml,
      schema_type: "ItemList",
    },
  };
}

export function buildTattooStudioWpPayload(record, { status = "draft" } = {}) {
  return {
    title: record.title,
    slug: record.wpSlug,
    status,
    content: record.contentHtml,
    excerpt: record.acf.editorial_summary || "",
    acf: { ...record.acf },
  };
}

export function planTattooStudioUpserts(records, existingPosts) {
  const identities = new Set();
  for (const record of records) {
    if (identities.has(record.identity)) throw new Error(`Duplicate tattoo studio identity ${record.identity}`);
    identities.add(record.identity);
  }

  return records.map((record) => {
    const candidates = existingPosts.filter((post) =>
      post?.acf?.studio_id === record.identity || post?.slug === record.wpSlug,
    );
    const unique = [...new Map(candidates.map((post) => [Number(post.id), post])).values()];
    if (unique.length > 1) throw new Error(`Multiple existing tattoo studios for ${record.identity}`);
    const existing = unique[0] || null;
    return {
      action: existing ? "update" : "create",
      postId: existing?.id ?? null,
      existing,
      record,
    };
  });
}
