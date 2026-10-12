import { NextResponse, type NextRequest } from "next/server.js";
import { CONTEST_COOKIES } from "./config.ts";
import { getContestSql, isContestConfigured, type SqlClient } from "./db.ts";
import { clientIp, hashWithSecret, isVoterId, newVoterId, tokensMatch } from "./identity.ts";

/** Einheitliche Fehlerantwort der Contest-API. */
export function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function contestUnavailable() {
  return jsonError(503, "Der Contest ist gerade nicht erreichbar. Bitte versuche es später noch einmal.");
}

/** Datenbank-Client, wenn Datenbank, Blob-Store und Geheimnis konfiguriert sind; sonst null. */
export function requireConfiguredSql(): SqlClient | null {
  if (!isContestConfigured()) return null;
  try {
    return getContestSql();
  } catch {
    return null;
  }
}

export function ipHashFor(request: Request): string {
  return hashWithSecret(clientIp(request.headers));
}

export function voterFromRequest(request: NextRequest): { voterId: string; isNew: boolean } {
  const existing = request.cookies.get(CONTEST_COOKIES.voter)?.value;
  if (isVoterId(existing)) return { voterId: existing, isNew: false };
  return { voterId: newVoterId(), isNew: true };
}

export function applyVoterCookie(response: NextResponse, voterId: string) {
  response.cookies.set({
    name: CONTEST_COOKIES.voter,
    value: voterId,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Der Admin-Cookie trägt nie das Token selbst, nur einen Hash daraus. */
export function adminCookieValue(): string | null {
  const token = process.env.CONTEST_ADMIN_TOKEN;
  if (!token || token.length < 12) return null;
  return hashWithSecret(`admin:${token}`);
}

export function isAdminCookie(value: string | undefined | null): boolean {
  const expected = adminCookieValue();
  return Boolean(expected) && tokensMatch(value, expected);
}

export function isAdminToken(provided: string | undefined | null): boolean {
  const token = process.env.CONTEST_ADMIN_TOKEN;
  if (!token || token.length < 12) return false;
  return tokensMatch(provided, token);
}

export function isAdminRequest(request: NextRequest): boolean {
  return isAdminCookie(request.cookies.get(CONTEST_COOKIES.admin)?.value);
}

export function applyAdminCookie(response: NextResponse, value: string | null) {
  if (value === null) {
    response.cookies.set({ name: CONTEST_COOKIES.admin, value: "", path: "/", maxAge: 0 });
    return;
  }
  response.cookies.set({
    name: CONTEST_COOKIES.admin,
    value,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
