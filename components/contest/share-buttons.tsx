'use client';

import { useState, useSyncExternalStore } from "react";

type ShareButtonsProps = {
  url: string;
  title: string;
  text: string;
};

const noop = () => () => {};
const canShareOnClient = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const canShareOnServer = () => false;

/** Teilen-Leiste für Teilnehmerseiten: WhatsApp, Facebook, Link kopieren, Systemdialog wenn vorhanden. */
export function ShareButtons({ url, title, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  // Server rendert ohne Systemdialog-Button, der Client blendet ihn nach der Hydration ein (kein Hydration-Mismatch).
  const canShare = useSyncExternalStore(noop, canShareOnClient, canShareOnServer);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text} ${url}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Link kopieren:", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // Abbruch durch Nutzer: nichts zu tun
    }
  }

  return (
    <div className="contest-share">
      <p className="contest-share-title">Hol dir Stimmen: Teile deine Seite</p>
      <div className="button-row">
        <a className="button button-secondary" href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a
          className="button button-secondary"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <button type="button" className="button button-secondary" onClick={copyLink}>
          {copied ? "Link kopiert ✓" : "Link kopieren"}
        </button>
        {canShare ? (
          <button type="button" className="button button-secondary" onClick={nativeShare}>
            Teilen …
          </button>
        ) : null}
      </div>
      <p className="contest-share-hint">
        Für Instagram: Link kopieren und in deine Story oder Bio setzen. Jede Person kann einmal am Tag für dich abstimmen.
      </p>
    </div>
  );
}
