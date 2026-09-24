import { conversionUrl } from "@/lib/conversion-links";
import { type MarketCode, publicUrl } from "@/lib/markets";

// Hinweis unter den Stadtlisten: Wer seine Stadt nicht findet, landet in der individuellen Suche von ICONY.
// Immer absolut auf die Live-Domain, die Suche gibt es auf Vercel nicht.
export function CitySearchFallback({ market }: { market: MarketCode }) {
  return (
    <aside className="panel-card city-search-fallback" aria-labelledby={`city-search-fallback-${market}`}>
      <div>
        <span className="eyebrow">Individuelle Suche</span>
        <h2 id={`city-search-fallback-${market}`}>Deine Stadt fehlt? Tinte gibt&apos;s überall.</h2>
        <p>
          Nicht jede Stadt hat eine eigene Seite – tätowierte und gepiercte Singles gibt es trotzdem auch bei dir. In der
          individuellen Suche legst du Ort, Umkreis und Alter selbst fest und siehst, wer in deiner Nähe Tinte trägt.
        </p>
      </div>
      <a className="button button-primary" href={conversionUrl(publicUrl(market), "/suche/", "location")}>
        Zur individuellen Suche
      </a>
    </aside>
  );
}
