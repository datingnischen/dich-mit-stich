import type { DetailedHTMLProps, HTMLAttributes } from "react";

// <ui-strong>: fett gesetzte UI-Beschriftung (Kartentitel, Zähler, Labels) ohne die Betonung von <strong>/<b>,
// damit nur Hervorhebungen im Fließtext als <strong> zählen. Stil in app/globals.css.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ui-strong": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
