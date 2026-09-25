import Image from "next/image";
import { LocationPinIcon } from "@/components/location-pin-icon";
import { MarketLink } from "@/components/market-link";
import { conversionUrl, type ConversionAid } from "@/lib/conversion-links";
import { getMarket, getOtherMarkets, publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type { ConversionAid } from "@/lib/conversion-links";

type ShellProps = {
  market?: MarketCode;
  sectionLive?: boolean;
  stickyCta?: boolean;
  aid?: ConversionAid;
};

const aboutLinks: NavLink[] = [
  { label: "Über uns", href: "/ueber-uns" },
  { label: "FAQ", href: "/faq" },
  { label: "Unser Expertenteam", href: "/ueber-uns/expertenteam" },
  { label: "Erfolgsgeschichten", href: "/ueber-uns/erfolgsgeschichten" },
  { label: "Kooperationen", href: "/ueber-uns/kooperationen" },
  { label: "Bewertungen", href: "/ueber-uns/bewertungen" },
  { label: "Social Media", href: "/ueber-uns/social-media" },
];

type NavGroup = {
  title: string;
  items: NavLink[];
};

const headerMenuGroups: NavGroup[] = [
  {
    title: "Entdecken",
    items: [
      { label: "Tattoo-Singles", href: "/tattoo-singles" },
      { label: "Tattoo-Studios", href: "/tattoo-studios" },
      { label: "Tattoo-Motive", href: "/magazin/tattoo-motive" },
      { label: "Piercings", href: "/magazin/piercing" },
    ],
  },
  {
    title: "Über uns",
    items: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Erfolgsgeschichten", href: "/ueber-uns/erfolgsgeschichten" },
    ],
  },
  {
    title: "Hilfe",
    items: [{ label: "FAQ", href: "/faq" }],
  },
];

const footerColumns: Array<{
  title: string;
  links: NavLink[];
}> = [
  {
    title: "Tattoo-Motive",
    links: [
      { label: "Beliebte Tattoo Motive", href: "/magazin/tattoo-motive" },
      { label: "Tribal Tattoo", href: "/magazin/tribal-tattoo" },
      { label: "Sleeve Tattoo", href: "/magazin/sleeve-tattoo" },
      { label: "Wolf Tattoo", href: "/magazin/wolf-tattoo" },
      { label: "Mandala Tattoo", href: "/magazin/mandala-tattoo" },
      { label: "Skull Tattoo", href: "/magazin/skull-tattoos" },
      { label: "Polynesian Tattoo", href: "/magazin/polynesian-tattoo" },
      { label: "Wikinger Tattoo", href: "/magazin/das-wikinger-tattoo" },
    ],
  },
  {
    title: "Tattoo-Lexikon",
    links: [
      { label: "Übersicht aller Tattoo Themen", href: "/magazin/tattoo-lexikon" },
      { label: "Models, Schönheiten, Persönlichkeiten", href: "/magazin/tattoo-persoenlichkeiten" },
      { label: "Kat von D – Das Leben der Tattookünstlerin", href: "/magazin/kat-von-d" },
      { label: "Zombie-Boy – Persönlichkeit", href: "/magazin/zombie-boy-rick-genest" },
      { label: "Sophie Logan – Erotikstar", href: "/magazin/sophie-logan" },
    ],
  },
  {
    title: "Piercings",
    links: [
      { label: "Piercingarten", href: "/magazin/piercingarten" },
      { label: "Rook Piercing", href: "/magazin/rook-piercing" },
      { label: "Intimpiercing", href: "/magazin/intimpiercing" },
      { label: "Septum-Piercing", href: "/magazin/septum-piercing" },
      { label: "Industrial piercing", href: "/magazin/industrial-piercing" },
      { label: "Lippenpiercing", href: "/magazin/lippenpiercing" },
    ],
  },
  {
    title: "Über uns & Stories",
    links: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Unser Expertenteam", href: "/ueber-uns/expertenteam" },
      { label: "Erfolgsgeschichten", href: "/ueber-uns/erfolgsgeschichten" },
      { label: "Kooperationen", href: "/ueber-uns/kooperationen" },
      { label: "Bewertungen", href: "/ueber-uns/bewertungen" },
      { label: "Social Media", href: "/ueber-uns/social-media" },
    ],
  },
  {
    title: "Tattoo-Studio-Guide",
    links: [
      { label: "Studio-Guide Übersicht", href: "/tattoo-studios" },
      { label: "Tattoo-Studios Berlin", href: "/tattoo-studios/berlin" },
      { label: "Tattoo-Studios Hannover", href: "/tattoo-studios/hannover" },
    ],
  },
  {
    title: "Tattoo-Singles Städte",
    links: [
      { label: "Tattoo-Singles Übersicht", href: "/tattoo-singles" },
      { label: "Berlin", href: "/tattoo-singles/berlin" },
      { label: "Hamburg", href: "/tattoo-singles/hamburg" },
      { label: "Köln", href: "/tattoo-singles/koeln" },
      { label: "Bremen", href: "/tattoo-singles/bremen" },
    ],
  },
  {
    title: "Mitgliedschaft",
    links: [
      { label: "Singlebörse", href: "https://dich-mit-stich.de/?AID=magazin", external: true },
      { label: "Kostenlos registrieren", href: "https://dich-mit-stich.de/registration/", external: true },
      { label: "Login", href: "https://dich-mit-stich.de/login/", external: true },
      { label: "Kostenlose Basis-Mitgliedschaft", href: "https://dich-mit-stich.de/kostenlose-basis-mitgliedschaft.html", external: true },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Häufige Fragen (FAQ)", href: "/faq" },
      { label: "Datenschutz", href: "https://dich-mit-stich.de/datenschutz.html", external: true },
      { label: "Impressum", href: "https://dich-mit-stich.de/impressum.html", external: true },
      { label: "AGB", href: "https://dich-mit-stich.de/agb.html", external: true },
    ],
  },
];

const footerGroups = [
  { title: "Tattoo-Wissen", columns: footerColumns.slice(0, 2) },
  { title: "Szene & Geschichten", columns: footerColumns.slice(2, 4) },
  { title: "Guides vor Ort", columns: footerColumns.slice(4, 6) },
  { title: "Mitmachen & Service", columns: footerColumns.slice(6, 8) },
];

const HEADER_LOGO_URL = staticAsset("/brand/dich-mit-stich-logo-header.jpg");
const AT_HEADER_LOGO_URL = staticAsset("/brand/dich-mit-stich-logo-at.svg");
const CH_HEADER_LOGO_URL = staticAsset("/brand/dich-mit-stich-logo-ch.svg");

const BRAND_LOGOS: Record<MarketCode, { src: string; alt: string; width: number; height: number }> = {
  de: { src: HEADER_LOGO_URL, alt: "dich-mit-stich.de", width: 691, height: 140 },
  at: { src: AT_HEADER_LOGO_URL, alt: "dich-mit-stich.at", width: 345, height: 60 },
  ch: { src: CH_HEADER_LOGO_URL, alt: "dich-mit-stich.ch", width: 1417, height: 283 },
};

function isCityLink(href: string) {
  return /^\/(?:tattoo-singles|tattoo-studios)\/[^/]+\/?$/.test(href);
}

function externalAttrs(external?: boolean) {
  return external ? { target: "_blank", rel: "noopener" } : undefined;
}

function marketHref(link: NavLink, market: MarketCode, aid?: ConversionAid) {
  if (!link.external) return link.href;

  const url = new URL(link.href);
  if (url.hostname === "dich-mit-stich.de") {
    url.hostname = getMarket(market).domain;
  }
  if (aid && (url.pathname === "/" || url.pathname === "/registration/")) {
    return conversionUrl(url.origin, url.pathname, aid);
  }
  return url.toString();
}

function NavMenuLink({ item, market, aid }: { item: NavLink; market: MarketCode; aid?: ConversionAid }) {
  if (item.external) {
    return (
      <a href={marketHref(item, market, aid)} {...externalAttrs(true)}>
        {item.label}
      </a>
    );
  }
  return (
    <MarketLink pathname={item.href} targetMarket={market}>
      {item.label}
    </MarketLink>
  );
}

function conversionHref(market: MarketCode, pathname: string, aid?: ConversionAid) {
  return conversionUrl(publicUrl(market), pathname, aid);
}

function BrandLogo({ footer = false, market }: { footer?: boolean; market: MarketCode }) {
  const logo = BRAND_LOGOS[market];

  return (
    <MarketLink
      className={`brand-lockup dms-brand-lockup ${footer ? "footer-brand-wordmark" : "brand-lockup-header"}`}
      targetMarket={market}
      aria-label="Dich mit Stich Startseite"
    >
      <Image
        className={`brand-logo-image ${footer ? "brand-logo-image-footer" : "brand-logo-image-header"}`}
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        sizes={footer ? "260px" : "220px"}
        priority={!footer}
      />
    </MarketLink>
  );
}

// Inline SVG instead of emoji flags: Windows renders flag emoji as bare letters.
function CountryFlag({ code }: { code: MarketCode }) {
  return (
    <svg className="footer-country-flag" viewBox="0 0 24 16" aria-hidden="true" focusable="false">
      {code === "de" ? (
        <>
          <rect width="24" height="16" fill="#ffce00" />
          <rect width="24" height="10.67" fill="#dd0000" />
          <rect width="24" height="5.33" fill="#000" />
        </>
      ) : code === "at" ? (
        <>
          <rect width="24" height="16" fill="#ed2939" />
          <rect y="5.33" width="24" height="5.33" fill="#fff" />
        </>
      ) : (
        <>
          <rect width="24" height="16" fill="#da291c" />
          <rect x="10.5" y="3.5" width="3" height="9" fill="#fff" />
          <rect x="7.5" y="6.5" width="9" height="3" fill="#fff" />
        </>
      )}
    </svg>
  );
}

function FooterCountryLinks({ market }: { market: MarketCode }) {
  return (
    <nav className="footer-country-links" aria-label="Dich mit Stich Länderseiten">
      <ul>
        {getOtherMarkets(market).map((entry) => (
          <li key={entry.code}>
            <MarketLink
              className="footer-country-link"
              targetMarket={entry.code}
              hrefLang={entry.locale}
              aria-label={`Dich mit Stich ${entry.countryName}: ${entry.domain}`}
            >
              <CountryFlag code={entry.code} />
              <span className="footer-country-link-domain">{entry.domain}</span>
            </MarketLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteHeader({ market = "de", sectionLive = false, aid }: ShellProps) {
  const config = getMarket(market);

  if (!config.contentEnabled && !sectionLive) {
    return (
      <header className="site-header-shell">
        <div className="site-header-bar compact-header-bar shell">
          <BrandLogo market={market} />
          <span className="eyebrow">{config.countryName}</span>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header-shell">
      <div className="site-header-bar compact-header-bar shell">
        <BrandLogo market={market} />

        <div className="header-actions compact-header-actions" aria-label="Nutzeraktionen">
          <a className="login-link" href={publicUrl(market, "/login/")}>Login</a>
          <a className="header-register header-register-primary" href={conversionHref(market, "/registration/", aid)}>Registrieren</a>

          <details className="header-menu">
            <summary aria-label="Menü öffnen">
              <span className="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
              <span className="sr-only">Menü</span>
            </summary>
            <div className="header-menu-panel">
              <p className="header-menu-panel-title">Menü</p>
              <nav className="main-nav compact-menu-nav" aria-label="Hauptnavigation">
                {config.contentEnabled ? (
                  headerMenuGroups.map((group) => (
                    <div className="header-menu-group" key={group.title}>
                      <p className="header-menu-group-label">{group.title}</p>
                      {group.items.map((item) => (
                        <NavMenuLink item={item} market={market} aid={aid} key={item.href} />
                      ))}
                    </div>
                  ))
                ) : (
                  aboutLinks.map((item) => (
                    <NavMenuLink item={item} market={market} aid={aid} key={item.href} />
                  ))
                )}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ market = "de", sectionLive = false, stickyCta = false, aid }: ShellProps) {
  const config = getMarket(market);

  if (!config.contentEnabled) {
    return (
      <footer className="site-footer-shell" id="site-footer">
        <div className={`footer-surface footer-surface-compact${stickyCta ? " footer-surface-sticky" : ""}`}>
          <div className="footer-compact-main">
            <div className="footer-brand-panel">
              <BrandLogo footer market={market} />
              <p>
                {sectionLive
                  ? `Entdecke Tattoo-Singles und die Menschen hinter Dich mit Stich ${market === "ch" ? "in der Schweiz" : `in ${config.countryName}`}.`
                  : `Der eigene Länderbereich für ${config.countryName} wird markt- und inhaltssauber vorbereitet.`}
              </p>
              <FooterCountryLinks market={market} />
            </div>
            {sectionLive ? (
              <nav className="footer-column footer-about-links" aria-label="Über uns">
                <h2>Über uns</h2>
                <ul>
                  {aboutLinks.map((link) => (
                    <li key={link.href}>
                      <MarketLink pathname={link.href} targetMarket={market}>{link.label}</MarketLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          <div className="sub-footer">
            <span>© {new Date().getFullYear()} Dich mit Stich {config.countryName}</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer-shell" id="site-footer">
      <div className={`footer-surface${stickyCta ? " footer-surface-sticky" : ""}`}>
        <section className="footer-cta footer-cta-dark" aria-label="Registrierung">
          <div className="footer-cta-copy">
            <p className="footer-kicker">Szene-Dating mit Profil</p>
            <h2>Flirte mit Tattoo- und Piercing-Singles, die wirklich zu deinem Stil passen.</h2>
            <p>Magazin, Stadtseiten und echte Erfolgsgeschichten helfen dir beim Einstieg — und führen direkt zu neuen Kontakten.</p>
          </div>
          <a className="footer-cta-button" href={conversionHref(market, "/registration/", aid)}>
            <span>Jetzt kostenlos registrieren</span>
            <span aria-hidden="true">→</span>
          </a>
        </section>

        <div className="footer-main">
          <div className="footer-brand-panel">
            <BrandLogo footer market={market} />
            <p className="footer-brand-kicker">Dating · Szene · Orientierung</p>
            <p className="footer-brand-copy">
              Dich mit Stich verbindet Szene-Feeling, Dating-Ratgeber, Stadtseiten und echte Erfolgsgeschichten in einer
              klaren, vertrauensvollen Oberfläche für Menschen mit eigenem Stil.
            </p>
            <ul className="footer-trust-list" aria-label="Vertrauensmerkmale">
              <li>Eigener Szene-Fokus statt Massenbörse</li>
              <li>Inspiration für dein Tattoo-Leben und deine Partnersuche</li>
              <li>Tattoo-Singles, Stadt-Guides und Szene-Wissen direkt für dich</li>
            </ul>
            <FooterCountryLinks market={market} />
          </div>

          <nav className="footer-link-grid" aria-label="Footer Navigation">
            {footerGroups.map((group) => (
              <section className="footer-topic-group" key={group.title}>
                <p className="footer-topic-label">{group.title}</p>
                <div className="footer-topic-columns">
                  {group.columns.map((column) => (
                    <div className="footer-column" key={column.title}>
                      <h2>{column.title}</h2>
                      <ul>
                        {column.links.map((link) => {
                          const cityLink = isCityLink(link.href);
                          return (
                            <li key={`${column.title}-${link.label}`}>
                              <a className={cityLink ? "footer-city-link" : undefined} href={marketHref(link, market, aid)} {...externalAttrs(link.external)}>
                                {cityLink ? <LocationPinIcon className="footer-city-link-icon" /> : null}
                                <span>{link.label}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>

        <div className="sub-footer">
          <div>
            <span>© {new Date().getFullYear()} Dich mit Stich</span>
          </div>
          <div className="sub-footer-links">
            <a href={conversionHref(market, "/registration/", aid)}>Registrieren</a>
            <a href={publicUrl(market, "/login/")}>Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
