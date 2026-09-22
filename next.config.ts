import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const DEFAULT_ASSET_HOST = "https://dich-mit-stich.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";
function buildContentSecurityPolicy(assetOrigin: string, isDev: boolean) {
  const developmentEval = isDev ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${developmentEval} ${assetOrigin} https://js.icony.com`,
    `style-src 'self' 'unsafe-inline' ${assetOrigin}`,
    "img-src 'self' data: https:",
    `font-src 'self' data: ${assetOrigin}`,
    "connect-src 'self' https://dich-mit-stich.de",
    "media-src 'self' https:",
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://dich-mit-stich.de https://dich-mit-stich.at https://dich-mit-stich.ch",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPathPrefix(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const trimmed = trimTrailingSlash(withLeadingSlash);
  return trimmed || DEFAULT_ASSET_PATH_PREFIX;
}

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const assetHost = trimTrailingSlash(process.env.NEXT_PUBLIC_ASSET_HOST || DEFAULT_ASSET_HOST);
  const assetOrigin = new URL(assetHost).origin;
  const assetPathPrefix = normalizeAssetPathPrefix(
    process.env.NEXT_PUBLIC_ASSET_PATH_PREFIX || DEFAULT_ASSET_PATH_PREFIX,
  );

  return {
    assetPrefix: isDev ? undefined : `${assetHost}${assetPathPrefix}`,
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "dich-mit-stich.de",
          pathname: "/magazin/wp-content/uploads/**",
        },
        {
          protocol: "https",
          hostname: "dich-mit-stich.vercel.app",
          pathname: "/app-assets/**",
        },
      ],
    },
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Content-Security-Policy", value: buildContentSecurityPolicy(assetOrigin, isDev) },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ],
        },
      ];
    },
    async redirects() {
      return [
        {
          source: "/magazin/home",
          destination: "/magazin",
          permanent: true,
        },
        {
          source: "/magazin/tattoo-studios",
          destination: "/tattoo-studios",
          permanent: true,
        },
        {
          source: "/magazin/author/redaktion",
          destination: "/magazin/unser-datingexperte",
          permanent: true,
        },
        {
          source: "/magazin/author/anne-schweitzer",
          destination: "/magazin/anne-schweitzer",
          permanent: true,
        },
        {
          source: "/magazin/expertenteam",
          destination: "/ueber-uns/expertenteam",
          permanent: true,
        },
        {
          source: "/magazin/thema/erfolgsgeschichten",
          destination: "/ueber-uns/erfolgsgeschichten",
          permanent: true,
        },
        {
          source: "/social-media",
          destination: "/ueber-uns/social-media",
          permanent: true,
        },
        {
          source: "/bewertungen-und-erfahrungen",
          destination: "/ueber-uns/bewertungen",
          permanent: true,
        },
        {
          source: "/wir-suchen",
          destination: "/ueber-uns/kooperationen",
          permanent: true,
        },
        {
          source: "/kooperation-mit-tattoo-studios",
          destination: "/ueber-uns/kooperationen",
          permanent: true,
        },
        {
          source: "/kooperation-mit-influencern",
          destination: "/ueber-uns/kooperationen",
          permanent: true,
        },
        {
          source: "/tattoo-studio/blackfisk-tattoo-co-berlin",
          destination: "/tattoo-studios/berlin",
          permanent: true,
        },
        {
          source: "/tattoo-studio/omen-tattoo-berlin",
          destination: "/tattoo-studios/berlin",
          permanent: true,
        },
        {
          source: "/tattoo-studio/pechschwarz-tattoo-berlin",
          destination: "/tattoo-studios/berlin",
          permanent: true,
        },
        {
          source: "/tattoo-studio/prime-ink-tattoo-hannover-hannover",
          destination: "/tattoo-studio/prime-ink-tattoo-hannover",
          permanent: true,
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: `${assetPathPrefix}/:path*`,
          destination: "/:path*",
        },
      ];
    },
  };
}
