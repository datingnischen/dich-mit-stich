'use client';

import { useEffect, useState } from "react";

import { STUDIO_STYLE_TRIGGER } from "@/lib/studio-guide-sections";

type StyleCount = { slug: string; label: string; count: number };

/**
 * Filters the studio cards of a city by style. Cards carry their style slugs in
 * data-studio-styles; links elsewhere on the page with data-studio-style="a,b" set the filter too.
 */
export function StudioStyleFilter({ styles, total, gridId }: { styles: StyleCount[]; total: number; gridId: string }) {
  const [active, setActive] = useState<string[]>([]);

  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    let visible = 0;
    for (const card of grid.querySelectorAll<HTMLElement>("[data-studio-styles]")) {
      const cardStyles = (card.dataset.studioStyles || "").split(" ");
      const show = !active.length || active.some((slug) => cardStyles.includes(slug));
      card.hidden = !show;
      if (show) visible += 1;
    }
    grid.dataset.visibleCount = String(visible);
  }, [active, gridId]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const trigger = (event.target as Element | null)?.closest<HTMLElement>(`[${STUDIO_STYLE_TRIGGER}]`);
      if (!trigger) return;
      setActive((trigger.getAttribute(STUDIO_STYLE_TRIGGER) || "").split(",").filter(Boolean));
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="studio-style-filter" role="group" aria-label="Studios nach Stil filtern">
      <span className="studio-style-filter-label">Nach Stil filtern</span>
      <div className="studio-style-filter-chips">
        <button type="button" aria-pressed={!active.length} onClick={() => setActive([])}>
          Alle <small>{total}</small>
        </button>
        {styles.map((style) => {
          const pressed = active.length === 1 && active[0] === style.slug;
          return (
            <button
              key={style.slug}
              type="button"
              aria-pressed={pressed}
              onClick={() => setActive(pressed ? [] : [style.slug])}
            >
              {style.label} <small>{style.count}</small>
            </button>
          );
        })}
      </div>
      {active.length ? (
        <p className="studio-style-filter-status" aria-live="polite">
          Gefiltert: {styles.filter((style) => active.includes(style.slug)).map((style) => style.label).join(", ")}
          {" · "}
          <button type="button" onClick={() => setActive([])}>Filter zurücksetzen</button>
        </p>
      ) : null}
    </div>
  );
}
