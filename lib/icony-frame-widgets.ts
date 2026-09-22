import type { ConversionAid } from "./conversion-links.ts";
import { getIconyProjectKey } from "./icony-city-widgets.ts";
import type { MarketCode } from "./markets.ts";

/** ICONY renders both widgets itself; we only hand it the brand colours and the attribution id. */
const ICONY_FRAME_ENDPOINT = "https://js.icony.com/frame/";

/** Mirrors --brand and --muted in globals.css so the embed does not clash with the page. */
const PRIMARY_COLOUR = "67133c";
const SECONDARY_COLOUR = "4f4e4e";

export type IconyFrameWidget = {
  src: string;
  width: number;
  height: number;
  title: string;
};

function buildFrameSrc(market: MarketCode, aid: ConversionAid, params: Record<string, string>) {
  const url = new URL(ICONY_FRAME_ENDPOINT);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("id", getIconyProjectKey(market));
  url.searchParams.set("pc", PRIMARY_COLOUR);
  url.searchParams.set("aid", aid);
  return url.toString();
}

/** The "Gerade online" activity stream: who just logged in or received a smiley. */
export function buildIconyActivityFrame(market: MarketCode, aid: ConversionAid): IconyFrameWidget {
  return {
    src: buildFrameSrc(market, aid, { w: "250", h: "300", sc: SECONDARY_COLOUR }),
    width: 250,
    height: 300,
    title: "Gerade online: aktuelle Mitglieder-Aktivitäten",
  };
}

/** The short registration form: postcode plus "Ich bin" and "Ich suche". ICONY selects it with t=4. */
export function buildIconyRegistrationFrame(market: MarketCode, aid: ConversionAid): IconyFrameWidget {
  return {
    src: buildFrameSrc(market, aid, { w: "300", h: "300", t: "4" }),
    width: 300,
    height: 300,
    title: "Kostenlos registrieren: Singles in deiner Nähe finden",
  };
}
