import { NextResponse, type NextRequest } from "next/server.js";
import { adminCookieValue, applyAdminCookie, isAdminToken, jsonError, readJson } from "@/lib/contest/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const cookieValue = adminCookieValue();
  if (!cookieValue) return jsonError(503, "CONTEST_ADMIN_TOKEN ist nicht gesetzt (docs/contest.md).");
  if (!isAdminToken(token)) return jsonError(401, "Das Zugangstoken stimmt nicht.");

  const response = NextResponse.json({ ok: true });
  applyAdminCookie(response, cookieValue);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  applyAdminCookie(response, null);
  return response;
}
