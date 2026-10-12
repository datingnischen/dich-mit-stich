'use client';

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { CONTEST_API_PATH, CONTEST_LIMITS, CONTEST_RULES_PATH } from "@/lib/contest/config";
import { imageExtension, isAllowedImageType } from "@/lib/contest/validation";

type Step = "idle" | "uploading" | "saving" | "done";

type PreparedImage = { blob: Blob; type: string; ext: string };

/** Verkleinert das Foto im Browser (längste Kante maxImageEdge), damit der Upload klein bleibt. */
async function prepareImage(file: File): Promise<PreparedImage> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("Bitte wähle ein Foto als JPG, PNG oder WebP.");
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, CONTEST_LIMITS.maxImageEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
      if (blob && blob.size > 0) return { blob, type: "image/jpeg", ext: "jpg" };
    }
  } catch {
    // Fallback unten: Originaldatei
  }
  if (file.size > CONTEST_LIMITS.maxUploadBytes) {
    throw new Error("Das Foto ist zu groß. Bitte wähle eine Datei bis 6 MB.");
  }
  return { blob: file, type: file.type, ext: imageExtension(file.type) };
}

export function EntryForm() {
  const ids = useId();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultPath, setResultPath] = useState<string | null>(null);

  // Objekt-URL der Vorschau freigeben, sobald eine neue gesetzt wird oder das Formular verschwindet.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(next: File | null) {
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "uploading" || step === "saving") return;
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!file) {
      setError("Bitte wähle zuerst dein Foto aus.");
      return;
    }

    try {
      setStep("uploading");
      const prepared = await prepareImage(file);
      const pathname = `contest/${crypto.randomUUID()}.${prepared.ext}`;
      const uploaded = await upload(pathname, prepared.blob, {
        access: "public",
        handleUploadUrl: `${CONTEST_API_PATH}/upload/`,
        contentType: prepared.type,
      });

      setStep("saving");
      const response = await fetch(`${CONTEST_API_PATH}/entries/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: data.get("displayName"),
          age: data.get("age"),
          city: data.get("city"),
          caption: data.get("caption"),
          email: data.get("email"),
          consentTerms: data.get("consentTerms") === "on",
          consentImage: data.get("consentImage") === "on",
          website: data.get("website"),
          photoUrl: uploaded.url,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; path?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.path) {
        throw new Error(payload.error ?? "Dein Beitrag konnte nicht gespeichert werden. Bitte versuche es noch einmal.");
      }
      setResultPath(payload.path);
      setStep("done");
      form.reset();
      selectFile(null);
      setCaption("");
    } catch (submitError) {
      setStep("idle");
      setError(submitError instanceof Error ? submitError.message : "Das hat leider nicht geklappt. Bitte versuche es noch einmal.");
    }
  }

  if (step === "done" && resultPath) {
    return (
      <section className="panel-card contest-form-done" aria-live="polite">
        <span className="eyebrow eyebrow-brand">Eingereicht</span>
        <h2>Danke, dein Beitrag ist da!</h2>
        <p>
          Wir schauen kurz drüber und schalten dein Foto dann frei. Das dauert in der Regel nicht lange. Danach erscheint es
          im Ranking und deine Seite ist öffentlich erreichbar:
        </p>
        <p className="contest-form-link">
          <Link href={resultPath}>{typeof window === "undefined" ? resultPath : `${window.location.origin}${resultPath}`}</Link>
        </p>
        <p>Speichere dir den Link. Sobald dein Beitrag freigegeben ist, kannst du ihn teilen und Stimmen sammeln.</p>
        <div className="button-row">
          <Link className="button button-primary" href={resultPath}>Meine Seite ansehen</Link>
          <Link className="button button-secondary" href="/tattoo-singles/contest/">Zum Ranking</Link>
        </div>
      </section>
    );
  }

  const busy = step === "uploading" || step === "saving";
  return (
    <form className="panel-card contest-form" onSubmit={handleSubmit} noValidate>
      <div className="contest-field contest-field-photo">
        <label htmlFor={`${ids}-photo`}>Dein Foto</label>
        <input
          id={`${ids}-photo`}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(event) => selectFile(event.currentTarget.files?.[0] ?? null)}
        />
        <p className="contest-field-hint">
          JPG, PNG oder WebP. Wir verkleinern das Bild automatisch. Du musst selbst auf dem Foto zu sehen sein.
        </p>
        {previewUrl ? (
          <div className="contest-form-preview">
            {/* Vorschau einer lokalen Datei: kein next/image, da Blob-URL */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Vorschau deines ausgewählten Fotos" />
          </div>
        ) : null}
      </div>

      <div className="contest-field-grid">
        <div className="contest-field">
          <label htmlFor={`${ids}-name`}>Name oder Nickname</label>
          <input id={`${ids}-name`} name="displayName" type="text" minLength={CONTEST_LIMITS.displayNameMin} maxLength={CONTEST_LIMITS.displayNameMax} required autoComplete="nickname" />
        </div>
        <div className="contest-field">
          <label htmlFor={`${ids}-age`}>Alter</label>
          <input id={`${ids}-age`} name="age" type="number" inputMode="numeric" min={CONTEST_LIMITS.minAge} max={CONTEST_LIMITS.maxAge} required />
        </div>
        <div className="contest-field">
          <label htmlFor={`${ids}-city`}>Ort <span className="contest-optional">(optional)</span></label>
          <input id={`${ids}-city`} name="city" type="text" maxLength={CONTEST_LIMITS.cityMax} autoComplete="address-level2" />
        </div>
        <div className="contest-field">
          <label htmlFor={`${ids}-email`}>E-Mail <span className="contest-optional">(nicht öffentlich)</span></label>
          <input id={`${ids}-email`} name="email" type="email" required autoComplete="email" />
          <p className="contest-field-hint">Nur für Rückfragen und die Gewinnbenachrichtigung.</p>
        </div>
      </div>

      <div className="contest-field">
        <label htmlFor={`${ids}-caption`}>Dein Text</label>
        <textarea
          id={`${ids}-caption`}
          name="caption"
          rows={4}
          maxLength={CONTEST_LIMITS.captionMax}
          required
          value={caption}
          onChange={(event) => setCaption(event.currentTarget.value)}
          placeholder="Was bedeutet dir dein Tattoo? Wer bist du, was suchst du?"
        />
        <p className="contest-field-hint">{caption.length}/{CONTEST_LIMITS.captionMax} Zeichen, keine Links.</p>
      </div>

      <div className="contest-field contest-honeypot" aria-hidden="true">
        <label htmlFor={`${ids}-website`}>Website</label>
        <input id={`${ids}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="contest-consent">
        <label className="contest-check">
          <input type="checkbox" name="consentImage" required />
          <span>
            Ich bin mindestens 18 Jahre alt, bin selbst auf dem Foto zu sehen und erlaube Dich mit Stich, Foto und Text im Rahmen des
            Contests zu zeigen.
          </span>
        </label>
        <label className="contest-check">
          <input type="checkbox" name="consentTerms" required />
          <span>
            Ich akzeptiere die <Link href={`${CONTEST_RULES_PATH}/`} target="_blank">Teilnahmebedingungen und Datenschutzhinweise</Link>.
          </span>
        </label>
      </div>

      {error ? <p className="contest-form-error" role="alert">{error}</p> : null}

      <div className="button-row">
        <button type="submit" className="button button-primary" disabled={busy}>
          {step === "uploading" ? "Foto wird hochgeladen …" : step === "saving" ? "Wird gespeichert …" : "Beitrag einreichen"}
        </button>
        <Link className="button button-secondary" href="/tattoo-singles/contest/">Zurück zum Contest</Link>
      </div>
    </form>
  );
}
