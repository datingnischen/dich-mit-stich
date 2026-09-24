import Image from "next/image";
import { Fragment, type ReactNode } from "react";

import { MarketHtmlContentClient } from "@/components/market-html-content-client";
import { MarketLink } from "@/components/market-link";
import { CITY_GUIDE_THEMES, cityGuideUnit, parseCityGuide, type CityGuideSection, type CityGuideTheme } from "@/lib/city-guide";
import { marketizeSanitizedHtml } from "@/lib/market-html";
import type { MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";
import { getTattooStudioCityGuide, isIndexableTattooStudioCity } from "@/lib/tattoo-studio-guide";

export type CitySceneRelatedCity = { slug: string; label: string; region: string; imageUrl: string | null };

type CitySceneGuideProps = {
  market: MarketCode;
  slug: string;
  cityName: string;
  html: string;
  /** All cities of the market; the guide picks the ones WordPress links as "similar cities". */
  cities: CitySceneRelatedCity[];
};

const ICON_PATHS: Record<CityGuideTheme, ReactNode> = {
  studios: <path d="m14 4 6 6-9.5 9.5a2.1 2.1 0 0 1-3 0l-3-3a2.1 2.1 0 0 1 0-3L14 4Zm-4 6 4 4M3 21l3-3" />,
  cities: <path d="M3 21h18M5 21V8l5-3v16M10 21V11h9v10M13 14h3M13 17h3M7 11h1M7 14h1M7 17h1" />,
  hotspots: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  events: <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm0 4h16M8 3v4M16 3v4m-4 7.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3.9-1.8Z" />,
  nightlife: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5ZM17 3v3m-1.5-1.5h3" />,
  streetart: <path d="M9 3h4v3H9zM8 6h6a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm9-1h1m1 2h1m-2 2h1m-9 4h4" />,
  shopping: <path d="M6 8h12l-1 13H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2" />,
  culture: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.3-.8.2-1.7 1.1-1.7H17a4 4 0 0 0 4-4c0-5-4-10.5-9-10.5Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  history: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 0 2 2h13v-4M9 7h6" />,
  dating: <path d="M12 20s-7.5-4.6-9-9.3C1.9 7.2 4 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4 20 4 22.1 7.2 21 10.7 19.5 15.4 12 20 12 20Z" />,
  scene: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
};

function ThemeIcon({ theme }: { theme: CityGuideTheme }) {
  return (
    <svg
      className="city-scene-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[theme]}
    </svg>
  );
}

/** Fragments are already marketized; the client part only adds the market prefix on preview hosts. */
function Html({ html, market, className }: { html: string; market: MarketCode; className?: string }) {
  if (!html) return null;
  return <MarketHtmlContentClient className={className} html={html} market={market} />;
}

function SceneSection({ market, section, cityName }: { market: MarketCode; section: CityGuideSection; cityName: string }) {
  const theme = CITY_GUIDE_THEMES[section.theme];
  const hasCards = section.items.length > 0;

  return (
    <section id={section.id} className="city-scene" data-theme={section.theme} aria-labelledby={`${section.id}-title`}>
      <header className="city-scene-head">
        <span className="city-scene-badge">
          <ThemeIcon theme={section.theme} />
        </span>
        <div>
          <span className="city-scene-eyebrow">
            {theme.label} · {cityName}
          </span>
          <h2 id={`${section.id}-title`}>{section.heading}</h2>
        </div>
      </header>

      <Html market={market} className="city-scene-lead" html={section.leadHtml} />

      {hasCards ? (
        <ol className="city-scene-cards">
          {section.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="city-scene-card">
              <span className="city-scene-card-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{item.name}</h3>
              {item.address ? <span className="city-scene-card-address">{item.address}</span> : null}
              <Html market={market} className="city-scene-card-text" html={item.html} />
            </li>
          ))}
        </ol>
      ) : null}

      <Html market={market} className="city-scene-prose" html={section.restHtml} />
    </section>
  );
}

function StudioTeaser({ market, slug, cityName }: { market: MarketCode; slug: string; cityName: string }) {
  if (!isIndexableTattooStudioCity(market, slug)) return null;
  const guide = getTattooStudioCityGuide(market, slug);
  if (!guide) return null;
  const styles = [...new Set(guide.studios.flatMap((studio) => studio.styles.map((style) => style.label)))].slice(0, 6);
  const count = guide.studios.length;

  return (
    <aside className="city-studio-teaser" aria-labelledby="city-studio-teaser-title">
      {guide.imageUrl ? (
        <div className="city-studio-teaser-media">
          <Image src={staticAsset(guide.imageUrl)} alt="" fill sizes="(max-width: 760px) 100vw, 320px" />
        </div>
      ) : null}
      <div className="city-studio-teaser-copy">
        <span className="city-scene-eyebrow">Studio-Guide {cityName}</span>
        <h2 id="city-studio-teaser-title">
          {count} {count === 1 ? "geprüftes Tattoo-Studio" : "geprüfte Tattoo-Studios"} in {cityName}
        </h2>
        <p>
          Adressen, Stile und Kontaktwege haben wir im eigenen Studio-Guide gesammelt – redaktionell geprüft und mit
          Profil für jedes Studio.
        </p>
        {styles.length ? (
          <ul className="city-studio-teaser-styles" aria-label="Stile der Studios">
            {styles.map((style) => (
              <li key={style}>{style}</li>
            ))}
          </ul>
        ) : null}
        <MarketLink className="button button-light" targetMarket={market} pathname={`/tattoo-studios/${slug}`}>
          Zum Studio-Guide {cityName} <span aria-hidden="true">→</span>
        </MarketLink>
      </div>
    </aside>
  );
}

/**
 * The editorial part of a city page: the WordPress text split into a jump compass, themed card
 * sections, a studio teaser pointing to the studio guide and image cards for similar cities.
 */
export function CitySceneGuide({ market, slug, cityName, html, cities }: CitySceneGuideProps) {
  const guide = parseCityGuide(marketizeSanitizedHtml(html, market));
  const hasStudioGuide = isIndexableTattooStudioCity(market, slug);
  const studioCount = hasStudioGuide ? getTattooStudioCityGuide(market, slug)?.studios.length ?? 0 : 0;
  const citiesBySlug = new Map(cities.map((city) => [city.slug, city]));
  const related = guide.relatedCitySlugs
    .map((citySlug) => citiesBySlug.get(citySlug))
    .filter((city): city is CitySceneRelatedCity => Boolean(city) && city?.slug !== slug);

  if (!guide.sections.length) {
    return (
      <>
        <Html market={market} className="rich-content city-scene-intro-prose" html={guide.introHtml} />
        {hasStudioGuide ? <StudioTeaser market={market} slug={slug} cityName={cityName} /> : null}
        <RelatedCities market={market} cities={related} />
      </>
    );
  }

  return (
    <div className="city-scene-guide">
      <div className="city-scene-intro panel-card">
        <Html market={market} className="city-scene-intro-text" html={guide.introHtml} />

        <nav className="city-compass" aria-label={`Szene-Kompass ${cityName}`}>
          <span className="city-compass-title">Szene-Kompass {cityName}</span>
          <ul>
            {guide.sections.map((section) => (
              <li key={section.id} data-theme={section.theme}>
                <a href={`#${section.id}`}>
                  <ThemeIcon theme={section.theme} />
                  {section.items.length ? <strong>{section.items.length}</strong> : null}
                  <span>
                    {section.items.length
                      ? cityGuideUnit(section.theme, section.items.length)
                      : CITY_GUIDE_THEMES[section.theme].label}
                  </span>
                </a>
              </li>
            ))}
            {hasStudioGuide ? (
              <li data-theme="studios">
                <MarketLink targetMarket={market} pathname={`/tattoo-studios/${slug}`}>
                  <ThemeIcon theme="studios" />
                  <strong>{studioCount}</strong>
                  <span>{cityGuideUnit("studios", studioCount)} ↗</span>
                </MarketLink>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>

      {guide.sections.map((section, index) => (
        <Fragment key={section.id}>
          <SceneSection market={market} section={section} cityName={cityName} />
          {index === 0 && hasStudioGuide ? <StudioTeaser market={market} slug={slug} cityName={cityName} /> : null}
        </Fragment>
      ))}

      <RelatedCities market={market} cities={related} />
    </div>
  );
}

function RelatedCities({ market, cities }: { market: MarketCode; cities: CitySceneRelatedCity[] }) {
  if (!cities.length) return null;
  return (
    <section className="city-related" aria-labelledby="city-related-title">
      <div className="section-header">
        <span className="eyebrow">Weitere Städte</span>
        <h2 id="city-related-title">Ähnliche Szene, andere Stadt</h2>
      </div>
      <ul className="city-related-grid">
        {cities.map((city) => (
          <li key={city.slug}>
            <MarketLink className="city-related-card" targetMarket={market} pathname={`/tattoo-singles/${city.slug}`}>
              {city.imageUrl ? (
                <Image src={staticAsset(city.imageUrl)} alt="" fill sizes="(max-width: 760px) 100vw, 300px" />
              ) : null}
              <span className="city-related-copy">
                {city.region && city.region !== city.label ? <small>{city.region}</small> : null}
                <strong>{city.label}</strong>
                <span>Tattoo-Singles entdecken →</span>
              </span>
            </MarketLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
