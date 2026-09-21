import Image from "next/image";

import { staticAsset } from "@/lib/static-asset";

const AMAZON_URL = "https://www.amazon.de/dp/3696371211/";

export function PublishedBookFeature() {
  return (
    <section className="published-book-feature" aria-labelledby="published-book-title">
      <div className="published-book-visual" aria-hidden="true">
        <div className="published-book-cover">
          <Image
            src={staticAsset("/images/books/dating-ohne-bullshit-cover.webp")}
            alt=""
            width={1748}
            height={2480}
            sizes="(max-width: 720px) 210px, 280px"
            unoptimized
          />
        </div>
      </div>

      <div className="published-book-copy">
        <span className="eyebrow">Buch von Christian M. Haas</span>
        <h2 id="published-book-title">Dating ohne Bullshit</h2>
        <p className="published-book-subtitle">Der ungeschönte Insiderblick ins Online-Dating-Business</p>
        <p className="published-book-hook">
          Kein Datingratgeber, sondern ein ehrlicher Blick hinter die Kulissen: auf den Aufbau von Datingplattformen,
          unternehmerische Entscheidungen, Rückschläge und die Verantwortung hinter digitalen Begegnungen.
        </p>
        <ul className="published-book-facts" aria-label="Buchdetails">
          <li>Taschenbuch</li>
          <li>136 Seiten</li>
          <li>1. Auflage</li>
          <li>ISBN 978-3-6963-7121-0</li>
        </ul>
        <a className="button button-primary published-book-cta" href={AMAZON_URL} target="_blank" rel="noopener noreferrer nofollow">
          Buch bei Amazon ansehen
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
