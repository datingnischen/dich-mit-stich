import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server.js";
import { deleteContestBlob } from "@/lib/contest/blob";
import { CONTEST_ENTRY_PATH, CONTEST_PATH } from "@/lib/contest/config";
import { deleteEntry, getEntryByPublicId, isEntryId, moderateEntry } from "@/lib/contest/repository";
import { contestUnavailable, isAdminRequest, jsonError, readJson, requireConfiguredSql } from "@/lib/contest/service";

export const dynamic = "force-dynamic";

const ACTIONS = new Set(["approve", "reject", "delete"]);

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return jsonError(401, "Bitte zuerst anmelden.");
  const sql = requireConfiguredSql();
  if (!sql) return contestUnavailable();

  const body = await readJson(request);
  const action = typeof body?.action === "string" ? body.action : "";
  if (!body || !isEntryId(body.entryId) || !ACTIONS.has(action)) return jsonError(400, "Ungültige Anfrage.");
  const publicId = typeof body.publicId === "string" ? body.publicId : null;

  try {
    if (action === "delete") {
      const deleted = await deleteEntry(sql, body.entryId);
      if (!deleted) return jsonError(404, "Beitrag nicht gefunden.");
      await deleteContestBlob(deleted.photoPathname);
    } else {
      const entry = await moderateEntry(sql, body.entryId, action as "approve" | "reject");
      if (!entry) return jsonError(404, "Beitrag nicht gefunden.");
    }
    revalidatePath(CONTEST_PATH);
    if (publicId) {
      revalidatePath(`${CONTEST_ENTRY_PATH}/${publicId}`);
    } else {
      revalidatePath(`${CONTEST_ENTRY_PATH}/[publicId]`, "page");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contest: Moderation fehlgeschlagen", error);
    return contestUnavailable();
  }
}

export async function GET(request: NextRequest) {
  // Schnelle Prüfung für die Admin-Oberfläche, ob ein Beitrag existiert (per publicId).
  if (!isAdminRequest(request)) return jsonError(401, "Bitte zuerst anmelden.");
  const sql = requireConfiguredSql();
  if (!sql) return contestUnavailable();
  const publicId = request.nextUrl.searchParams.get("publicId") ?? "";
  const entry = await getEntryByPublicId(sql, publicId);
  return entry ? NextResponse.json({ ok: true, status: entry.status }) : jsonError(404, "Beitrag nicht gefunden.");
}
