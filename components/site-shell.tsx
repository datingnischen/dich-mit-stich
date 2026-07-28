type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

const headerMenuItems: NavLink[] = [
  { label: "Start", href: "/" },
  { label: "Magazin", href: "/magazin" },
  { label: "Singlebörse", href: "https://dich-mit-stich.de/?AID=magazin", external: true },
  { label: "Tattoo-Motive", href: "/magazin/tattoo-motive" },
  { label: "Tattoo-Lexikon", href: "/magazin/tattoo-lexikon" },
  { label: "Piercings", href: "/magazin/piercing" },
  { label: "Über uns", href: "/magazin/expertenteam" },
  { label: "Tattoo-Singles", href: "/tattoo-singles" },
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
              <span className="sr-only">Menü</span>
            </summary>
            <div className="header-menu-panel">
              <nav className="main-nav compact-menu-nav" aria-label="Hauptnavigation">
                {headerMenuItems.map((item) => (
                  <a href={item.href} key={item.href} {...externalAttrs(item.external)}>{item.label}</a>
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
          <p>Magazin, Stadtseiten und echte Erfolgsgeschichten helfen dir beim Einstieg — und führen direkt zu neuen Kontakten.</p>
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
            klaren, vertrauensvollen Oberfläche für Menschen mit eigenem Stil.
          </p>
          <ul className="footer-trust-list" aria-label="Vertrauensmerkmale">
            <li>Eigener Szene-Fokus statt Massenbörse</li>
            <li>Magazin + Stadtseiten mit klarer Orientierung</li>
            <li>Alle wichtigen Magazin-Menüpunkte auch direkt im Footer erreichbar</li>
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
