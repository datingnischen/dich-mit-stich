const FIRST_PARTY_ABSOLUTE_HREF = /\bhref=(["'])https:\/\/(?:www\.)?dich-mit-stich\.(?:de|at|ch)(\/[^"'<>]*)\1/gi;

export function localizeFirstPartyText(text: string, marketOrigin: string) {
  const hostname = new URL(marketOrigin).hostname;
  return text.replace(/dich-mit-stich\.(?:de|at|ch)/gi, (match) =>
    match[0] === match[0].toUpperCase() ? `Dich-mit-Stich.${hostname.split(".").at(-1)}` : hostname,
  );
}

export function localizeFirstPartyHtmlLinks(html: string, marketOrigin: string) {
  const normalizedOrigin = marketOrigin.replace(/\/$/, "");
  const localizedLinks = html.replace(
    FIRST_PARTY_ABSOLUTE_HREF,
    (_match, quote: string, pathname: string) => `href=${quote}${normalizedOrigin}${pathname}${quote}`,
  );
  return localizedLinks
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith("<") ? part : localizeFirstPartyText(part, normalizedOrigin)))
    .join("");
}
