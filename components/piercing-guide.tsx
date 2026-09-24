import Image from "next/image";
import { Fragment } from "react";

import { MarketHtmlContent } from "@/components/market-html-content";
import { MarketLink } from "@/components/market-link";
import type { HubChildGroup, MagazineHub } from "@/lib/magazine-hubs";
import type { MarketCode } from "@/lib/markets";
import {
  PIERCING_GUIDE,
  guideAnchor,
  guideNavLabel,
  piercingRegion,
  piercingRegionAnchor,
  splitGuideSections,
} from "@/lib/piercing-guide";

export const PIERCING_DIRECTORY_ID = "alle-piercingarten";

function groupAnchor(heading: string) {
  return `piercingarten-${guideAnchor(heading)}`;
}

function GuideTimeline() {
  return (
    <aside className="piercing-timeline" aria-labelledby="piercing-timeline-title">
      <h2 id="piercing-timeline-title">3.500 Jahre Piercing im Zeitraffer</h2>
      <ol>
        {PIERCING_GUIDE.timeline.map((step) => (
          <li key={step.when}>
            <span className="piercing-timeline-when">{step.when}</span>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function GuideChecklist() {
  return (
    <aside className="piercing-checklist" aria-labelledby="piercing-checklist-title">
      <h2 id="piercing-checklist-title">Kurz-Check vor dem Termin</h2>
      <ul>
        {PIERCING_GUIDE.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * The piercing overview with key figures up front, a jump bar through its sections and two
 * visual breaks: the history as a timeline, the studio visit as a checklist.
 */
export function PiercingGuideArticle({ market, html, typeCount }: { market: MarketCode; html: string; typeCount: number }) {
  const { intro, sections } = splitGuideSections(html);
  const studioIndex = sections.findIndex((section) => /^wie kommt/i.test(section.heading));

  return (
    <>
      <div className="piercing-facts">
        {PIERCING_GUIDE.facts.map((fact) => (
          <div key={fact.label} className="piercing-fact">
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </div>
        ))}
        {typeCount ? (
          <a className="piercing-fact piercing-fact-link" href={`#${PIERCING_DIRECTORY_ID}`}>
            <strong>{typeCount}</strong>
            <span>Piercingarten mit eigenem Ratgeber ↓</span>
          </a>
        ) : null}
      </div>

      {sections.length ? (
        <nav className="piercing-guide-nav" aria-label="Inhalt">
          <span>Inhalt</span>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{guideNavLabel(section.heading)}</a>
              </li>
            ))}
            {typeCount ? (
              <li>
                <a href={`#${PIERCING_DIRECTORY_ID}`}>Alle Piercingarten</a>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}

      {intro.trim() ? <MarketHtmlContent market={market} html={intro} className="piercing-guide-intro" /> : null}

      {sections.map((section, index) => (
        <Fragment key={section.id}>
          {index === studioIndex ? <GuideTimeline /> : null}
          <div id={section.id} className="piercing-guide-section">
            <MarketHtmlContent market={market} html={section.html} />
          </div>
          {index === studioIndex ? <GuideChecklist /> : null}
        </Fragment>
      ))}
      {studioIndex === -1 ? <GuideTimeline /> : null}
    </>
  );
}

/** Hero of the Piercingarten hub: one picture tile per body region, each jumping to its cards. */
export function PiercingRegionPicker({ groups }: { groups: HubChildGroup[] }) {
  return (
    <nav className="magazine-detail-media piercing-region-picker" aria-label="Piercingarten nach Körperstelle">
      {groups.map((group) => {
        const region = piercingRegion(group.heading);
        return (
          <a key={group.heading} href={`#${piercingRegionAnchor(group.heading)}`} className="piercing-region-tile">
            {group.imageUrl ? (
              <Image src={group.imageUrl} alt="" width={768} height={512} sizes="(max-width: 760px) 50vw, 240px" priority />
            ) : null}
            <span className="piercing-region-tile-copy">
              <strong>{region.short}</strong>
              <span>{group.links.length} Arten</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/** Every piercing type the Piercingarten hub links, grouped by body region as the hub groups them. */
export function PiercingTypeDirectory({
  market,
  hub,
  groups,
  total,
}: {
  market: MarketCode;
  hub: MagazineHub;
  groups: HubChildGroup[];
  total: number;
}) {
  return (
    <section id={PIERCING_DIRECTORY_ID} className="content-section piercing-directory" aria-labelledby="piercing-directory-heading">
      <div className="piercing-directory-head">
        <span className="eyebrow">{hub.label}</span>
        <h2 id="piercing-directory-heading">Alle {total} Piercingarten nach Körperstelle</h2>
        <p>
          Jede Piercingart hat ihren eigenen Ratgeber mit Stichkanal, Schmuck, Schmerz und Heilung. Vergleichen kannst du sie auch in der{" "}
          <MarketLink targetMarket={market} pathname={hub.path}>Übersicht der Piercingarten</MarketLink>.
        </p>
        <ul className="piercing-directory-jump">
          {groups.map((group) => (
            <li key={group.heading}>
              <a href={`#${groupAnchor(group.heading)}`}>
                {piercingRegion(group.heading).short} <span>{group.links.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="piercing-region-grid">
        {groups.map((group) => (
          <article key={group.heading} id={groupAnchor(group.heading)} className="piercing-region">
            <header className={`piercing-region-head${group.imageUrl ? "" : " piercing-region-head-plain"}`}>
              {group.imageUrl ? (
                <Image src={group.imageUrl} alt="" width={768} height={512} sizes="(max-width: 760px) 100vw, 380px" />
              ) : null}
              <div>
                <h3>{group.heading}</h3>
                <span>{group.links.length} Ratgeber</span>
              </div>
            </header>
            <ul>
              {group.links.map((link) => (
                <li key={link.slug}>
                  <MarketLink targetMarket={market} pathname={`/magazin/${link.slug}`}>
                    {link.label}
                  </MarketLink>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
