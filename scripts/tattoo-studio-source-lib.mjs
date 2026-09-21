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

function studioSlug(name, cityName) {
  const nameSlug = slugify(name);
  const citySlug = slugify(cityName);
  return nameSlug === citySlug || nameSlug.endsWith(`-${citySlug}`)
    ? nameSlug
    : `${nameSlug}-${citySlug}`;
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

function labeledBreakFields(block) {
  const lines = String(block || "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .split("\n")
    .map((line) => textContent(line))
    .filter(Boolean);
  const fields = {};
  for (const line of lines) {
    const match = line.match(/^(Website|Webseite|Adresse(?:n|\s+[12])?|Kontakt(?:\s+Tattoo)?|Hinweis|Telefon(?:\/WhatsApp)?|WhatsApp|E-?Mail):\s*(.*)$/i);
    if (match) fields[match[1].toLowerCase()] = match[2].trim();
  }
  return fields;
}

function labeledProseFields(block) {
  const text = textContent(block).replace(/^\s*[–—-]\s*/, "");
  const identity = text.match(/^(.*?)\.\s*Webseite:\s*(.*?)\.\s*Kontakt:\s*([\s\S]*)$/i);
  if (!identity) return {};
  const remainder = identity[3].replace(/\s*\(\[[^\]]+\]\(https?:\/\/[^)]+\)\)\s*$/i, "").trim();
  const contactBoundary = remainder.match(/^([\s\S]*?\.)\s+(?=[A-ZÄÖÜ])/);
  return {
    adresse: identity[1].trim(),
    webseite: identity[2].trim(),
    kontakt: (contactBoundary?.[1] || remainder).replace(/\.$/, "").trim(),
    hinweis: contactBoundary ? remainder.slice(contactBoundary[0].length).trim() : "",
  };
}

function normalizeWebsite(value) {
  const candidate = String(value || "").trim().replace(/\/$/, "");
  if (!/^(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i.test(candidate)) return "";
  try {
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if (!parsed.hostname.includes(".") || parsed.username || parsed.password) return "";
    parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function addressFromFields(fields) {
  return (fields.adresse || [fields["adresse 1"], fields["adresse 2"], fields.adressen]
    .filter(Boolean)
    .join("; ")).trim();
}

function contactFromFields(fields) {
  return (fields.kontakt || [fields["kontakt tattoo"], fields["telefon/whatsapp"], fields.telefon, fields.whatsapp, fields["e-mail"], fields.email]
    .filter(Boolean)
    .join(", ")).trim();
}

function stripMarkdownSource(value) {
  return String(value || "").replace(/\s*\(\[[^\]]+\]\(https?:\/\/[^)]+\)\)\s*$/i, "").trim();
}

function neutralizeRankingClaims(value) {
  return String(value || "")
    .replace(/Die besten Tattoo-Studios finden/gi, "Ausgewählte Tattoo-Studios entdecken")
    .replace(/Die besten Adressen finden/gi, "Ausgewählte Adressen entdecken")
    .replace(/die besten Tattoo-Studios/gi, "passende Tattoo-Studios");
}

function extractSection(source, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`(<h2[^>]*>\\s*${escaped}\\s*</h2>[\\s\\S]*?)(?=<h2\\b|$)`, "i"));
  return match?.[1]?.trim() || "";
}

function extractEditorialHtml(article, cityName, studioArea, studioMatches) {
  const sections = [...article.matchAll(/(<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?)(?=<h2\b|$)/gi)]
    .filter((match) => {
      const heading = textContent(match[2]);
      return heading !== `Tattoo-Studios in ${cityName}`
        && heading !== "Datenstand, Auswahl und Hinweise"
        && heading !== "Weitere Tattoo-Studio-Übersichten";
    })
    .map((match) => match[1].trim());
  const studioIntro = studioArea.split(/(?=<h3\b|<ul\b|<ol\b)/i)[0].trim();
  const studioAdvice = studioMatches
    .filter((match) => {
      const fields = { ...labeledBreakFields(match[2]), ...labeledList(match[2]) };
      return !normalizeWebsite(fields.website || fields.webseite)
        && !fields.adresse
        && !fields.kontakt
        && !fields.telefon
        && !fields["e-mail"];
    })
    .map((match) => match[0].trim());
  return neutralizeRankingClaims([...sections, studioIntro, ...studioAdvice].filter(Boolean).join("\n"));
}

export function extractTattooStudioCityGuide(sourceHtml, { market, citySlug, sourceUrl }) {
  const country = String(market || "").toUpperCase();
  if (!["DE", "AT", "CH"].includes(country)) throw new Error(`Unsupported studio market ${market}`);
  if (!citySlug || !sourceUrl) throw new Error("Studio city source identity is incomplete");

  const articleMatch = sourceHtml.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) throw new Error(`Tattoo studio source is missing an article boundary for ${country}:${citySlug}`);
  const rawArticle = articleMatch[1];
  const hasEntryContent = /<div\b[^>]*class=["'][^"']*\bentry-content\b[^"']*["'][^>]*>/i.test(rawArticle);
  const entryContentMatch = rawArticle.match(/<div\b[^>]*class=["'][^"']*\bentry-content\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<!--\s*\.entry-content\s*-->/i);
  if (hasEntryContent && !entryContentMatch) {
    throw new Error(`Tattoo studio source has an incomplete entry-content boundary for ${country}:${citySlug}`);
  }
  const article = (entryContentMatch?.[1] || rawArticle).trim();
  if (/<footer\b|<\/footer\s*>|<[^>]+\bclass=["'][^"']*\bentry-footer\b[^"']*["'][^>]*>|<!--\s*\.?(?:entry-)?footer\s*-->/i.test(article)) {
    throw new Error(`Tattoo studio source contains a structural footer inside editorial content for ${country}:${citySlug}`);
  }
  const h1 = textContent(rawArticle.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const cityName = h1.match(/Tattoo-Studios in (.+?)\s*(?:[–—-]|:)/i)?.[1]?.trim();
  if (!cityName) throw new Error(`Could not resolve studio city name for ${country}:${citySlug}`);

  const studioArea = headingBlock(article, 2, `Tattoo-Studios in ${cityName}`);
  const studioMatches = [...studioArea.matchAll(/<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)];
  const headingStudios = studioMatches.map((match) => {
    const name = textContent(match[1]);
    const block = match[2];
    const fields = { ...labeledBreakFields(block), ...labeledList(block) };
    const websiteHref = block.match(/(?:Website|Webseite):[\s\S]*?<a\b[^>]*href=["'](https?:\/\/[^"']+)["']/i)?.[1] || "";
    const websiteUrl = normalizeWebsite(websiteHref || fields.website || fields.webseite);
    const resolvedStudioSlug = studioSlug(name, cityName);
    const description = [...block.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((paragraph) => ({ html: paragraph[1], text: textContent(paragraph[1]) }))
      .find((paragraph) => paragraph.text && !/^(?:website|webseite|adresse|kontakt|hinweis)\s*:/i.test(paragraph.text))?.text || "";
    const address = addressFromFields(fields);
    const contact = contactFromFields(fields);
    return {
      identity: `${country}:${citySlug}:${resolvedStudioSlug}`,
      cityIdentity: `${country}:${citySlug}`,
      market: country.toLowerCase(),
      country,
      citySlug,
      cityName,
      slug: resolvedStudioSlug,
      name,
      description: stripMarkdownSource(description),
      websiteUrl,
      address,
      contact,
      sourceUrl: websiteUrl || sourceUrl,
    };
  }).filter((studio) => studio.websiteUrl || studio.address || studio.contact);
  const listStudios = [...studioArea.matchAll(/<li[^>]*>\s*<strong[^>]*>(.*?)<\/strong>([\s\S]*?)<\/li>/gi)]
    .filter((match) => !/daher\s+nicht\s+in\s+die\s+(?:empfehlungs)?liste\s+aufgenommen/i.test(textContent(match[2])))
    .filter((match) => !/^(?:website|webseite|adresse(?:n|\s+[12])?|kontakt(?:\s+tattoo)?|hinweis|stile?|telefon(?:\/whatsapp)?|whatsapp|e-?mail|öffnungszeiten?)\s*:?$/i.test(textContent(match[1])))
    .map((match) => {
      const name = textContent(match[1]);
      const block = match[2];
      const fields = { ...labeledProseFields(block), ...labeledBreakFields(block) };
      const websiteHref = block.match(/Webseite:[\s\S]*?<a\b[^>]*href=["'](https?:\/\/[^"']+)["']/i)?.[1] || "";
      const websiteUrl = normalizeWebsite(websiteHref || fields.website || fields.webseite);
      const resolvedStudioSlug = studioSlug(name, cityName);
      return {
        identity: `${country}:${citySlug}:${resolvedStudioSlug}`,
        cityIdentity: `${country}:${citySlug}`,
        market: country.toLowerCase(),
        country,
        citySlug,
        cityName,
        slug: resolvedStudioSlug,
        name,
        description: fields.hinweis || "",
        websiteUrl,
        address: fields.adresse || "",
        contact: fields.kontakt || "",
        sourceUrl: websiteUrl || sourceUrl,
      };
    });
  const studios = headingStudios.length ? headingStudios : listStudios;
  const editorialHtml = extractEditorialHtml(article, cityName, studioArea, studioMatches);

  const verifiedMatch = article.match(/zuletzt am\s+(\d{4}-\d{2}-\d{2})\s+geprüft/i);
  return {
    identity: `${country}:${citySlug}`,
    market: country.toLowerCase(),
    country,
    citySlug,
    cityName,
    title: neutralizeRankingClaims(h1),
    sourceUrl,
    editorialHtml,
    selectionMethodHtml: extractSection(article, "Datenstand, Auswahl und Hinweise"),
    lastVerified: verifiedMatch?.[1] || "",
    studios,
  };
}
