import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFrame } from "@/components/site-frame";
import { publicUrl } from "@/lib/markets";
import { getTattooStudio, getTattooStudioCityGuide, getTattooStudioSlugs } from "@/lib/tattoo-studio-guide";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getTattooStudioSlugs("de").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const studio = getTattooStudio("de", slug);
  if (!studio) return {};
  return {
    title: `${studio.name} in ${studio.cityName}: Studio-Profil`,
    description: `${studio.name} in ${studio.cityName}: Stilrichtungen, Adresse, Website und transparente redaktionelle Einordnung.`,
    alternates: { canonical: publicUrl("de", `/tattoo-studio/${slug}`) },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function TattooStudioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const studio = getTattooStudio("de", slug);
  if (!studio) notFound();
  const city = getTattooStudioCityGuide("de", studio.citySlug);
  if (!city) notFound();
  const related = city.studios.filter((item) => item.slug !== studio.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TattooParlor",
    name: studio.name,
    description: studio.description,
    url: publicUrl("de", `/tattoo-studio/${studio.slug}`),
    sameAs: studio.websiteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: studio.address,
      addressLocality: studio.cityName,
      addressCountry: studio.country,
    },
  };

  return (
    <SiteFrame market="de" sectionLive>
      <main className="shell studio-guide-shell studio-detail-shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

        <nav className="studio-breadcrumb" aria-label="Breadcrumb">
          <Link href="/tattoo-studios">Studio-Guide</Link><span>›</span>
          <Link href={`/tattoo-studios/${studio.citySlug}`}>{studio.cityName}</Link><span>›</span><span>{studio.name}</span>
        </nav>

        <section className="studio-detail-hero">
          <div className="studio-detail-monogram" aria-hidden="true"><span>Studio</span><strong>{studio.name.slice(0, 2).toUpperCase()}</strong><small>{studio.cityName}</small></div>
          <div className="studio-detail-hero-copy">
            <span className="eyebrow studio-guide-eyebrow">Tattoo-Studio in {studio.cityName}</span>
            <h1>{studio.name}</h1>
            <p>{studio.description}</p>
            {studio.styles.length ? <div className="studio-style-row studio-detail-styles">{studio.styles.map((style) => <span key={style.slug}>{style.label}</span>)}</div> : null}
            <div className="button-row">
              <a className="button button-primary" href={studio.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">Website des Studios öffnen</a>
              <Link className="button button-secondary" href={`/tattoo-studios/${studio.citySlug}`}>Weitere Studios in {studio.cityName}</Link>
            </div>
          </div>
        </section>

        <section className="studio-detail-grid">
          <article className="panel-card studio-fact-card">
            <span className="eyebrow">Studio-Steckbrief</span>
            <dl>
              <div><dt>Adresse</dt><dd>{studio.address}</dd></div>
              <div><dt>Kontakt</dt><dd>{studio.contact || "Über die Studio-Website"}</dd></div>
              <div><dt>Website</dt><dd><a href={studio.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">{new URL(studio.websiteUrl).hostname}</a></dd></div>
              <div><dt>Datenstatus</dt><dd>Redaktionell erfasst</dd></div>
            </dl>
          </article>
          <aside className="panel-card studio-trust-card">
            <span className="eyebrow">Vertrauen & Aktualität</span>
            <h2>Transparent statt Sterne-Ranking</h2>
            <ul>
              <li>Zuletzt redaktionell geprüft: <strong>{formatDate(studio.lastVerified)}</strong></li>
              <li>Keine bezahlte Platzierung</li>
              <li>Angaben basieren auf öffentlich zugänglichen Studioinformationen</li>
            </ul>
            <a href={publicUrl("de", "/kontakt/")}>Datenänderung melden →</a>
          </aside>
        </section>

        {related.length ? (
          <section className="content-section">
            <div className="section-header studio-guide-section-header"><span className="eyebrow">In der Nähe</span><h2>Weitere Studios in {studio.cityName}</h2></div>
            <div className="studio-related-grid">
              {related.map((item) => <Link href={`/tattoo-studio/${item.slug}`} key={item.identity}><span>Studio-Profil</span><h3>{item.name}</h3><strong>Öffnen →</strong></Link>)}
            </div>
          </section>
        ) : null}
      </main>
    </SiteFrame>
  );
}
