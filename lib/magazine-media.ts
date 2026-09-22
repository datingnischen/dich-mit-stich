const WORDPRESS_EMOJI_IMAGE = /<img\b[^>]*\bsrc=["']https:\/\/s\.w\.org\/images\/core\/emoji\/[^"']*["'][^>]*>/gi;
const POINTING_HAND = /[\u{1F446}-\u{1F449}]\u{FE0F}?/gu;
const PINTEREST_URL = /^https?:\/\/(?:[a-z0-9-]+\.)*(?:pinterest\.[a-z]{2,}(?:\.[a-z]{2,})?|pin\.it)(?:[/?#]|$)/i;

const CONTENT_BLOCK = /<figure\b[^>]*>[\s\S]*?<\/figure>|<p\b[^>]*>(?:(?!<\/?p\b)[\s\S])*<\/p>/gi;
const IMAGE_TAG = /<img\b[^>]*>/gi;
const ANCHOR_TAG = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const HREF_ATTRIBUTE = /\bhref=["']([^"']*)["']/i;
const FIGCAPTION = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const BLOCK_WRAPPER = /<\/?(?:p|figcaption|figure)\b[^>]*>/gi;
const EDGE_BREAKS = /^(?:\s|&nbsp;|<br\s*\/?>)+|(?:\s|&nbsp;|<br\s*\/?>)+$/gi;

const FOLLOW_TEXT = /^folge\s+uns\b/i;
const TRIVIAL_TEXT = /^[\s.,;:!?–—-]*$/;

export const PINTEREST_MOTIF_LABEL = "Dieses Motiv auf Pinterest ansehen";
export const PINTEREST_FOLLOW_LABEL = "Folge uns auf Pinterest";
export const PINTEREST_FOLLOW_LEAD = "Noch mehr Motive und Inspiration findest du auf unserer Pinterest-Pinnwand.";

export const MAGAZINE_MEDIA_CLASS_TOKENS = new Set([
  "magazine-motif",
  "magazine-pin-link",
  "magazine-pin-follow",
  "pin-cta",
  "pin-cta-follow",
]);

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;|&#0*38;/gi, "&")
    .replace(/&quot;|&#0*34;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'");
}

function encodeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function plainText(html: string) {
  return html
    .replace(HTML_COMMENT, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#0*160;/gi, " ")
    .replace(POINTING_HAND, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pinterestHref(anchorAttributes: string) {
  const href = decodeHtmlAttribute(anchorAttributes.match(HREF_ATTRIBUTE)?.[1] ?? "").trim();
  return PINTEREST_URL.test(href) ? href : null;
}

/** Turns the `<img>` tags the WordPress emoji filter injects back into plain characters. */
export function inlineWordPressEmoji(html: string) {
  return html.replace(WORDPRESS_EMOJI_IMAGE, (tag) => decodeHtmlAttribute(tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? ""));
}

type PinterestLink = { markup: string; href: string; text: string };

type BlockInfo = {
  isFigure: boolean;
  image: string | null;
  /** The block carries an image and nothing but it — a caption may follow in the next block. */
  isImageOnly: boolean;
  caption: string;
  motifHref: string | null;
  followHref: string | null;
  isPinOnly: boolean;
};

function describeBlock(raw: string): BlockInfo {
  const isFigure = /^<figure\b/i.test(raw);
  const image = raw.match(IMAGE_TAG)?.[0] ?? null;

  const links: PinterestLink[] = [];
  for (const match of raw.matchAll(ANCHOR_TAG)) {
    const href = pinterestHref(match[1]);
    if (href) links.push({ markup: match[0], href, text: plainText(match[2]) });
  }

  let withoutPins = raw;
  for (const link of links) withoutPins = withoutPins.replace(link.markup, "");
  const restText = plainText(withoutPins);

  const captionSource = isFigure ? (withoutPins.match(FIGCAPTION)?.[1] ?? withoutPins) : withoutPins;
  const caption = captionSource
    .replace(HTML_COMMENT, "")
    .replace(IMAGE_TAG, "")
    .replace(BLOCK_WRAPPER, "")
    .replace(/&nbsp;|&#0*160;/gi, " ")
    .replace(POINTING_HAND, "")
    .replace(EDGE_BREAKS, "")
    .trim();

  const pin = links[0] ?? null;
  const isFollow = Boolean(pin) && FOLLOW_TEXT.test(restText);
  const isPinOnly = Boolean(pin) && (TRIVIAL_TEXT.test(restText) || isFollow);
  const textWithoutCaption = isFigure ? plainText(withoutPins.replace(FIGCAPTION, "")) : restText;

  return {
    isFigure,
    image,
    isImageOnly: Boolean(image) && TRIVIAL_TEXT.test(textWithoutCaption),
    caption: plainText(caption) ? caption : "",
    // Inside a <figure> the link belongs to the motif even when the caption wraps around it.
    motifHref: pin && !isFollow && (isFigure || isPinOnly) ? pin.href : null,
    followHref: pin && isFollow ? pin.href : null,
    isPinOnly,
  };
}

function pinterestAnchor(href: string, label: string, extraClass?: string) {
  const className = extraClass ? `pin-cta ${extraClass}` : "pin-cta";
  return `<a class="${className}" href="${encodeHtmlAttribute(href)}" target="_blank" rel="nofollow noopener noreferrer">${label}</a>`;
}

function motifCard(image: string | null, caption: string, motifHref: string | null) {
  const parts = [image ?? "", caption ? `<figcaption>${caption}</figcaption>` : ""];
  if (motifHref) parts.push(pinterestAnchor(motifHref, PINTEREST_MOTIF_LABEL));
  return `<figure class="magazine-motif">${parts.join("")}</figure>`;
}

function pinLinkRow(motifHref: string) {
  return `<p class="magazine-pin-link">${pinterestAnchor(motifHref, PINTEREST_MOTIF_LABEL)}</p>`;
}

function followCard(followHref: string) {
  return `<aside class="magazine-pin-follow"><p>${PINTEREST_FOLLOW_LEAD}</p>${pinterestAnchor(
    followHref,
    PINTEREST_FOLLOW_LABEL,
    "pin-cta-follow",
  )}</aside>`;
}

type Replacement = { start: number; end: number; html: string };

/**
 * Rebuilds the "Beispiel für ein … Tattoo" blocks the magazine ships from WordPress.
 *
 * The editors' markup arrives in several broken shapes — an image paragraph followed by a
 * caption-only `<figure>`, a caption that swallows the Pinterest link, a pointing-hand emoji
 * that WordPress turns into a full-width SVG. All of them collapse into one motif card here.
 */
export function normalizeMagazineMedia(html: string) {
  const content = inlineWordPressEmoji(html);
  const blocks = [...content.matchAll(CONTENT_BLOCK)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    info: describeBlock(match[0]),
  }));
  if (blocks.length === 0) return content;

  const isAdjacent = (endIndex: number, startIndex: number) => content.slice(endIndex, startIndex).trim() === "";

  const replacements: Replacement[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.info.followHref) {
      replacements.push({ start: block.start, end: block.end, html: followCard(block.info.followHref) });
      continue;
    }

    const startsMotif = block.info.isImageOnly || (block.info.isFigure && Boolean(block.info.motifHref));
    if (!startsMotif) {
      // A motif link no image block claimed — at least give it the same call-to-action treatment.
      if (block.info.isPinOnly && block.info.motifHref) {
        replacements.push({ start: block.start, end: block.end, html: pinLinkRow(block.info.motifHref) });
      }
      continue;
    }

    let caption = block.info.isFigure ? block.info.caption : "";
    let motifHref = block.info.motifHref;
    let end = block.end;
    let next = index + 1;

    while (next < blocks.length && isAdjacent(end, blocks[next].start)) {
      const candidate = blocks[next];
      if (candidate.info.image || candidate.info.followHref) break;

      // A caption-only <figure> right after the image paragraph is that image's caption.
      if (candidate.info.isFigure && !caption && (candidate.info.caption || candidate.info.motifHref)) {
        caption = candidate.info.caption;
        motifHref = motifHref ?? candidate.info.motifHref;
        end = candidate.end;
        next += 1;
        if (motifHref) break;
        continue;
      }

      if (!motifHref && candidate.info.isPinOnly && candidate.info.motifHref) {
        motifHref = candidate.info.motifHref;
        end = candidate.end;
        next += 1;
        break;
      }

      const followedByPin =
        next + 1 < blocks.length &&
        isAdjacent(candidate.end, blocks[next + 1].start) &&
        blocks[next + 1].info.isPinOnly &&
        Boolean(blocks[next + 1].info.motifHref);
      if (!caption && candidate.info.caption && !candidate.info.motifHref && followedByPin) {
        caption = candidate.info.caption;
        end = candidate.end;
        next += 1;
        continue;
      }

      break;
    }

    // A self-contained <figure> that needs no repair stays exactly as the editors wrote it.
    if (!motifHref && end === block.end) continue;
    if (!caption && !motifHref) continue;
    replacements.push({ start: block.start, end, html: motifCard(block.info.image, caption, motifHref) });
    index = next - 1;
  }

  if (replacements.length === 0) return content;

  let result = "";
  let cursor = 0;
  for (const replacement of replacements) {
    if (replacement.start < cursor) continue;
    result += content.slice(cursor, replacement.start) + replacement.html;
    cursor = replacement.end;
  }
  return result + content.slice(cursor);
}
