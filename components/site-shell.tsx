import Image from "next/image";
import { MarketLink } from "@/components/market-link";
import { getMarket, publicUrl, type MarketCode } from "@/lib/markets";
import { staticAsset } from "@/lib/static-asset";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

const headerMenuItems: NavLink[] = [
  { label: "FAQ", href: "https://dich-mit-stich.de/faq/", external: true },
  { label: "Erfahrungen", href: "https://dich-mit-stich.de/bewertungen-und-erfahrungen/", external: true },
  { label: "Region eingrenzen", href: "/tattoo-singles" },
  { label: "Lieblings-Studios", href: "/tattoo-studios" },
  { label: "Tattoo-Motive", href: "/magazin/tattoo-motive" },
  { label: "Erfolgsgeschichten", href: "/magazin/thema/erfolgsgeschichten" },
  { label: "Unser Expertenteam", href: "/magazin/expertenteam" },
  { label: "Piercings", href: "/magazin/piercing" },
  { label: "Social Media", href: "https://dich-mit-stich.de/social-media/", external: true },
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
      { label: "Unser Expertenteam", href: "/magazin/expertenteam" },
      { label: "Erfolgsgeschichten", href: "/magazin/thema/erfolgsgeschichten" },
      { label: "Christian M. Haas", href: "/magazin/unser-datingexperte" },
      { label: "Anne Schweitzer", href: "/magazin/author/anne-schweitzer" },
      { label: "Magazin-Start", href: "/magazin" },
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

function externalAttrs(external?: boolean) {
  return external ? { target: "_blank", rel: "noopener" } : undefined;
}

function marketHref(link: NavLink, market: MarketCode) {
  if (!link.external) return link.href;

  const url = new URL(link.href);
  if (url.hostname === "dich-mit-stich.de") {
    url.hostname = getMarket(market).domain;
  }
  return url.toString();
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

export function SiteHeader({ market = "de" }: { market?: MarketCode }) {
  const config = getMarket(market);

  if (!config.contentEnabled) {
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
          <a className="header-register header-register-primary" href={publicUrl(market, "/registration/")}>Registrieren</a>

          <details className="header-menu">
            <summary aria-label="Menü öffnen">
              <span className="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
              <span className="sr-only">Menü</span>
            </summary>
            <div className="header-menu-panel">
              <nav className="main-nav compact-menu-nav" aria-label="Hauptnavigation">
                {headerMenuItems.map((item) => (
                  <a href={marketHref(item, market)} key={item.href} {...externalAttrs(item.external)}>{item.label}</a>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ market = "de", sectionLive = false }: { market?: MarketCode; sectionLive?: boolean }) {
  const config = getMarket(market);

  if (!config.contentEnabled) {
    return (
      <footer className="site-footer-shell" id="site-footer">
        <div className="footer-surface footer-surface-compact">
          <div className="footer-compact-main">
            <div className="footer-brand-panel">
              <BrandLogo footer market={market} />
              <p>
                {sectionLive
                  ? `Entdecke Tattoo-Singles und alternative Szene-Guides ${market === "ch" ? "in der Schweiz" : `in ${config.countryName}`}.`
                  : `Der eigene Länderbereich für ${config.countryName} wird markt- und inhaltssauber vorbereitet.`}
              </p>
            </div>
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
      <div className="footer-surface">
        <section className="footer-cta footer-cta-dark" aria-label="Registrierung">
          <div className="footer-cta-copy">
            <p className="footer-kicker">Szene-Dating mit Profil</p>
            <h2>Flirte mit Tattoo- und Piercing-Singles, die wirklich zu deinem Stil passen.</h2>
            <p>Magazin, Stadtseiten und echte Erfolgsgeschichten helfen dir beim Einstieg — und führen direkt zu neuen Kontakten.</p>
          </div>
          <a className="footer-cta-button" href={publicUrl(market, "/registration/")}>
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
                        {column.links.map((link) => (
                          <li key={`${column.title}-${link.label}`}>
                            <a href={marketHref(link, market)} {...externalAttrs(link.external)}>{link.label}</a>
                          </li>
                        ))}
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
            <a href={publicUrl(market, "/registration/")}>Registrieren</a>
            <a href={publicUrl(market, "/login/")}>Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
