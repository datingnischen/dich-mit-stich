import type sanitizeHtml from "sanitize-html";

import { normalizeWordPressUrls } from "./wordpress-origin.ts";

// Audio-Zusammenfassungen (<!-- audio-summary -->) bringen einen eigenen Player mit; ohne ihn bliebe nur der
// Fallback-Text „Dein Browser unterstützt das Audio-Element nicht“ stehen. Beide Sanitizer (WordPress-Grenze
// und Marktausgabe) nutzen dieselben Regeln.
export const MAGAZINE_AUDIO_TAGS = ["audio", "source"];
export const MAGAZINE_AUDIO_ATTRIBUTES = { audio: ["controls", "preload"], source: ["src", "type"] };
export const magazineAudioTransforms = {
  audio: (tagName: string) => ({ tagName, attribs: { controls: "", preload: "none" } }),
  source: (tagName: string, attributes: sanitizeHtml.Attributes) => {
    const src = normalizeWordPressUrls(attributes.src || "");
    return {
      tagName,
      attribs: {
        ...(/^https:\/\//i.test(src) ? { src } : {}),
        ...(/^audio\/[a-z0-9.+-]+$/i.test(attributes.type || "") ? { type: attributes.type } : {}),
      },
    };
  },
};
