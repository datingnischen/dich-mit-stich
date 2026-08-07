'use client';

import { useMemo, useState } from 'react';
import { publicUrl } from '@/lib/markets';

type IconySinglesWidgetProps = {
  cityName: string;
  projectKey: string;
  postalCode: string;
  primaryColor?: string;
  legacyCounter?: string;
  iframeHeight?: number;
};

export function IconySinglesWidget({
  cityName,
  projectKey,
  postalCode,
  primaryColor = '68133c',
  legacyCounter = '43',
  iframeHeight = 220,
}: IconySinglesWidgetProps) {
  const [selectedGender, setSelectedGender] = useState<'women' | 'men'>('women');
  const selectedLabel = selectedGender === 'women' ? 'Frauen' : 'Männer';

  const src = useMemo(() => {
    const params = new URLSearchParams({
      h: '300',
      id: projectKey,
      pc: primaryColor,
      z: postalCode,
      ds: '',
      ctr: legacyCounter,
      it: '1',
      gender: selectedGender === 'women' ? '2' : '1',
    });

    return `https://js.icony.com/frame/?${params.toString()}`;
  }, [legacyCounter, postalCode, primaryColor, projectKey, selectedGender]);

  return (
    <section className="content-section icony-widget-section" aria-label={`Singles aus ${cityName}`}>
      <div className="icony-widget-shell">
        <div className="icony-widget-copy">
          <p className="eyebrow eyebrow-brand">Singles entdecken</p>
          <h2>Neue Singles in {cityName}</h2>
          <p>
            Wähle, ob du Frauen oder Männer sehen möchtest. Wenn du den Umkreis erweitern willst, kannst du direkt ausführlicher suchen.
          </p>
        </div>

        <div className="icony-widget-toggle" role="group" aria-label="Geschlecht wählen">
          <button
            type="button"
            className={`icony-widget-toggle-pill ${selectedGender === 'women' ? 'is-active' : ''}`}
            onClick={() => setSelectedGender('women')}
            aria-pressed={selectedGender === 'women'}
          >
            Frauen anzeigen
          </button>
          <button
            type="button"
            className={`icony-widget-toggle-pill ${selectedGender === 'men' ? 'is-active' : ''}`}
            onClick={() => setSelectedGender('men')}
            aria-pressed={selectedGender === 'men'}
          >
            Männer anzeigen
          </button>
        </div>

        <div className="icony-widget-frame-card" data-selected-gender={selectedGender}>
          <div className="icony-widget-frame-head">
            <strong>{selectedLabel} aus {cityName}</strong>
            <span>Lokale Profilvorschauen aus dem ICONY-Netzwerk</span>
          </div>
          <iframe
            title={`Singles aus ${cityName}`}
            src={src}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            frameBorder="0"
            className="icony-widget-frame"
            style={{ width: '100%', height: `${iframeHeight}px` }}
          />
        </div>

        <div className="icony-widget-actions">
          <a className="button button-primary icony-widget-link" href={publicUrl('at', '/suche/')}>
            Ausführlicher in {cityName} suchen
          </a>
          <span className="icony-widget-footnote">Kostenlos starten · Umkreis selbst erweitern · diskret stöbern</span>
        </div>
      </div>
    </section>
  );
}
