'use client';

import { useState } from 'react';

import { useIconyActivities, type SelectedGender } from '@/components/icony-singles-widget';
import { buildIconyCitySearchPath } from '@/lib/icony-city-widgets';
import { publicUrl, type MarketCode } from '@/lib/markets';

type IconyOnlineCardProps = {
  market: MarketCode;
  cityName: string;
  projectKey: string;
  postalCode: string;
};

/** Sidebar teaser with six recently active singles around a city. */
export function IconyOnlineCard({ market, cityName, projectKey, postalCode }: IconyOnlineCardProps) {
  const [gender, setGender] = useState<SelectedGender>('women');
  const { activities, status, setStatus } = useIconyActivities({ market, projectKey, postalCode, gender, count: 12 });
  const shown = activities.slice(0, 6);

  function choose(next: SelectedGender) {
    if (next === gender) return;
    setStatus('loading');
    setGender(next);
  }

  return (
    <aside className="icony-online-card" aria-labelledby="icony-online-title">
      <div className="icony-online-head">
        <span className="icony-online-live"><span aria-hidden="true" /> Live</span>
        <h2 id="icony-online-title">
          Tätowierte Singles
          <small>Wer ist gerade online?</small>
        </h2>
      </div>

      <div className="icony-online-toggle" role="group" aria-label="Geschlecht wählen">
        <button type="button" aria-pressed={gender === 'women'} onClick={() => choose('women')}>Frauen</button>
        <button type="button" aria-pressed={gender === 'men'} onClick={() => choose('men')}>Männer</button>
      </div>

      <div className="icony-online-grid" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading'
          ? Array.from({ length: 6 }, (_, index) => <span key={index} className="icony-online-skeleton" aria-hidden="true" />)
          : null}
        {status === 'error' ? <p className="icony-online-status">Die Profile konnten gerade nicht geladen werden.</p> : null}
        {status === 'ready' && !shown.length ? (
          <p className="icony-online-status">Gerade ist niemand aus {cityName} aktiv – schau gleich noch einmal vorbei.</p>
        ) : null}
        {status === 'ready'
          ? shown.map((activity, index) => (
              <a
                key={`${activity.username}-${index}`}
                className="icony-online-profile"
                href={activity.vcardurl}
                target="_blank"
                rel="noreferrer"
                title={activity.action_text}
              >
                {/* External ICONY profile images are delivered dynamically by its public API. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activity.imageurl} alt={`Profilbild von ${activity.username}`} loading="lazy" />
                <span className="icony-online-dot" aria-hidden="true" />
                <span className="icony-online-name">
                  <strong>{activity.username}</strong>
                  <span>{activity.age} · {activity.city}</span>
                </span>
              </a>
            ))
          : null}
      </div>

      <a className="button button-primary icony-online-cta" href={publicUrl(market, buildIconyCitySearchPath(market, postalCode))}>
        Alle Singles aus {cityName}
      </a>
      <span className="icony-online-note">Kostenlos starten · diskret stöbern</span>
    </aside>
  );
}
