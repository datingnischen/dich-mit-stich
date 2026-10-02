import Image from "next/image";

import { LandingLiveSingles } from "@/components/landing-live-singles";
import type { ConversionAid } from "@/lib/conversion-links";
import { buildIconyRegistrationFrame } from "@/lib/icony-frame-widgets";
import { localizeLandingText, type LandingContent } from "@/lib/landing-tattoo-singles";
import { publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

const HERO_IMAGE = staticAsset("/brand/frontpage-visual-dichmitstich.webp");

const BRAND_LOGOS: Record<MarketCode, { src: string; alt: string; width: number; height: number }> = {
  de: { src: staticAsset("/brand/dich-mit-stich-logo-header.jpg"), alt: "dich-mit-stich.de", width: 691, height: 140 },
  at: { src: staticAsset("/brand/dich-mit-stich-logo-at.svg"), alt: "dich-mit-stich.at", width: 345, height: 60 },
  ch: { src: staticAsset("/brand/dich-mit-stich-logo-ch.svg"), alt: "dich-mit-stich.ch", width: 1417, height: 283 },
};

const TRUSTPILOT_URL = "https://de.trustpilot.com/review/dich-mit-stich.de";

/** Echte Paare aus /ueber-uns/erfolgsgeschichten/ (lib/about-pages.ts), bewusst ohne Link von der Landingpage weg. */
const STORIES = [
  {
    names: "Pascal & Stephanie",
    text: "Eine Liebesgeschichte, die in der Dich-mit-Stich-Community begann.",
    image: { src: staticAsset("/magazin/wp-content/uploads/2025/12/foto.jpeg"), alt: "Pascal und Stephanie" },
  },
  {
    names: "Katharina & Philip",
    text: "Katharina und Philip haben sich über Dich mit Stich kennengelernt.",
    image: { src: staticAsset("/magazin/wp-content/uploads/2025/10/Katharina-Phillip-Dich-mit-Stich-Lovestory.jpg"), alt: "Katharina und Philip" },
  },
  {
    names: "Andreas & Do",
    text: "Andreas hat über Dich mit Stich sein Gegenstück gefunden.",
    image: { src: staticAsset("/magazin/wp-content/uploads/2025/10/erfolgsgeschichte.png"), alt: "Andreas und Do" },
  },
] as const;

const CTA_LABEL = "Jetzt kostenlos registrieren";

function RegistrationFrame({ market, aid }: { market: MarketCode; aid: ConversionAid }) {
  const widget = buildIconyRegistrationFrame(market, aid);
  // Wie IconyFrame, aber ohne loading="lazy": das Formular ist das erste Conversion-Element der Seite.
  return (
    <iframe
      className="lp-registration-frame"
      src={widget.src}
      title={widget.title}
      width={widget.width}
      height={widget.height}
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TattooSinglesLanding({ content }: { content: LandingContent }) {
  const { market, registrationUrl } = content;
  const t = (text: string) => localizeLandingText(market, text);
  const logo = BRAND_LOGOS[market];
  const legalLinks = [
    { label: "Impressum", href: publicUrl(market, "/impressum.html") },
    { label: "Datenschutz", href: publicUrl(market, "/datenschutz.html") },
    { label: "AGB", href: publicUrl(market, "/agb.html") },
  ];

  const faq = [
    {
      question: "Ist die Registrierung wirklich kostenlos?",
      answer: t(
        "Ja. Anmelden, Profil anlegen und umsehen ist kostenlos (Basis-Mitgliedschaft). Für unbegrenztes Schreiben und Zusatzfunktionen gibt es Premium – Preise und Laufzeiten siehst du vor dem Abschluss.",
      ),
    },
    {
      question: "Muss ich selbst tätowiert sein?",
      answer: t(
        "Nein. Bei Dich mit Stich sind Menschen mit Tattoos und Piercings genauso dabei wie Menschen, die sie lieben. Wichtig ist nur, dass du die Szene magst.",
      ),
    },
    {
      question: `Wer ist bei Dich mit Stich ${content.countryPhrase} dabei?`,
      answer: t(
        `Frauen und Männer ${content.countryPhrase}, ${content.cityRange} und auch abseits der grossen Städte. Durch die Einbindung in ein grösseres Datingnetzwerk ist die Mitgliederbasis breit – mit der Umkreissuche siehst du, wer bei dir in der Nähe ist.`,
      ),
    },
    {
      question: "Wie sicher sind die Profile?",
      answer: t(
        "Neuanmeldungen, Bilder und Freitexte werden vom Support-Team auf Auffälligkeiten geprüft. Chatbots zur Kontaktanbahnung gibt es nicht. Betrieben wird die Plattform von der Icony GmbH.",
      ),
    },
    {
      question: "Kann ich mein Profil wieder löschen?",
      answer: t("Ja, jederzeit selbst in den Einstellungen – vollständig und ohne Angabe von Gründen."),
    },
  ];

  return (
    <div className="lp" data-landing-variant={content.variant} data-landing-market={market}>
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <Image className="lp-logo" src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} sizes="200px" priority />
          <a className="button button-primary lp-header-cta" href={registrationUrl} data-lp-cta="header">
            Kostenlos registrieren
          </a>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-media" aria-hidden="true">
            <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" />
          </div>
          <div className="lp-shell lp-hero-inner">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">{content.eyebrow}</span>
              <h1>{content.headline}</h1>
              <p className="lp-hero-subline">{content.subline}</p>
              <ul className="lp-hero-points" aria-label="Das bekommst du">
                <li><CheckIcon />{t("Kostenlos registrieren – keine versteckten Kosten beim Einstieg")}</li>
                <li><CheckIcon />{t("Sieh sofort, wer in deinem Umkreis online ist")}</li>
                <li><CheckIcon />{t("Geprüfte Profile, betrieben von der Icony GmbH")}</li>
              </ul>
              <div className="lp-cta-row">
                <a className="button button-primary lp-button lp-button-hero" href={registrationUrl} data-lp-cta="hero">{CTA_LABEL}</a>
                <a className="lp-link-secondary" href="#live">Wer ist gerade online?</a>
              </div>
              <p className="lp-hero-trust">
                <span aria-hidden="true">★★★★★</span>{" "}
                <a href={TRUSTPILOT_URL} target="_blank" rel="nofollow noopener noreferrer">Bewertungen auf Trustpilot</a>
                {" · "}
                {t("Über 20 Jahre Erfahrung im Online-Dating")}
              </p>
            </div>

            <aside className="lp-hero-form" aria-labelledby="lp-form-title">
              <span className="lp-form-eyebrow">Kostenlos starten</span>
              <h2 id="lp-form-title">In 2 Minuten dabei</h2>
              <p>{t("Verrate uns, wo du wohnst und wen du suchst. Wir zeigen dir, wer in deiner Nähe Tinte trägt.")}</p>
              <div className="lp-hero-frame">
                <RegistrationFrame market={market} aid={content.aid} />
              </div>
              <a className="lp-form-fallback" href={registrationUrl} data-lp-cta="hero-form-link">
                Direkt zur Registrierung →
              </a>
            </aside>
          </div>
        </section>

        {/* Siegel und Logo sind kleine Originale (330×60, 300×60, 200×72): unverändert ausliefern,
            der Bildoptimierer würde sie sonst verkleinern und der Browser wieder unscharf hochziehen. */}
        <section className="lp-trust-strip" aria-label="Vertrauen">
          <div className="lp-shell lp-trust-inner">
            <a className="lp-trust-item" href={TRUSTPILOT_URL} target="_blank" rel="nofollow noopener noreferrer">
              <span className="lp-trust-stars" aria-hidden="true">★★★★★</span>
              <span>Bewertungen auf Trustpilot</span>
            </a>
            <a className="lp-trust-item" href="https://singleboersen-ueberblick.de/partnersuche/dich-mit-stich/" target="_blank" rel="nofollow noopener noreferrer">
              <Image src={staticAsset("/about/dich-mit-stich-bewertungen-siegel-singleboersen-ueberblick.webp")} alt="Empfehlungssiegel von singleboersen-ueberblick.de" width={330} height={60} unoptimized />
              <span>Empfohlen auf singleboersen-ueberblick.de</span>
            </a>
            <a className="lp-trust-item" href="https://www.singleboersen-vergleichen.de/singleportal/dich-mit-stich/" target="_blank" rel="nofollow noopener noreferrer">
              <Image src={staticAsset("/about/dich-mit-stich-bewertungen-siegel-singleboersen-vergleichen.webp")} alt="Bewertungssiegel von singleboersen-vergleichen.de" width={300} height={60} unoptimized />
              <span>Bewertet auf singleboersen-vergleichen.de</span>
            </a>
            <span className="lp-trust-item lp-trust-item-static">
              <Image src={staticAsset("/brand/icony-gmbh-logo.png")} alt="Icony GmbH" width={200} height={72} unoptimized />
              <span>{t("Betrieb & Datenschutz: Icony GmbH")}</span>
            </span>
          </div>
        </section>

        <div className="lp-shell">
          <LandingLiveSingles
            market={market}
            projectKey={content.projectKey}
            postalCode={content.postalCode}
            title={content.liveTitle}
            initialGender={content.liveGender}
            registrationUrl={registrationUrl}
            aid={content.aid}
            ctaLabel={CTA_LABEL}
          />

          <section className="lp-section lp-steps" aria-labelledby="lp-steps-title">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-dark">So geht&apos;s</span>
              <h2 id="lp-steps-title">In drei Schritten zu Singles mit Tinte</h2>
            </div>
            <ol className="lp-steps-grid">
              <li>
                <span className="lp-step-number">01</span>
                <h3>Kostenlos registrieren</h3>
                <p>{t("PLZ, Ich bin, Ich suche, E-Mail bestätigen – fertig. Kein Abo, keine Kreditkarte.")}</p>
              </li>
              <li>
                <span className="lp-step-number">02</span>
                <h3>Profil zeigen</h3>
                <p>{t("Fotos von deinen Tattoos und Piercings hochladen und ein paar Sätze zu dir schreiben. Je echter, desto mehr Antworten.")}</p>
              </li>
              <li>
                <span className="lp-step-number">03</span>
                <h3>Im Umkreis flirten</h3>
                <p>{t("Mit dem Flirtradar legst du den Suchradius fest, siehst, wer wirklich erreichbar ist, und schreibst die erste Nachricht.")}</p>
              </li>
            </ol>
            <div className="lp-cta-row lp-cta-row-center">
              <a className="button button-primary lp-button" href={registrationUrl} data-lp-cta="steps">{CTA_LABEL}</a>
            </div>
          </section>

          <section className="lp-section lp-benefits" aria-labelledby="lp-benefits-title">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-dark">Warum Dich mit Stich</span>
              <h2 id="lp-benefits-title">{t("Hier fragt niemand, ob das Tattoo wehgetan hat")}</h2>
            </div>
            <div className="lp-benefits-grid">
              <article>
                <span className="lp-benefit-icon" aria-hidden="true">✦</span>
                <h3>Szene statt Massenbörse</h3>
                <p>{t("Du triffst Menschen, die Tinte und Piercings lieben – Old School, Blackwork oder Fine Line. Niemand schaut dich schräg an.")}</p>
              </article>
              <article>
                <span className="lp-benefit-icon" aria-hidden="true">◎</span>
                <h3>Umkreissuche & Flirtradar</h3>
                <p>{t(`Leg fest, wie weit du fahren würdest, und sieh Singles, die wirklich erreichbar sind – ${content.cityRange} und dazwischen.`)}</p>
              </article>
              <article>
                <span className="lp-benefit-icon" aria-hidden="true">◇</span>
                <h3>Kostenlos starten</h3>
                <p>{t("Anmelden, Profil anlegen, umsehen: kostenlos. Premium nur, wenn du unbegrenzt schreiben willst – die Preise siehst du vorher.")}</p>
              </article>
              <article>
                <span className="lp-benefit-icon" aria-hidden="true">✓</span>
                <h3>Geprüfte Profile</h3>
                <p>{t("Neue Profile, Bilder und Texte werden vom Support-Team geprüft, Chatbots gibt es nicht. Betrieben von der Icony GmbH, seit über 20 Jahren im Online-Dating.")}</p>
              </article>
            </div>
          </section>

          <section className="lp-section lp-stories" aria-labelledby="lp-stories-title">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-dark">Erfolgsgeschichten</span>
              <h2 id="lp-stories-title">Paare, die sich hier gefunden haben</h2>
            </div>
            <div className="lp-stories-grid">
              {STORIES.map((story) => (
                <figure key={story.names} className="lp-story">
                  <Image src={story.image.src} alt={story.image.alt} width={480} height={360} sizes="(max-width: 700px) 100vw, 320px" />
                  <figcaption>
                    <ui-strong>{story.names}</ui-strong>
                    <span>{story.text}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="lp-section lp-faq" aria-labelledby="lp-faq-title">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-dark">Kurz gefragt</span>
              <h2 id="lp-faq-title">Was du vor der Anmeldung wissen willst</h2>
            </div>
            <div className="lp-faq-list">
              {faq.map((item) => (
                <details key={item.question} className="lp-faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <section className="lp-final" aria-labelledby="lp-final-title">
          <div className="lp-shell lp-final-inner">
            <span className="lp-eyebrow">{content.eyebrow}</span>
            <h2 id="lp-final-title">{t("Deine Tinte hat eine Geschichte. Erzähl sie jemandem, der sie versteht.")}</h2>
            <p>{t("Kostenlos registrieren, Profil anlegen und sehen, wer in deiner Nähe dabei ist.")}</p>
            <a className="button button-primary lp-button lp-button-hero" href={registrationUrl} data-lp-cta="final">{CTA_LABEL}</a>
            <span className="lp-cta-note lp-cta-note-light">Kostenlos · in 2 Minuten · Profil jederzeit löschbar</span>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-shell lp-footer-inner">
          <span>© {new Date().getFullYear()} Dich mit Stich · ein Angebot der Icony GmbH</span>
          <nav aria-label="Rechtliches">
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href} rel="nofollow">{link.label}</a>
            ))}
          </nav>
        </div>
      </footer>

      <a className="lp-sticky" href={registrationUrl} data-lp-cta="sticky">
        {CTA_LABEL}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
