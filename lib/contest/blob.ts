import { del, head } from "@vercel/blob";

/** Bestätigt, dass die URL eine Datei im eigenen Blob-Store ist (head schlägt für fremde Stores fehl). */
export async function verifyContestBlob(url: string): Promise<{ ok: true; size: number; contentType: string } | { ok: false }> {
  try {
    const info = await head(url);
    return { ok: true, size: info.size, contentType: info.contentType };
  } catch {
    return { ok: false };
  }
}

export async function deleteContestBlob(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch (error) {
    console.error("Contest: Blob konnte nicht gelöscht werden", pathname, error);
  }
}
