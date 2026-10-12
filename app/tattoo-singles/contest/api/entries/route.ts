import { NextResponse, type NextRequest } from "next/server.js";
import { verifyContestBlob } from "@/lib/contest/blob";
import { CONTEST_ENTRY_PATH, CONTEST_LIMITS } from "@/lib/contest/config";
import { newPublicId } from "@/lib/contest/identity";
import { countEntriesByIpToday, createEntry } from "@/lib/contest/repository";
import { contestUnavailable, ipHashFor, jsonError, readJson, requireConfiguredSql } from "@/lib/contest/service";
import { blobPathnameFromUrl, isAllowedImageType, validateEntryInput } from "@/lib/contest/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sql = requireConfiguredSql();
  if (!sql) return contestUnavailable();

  const body = await readJson(request);
  if (!body) return jsonError(400, "Ungültige Anfrage.");
  // Honeypot: echte Besucher sehen dieses Feld nicht.
  if (typeof body.website === "string" && body.website.trim()) return jsonError(400, "Ungültige Anfrage.");

  const validation = validateEntryInput(body);
  if (!validation.ok) return jsonError(400, validation.error);
  const input = validation.value;

  const ipHash = ipHashFor(request);
  try {
    if ((await countEntriesByIpToday(sql, ipHash)) >= CONTEST_LIMITS.entriesPerIpPerDay) {
      return jsonError(429, "Von deiner Verbindung sind heute schon genug Beiträge eingegangen. Versuch es morgen wieder.");
    }

    const blob = await verifyContestBlob(input.photoUrl);
    if (!blob.ok || !isAllowedImageType(blob.contentType) || blob.size > CONTEST_LIMITS.maxUploadBytes) {
      return jsonError(400, "Das Foto wurde nicht korrekt hochgeladen. Bitte wähle es noch einmal aus.");
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const publicId = newPublicId();
      try {
        const entry = await createEntry(sql, {
          publicId,
          displayName: input.displayName,
          age: input.age,
          city: input.city,
          caption: input.caption,
          email: input.email,
          photoUrl: input.photoUrl,
          photoPathname: blobPathnameFromUrl(input.photoUrl),
          consentTerms: true,
          consentImage: true,
          ipHash,
          userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        });
        return NextResponse.json({ ok: true, publicId: entry.publicId, path: `${CONTEST_ENTRY_PATH}/${entry.publicId}/` }, { status: 201 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/public_id/.test(message)) throw error;
      }
    }
    return jsonError(500, "Es ist ein Fehler aufgetreten. Bitte versuche es noch einmal.");
  } catch (error) {
    console.error("Contest: Eintrag konnte nicht gespeichert werden", error);
    return contestUnavailable();
  }
}
