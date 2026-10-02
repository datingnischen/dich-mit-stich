import sanitizeHtml from "sanitize-html";

import { MAGAZINE_AUDIO_ATTRIBUTES, MAGAZINE_AUDIO_TAGS, magazineAudioTransforms } from "./magazine-audio.ts";
import { normalizeLegacyUrls, SITE_ORIGIN } from "./magazine-urls.ts";

/**
 * Magazin-Inhalte (Beiträge, Seiten, Kategorien, Autoren) kommen aus Dateien im Repo, nicht mehr aus WordPress:
 * content/magazin/beitraege, content/magazin/seiten, data/magazin-kategorien.json, data/magazin-autoren.json.
 * Das Laden steht in lib/magazine-content.ts, die Abfrage-API in lib/magazine.ts; hier liegen nur Typen und
 * Textwerkzeuge ohne Dateizugriff (dürfen auch in Client-Bundles landen).
 */

export type MagazineCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
};

export type MagazineEntry = {
  id: number;
  slug: string;
  type: "post" | "page";
  date?: string;
  modified?: string;
  title: string;
  /** SEO-Titel (AIOSEO, ohne "| Tattoo-Magazin"), nur im Detailabruf. */
  seoTitle?: string;
  /** SEO-Description (AIOSEO), nur im Detailabruf. */
  seoDescription?: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  authorName?: string;
  authorSlug?: string;
  categories: MagazineCategory[];
};

export type MagazineRouteEntry = Pick<MagazineEntry, "id" | "slug" | "type" | "date" | "modified">;

function decodeNamedEntities(text: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    hellip: "…",
    auml: "ä",
    ouml: "ö",
    uuml: "ü",
    Auml: "Ä",
    Ouml: "Ö",
    Uuml: "Ü",
    szlig: "ß",
    eacute: "é",
    agrave: "à",
    ecirc: "ê",
    copy: "©",
    reg: "®",
    trade: "™",
  };

  return text.replace(/&([a-zA-Z]+);/g, (_, name: string) => entities[name] ?? `&${name};`);
}

export function decodeHtmlEntities(text = "") {
  return decodeNamedEntities(text)
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([\da-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

// Magazinbeiträge beginnen teils mit einer Audio-Zusammenfassung. Der Audio-Block (Überschrift, Hinweis, Player) und
// der daraus entstandene Auszug-Text müssen vor dem Bau von Teasern entfernt werden.
const AUDIO_SUMMARY_BLOCK = /<!--\s*audio-summary:start\s*-->[\s\S]*?<!--\s*audio-summary:end\s*-->/gi;
const EMBEDDED_MEDIA_BLOCK = /<(script|style|audio|video)\b[^>]*>[\s\S]*?<\/\1>/gi;
const AUDIO_SUMMARY_TEXT = /Artikel kurz anhören\s*Die wichtigsten Punkte kurz und verständlich zusammengefasst\.?/gi;
const AUDIO_FALLBACK_TEXT = /Dein Browser unterstützt das Audio-Element nicht\.?/gi;

export function stripHtml(text = "") {
  return decodeHtmlEntities(text.replace(AUDIO_SUMMARY_BLOCK, " ").replace(EMBEDDED_MEDIA_BLOCK, " "))
    .replace(/<[^>]+>/g, " ")
    .replace(AUDIO_SUMMARY_TEXT, " ")
    .replace(AUDIO_FALLBACK_TEXT, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Ohne Audio-Block kann der Auszug zu kurz für einen Teaser sein: Listen tragen keinen Volltext,
// dann bleibt der Teaser leer, statt einen Stummel zu zeigen.
const MIN_TEASER_LENGTH = 90;

export function teaserText(entry: { excerpt?: string; content?: string }, maxLength: number) {
  const excerpt = stripHtml(entry.excerpt);
  const source = excerpt.length >= MIN_TEASER_LENGTH ? excerpt : stripHtml(entry.content) || excerpt;
  return source.length >= MIN_TEASER_LENGTH ? source.slice(0, maxLength) : "";
}

const DUPLICATED_SCHEME_FIRST_PARTY_PREFIX = "https://https://dich-mit-stich.de/";

function hardenMagazineLink(attributes: Record<string, string>) {
  const hardened = { ...attributes };
  const rawHref = attributes.href?.trim();
  const target = attributes.target === "_blank" ? "_blank" : undefined;

  if (rawHref) {
    try {
      const normalizedHref = rawHref.startsWith(DUPLICATED_SCHEME_FIRST_PARTY_PREFIX)
        ? `${SITE_ORIGIN}/${rawHref.slice(DUPLICATED_SCHEME_FIRST_PARTY_PREFIX.length)}`
        : rawHref;
      const parsed = new URL(normalizedHref, SITE_ORIGIN);
      const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
      const isAbsoluteHttpInput = /^(?:https?:)?\/\//i.test(normalizedHref) || /^https?:/i.test(normalizedHref);
      if (isHttp && isAbsoluteHttpInput) hardened.href = parsed.href;

      if (isHttp && parsed.origin !== SITE_ORIGIN) {
        hardened.rel = "noopener noreferrer nofollow";
      } else if (target) {
        hardened.rel = "noopener noreferrer";
      }
    } catch {
      delete hardened.href;
    }
  }

  if (target) hardened.target = target;
  else delete hardened.target;
  return hardened;
}

function normalizeSrcset(value = "") {
  return value
    .split(",")
    .map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [normalizeLegacyUrls(url), ...descriptor].join(" ");
    })
    .join(", ");
}

// NextGEN rendert seinen Galerie-Shortcode nur im WordPress-Theme; die REST-API ließ die Markierung stehen,
// teils direkt vor dem nächsten Wort ("ngg_shortcode_0_placeholderEin Mandala …").
const NEXTGEN_GALLERY_PLACEHOLDER = /\bngg_shortcode_\d+_placeholder/g;

/** Bereinigt Magazin-HTML (Import und Redaktion): erlaubte Tags, gehärtete Links, Bilder mit Upload-Pfad im Repo. */
export function sanitizeMagazineHtml(html = "") {
  return sanitizeHtml(html.replace(NEXTGEN_GALLERY_PLACEHOLDER, ""), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", ...MAGAZINE_AUDIO_TAGS],
    selfClosing: [...sanitizeHtml.defaults.selfClosing, "source"],
    allowedAttributes: {
      ...MAGAZINE_AUDIO_ATTRIBUTES,
      a: ["href", "name", "target", "title", "rel"],
      blockquote: ["cite"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading", "decoding"],
      li: ["value"],
      ol: ["start"],
      td: ["colspan", "rowspan", "headers"],
      th: ["colspan", "rowspan", "headers", "scope"],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      ...magazineAudioTransforms,
      a: (tagName, attributes) => ({
        tagName,
        attribs: hardenMagazineLink(attributes),
      }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: {
          ...attributes,
          ...(attributes.src ? { src: normalizeLegacyUrls(attributes.src) } : {}),
          ...(attributes.srcset ? { srcset: normalizeSrcset(attributes.srcset) } : {}),
          loading: attributes.loading || "lazy",
          decoding: attributes.decoding || "async",
        },
      }),
    },
  });
}

export function formatGermanDate(dateString?: string) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString.slice(0, 10);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatGermanDateLong(dateString?: string) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString.slice(0, 10);

  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Sichtbares Datum: nur Artikel (Posts) zeigen eins, und zwar das Änderungsdatum.
// Feste Seiten (type "page") bleiben ohne Datum. JSON-LD ist davon unberührt.
export function visibleEntryDate(entry: Pick<MagazineEntry, "type" | "date" | "modified">) {
  if (entry.type !== "post") return undefined;
  return entry.modified || entry.date || undefined;
}
