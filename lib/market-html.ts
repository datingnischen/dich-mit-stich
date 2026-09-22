import sanitizeHtml from "sanitize-html";

import { MAGAZINE_APPENDIX_CLASS_TOKENS, normalizeMagazineAppendix } from "./magazine-appendix.ts";
import { MAGAZINE_MEDIA_CLASS_TOKENS, normalizeMagazineMedia } from "./magazine-media.ts";
import type { MarketCode } from "./markets.ts";

const FIRST_PARTY_HOST = /^(?:www\.)?dich-mit-stich\.(?:de|at|ch)$/i;
const ABSOLUTE_HTTPS_URL = /^https:\/\/([^/?#]*)([^?#]*)/i;
const MARKET_PATH = /^\/(?:de|at|ch)(?:\/|$)/i;
const UNSAFE_INTERNAL_URL = /[\\\s\u0000-\u001f\u007f]|%25|%(?:0[0-9a-f]|1[0-9a-f]|2f|5c|7f)/i;
const MALFORMED_PERCENT_ESCAPE = /%(?![0-9a-f]{2})/i;

function isSafeInternalPath(pathname: string) {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || MARKET_PATH.test(pathname)) return false;
  return !pathname
    .split("/")
    .map((segment) => segment.replace(/%2e/gi, "."))
    .some((segment) => segment === "." || segment === "..");
}

export function localizeFirstPartyText(text: string, marketOrigin: string) {
  const hostname = new URL(marketOrigin).hostname;
  return text.replace(/dich-mit-stich\.(?:de|at|ch)/gi, (match) =>
    match[0] === match[0].toUpperCase() ? `Dich-mit-Stich.${hostname.split(".").at(-1)}` : hostname,
  );
}

export function firstPartyInternalPath(href: string) {
  if (UNSAFE_INTERNAL_URL.test(href) || MALFORMED_PERCENT_ESCAPE.test(href)) return null;

  const rawPath = href.split(/[?#]/, 1)[0];
  if (href.startsWith("/")) return isSafeInternalPath(rawPath) ? href : null;

  const absoluteMatch = href.match(ABSOLUTE_HTTPS_URL);
  if (!absoluteMatch || !FIRST_PARTY_HOST.test(absoluteMatch[1])) return null;
  const absolutePath = absoluteMatch[2] || "/";
  if (!isSafeInternalPath(absolutePath)) return null;

  try {
    const target = new URL(href);
    if (
      target.protocol !== "https:" ||
      !FIRST_PARTY_HOST.test(target.hostname) ||
      target.username ||
      target.password ||
      target.port
    ) return null;

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

const EXTERNAL_REL_TOKENS = new Set(["nofollow", "noopener", "noreferrer"]);

const OWN_CLASS_TOKENS = new Set([...MAGAZINE_MEDIA_CLASS_TOKENS, ...MAGAZINE_APPENDIX_CLASS_TOKENS]);

/** WordPress ships its own class soup; only the classes this app emits itself survive. */
function keepOwnClasses(attributes: sanitizeHtml.Attributes) {
  const tokens = (attributes.class || "").split(/\s+/).filter((token) => OWN_CLASS_TOKENS.has(token));
  const attribs = { ...attributes };
  if (tokens.length > 0) attribs.class = tokens.join(" ");
  else delete attribs.class;
  return attribs;
}

export function marketizeSanitizedHtml(html: string, market: MarketCode) {
  return sanitizeHtml(normalizeMagazineAppendix(normalizeMagazineMedia(html)), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      a: ["href", "name", "target", "title", "rel", "class", "data-dms-internal"],
      aside: ["class"],
      blockquote: ["cite"],
      figure: ["class"],
      img: ["src", "srcset", "alt", "title", "width", "height", "loading", "decoding"],
      li: ["value"],
      p: ["class"],
      ol: ["start"],
      td: ["colspan", "rowspan", "headers"],
      th: ["colspan", "rowspan", "headers", "scope"],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      aside: (tagName, attributes) => ({ tagName, attribs: keepOwnClasses(attributes) }),
      figure: (tagName, attributes) => ({ tagName, attribs: keepOwnClasses(attributes) }),
      p: (tagName, attributes) => ({ tagName, attribs: keepOwnClasses(attributes) }),
      a: (tagName, attributes) => {
        const cleanAttributes = keepOwnClasses(attributes);
        delete cleanAttributes["data-dms-internal"];
        const internalPath = firstPartyInternalPath(cleanAttributes.href || "");
        if (!internalPath) return { tagName, attribs: cleanAttributes };

        const attribs: Record<string, string> = {
          ...cleanAttributes,
          href: `/${market}${internalPath === "/" ? "" : internalPath}`,
          "data-dms-internal": "true",
        };
        delete attribs.target;

        const relTokens = (attribs.rel || "").toLowerCase().split(/\s+/).filter(Boolean);
        if (relTokens.length > 0 && relTokens.every((token) => EXTERNAL_REL_TOKENS.has(token))) {
          delete attribs.rel;
        }

        return { tagName, attribs };
      },
    },
  });
}
