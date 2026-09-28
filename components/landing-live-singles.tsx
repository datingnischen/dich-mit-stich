"use client";

import { useState } from "react";

import { useIconyActivities, type SelectedGender } from "@/components/icony-singles-widget";
import type { MarketCode } from "@/lib/markets";

type LandingLiveSinglesProps = {
  market: MarketCode;
  projectKey: string;
  postalCode: string;
  title: string;
  initialGender: SelectedGender;
  registrationUrl: string;
  ctaLabel: string;
};

const SHOWN_PROFILES = 8;

/**
 * Live-Beweis auf der Ads-Landingpage: acht zuletzt aktive ICONY-Profile rund um eine Postleitzahl.
 * Die Profilkarten führen auf ICONY, wo ohne Login die Registrierung folgt – der Klick ist also
 * selbst ein Conversion-Pfad.
 */
export function LandingLiveSingles({ market, projectKey, postalCode, title, initialGender, registrationUrl, ctaLabel }: LandingLiveSinglesProps) {
  const [gender, setGender] = useState<SelectedGender>(initialGender);
  const { activities, status, setStatus } = useIconyActivities({ market, projectKey, postalCode, gender, count: 15 });
  const shown = activities.slice(0, SHOWN_PROFILES);

  function choose(next: SelectedGender) {
    if (next === gender) return;
    setStatus("loading");
    setGender(next);
  }

  return (
    <section className="lp-section lp-live" id="live" aria-labelledby="lp-live-title">
      <div className="lp-section-head">
        <span className="lp-live-badge"><span aria-hidden="true" /> Live</span>
        <h2 id="lp-live-title">{title}</h2>
        <p>Echte Profile, zuletzt aktiv. Tippe auf ein Profil oder registriere dich kostenlos und schreib die erste Nachricht.</p>
      </div>

      <div className="lp-live-toggle" role="group" aria-label="Frauen oder Männer anzeigen">
        <button type="button" aria-pressed={gender === "women"} onClick={() => choose("women")}>Frauen</button>
        <button type="button" aria-pressed={gender === "men"} onClick={() => choose("men")}>Männer</button>
      </div>

      <div className="lp-live-grid" aria-live="polite" aria-busy={status === "loading"}>
        {status === "loading"
          ? Array.from({ length: SHOWN_PROFILES }, (_, index) => <span key={index} className="lp-live-skeleton" aria-hidden="true" />)
          : null}
        {status === "error" ? <p className="lp-live-status">Die Profile konnten gerade nicht geladen werden. Nach der Registrierung siehst du alle Singles in deiner Nähe.</p> : null}
        {status === "ready" && !shown.length ? (
          <p className="lp-live-status">Gerade ist hier niemand aktiv. Nach der Registrierung siehst du alle Singles in deinem Umkreis.</p>
        ) : null}
        {status === "ready"
          ? shown.map((activity, index) => (
              <a
                key={`${activity.username}-${index}`}
                className="lp-live-profile"
                href={activity.vcardurl}
                target="_blank"
                rel="noreferrer"
                title={activity.action_text}
              >
                {/* Externe ICONY-Profilbilder kommen dynamisch von der öffentlichen API. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activity.imageurl} alt={`Profilbild von ${activity.username}`} loading="lazy" />
                <span className="lp-live-dot" aria-hidden="true" />
                <span className="lp-live-name">
                  <ui-strong>{activity.username}</ui-strong>
                  <span>{activity.age} · {activity.city}</span>
                </span>
              </a>
            ))
          : null}
      </div>

      <div className="lp-cta-row">
        <a className="button button-primary lp-button" href={registrationUrl}>{ctaLabel}</a>
        <span className="lp-cta-note">Kostenlos · in 2 Minuten · Profil jederzeit löschbar</span>
      </div>
    </section>
  );
}
