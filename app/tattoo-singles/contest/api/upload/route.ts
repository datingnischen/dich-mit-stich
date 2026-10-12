import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server.js";
import { CONTEST_LIMITS } from "@/lib/contest/config";
import { countEntriesByIpToday } from "@/lib/contest/repository";
import { contestUnavailable, ipHashFor, jsonError, requireConfiguredSql } from "@/lib/contest/service";
import { BLOB_FOLDER } from "@/lib/contest/validation";

export const dynamic = "force-dynamic";

/**
 * Client-Upload zu Vercel Blob: der Browser holt hier ein kurzlebiges Token und lädt die Datei direkt zum
 * Blob-Host hoch. Durch den nginx vor der Live-Domain geht nur dieses kleine JSON, nicht das Foto.
 */
export async function POST(request: NextRequest) {
  const sql = requireConfiguredSql();
  if (!sql) return contestUnavailable();

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return jsonError(400, "Ungültige Anfrage.");
  const ipHash = ipHashFor(request);

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, _clientPayload, multipart) => {
        if (multipart) throw new Error("Mehrteilige Uploads sind nicht erlaubt.");
        if (!pathname.startsWith(BLOB_FOLDER) || pathname.includes("..") || pathname.split("/").length !== 2) {
          throw new Error("Ungültiger Dateipfad.");
        }
        if ((await countEntriesByIpToday(sql, ipHash)) >= CONTEST_LIMITS.entriesPerIpPerDay) {
          throw new Error("Von deiner Verbindung sind heute schon genug Beiträge eingegangen. Versuch es morgen wieder.");
        }
        return {
          allowedContentTypes: CONTEST_LIMITS.allowedImageTypes,
          maximumSizeInBytes: CONTEST_LIMITS.maxUploadBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ipHash }),
        };
      },
      onUploadCompleted: async () => {
        // Der Eintrag entsteht erst mit dem Formular (api/entries); hier ist nichts zu tun.
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Upload fehlgeschlagen.");
  }
}
