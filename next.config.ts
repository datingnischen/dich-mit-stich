import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const DEFAULT_ASSET_HOST = "https://dich-mit-stich.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";

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
    async redirects() {
      return [
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
