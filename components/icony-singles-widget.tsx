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
  primaryColor = "68133c",
  legacyCounter = "43",
  iframeHeight = 220,
}: IconySinglesWidgetProps) {
  const params = new URLSearchParams({
    h: '300',
    id: projectKey,
    pc: primaryColor,
    z: postalCode,
    ds: '',
    ctr: legacyCounter,
    it: '1',
  });

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
          style={{ width: '340px', maxWidth: '100%', height: `${iframeHeight}px` }}
        />
      </div>
    </section>
  );
}
