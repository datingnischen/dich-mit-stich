import type { ReactNode } from "react";

import { MarketHtmlContentClient } from "@/components/market-html-content-client";
import { marketizeSanitizedHtml } from "@/lib/market-html";
import type { MarketCode } from "@/lib/markets";
import {
  STUDIO_STYLE_TRIGGER,
  parseStudioGuide,
  studioStyleCounts,
  stylesInTitle,
  type StudioGuideKind,
  type StudioGuideSection,
} from "@/lib/studio-guide-sections";
import type { TattooStudio } from "@/lib/tattoo-studio-guide";

const KIND_META: Record<StudioGuideKind, { label: string; icon: ReactNode }> = {
  intro: { label: "Überblick", icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  scene: {
    label: "Szene",
    icon: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
  },
  styles: { label: "Stile", icon: <path d="M18.4 2.6a2 2 0 0 1 2.9 2.9L11 15.8 8 16l.2-3L18.4 2.6ZM8 16c-1.5 0-3 1-3 3 0 1-.7 2-2 2 1.4 1 3 1.3 4.3 1 1.9-.5 3.2-2 2.7-4" /> },
  checklist: { label: "Vor der Anfrage", icon: <path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /> },
  summary: { label: "Kurz gesagt", icon: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /> },
  prose: { label: "Hintergrund", icon: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 16a2 2 0 0 0 2 2h13v-4M9 7h6" /> },
};

function KindIcon({ kind }: { kind: StudioGuideKind }) {
  return (
    <svg className="studio-ed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {KIND_META[kind].icon}
    </svg>
  );
}

function Html({ html, market, className }: { html: string; market: MarketCode; className?: string }) {
  if (!html) return null;
  return <MarketHtmlContentClient className={className} html={html} market={market} />;
}

function Head({ section, cityName }: { section: StudioGuideSection; cityName: string }) {
  return (
    <header className="studio-ed-head">
      <span className="studio-ed-badge"><KindIcon kind={section.kind} /></span>
      <div>
        <span className="studio-ed-eyebrow">{KIND_META[section.kind].label} · {cityName}</span>
        <h2 id={`${section.id}-title`}>{section.heading}</h2>
      </div>
    </header>
  );
}

type StyleCount = ReturnType<typeof studioStyleCounts>[number];

function StyleChips({ styles }: { styles: StyleCount[] }) {
  if (!styles.length) return null;
  return (
    <div className="studio-ed-style-chips">
      <span>In den Studios hier belegt:</span>
      <ul>
        {styles.map((style) => (
          <li key={style.slug}>
            <a href="#studio-auswahl" {...{ [STUDIO_STYLE_TRIGGER]: style.slug }}>
              {style.label} <small>{style.count}</small>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ section, market, cityName, studios, styleCounts }: {
  section: StudioGuideSection;
  market: MarketCode;
  cityName: string;
  studios: TattooStudio[];
  styleCounts: StyleCount[];
}) {
  const labelledBy = `${section.id}-title`;

  if (section.kind === "intro") {
    return (
      <section id={section.id} className="studio-ed-intro" aria-labelledby={labelledBy}>
        <h2 id={labelledBy} className="studio-ed-intro-title">{section.heading}</h2>
        <Html market={market} className="studio-ed-intro-text" html={section.leadHtml} />
        {section.items.length ? <Checklist section={section} market={market} /> : null}
        <Html market={market} className="studio-ed-prose" html={section.restHtml} />
      </section>
    );
  }

  if (section.kind === "summary") {
    return (
      <section id={section.id} className="studio-ed-summary" aria-labelledby={labelledBy}>
        <span className="studio-ed-summary-mark"><KindIcon kind="summary" /> Kurz gesagt</span>
        <h2 id={labelledBy}>{section.heading}</h2>
        <Html market={market} className="studio-ed-prose" html={section.leadHtml} />
        {section.items.length ? <Checklist section={section} market={market} /> : null}
        <Html market={market} className="studio-ed-prose" html={section.restHtml} />
      </section>
    );
  }

  return (
    <section id={section.id} className="studio-ed-section" data-kind={section.kind} aria-labelledby={labelledBy}>
      <Head section={section} cityName={cityName} />
      <Html market={market} className="studio-ed-prose" html={section.leadHtml} />

      {section.kind === "styles" && section.items.length ? (
        <ul className="studio-ed-styles">
          {section.items.map((item) => {
            const slugs = stylesInTitle(item.name, studios);
            const count = studios.filter((studio) => studio.styles.some((style) => slugs.includes(style.slug))).length;
            return (
              <li key={item.name} className="studio-ed-style">
                <h3>{item.name}</h3>
                <Html market={market} className="studio-ed-style-text" html={item.html} />
                {count ? (
                  <a className="studio-ed-style-link" href="#studio-auswahl" {...{ [STUDIO_STYLE_TRIGGER]: slugs.join(",") }}>
                    {count === 1 ? "1 Studio" : `${count} Studios`} in {cityName} <span aria-hidden="true">→</span>
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {section.kind === "styles" && !section.items.length ? <StyleChips styles={styleCounts} /> : null}
      {section.kind !== "styles" && section.items.length ? <Checklist section={section} market={market} /> : null}

      <Html market={market} className="studio-ed-prose" html={section.restHtml} />
    </section>
  );
}

function Checklist({ section, market }: { section: StudioGuideSection; market: MarketCode }) {
  return (
    <ol className="studio-ed-checklist">
      {section.items.map((item, index) => (
        <li key={item.name}>
          <span className="studio-ed-check" aria-hidden="true">{index + 1}</span>
          <div>
            <strong>{item.name}</strong>
            <Html market={market} className="studio-ed-check-text" html={item.html} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The editorial copy of a studio city guide as intro, scene, style cards, checklist and summary. */
export function StudioGuideEditorial({ html, market, cityName, studios }: {
  html: string;
  market: MarketCode;
  cityName: string;
  studios: TattooStudio[];
}) {
  const guide = parseStudioGuide(marketizeSanitizedHtml(html, market));
  const styleCounts = studioStyleCounts(studios);

  return (
    <div className="studio-ed">
      <Html market={market} className="studio-ed-intro-text" html={guide.introHtml} />
      {guide.sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          market={market}
          cityName={cityName}
          studios={studios}
          styleCounts={styleCounts}
        />
      ))}
    </div>
  );
}
