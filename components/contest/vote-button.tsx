'use client';

import { useState } from "react";
import { CONTEST_API_PATH } from "@/lib/contest/config";

type VoteButtonProps = {
  entryId: string;
  displayName: string;
  initialVotes: number;
  size?: "regular" | "large";
};

type VoteState = "idle" | "busy" | "counted" | "duplicate" | "error";

/** Stimme abgeben: 1 Stimme je Besucher und Tag; die Antwort liefert den neuen Stand. */
export function VoteButton({ entryId, displayName, initialVotes, size = "regular" }: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [state, setState] = useState<VoteState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function vote() {
    if (state === "busy") return;
    setState("busy");
    setMessage(null);
    try {
      const response = await fetch(`${CONTEST_API_PATH}/vote/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = (await response.json().catch(() => ({}))) as { votes?: number; message?: string; error?: string; status?: string };
      if (typeof data.votes === "number") setVotes(data.votes);
      if (response.ok) {
        setState("counted");
        setMessage(data.message ?? "Danke, deine Stimme zählt!");
      } else if (data.status === "duplicate") {
        setState("duplicate");
        setMessage(data.error ?? "Du hast heute schon abgestimmt.");
      } else {
        setState("error");
        setMessage(data.error ?? "Das hat leider nicht geklappt. Bitte versuche es später noch einmal.");
      }
    } catch {
      setState("error");
      setMessage("Das hat leider nicht geklappt. Bitte versuche es später noch einmal.");
    }
  }

  const done = state === "counted" || state === "duplicate";
  return (
    <div className={`contest-vote contest-vote-${size}`} data-state={state}>
      <button
        type="button"
        className={`button ${done ? "button-secondary" : "button-primary"} contest-vote-button`}
        onClick={vote}
        disabled={state === "busy" || done}
        aria-label={`Für ${displayName} abstimmen`}
      >
        <span aria-hidden="true">♥</span>
        {state === "busy" ? "Wird gezählt …" : done ? "Abgestimmt" : "Abstimmen"}
      </button>
      <span className="contest-vote-count" aria-live="polite">
        <strong>{votes}</strong> {votes === 1 ? "Stimme" : "Stimmen"}
      </span>
      {message ? <p className="contest-vote-message" role="status">{message}</p> : null}
    </div>
  );
}
