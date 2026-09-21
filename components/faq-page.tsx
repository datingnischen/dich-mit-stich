import { MarketLink } from "@/components/market-link";
import { SiteFrame } from "@/components/site-frame";
import { conversionUrl } from "@/lib/conversion-links";
import { buildFaqGraph, FAQ_PATH, getFaqSections, type FaqAnswerPart } from "@/lib/faq";
import { serializeJsonLd } from "@/lib/json-ld";
import { publicUrl, type MarketCode } from "@/lib/markets";

function AnswerPart({ market, part }: { market: MarketCode; part: FaqAnswerPart }) {
  if (part.type === "text") return part.value;
  if (part.external) {
    return <a href={part.href} target="_blank" rel="nofollow noopener noreferrer">{part.label}</a>;
  }
  if (part.href.startsWith("/")) {
    return <MarketLink targetMarket={market} pathname={part.href}>{part.label}</MarketLink>;
  }
  return <a href={part.href}>{part.label}</a>;
}

export function FaqPageView({ market }: { market: MarketCode }) {
  const faqSections = getFaqSections(market);
  const graph = buildFaqGraph(market);
  const questionCount = faqSections.reduce((total, section) => total + section.items.length, 0);

  return (
    <SiteFrame market={market} sectionLive>
      <main className="shell faq-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />

        <header className="faq-hero">
          <div>
            <span className="eyebrow">Hilfe & Orientierung</span>
            <h1>Häufig gestellte Fragen (FAQ)</h1>
            <p>
              Du interessierst dich für Dich mit Stich oder hast Fragen zur Nutzung? Hier findest du die wichtigsten
              Antworten rund um unsere Singlebörse für Tattoo- und Piercing-Fans – klar, transparent und auf den Punkt.
            </p>
            <div className="about-highlight-row" aria-label="FAQ-Themen">
              <span>{questionCount} Antworten</span>
              <span>Anmeldung & Kosten</span>
              <span>Sicherheit & Datenschutz</span>
              <span>Konto & Support</span>
            </div>
          </div>
          <aside className="faq-hero-index" aria-label="Direkt zu einem Themenbereich">
            <strong>Themen</strong>
            <nav>
              {faqSections.map((section, index) => (
                <a href={`#faq-section-${index + 1}`} key={section.title}>{section.title}</a>
              ))}
            </nav>
          </aside>
        </header>

        <div className="faq-sections">
          {faqSections.map((section, sectionIndex) => (
            <section className="faq-section" id={`faq-section-${sectionIndex + 1}`} key={section.title} aria-labelledby={`faq-heading-${sectionIndex + 1}`}>
              <div className="section-header">
                <span className="eyebrow">{section.eyebrow}</span>
                <h2 id={`faq-heading-${sectionIndex + 1}`}>{section.title}</h2>
                {section.lead ? <p>{section.lead}</p> : null}
              </div>
              <div className="faq-list">
                {section.items.map((item) => (
                  <details className="faq-item" key={item.question}>
                    <summary>{item.question}</summary>
                    <div className="faq-answer">
                      <p>{item.answer.map((part, index) => <AnswerPart market={market} part={part} key={`${item.question}-${index}`} />)}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="about-final-cta">
          <div>
            <span className="eyebrow">Noch nicht angemeldet?</span>
            <h2>Finde Menschen, die deinen Stil verstehen.</h2>
            <p>Die Registrierung ist kostenlos. Leistungen und Preise einer Premium-Mitgliedschaft werden vor dem Abschluss angezeigt.</p>
          </div>
          <a className="button button-primary" href={conversionUrl(publicUrl(market), "/registration/", "location")}>Kostenlos registrieren</a>
        </section>

        <nav className="faq-related-links" aria-label="Weitere Informationen">
          <MarketLink targetMarket={market} pathname="/ueber-uns">Über Dich mit Stich</MarketLink>
          <MarketLink targetMarket={market} pathname="/ueber-uns/bewertungen">Bewertungen und Erfahrungen</MarketLink>
          <a href={publicUrl(market, "/datenschutz.html")}>Datenschutz</a>
          <a href={publicUrl(market, "/impressum.html")}>Impressum</a>
        </nav>
      </main>
    </SiteFrame>
  );
}

export { FAQ_PATH };
