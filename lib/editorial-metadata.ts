import type { Metadata } from "next";
import type { MarketCode } from "@/lib/markets";

export function marketEditorialRobots(market: MarketCode, safetyOverride = false): Metadata["robots"] {
  if (safetyOverride) return { index: false, follow: false };
  if (market !== "de") return { index: false, follow: true };
  return undefined;
}
