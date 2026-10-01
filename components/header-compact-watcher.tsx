"use client";

import { useEffect, useRef } from "react";

// Setzt data-compact am Header, sobald gescrollt wurde. Das CSS macht den
// Header mobil dann einzeilig. Getrennte Schwellen (ein/aus), damit der
// Header nicht flackert, wenn sich seine Höhe beim Umschalten ändert.
const COMPACT_ON = 120;
const COMPACT_OFF = 40;

export function HeaderCompactWatcher() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = markerRef.current?.closest("header");
    if (!header) return;

    let compact = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = compact ? window.scrollY > COMPACT_OFF : window.scrollY > COMPACT_ON;
      if (next === compact) return;
      compact = next;
      header.toggleAttribute("data-compact", compact);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
