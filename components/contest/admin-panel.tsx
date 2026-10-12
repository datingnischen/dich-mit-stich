'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CONTEST_API_PATH, CONTEST_ENTRY_PATH } from "@/lib/contest/config";
import type { ContestEntryInternal, EntryStatus } from "@/lib/contest/repository";

type SerializedEntry = Omit<ContestEntryInternal, "createdAt" | "approvedAt"> & { createdAt: string; approvedAt: string | null };

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const token = String(new FormData(event.currentTarget).get("token") ?? "");
    const response = await fetch(`${CONTEST_API_PATH}/admin/login/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (response.ok) {
      router.refresh();
    } else {
      setError(data.error ?? "Anmeldung fehlgeschlagen.");
    }
  }

  return (
    <form className="panel-card contest-form contest-admin-login" onSubmit={submit}>
      <h2>Moderation</h2>
      {!configured ? (
        <p className="contest-form-error">
          Datenbank, Blob-Store oder Geheimnisse fehlen. Einrichtung: docs/contest.md im Repository.
        </p>
      ) : null}
      <div className="contest-field">
        <label htmlFor="contest-admin-token">Zugangstoken</label>
        <input id="contest-admin-token" name="token" type="password" autoComplete="current-password" required />
      </div>
      {error ? <p className="contest-form-error" role="alert">{error}</p> : null}
      <div className="button-row">
        <button type="submit" className="button button-primary" disabled={busy}>Anmelden</button>
      </div>
    </form>
  );
}

type AdminPanelProps = {
  pending: SerializedEntry[];
  approved: SerializedEntry[];
  rejected: SerializedEntry[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminPanel({ pending, approved, rejected }: AdminPanelProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(entry: SerializedEntry, action: "approve" | "reject" | "delete") {
    if (action === "delete" && !window.confirm(`Beitrag von ${entry.displayName} samt Foto und Stimmen endgültig löschen?`)) return;
    setBusyId(entry.id);
    setError(null);
    const response = await fetch(`${CONTEST_API_PATH}/admin/moderate/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entryId: entry.id, publicId: entry.publicId, action }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusyId(null);
    if (!response.ok) {
      setError(data.error ?? "Aktion fehlgeschlagen.");
      return;
    }
    router.refresh();
  }

  async function logout() {
    await fetch(`${CONTEST_API_PATH}/admin/login/`, { method: "DELETE" });
    router.refresh();
  }

  function renderList(title: string, entries: SerializedEntry[], status: EntryStatus) {
    return (
      <section className="contest-admin-section">
        <h2>{title} <span className="contest-admin-count">({entries.length})</span></h2>
        {entries.length === 0 ? <p className="contest-admin-empty">Keine Beiträge.</p> : null}
        <div className="contest-admin-list">
          {entries.map((entry) => (
            <article key={entry.id} className="contest-admin-item" data-status={entry.status}>
              <div className="contest-admin-photo">
                <Image src={entry.photoUrl} alt={`Foto von ${entry.displayName}`} fill sizes="200px" />
              </div>
              <div className="contest-admin-copy">
                <h3>
                  {entry.displayName}, {entry.age}{entry.city ? ` · ${entry.city}` : ""}
                  <span className="contest-admin-votes">{entry.votes} Stimmen</span>
                </h3>
                <p className="contest-admin-caption">{entry.caption}</p>
                <p className="contest-admin-meta">
                  <a href={`mailto:${entry.email}`}>{entry.email}</a> · eingereicht {formatDate(entry.createdAt)}
                  {entry.approvedAt ? ` · freigegeben ${formatDate(entry.approvedAt)}` : ""} ·{" "}
                  <Link href={`${CONTEST_ENTRY_PATH}/${entry.publicId}/`} target="_blank">Seite öffnen</Link>
                </p>
                <div className="button-row">
                  {status !== "approved" ? (
                    <button type="button" className="button button-primary button-small" disabled={busyId === entry.id} onClick={() => act(entry, "approve")}>
                      Freigeben
                    </button>
                  ) : null}
                  {status !== "rejected" ? (
                    <button type="button" className="button button-secondary button-small" disabled={busyId === entry.id} onClick={() => act(entry, "reject")}>
                      {status === "approved" ? "Zurückziehen" : "Ablehnen"}
                    </button>
                  ) : null}
                  <button type="button" className="button button-secondary button-small contest-admin-delete" disabled={busyId === entry.id} onClick={() => act(entry, "delete")}>
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="contest-admin">
      <div className="contest-admin-head">
        <p>Beiträge erscheinen erst nach Freigabe im Ranking. Löschen entfernt auch Foto und Stimmen.</p>
        <button type="button" className="button button-secondary button-small" onClick={logout}>Abmelden</button>
      </div>
      {error ? <p className="contest-form-error" role="alert">{error}</p> : null}
      {renderList("Offen", pending, "pending")}
      {renderList("Freigegeben", approved, "approved")}
      {renderList("Abgelehnt", rejected, "rejected")}
    </div>
  );
}
