import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

/** Geheimnis für Hashes (Voter-Cookie, IP). Ohne CONTEST_SECRET wird nicht gehasht, sondern abgebrochen. */
export function contestSecret(): string {
  const secret = process.env.CONTEST_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("CONTEST_SECRET fehlt oder ist zu kurz (mindestens 16 Zeichen).");
  }
  return secret;
}

export function hashWithSecret(value: string, secret = contestSecret()): string {
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}

export function newVoterId(): string {
  return randomUUID();
}

export function isVoterId(value: string | undefined | null): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

/** Erste Adresse aus x-forwarded-for (Vercel setzt sie), sonst x-real-ip, sonst "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function tokensMatch(provided: string | undefined | null, expected: string | undefined | null): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const PUBLIC_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // ohne i, l, o, 0, 1

/** Kurze, URL-taugliche Kennung für Teilnehmerseiten (8 Zeichen, ~40 Bit). */
export function newPublicId(random: () => number = Math.random): string {
  let id = "";
  for (let index = 0; index < 8; index += 1) {
    id += PUBLIC_ID_ALPHABET[Math.floor(random() * PUBLIC_ID_ALPHABET.length)];
  }
  return id;
}

export function isPublicId(value: string | undefined | null): value is string {
  return typeof value === "string" && /^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/.test(value);
}
