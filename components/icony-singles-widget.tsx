type IconySinglesWidgetProps = {
  cityName: string;
  projectKey: string;
  postalCode: string;
  width?: number;
  height?: number;
  count?: number;
  ageMin?: number;
  ageMax?: number;
  affiliateId?: string;
};

export function IconySinglesWidget({
  cityName,
  projectKey,
  postalCode,
  width = 960,
  height = 560,
  count = 10,
  ageMin = 18,
  ageMax = 45,
  affiliateId,
}: IconySinglesWidgetProps) {
  const params = new URLSearchParams({
    id: projectKey,
    w: String(width),
    h: String(height),
    c: String(count),
    as: String(ageMin),
    ae: String(ageMax),
    z: postalCode,
    cta: '1',
    ctat: `Jetzt Singles aus ${cityName} ansehen`,
  });

  if (affiliateId) {
    params.set('aid', affiliateId);
  }

  const src = `https://js.icony.com/frame/?${params.toString()}`;

  return (
    <section className="content-section icony-widget-section" aria-label={`Singles aus ${cityName}`}>
      <div className="panel-card icony-widget-card">
        <span className="eyebrow eyebrow-brand">Singles aus {cityName}</span>
        <h2>Aktuelle Singles aus {cityName} entdecken</h2>
        <p>Hier siehst du direkt Singles aus {cityName} und der näheren Umgebung aus dem ICONY-Netzwerk.</p>
        <iframe
          title={`Singles aus ${cityName}`}
          src={src}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          frameBorder="0"
          className="icony-widget-frame"
          style={{ width: '100%', height: `${height}px` }}
        />
      </div>
    </section>
  );
}
