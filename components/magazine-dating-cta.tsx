import Image from "next/image";
import Link from "next/link";
import { staticAsset } from "@/lib/static-asset";

const FLIRTRADAR_IMAGE = staticAsset("/brand/flirtradar-umkreissuche.png");

export function MagazineDatingCta() {
  return (
    <aside className="content-section magazine-dating-cta" aria-labelledby="magazine-dating-title">
      <div className="magazine-dating-copy">
        <span className="eyebrow eyebrow-brand">Flirtradar & Umkreissuche</span>
        <h2 id="magazine-dating-title">Dein Stil ist kein Zufall. Dein nächster Flirt muss es auch nicht sein.</h2>
        <p>
          Entdecke Tattoo- und Piercing-Singles in deiner Nähe. Mit dem Flirtradar siehst du schnell, wer deinen Stil
          teilt und nur wenige Kilometer entfernt ist.
        </p>
        <ul className="trust-points" aria-label="Vorteile des Flirtradars">
          <li>Passende Singles nach Entfernung entdecken</li>
          <li>Kostenlos starten und den Suchradius selbst bestimmen</li>
        </ul>
        <div className="button-row">
          <Link className="button button-primary" href="https://dich-mit-stich.de/registration/?AID=magazin">
            Flirtradar kostenlos nutzen
          </Link>
          <Link className="button button-secondary" href="/tattoo-singles">
            Tattoo-Singles nach Stadt
          </Link>
        </div>
      </div>

      <div className="magazine-dating-visual">
        <div className="magazine-dating-frame">
          <Image
            src={FLIRTRADAR_IMAGE}
            alt="Flirtradar mit Umkreissuche für Tattoo- und Piercing-Singles"
            width={1200}
            height={675}
            sizes="(max-width: 900px) 100vw, 420px"
          />
        </div>
      </div>
    </aside>
  );
}
