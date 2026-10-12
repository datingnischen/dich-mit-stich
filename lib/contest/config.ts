/**
 * Tattoo-Contest (Foto-Voting) unter /tattoo-singles/contest/ – zentrale, von Christian änderbare Vorgaben.
 * Design: docs/superpowers/specs/2026-10-12-tattoo-contest-design.md, Einrichtung: docs/contest.md
 */
export const CONTEST_PATH = "/tattoo-singles/contest";
export const CONTEST_ENTRY_PATH = `${CONTEST_PATH}/teilnehmer`;
export const CONTEST_JOIN_PATH = `${CONTEST_PATH}/mitmachen`;
export const CONTEST_RULES_PATH = `${CONTEST_PATH}/teilnahmebedingungen`;
export const CONTEST_ADMIN_PATH = `${CONTEST_PATH}/admin`;
export const CONTEST_API_PATH = `${CONTEST_PATH}/api`;

export const CONTEST_ROUND = {
  name: "Runde 1",
  title: "Tattoo-Contest: Zeig dein Lieblingstattoo",
  /** Gewinn-Text auf Hub und Teilnehmerseiten; vor Rundenende konkretisieren. */
  prize: "Der Gewinn wird vor Ende der Runde auf dieser Seite bekannt gegeben.",
  /** ISO-Datum (YYYY-MM-DD) oder null für eine offene Laufzeit. */
  endsOn: null as string | null,
};

export const CONTEST_LIMITS = {
  /** Stimmen je Besucher (Cookie) je Teilnehmer und Tag. */
  votesPerVoterPerEntryPerDay: 1,
  /** Stimmen je IP-Adresse und Tag über alle Teilnehmer. */
  votesPerIpPerDay: 50,
  /** Einreichungen je IP-Adresse und Tag. */
  entriesPerIpPerDay: 3,
  /** Obergrenze für den Blob-Upload; der Browser verkleinert vorher auf maxImageEdge. */
  maxUploadBytes: 6 * 1024 * 1024,
  maxImageEdge: 1600,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  displayNameMin: 2,
  displayNameMax: 40,
  captionMax: 300,
  cityMax: 60,
  minAge: 18,
  maxAge: 99,
  /** Einträge im Ranking auf dem Hub. */
  rankingSize: 24,
};

export const CONTEST_COOKIES = {
  voter: "dms_contest_voter",
  admin: "dms_contest_admin",
};

/** Hinweis für Hub und Formular, solange Datenbank oder Blob-Store fehlen. */
export const CONTEST_UNCONFIGURED_NOTE = "Der Contest startet in Kürze. Schau bald wieder vorbei.";
