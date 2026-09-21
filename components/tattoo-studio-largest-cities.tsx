import Image from "next/image";

import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import type { MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import {
  getLargestTattooStudioCities,
  TATTOO_STUDIO_CITY_POPULATION_SOURCES,
} from "@/lib/tattoo-studio-guide";

const MARKET_COPY: Record<MarketCode, { heading: string; intro: string }> = {
  de: {
    heading: "Die 10 größten Städte Deutschlands",
    intro: "Alle zehn Städte führen jetzt zu einer eigenen Tattoo-Studio-Stadtseite. Verifizierte Einzelprofile zeigen wir nur dort, wo offizielle Studioquellen bereits geprüft sind.",
  },
  at: {
    heading: "Die 10 größten Städte Österreichs",
    intro: "Öffne vorhandene Studio-Guides direkt. Für weitere große Städte führt die Karte zur veröffentlichten Tattoo-Stadtseite, bis ausreichend offizielle Studioquellen für einen eigenen Guide geprüft sind.",
  },
  ch: {
    heading: "Die 10 grössten Städte der Schweiz",
    intro: "Öffne vorhandene Studio-Guides direkt. Für weitere grosse Städte führt die Karte zur veröffentlichten Tattoo-Stadtseite, bis ausreichend offizielle Studioquellen für einen eigenen Guide geprüft sind.",
  },
};

export function TattooStudioLargestCities({ market }: { market: MarketCode }) {
  const cities = getLargestTattooStudioCities(market);
  const source = TATTOO_STUDIO_CITY_POPULATION_SOURCES[market];
  const copy = MARKET_COPY[market];

  return (
    <section className="content-section studio-all-cities-section" aria-labelledby={`largest-studio-cities-${market}`}>
      <div className="section-header studio-guide-section-header">
        <span className="eyebrow">Große Tattoo-Städte</span>
        <h2 id={`largest-studio-cities-${market}`}>{copy.heading}</h2>
        <p>{copy.intro}</p>
      </div>
      <div className="studio-all-city-grid">
        {cities.map((city) => (
          <MarketLink className="studio-all-city-card" targetMarket={market} pathname={city.href} key={city.slug}>
            <span className="studio-all-city-media">
              <Image
                src={market === "de" ? city.imageUrl : staticAsset(city.imageUrl)}
                alt={`Stadtansicht von ${city.label}`}
                width={220}
                height={150}
                sizes="(max-width: 640px) 112px, 150px"
              />
            </span>
            <span className="studio-all-city-copy">
              <LocationPinIcon />
              <span>
                <small>Platz {city.rank}</small>
                <strong>{city.label}</strong>
                <small>{city.hasVerifiedStudios ? "Geprüfte Studios ansehen" : city.hasCityGuide ? "Studio-Stadtseite öffnen" : "Tattoo-Stadtseite öffnen"}</small>
              </span>
            </span>
          </MarketLink>
        ))}
      </div>
      <p className="studio-city-population-source">
        Bevölkerungsstand {source.referenceDate}:{" "}
        <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">{source.label}</a>
      </p>
      <details className="city-preview-sources">
        <summary>Bildquellen der Stadtmotive</summary>
        <ul>
          {cities.map((city) => (
            <li key={city.slug}>
              <strong>{city.label}:</strong>{" "}
              <a href={city.imageAttribution.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                {city.imageAttribution.title}
              </a>{" "}
              von {city.imageAttribution.creator}, {city.imageAttribution.license}
              {city.imageAttribution.modifications ? ` – Bearbeitung: ${city.imageAttribution.modifications}` : null}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
