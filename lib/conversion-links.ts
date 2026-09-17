export type ConversionAid = "location" | "magazin";

export function conversionPathname(pathname: string, aid?: ConversionAid) {
  if (aid === "magazin" && (pathname === "/" || pathname === "/registration/")) {
    return "/suche/";
  }
  return pathname;
}

export function conversionUrl(origin: string, pathname: string, aid?: ConversionAid) {
  const url = new URL(origin);
  const convertedPath = conversionPathname(pathname, aid);
  url.pathname = convertedPath === "/" || convertedPath === "/suche/"
    ? convertedPath
    : `/${convertedPath.replace(/^\/+|\/+$/g, "")}`;
  url.search = "";
  if (aid) url.searchParams.set("AID", aid);
  return url.toString();
}
