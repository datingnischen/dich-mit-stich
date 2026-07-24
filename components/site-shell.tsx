const headerMenuItems = [
  { label: "Start", href: "/" },
  { label: "Magazin", href: "/magazin" },
  { label: "Tattoo-Singles", href: "/tattoo-singles" },
  { label: "Erfolgsgeschichten", href: "/magazin/thema/erfolgsgeschichten" },
  { label: "Ratgeber", href: "/magazin/thema/ratgeber" },
  { label: "Models & Szene", href: "/magazin/thema/tattoo-models" },
];

const footerColumns: Array<{
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    title: "Magazin",
    links: [
      { label: "Magazin-Start", href: "/magazin" },
      { label: "Erfolgsgeschichten", href: "/magazin/thema/erfolgsgeschichten" },
      { label: "Ratgeber", href: "/magazin/thema/ratgeber" },
      { label: "Tattoo-Persönlichkeiten", href: "/magazin/thema/tattoo-persoenlichkeiten" },
    ],
  },
  {
    title: "Städte",
    links: [
      { label: "Tattoo-Singles Übersicht", href: "/tattoo-singles" },
      { label: "Berlin", href: "/tattoo-singles/berlin" },
      { label: "Hamburg", href: "/tattoo-singles/hamburg" },
      { label: "Köln", href: "/tattoo-singles/koeln" },
    ],
  },
  {
    title: "Mitgliedschaft",
    links: [
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

function externalAttrs(external?: boolean) {
  return external ? { target: "_blank", rel: "noopener" } : undefined;
}

export function SiteHeader() {
  return (
    <header className="site-header-shell">
      <div className="site-header-bar compact-header-bar shell">
        <a className="brand-lockup dms-brand-lockup" href="/" aria-label="Dich mit Stich Startseite">
          <span className="brand-lockup-mark">D!</span>
          <span className="brand-lockup-copy">
            <strong>dich mit stich</strong>
            <small>Tattoo-, Piercing- & Szene-Dating</small>
          </span>
        </a>

        <div className="header-actions compact-header-actions" aria-label="Nutzeraktionen">
          <a className="login-link" href="https://dich-mit-stich.de/login/">Login</a>
          <a className="header-register header-register-primary" href="https://dich-mit-stich.de/registration/">Registrieren</a>

          <details className="header-menu">
            <summary aria-label="Menü öffnen">
              <span className="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
              <span>Menü</span>
            </summary>
            <div className="header-menu-panel">
              <nav className="main-nav compact-menu-nav" aria-label="Hauptnavigation">
                {headerMenuItems.map((item) => (
                  <a href={item.href} key={item.href}>{item.label}</a>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer-shell">
      <section className="footer-cta footer-cta-dark" aria-label="Registrierung">
        <div>
          <p className="eyebrow">Szene-Dating mit Profil</p>
          <h2>Flirte mit Tattoo- und Piercing-Singles, die wirklich zu deinem Stil passen.</h2>
          <p>Magazin, Stadtseiten und echte Erfolgsgeschichten führen direkt in den passenden Registrierungsflow.</p>
        </div>
        <a className="footer-cta-button" href="https://dich-mit-stich.de/registration/">Jetzt kostenlos registrieren</a>
      </section>

      <div className="footer-main">
        <div className="footer-brand-panel">
          <a className="brand-lockup footer-brand-wordmark dms-brand-lockup" href="/" aria-label="Dich mit Stich Startseite">
            <span className="brand-lockup-mark">D!</span>
            <span className="brand-lockup-copy">
              <strong>dich mit stich</strong>
              <small>Tattoo-, Piercing- & Szene-Dating</small>
            </span>
          </a>
          <p>
            Dich mit Stich verbindet Szene-Feeling, Dating-Ratgeber, Stadtseiten und echte Erfolgsgeschichten in einer
            deutlich saubereren Magazin-Oberfläche – orientiert am elFlirt-Qualitätsstandard, aber mit eigener dunklerer Brand-Attitüde.
          </p>
          <ul className="footer-trust-list" aria-label="Vertrauensmerkmale">
            <li>Eigener Szene-Fokus statt Massenbörse</li>
            <li>Magazin + Stadtseiten aus echten Quellsystemen</li>
            <li>Direkter Einstieg in den Live-Registrierungsflow</li>
          </ul>
        </div>

        <nav className="footer-link-grid" aria-label="Footer Navigation">
          {footerColumns.map((column) => (
            <div className="footer-column" key={column.title}>
              <h2>{column.title}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a href={link.href} {...externalAttrs(link.external)}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="sub-footer">
        <div>
          <span>© {new Date().getFullYear()} Dich mit Stich</span>
        </div>
        <div className="sub-footer-links">
          <a href="https://dich-mit-stich.de/registration/">Registrieren</a>
          <a href="https://dich-mit-stich.de/login/">Login</a>
        </div>
      </div>
    </footer>
  );
}
