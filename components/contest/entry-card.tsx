import Image from "next/image";
import Link from "next/link";
import { VoteButton } from "@/components/contest/vote-button";
import { CONTEST_ENTRY_PATH } from "@/lib/contest/config";
import type { ContestEntry } from "@/lib/contest/repository";

type EntryCardProps = {
  entry: ContestEntry;
  rank: number;
};

export function entryAltText(entry: ContestEntry) {
  return `Tattoo-Foto von ${entry.displayName}${entry.city ? ` aus ${entry.city}` : ""} beim Dich-mit-Stich-Contest`;
}

export function EntryCard({ entry, rank }: EntryCardProps) {
  const href = `${CONTEST_ENTRY_PATH}/${entry.publicId}/`;
  return (
    <article className="contest-card" data-rank={rank}>
      <Link href={href} className="contest-card-media" aria-label={`Beitrag von ${entry.displayName} ansehen`}>
        <Image src={entry.photoUrl} alt={entryAltText(entry)} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
        <span className="contest-rank-badge">#{rank}</span>
      </Link>
      <div className="contest-card-body">
        <h3 className="contest-card-title">
          <Link href={href}>{entry.displayName}</Link>
          <span className="contest-card-meta">
            {entry.age}{entry.city ? ` · ${entry.city}` : ""}
          </span>
        </h3>
        <p className="contest-card-caption">{entry.caption}</p>
        <VoteButton entryId={entry.id} displayName={entry.displayName} initialVotes={entry.votes} />
      </div>
    </article>
  );
}
