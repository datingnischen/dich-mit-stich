const CITY_REGIONS = {
  DE: {
    berlin: "Berlin",
    bochum: "Nordrhein-Westfalen",
    bremen: "Bremen",
    dortmund: "Nordrhein-Westfalen",
    dresden: "Sachsen",
    duesseldorf: "Nordrhein-Westfalen",
    essen: "Nordrhein-Westfalen",
    "frankfurt-am-main": "Hessen",
    hamburg: "Hamburg",
    hannover: "Niedersachsen",
    koeln: "Nordrhein-Westfalen",
    leipzig: "Sachsen",
    mannheim: "Baden-Württemberg",
    muenchen: "Bayern",
    nuernberg: "Bayern",
    stuttgart: "Baden-Württemberg",
  },
  CH: {
    zuerich: "Zürich",
    winterthur: "Zürich",
    "st-gallen": "St. Gallen",
    luzern: "Luzern",
    lugano: "Tessin",
    lausanne: "Waadt",
    genf: "Genf",
    "biel-bienne": "Bern",
    bern: "Bern",
    basel: "Basel-Stadt",
  },
  AT: {
    wien: "Wien",
    linz: "Oberösterreich",
    dornbirn: "Vorarlberg",
    graz: "Steiermark",
    salzburg: "Salzburg",
    klagenfurt: "Kärnten",
    villach: "Kärnten",
    wels: "Oberösterreich",
    "sankt-poelten": "Niederösterreich",
    "wiener-neustadt": "Niederösterreich",
  },
};

function decodeHtml(value) {
  const named = {
    amp: "&",
    apos: "'",
    copy: "©",
    gt: ">",
    hellip: "…",
    laquo: "«",
    lt: "<",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    raquo: "»",
    reg: "®",
    shy: "",
    szlig: "ß",
    uml: "¨",
    auml: "ä",
    Auml: "Ä",
    eacute: "é",
    Eacute: "É",
    ouml: "ö",
    Ouml: "Ö",
    uuml: "ü",
    Uuml: "Ü",
  };

  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (entity, name) => named[name] ?? entity);
}

function firstParagraphText(html) {
  const paragraph = String(html || "").match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "";
  return decodeHtml(paragraph.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeMarket(market) {
  const country = String(market || "").toUpperCase();
  if (!(country in CITY_REGIONS)) {
    throw new Error(`Unsupported city market ${market}`);
  }
  return country;
}

export function normalizeCityIdentity(value) {
  const [market, ...slugParts] = String(value || "").split(":");
  const slug = slugParts.join(":");
  if (!market || !slug) throw new Error(`Invalid city identity ${value}`);
  return `${market.toUpperCase()}:${slug.toLowerCase()}`;
}

export function buildCityRecord(input) {
  const country = normalizeMarket(input.market);
  const slug = String(input.slug || "").trim().toLowerCase();
  const cityName = String(input.cityName || "").trim();
  if (!slug || !cityName || !input.contentHtml || !input.sourceUrl) {
    throw new Error(`Incomplete city source for ${country}:${slug || "unknown"}`);
  }

  const identity = `${country}:${slug}`;
  const sourceRows = [
    {
      title: `Öffentliche Stadtseite ${cityName}`,
      url: input.sourceUrl,
      publisher: "Dich mit Stich",
      date: "",
      note: "Redaktionelle Ausgangsseite der CMS-Migration.",
    },
  ];
  if (input.imageAttribution?.sourceUrl) {
    sourceRows.push({
      title: input.imageAttribution.label || `Bildquelle ${cityName}`,
      url: input.imageAttribution.sourceUrl,
      publisher: input.imageAttribution.publisher || "",
      date: "",
      note: input.imageAttribution.creator
        ? `Quelle des Stadtbildes; Urheber: ${input.imageAttribution.creator}.`
        : "Quelle des Stadtbildes.",
    });
  }
  if (input.imageAttribution?.license && input.imageAttribution?.licenseUrl) {
    sourceRows.push({
      title: input.imageAttribution.license,
      url: input.imageAttribution.licenseUrl,
      publisher: input.imageAttribution.publisher || "",
      date: "",
      note: "Lizenz für das zugeordnete Stadtbild.",
    });
  }

  const intro = firstParagraphText(input.contentHtml) || input.metaDescription || "";
  const registrationUrl = input.registrationUrl || (country === "CH"
    ? "https://dich-mit-stich.ch/registration/"
    : "https://dich-mit-stich.de/registration/");

  return {
    ...input,
    market: country.toLowerCase(),
    country,
    identity,
    wpSlug: `${country.toLowerCase()}-${slug}`,
    slug,
    cityName,
    acf: {
      template_variant: "city",
      hero_eyebrow: `Tattoo-Singles · ${cityName}`,
      hero_title: input.h1 || input.title,
      hero_lead: input.metaDescription || "",
      hero_image_position: "center",
      intro_highlight: intro,
      show_toc: true,
      content_density: "comfortable",
      primary_cta_label: "Kostenlos registrieren",
      primary_cta_url: registrationUrl,
      secondary_cta_label: "Alle Tattoo-Singles Städte",
      secondary_cta_url: country === "CH"
        ? "https://dich-mit-stich.ch/tattoo-singles/"
        : "https://dich-mit-stich.de/tattoo-singles/",
      city_id: identity,
      city_name: cityName,
      city_region: CITY_REGIONS[country][slug] || "",
      city_country: country,
      city_hero_claim: input.heroTitle || input.metaDescription || "",
      city_dating_angle: intro,
      good_for: ["neue_kontakte", "lockeres_flirten", "partnersuche"],
      sources_intro: "Grundlage sind die bisherige redaktionelle Stadtseite und die ausgewiesene Bildquelle.",
      sources_display_mode: "visible",
      sources: sourceRows,
      schema_type: "auto",
      enable_faq_schema: false,
    },
  };
}

export function buildWpPayload(record, { status = "publish", mediaId = null } = {}) {
  const payload = {
    title: record.title || record.h1,
    slug: record.wpSlug,
    status,
    content: record.contentHtml,
    excerpt: record.metaDescription || "",
    acf: { ...record.acf },
  };

  if (mediaId) {
    payload.featured_media = mediaId;
    payload.acf.hero_image = mediaId;
  }

  return payload;
}

export function planUpserts(records, existingPosts) {
  const identities = new Set();
  for (const record of records) {
    if (identities.has(record.identity)) {
      throw new Error(`Duplicate city identity ${record.identity}`);
    }
    identities.add(record.identity);
  }

  return records.map((record) => {
    const candidates = existingPosts.filter((post) =>
      post?.acf?.city_id === record.identity || post?.slug === record.wpSlug,
    );
    const uniqueCandidates = [...new Map(candidates.map((post) => [Number(post.id), post])).values()];
    if (uniqueCandidates.length > 1) {
      throw new Error(`Multiple existing posts for ${record.identity}`);
    }
    const existing = uniqueCandidates[0];
    return {
      action: existing ? "update" : "create",
      postId: existing?.id ?? null,
      existing: existing || null,
      record,
    };
  });
}
