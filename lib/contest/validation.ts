import { CONTEST_LIMITS } from "./config.ts";

export type EntryInput = {
  displayName: string;
  age: number;
  city: string | null;
  caption: string;
  email: string;
  photoUrl: string;
  consentTerms: true;
  consentImage: true;
};

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
export const BLOB_FOLDER = "contest/";
const LINK_PATTERN = /https?:\/\/|www\./i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function truthy(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

/** Prüft die Felder des Teilnahmeformulars; Fehlermeldungen sind für Besucher gedacht. */
export function validateEntryInput(raw: unknown): Validation<EntryInput> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const displayName = text(body.displayName);
  if (displayName.length < CONTEST_LIMITS.displayNameMin || displayName.length > CONTEST_LIMITS.displayNameMax) {
    return {
      ok: false,
      error: `Bitte gib einen Namen oder Nickname mit ${CONTEST_LIMITS.displayNameMin} bis ${CONTEST_LIMITS.displayNameMax} Zeichen an.`,
    };
  }
  if (LINK_PATTERN.test(displayName)) {
    return { ok: false, error: "Links sind im Namen nicht erlaubt." };
  }

  const age = Number.parseInt(String(body.age ?? ""), 10);
  if (!Number.isInteger(age) || age < CONTEST_LIMITS.minAge || age > CONTEST_LIMITS.maxAge) {
    return { ok: false, error: `Teilnehmen kannst du ab ${CONTEST_LIMITS.minAge} Jahren. Bitte gib dein Alter an.` };
  }

  const city = text(body.city);
  if (city.length > CONTEST_LIMITS.cityMax) {
    return { ok: false, error: `Der Ort darf höchstens ${CONTEST_LIMITS.cityMax} Zeichen haben.` };
  }

  const caption = typeof body.caption === "string"
    ? body.caption.trim().replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n")
    : "";
  if (caption.length < 10) {
    return { ok: false, error: "Erzähl in mindestens 10 Zeichen etwas über dich oder dein Tattoo." };
  }
  if (caption.length > CONTEST_LIMITS.captionMax) {
    return { ok: false, error: `Dein Text darf höchstens ${CONTEST_LIMITS.captionMax} Zeichen haben.` };
  }
  if (LINK_PATTERN.test(caption)) {
    return { ok: false, error: "Links sind im Text nicht erlaubt." };
  }

  const email = text(body.email).toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 120) {
    return {
      ok: false,
      error: "Bitte gib eine gültige E-Mail-Adresse an (nur für Rückfragen und die Gewinnbenachrichtigung).",
    };
  }

  const photoUrl = text(body.photoUrl);
  if (!isAllowedBlobUrl(photoUrl)) {
    return { ok: false, error: "Das Foto wurde nicht korrekt hochgeladen. Bitte wähle es noch einmal aus." };
  }

  if (!truthy(body.consentTerms)) {
    return { ok: false, error: "Bitte bestätige die Teilnahmebedingungen." };
  }
  if (!truthy(body.consentImage)) {
    return { ok: false, error: "Bitte bestätige, dass du auf dem Foto zu sehen bist und wir es zeigen dürfen." };
  }

  return {
    ok: true,
    value: {
      displayName,
      age,
      city: city || null,
      caption,
      email,
      photoUrl,
      consentTerms: true,
      consentImage: true,
    },
  };
}

/** Nur Dateien aus dem eigenen Blob-Ordner `contest/` auf einem Vercel-Blob-Host werden angenommen. */
export function isAllowedBlobUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:"
    && url.hostname.endsWith(BLOB_HOST_SUFFIX)
    && url.hostname.length > BLOB_HOST_SUFFIX.length
    && url.pathname.startsWith(`/${BLOB_FOLDER}`)
    && !url.search
  );
}

export function blobPathnameFromUrl(value: string): string {
  return decodeURIComponent(new URL(value).pathname.replace(/^\/+/, ""));
}

export function isAllowedImageType(type: string | undefined | null): boolean {
  return typeof type === "string" && CONTEST_LIMITS.allowedImageTypes.includes(type);
}

export function imageExtension(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}
