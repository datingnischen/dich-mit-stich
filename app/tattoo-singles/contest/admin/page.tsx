import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLogin, AdminPanel } from "@/components/contest/admin-panel";
import { CONTEST_COOKIES } from "@/lib/contest/config";
import { getContestSql, isContestConfigured } from "@/lib/contest/db";
import { listEntriesForModeration, type ContestEntryInternal } from "@/lib/contest/repository";
import { isAdminCookie } from "@/lib/contest/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contest-Moderation",
  robots: { index: false, follow: false },
};

function serialize(entries: ContestEntryInternal[]) {
  return entries.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    approvedAt: entry.approvedAt ? entry.approvedAt.toISOString() : null,
  }));
}

export default async function ContestAdminPage() {
  const cookieStore = await cookies();
  const configured = isContestConfigured() && Boolean(process.env.CONTEST_ADMIN_TOKEN);
  const authenticated = configured && isAdminCookie(cookieStore.get(CONTEST_COOKIES.admin)?.value);

  if (!authenticated) {
    return (
      <main className="shell shell-narrow contest-shell">
        <AdminLogin configured={configured} />
      </main>
    );
  }

  let lists: { pending: ContestEntryInternal[]; approved: ContestEntryInternal[]; rejected: ContestEntryInternal[] } | null = null;
  try {
    const sql = getContestSql();
    const [pending, approved, rejected] = await Promise.all([
      listEntriesForModeration(sql, "pending"),
      listEntriesForModeration(sql, "approved"),
      listEntriesForModeration(sql, "rejected"),
    ]);
    lists = { pending, approved, rejected };
  } catch (error) {
    console.error("Contest: Moderationsliste konnte nicht geladen werden", error);
  }

  return (
    <main className="shell contest-shell">
      <section className="panel-card contest-hero contest-hero-compact">
        <span className="eyebrow eyebrow-muted">Intern</span>
        <h1>Contest-Moderation</h1>
      </section>
      {lists ? (
        <AdminPanel pending={serialize(lists.pending)} approved={serialize(lists.approved)} rejected={serialize(lists.rejected)} />
      ) : (
        <p className="panel-card contest-form-error">Die Datenbank ist gerade nicht erreichbar.</p>
      )}
    </main>
  );
}
