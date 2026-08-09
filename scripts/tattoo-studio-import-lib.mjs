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

const DE_REGION_BY_CITY = {
  berlin: "Berlin",
  hannover: "Niedersachsen",
};

const LEGACY_STUDIO_MATCHES = {
  "DE:hannover:prime-ink-tattoo-hannover": {
    identities: ["DE:hannover:prime-ink-tattoo-hannover-hannover"],
    wpSlugs: ["de-hannover-prime-ink-tattoo-hannover-hannover"],
  },
};

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

export function inferTattooStyles(value) {
  const text = String(value || "");
  const mentions = STYLE_PATTERNS.flatMap(([slug, pattern]) =>
    [...text.matchAll(new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`))]
      .map((match) => ({ slug, index: match.index, end: match.index + match[0].length })),
  ).sort((left, right) => left.index - right.index || left.end - right.end);

  const predicateNegation = /\b(?:nicht|nie)\s+(?:angeboten|verfügbar)|\b(?:not|never)\s+(?:offered|available)\b/i;
  const leadingNegation = /\b(?:kein(?:e|en|er|es)?|no)\s*$/i;
  const sentenceEnd = /[.!?;:\n]/;
  const isListConnector = (connector) => {
    if (/[.!?;:\n]/.test(connector)) return false;
    const hasConjunction = /\b(?:und|and|oder|or|sowie)\b/i.test(connector);
    const hasListPunctuation = /[,&/]/.test(connector);
    if (!hasConjunction && !hasListPunctuation) return false;
    return connector
      .replace(/\b(?:und|and|oder|or|sowie)\b/gi, "")
      .replace(/[\s,&/–—-]/g, "") === "";
  };
  const directlyNegated = mentions.map((mention, index) => {
    const previous = mentions[index - 1];
    const next = mentions[index + 1];
    const before = text.slice(previous?.end ?? 0, mention.index);
    const boundedAfter = text.slice(mention.end, next?.index ?? text.length);
    const punctuation = boundedAfter.search(sentenceEnd);
    const after = punctuation === -1 ? boundedAfter : boundedAfter.slice(0, punctuation);
    return leadingNegation.test(before) || predicateNegation.test(after);
  });

  for (let index = 1; index < mentions.length; index += 1) {
    const between = text.slice(mentions[index - 1].end, mentions[index].index);
    if (isListConnector(between) && directlyNegated[index - 1]) directlyNegated[index] = true;
  }
  for (let index = mentions.length - 2; index >= 0; index -= 1) {
    const between = text.slice(mentions[index].end, mentions[index + 1].index);
    if (isListConnector(between) && directlyNegated[index + 1]) directlyNegated[index] = true;
  }

  return [...new Set(mentions
    .filter((_, index) => !directlyNegated[index])
    .map((mention) => mention.slug))]
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
  if (studio.websiteUrl) assertHttpsUrl(studio.websiteUrl, `Tattoo studio website for ${studio.identity}`);
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
      studio_region: country === "DE" ? DE_REGION_BY_CITY[studio.citySlug] || "" : "",
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
      guide_region: country === "DE" ? DE_REGION_BY_CITY[guide.citySlug] || "" : "",
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
    const legacy = LEGACY_STUDIO_MATCHES[record.identity] || { identities: [], wpSlugs: [] };
    const matchingIdentities = new Set([record.identity, ...legacy.identities]);
    const matchingSlugs = new Set([record.wpSlug, ...legacy.wpSlugs]);
    const candidates = existingPosts.filter((post) =>
      matchingIdentities.has(post?.acf?.studio_id) || matchingSlugs.has(post?.slug),
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
