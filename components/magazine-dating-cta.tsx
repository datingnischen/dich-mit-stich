import { MarketLink } from "@/components/market-link";
import { conversionUrl } from "@/lib/conversion-links";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

const FLIRTRADAR_IMAGE = staticAsset("/brand/flirtradar-umkreissuche.svg");

export function MagazineDatingCta({ market }: { market: MarketCode }) {
  const registrationHref = conversionUrl(publicUrl(market), "/", "magazin");

  return (
    <aside className="content-section magazine-dating-cta" aria-labelledby="magazine-dating-title">
      <div className="magazine-dating-copy">
        <span className="eyebrow eyebrow-brand">Flirtradar & Umkreissuche</span>
        <h2 id="magazine-dating-title">Dein Stil ist kein Zufall. Dein nächster Flirt muss es auch nicht sein.</h2>
        <p>
          Entdecke Tattoo- und Piercing-Singles in deiner Nähe. Mit dem Flirtradar siehst du schnell, wer deinen Stil
          teilt und nur wenige Kilometer entfernt ist.
        </p>
        <ul className="trust-points" aria-label="Vorteile des Flirtradars">
          <li>Passende Singles nach Entfernung entdecken</li>
          <li>Kostenlos starten und den Suchradius selbst bestimmen</li>
        </ul>
        <div className="button-row">
          <a className="button button-primary" href={registrationHref}>
            Flirtradar kostenlos nutzen
          </a>
          <MarketLink className="button button-secondary" targetMarket={market} pathname="/tattoo-singles">
            Tattoo-Singles nach Stadt
          </MarketLink>
        </div>
      </div>

      <div className="magazine-dating-visual">
        <a className="magazine-dating-frame" href={registrationHref}>
          <img
            src={FLIRTRADAR_IMAGE}
            alt="Flirtradar mit Umkreissuche für Tattoo- und Piercing-Singles"
            width={320}
            height={480}
            loading="lazy"
            decoding="async"
          />
        </a>
      </div>
    </aside>
  );
}
