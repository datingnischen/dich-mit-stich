import { NextResponse, type NextRequest } from "next/server.js";
import { hashWithSecret } from "@/lib/contest/identity";
import { castVote, isEntryId } from "@/lib/contest/repository";
import {
  applyVoterCookie,
  contestUnavailable,
  ipHashFor,
  jsonError,
  readJson,
  requireConfiguredSql,
  voterFromRequest,
} from "@/lib/contest/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sql = requireConfiguredSql();
  if (!sql) return contestUnavailable();

  const body = await readJson(request);
  if (!body || !isEntryId(body.entryId)) return jsonError(400, "Ungültige Anfrage.");

  const { voterId, isNew } = voterFromRequest(request);
  try {
    const result = await castVote(sql, {
      entryId: body.entryId,
      voterHash: hashWithSecret(voterId),
      ipHash: ipHashFor(request),
    });

    let response: NextResponse;
    switch (result.status) {
      case "counted":
        response = NextResponse.json({ ok: true, status: result.status, votes: result.votes, message: "Danke, deine Stimme zählt!" });
        break;
      case "duplicate":
        response = NextResponse.json(
          { ok: false, status: result.status, votes: result.votes, error: "Du hast heute schon für diesen Beitrag abgestimmt. Morgen geht es weiter." },
          { status: 409 },
        );
        break;
      case "ip-limit":
        response = NextResponse.json(
          { ok: false, status: result.status, error: "Von deiner Verbindung kamen heute schon sehr viele Stimmen. Morgen geht es weiter." },
          { status: 429 },
        );
        break;
      default:
        response = NextResponse.json({ ok: false, status: result.status, error: "Diesen Beitrag gibt es nicht oder er ist noch nicht freigegeben." }, { status: 404 });
    }
    if (isNew) applyVoterCookie(response, voterId);
    return response;
  } catch (error) {
    console.error("Contest: Stimme konnte nicht gespeichert werden", error);
    return contestUnavailable();
  }
}
