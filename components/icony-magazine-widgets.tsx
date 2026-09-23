import { buildIconyActivityFrame, buildIconyRegistrationFrame, type IconyFrameWidget } from "@/lib/icony-frame-widgets";
import type { MarketCode } from "@/lib/markets";

export function IconyFrame({ widget }: { widget: IconyFrameWidget }) {
  return (
    <iframe
      className="icony-embed-frame"
      src={widget.src}
      title={widget.title}
      width={widget.width}
      height={widget.height}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}

/** The two ICONY embeds the legacy magazine sidebar carried, kept under the article instead. */
export function IconyMagazineWidgets({ market }: { market: MarketCode }) {
  return (
    <section className="content-section icony-embed-section" aria-labelledby="icony-embed-title">
      <div className="icony-embed-head">
        <span className="eyebrow eyebrow-brand">Singles entdecken</span>
        <h2 id="icony-embed-title">Schau, wer gerade online ist</h2>
        <p>
          Die Suche nach tätowierten und gepiercten Singles startet direkt hier: sieh die aktuellen Aktivitäten
          oder melde dich in unter einer Minute kostenlos an.
        </p>
      </div>

      <div className="icony-embed-grid">
        <div className="icony-embed-card">
          <h3>Gerade online</h3>
          <IconyFrame widget={buildIconyActivityFrame(market, "magazin")} />
        </div>

        <div className="icony-embed-card">
          <h3>Kostenlos registrieren</h3>
          <IconyFrame widget={buildIconyRegistrationFrame(market, "magazin")} />
        </div>
      </div>
    </section>
  );
}
