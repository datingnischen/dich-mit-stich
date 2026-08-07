'use client';

import { useEffect, useState } from 'react';
import { publicUrl, type MarketCode } from '@/lib/markets';

type IconySinglesWidgetProps = {
  market: MarketCode;
  cityName: string;
  projectKey: string;
  postalCode: string;
};

type SelectedGender = 'women' | 'men';

type IconyActivity = {
  action_text: string;
  age: number;
  city: string;
  country: string;
  gender: 'female' | 'male' | string;
  imageurl: string;
  username: string;
  vcardurl: string;
};

type IconyResponse = {
  data?: IconyActivity[];
};

type IconyQueueItem = IArguments & { id: string };
type IconyClient = {
  (...args: unknown[]): string;
  q: IconyQueueItem[];
  R?: () => void;
};

declare global {
  interface Window {
    IconyObject?: string;
    dmsIcony?: IconyClient;
  }
}

let iconyApiPromise: Promise<IconyClient> | null = null;

function createRequestId() {
  return `i${crypto.randomUUID().replaceAll('-', '')}`;
}

function loadIconyApi() {
  if (iconyApiPromise) {
    return iconyApiPromise;
  }

  iconyApiPromise = new Promise<IconyClient>((resolve, reject) => {
    window.IconyObject = 'dmsIcony';

    const client = function iconyClient(...args: unknown[]) {
      const queueItem = args as unknown as IconyQueueItem;
      queueItem.id = createRequestId();
      client.q.push(queueItem);
      client.R?.();
      return queueItem.id;
    } as IconyClient;

    client.q = [];
    window.dmsIcony = client;

    const script = document.createElement('script');
    script.src = 'https://js.icony.com/api.js';
    script.async = true;
    script.onload = () => resolve(client);
    script.onerror = () => reject(new Error('ICONY API konnte nicht geladen werden.'));
    document.head.appendChild(script);
  });

  return iconyApiPromise;
}

export function IconySinglesWidget({ market, cityName, projectKey, postalCode }: IconySinglesWidgetProps) {
  const [selectedGender, setSelectedGender] = useState<SelectedGender>('women');
  const [activities, setActivities] = useState<IconyActivity[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const selectedLabel = selectedGender === 'women' ? 'Frauen' : 'Männer';
  const expectedGender = selectedGender === 'women' ? 'female' : 'male';

  useEffect(() => {
    let cancelled = false;

    loadIconyApi()
      .then((icony) => {
        icony('create', projectKey);
        icony(
          'get',
          'activities', 'json',
          (response: IconyResponse) => {
            if (cancelled) return;

            const filteredActivities = (response.data ?? []).filter(
              (activity) => activity.gender === expectedGender,
            );
            setActivities(filteredActivities);
            setStatus('ready');
          },
          {
            count: 15,
            gender: selectedGender === 'women' ? 2 : 1,
            zip: postalCode,
            auto_load: false,
          },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setActivities([]);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [expectedGender, postalCode, projectKey, selectedGender]);

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
            onClick={() => {
              setStatus('loading');
              setSelectedGender('women');
            }}
            aria-pressed={selectedGender === 'women'}
          >
            Frauen anzeigen
          </button>
          <button
            type="button"
            className={`icony-widget-toggle-pill ${selectedGender === 'men' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus('loading');
              setSelectedGender('men');
            }}
            aria-pressed={selectedGender === 'men'}
          >
            Männer anzeigen
          </button>
        </div>

        <div className="icony-widget-frame-card" data-selected-gender={selectedGender}>
          <div className="icony-widget-frame-head">
            <strong>{selectedLabel} aus {cityName}</strong>
            <span>Singles aus {cityName} und Umgebung</span>
          </div>

          <div className="icony-widget-results" aria-live="polite" aria-busy={status === 'loading'}>
            {status === 'loading' ? <p className="icony-widget-status">Profile werden geladen …</p> : null}
            {status === 'error' ? (
              <p className="icony-widget-status">Die Profile konnten gerade nicht geladen werden.</p>
            ) : null}
            {status === 'ready' && activities.length === 0 ? (
              <p className="icony-widget-status">Aktuell sind keine passenden Profile verfügbar.</p>
            ) : null}
            {status === 'ready'
              ? activities.map((activity, index) => (
                  <a
                    className="icony-profile-card"
                    data-gender={activity.gender}
                    href={activity.vcardurl}
                    target="_blank"
                    rel="noreferrer"
                    key={`${activity.username}-${index}`}
                  >
                    {/* External ICONY profile images are delivered dynamically by its public API. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activity.imageurl} alt={`Profilbild von ${activity.username}`} loading="lazy" />
                    <span className="icony-profile-copy">
                      <strong>{activity.username}</strong>
                      <span>{activity.age} Jahre, {activity.city}</span>
                      <small>{activity.action_text}</small>
                    </span>
                  </a>
                ))
              : null}
          </div>
        </div>

        <div className="icony-widget-actions">
          <a className="button button-primary icony-widget-link" href={publicUrl(market, '/suche/')}>
            Ausführlicher in {cityName} suchen
          </a>
          <span className="icony-widget-footnote">Kostenlos starten · Umkreis selbst erweitern · diskret stöbern</span>
        </div>
      </div>
    </section>
  );
}
