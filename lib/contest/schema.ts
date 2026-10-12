/** Postgres-Schema des Contests; alle Anweisungen sind idempotent (IF NOT EXISTS). */
export const CONTEST_SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS contest_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id text NOT NULL UNIQUE,
    display_name text NOT NULL,
    age integer NOT NULL,
    city text,
    caption text NOT NULL,
    email text NOT NULL,
    photo_url text NOT NULL,
    photo_pathname text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    consent_terms boolean NOT NULL,
    consent_image boolean NOT NULL,
    ip_hash text NOT NULL,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    moderated_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS contest_entries_status_idx ON contest_entries (status, approved_at)`,
  `CREATE INDEX IF NOT EXISTS contest_entries_ip_day_idx ON contest_entries (ip_hash, created_at)`,
  `CREATE TABLE IF NOT EXISTS contest_votes (
    id bigserial PRIMARY KEY,
    entry_id uuid NOT NULL REFERENCES contest_entries (id) ON DELETE CASCADE,
    voter_hash text NOT NULL,
    vote_day date NOT NULL DEFAULT current_date,
    ip_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entry_id, voter_hash, vote_day)
  )`,
  `CREATE INDEX IF NOT EXISTS contest_votes_entry_idx ON contest_votes (entry_id)`,
  `CREATE INDEX IF NOT EXISTS contest_votes_ip_day_idx ON contest_votes (ip_hash, vote_day)`,
];
