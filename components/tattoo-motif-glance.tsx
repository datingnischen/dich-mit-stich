import type { TattooMotifSpotlight } from "@/lib/tattoo-motifs";

function GlanceRow({ label, items }: { label: string; items: readonly string[] }) {
  if (!items.length) return null;

  return (
    <div className="motif-glance-row">
      <dt>{label}</dt>
      <dd>
        <ul className="motif-glance-chips">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

/** Scan-first summary between the cover and the article: what the motif means and where it sits. */
export function TattooMotifGlance({ spotlight }: { spotlight: TattooMotifSpotlight }) {
  return (
    <section className="motif-glance" aria-labelledby="motif-glance-title">
      <div className="motif-glance-head">
        <span className="eyebrow eyebrow-brand">Auf einen Blick</span>
        <h2 id="motif-glance-title">{spotlight.motif} Tattoo in 20 Sekunden</h2>
        <span className="motif-glance-time">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {spotlight.readingMinutes} Min. Lesezeit
        </span>
      </div>
      <dl className="motif-glance-grid">
        <GlanceRow label="Steht für" items={spotlight.meanings} />
        <GlanceRow label="Beliebt auf" items={spotlight.placements} />
        <GlanceRow label="Oft kombiniert mit" items={spotlight.pairings} />
      </dl>
    </section>
  );
}
