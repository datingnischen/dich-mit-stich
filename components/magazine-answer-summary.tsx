import type { AnswerEnginePilotEntry } from "@/lib/magazine-answer-engine";

type MagazineAnswerSummaryProps = {
  entry: AnswerEnginePilotEntry;
};

export function MagazineAnswerSummary({ entry }: MagazineAnswerSummaryProps) {
  const headingId = `kurz-antwort-${entry.slug}`;

  return (
    <section className="magazine-answer-summary" aria-labelledby={headingId}>
      <span className="eyebrow">Kurz beantwortet</span>
      <h2 id={headingId}>{entry.heading}</h2>
      <p className="magazine-answer-direct">{entry.directAnswer}</p>
      <ul className="magazine-answer-facts">
        {entry.keyFacts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <footer className="magazine-answer-sources">
        <strong>Redaktionell geprüft am {entry.reviewedAtLabel}</strong>
        <span>Fachquellen:</span>
        <ul>
          {entry.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </section>
  );
}
