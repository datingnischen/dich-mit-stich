import Image from "next/image";
import Link from "next/link";
import type { ExpertProfile } from "@/lib/expert-profile";

type ExpertTrustCardProps = {
  profile: ExpertProfile;
  eyebrow?: string;
  title?: string;
  primaryLabel?: string;
  primaryHref?: string;
};

export function ExpertTrustCard({
  profile,
  eyebrow = "Begleitet von unserem Datingexperten",
  title = "Vertrauen statt Blindflug: Die Inhalte orientieren sich am echten Szene- und Dating-Know-how von Christian M. Haas.",
  primaryLabel = "Zum Expertenprofil",
  primaryHref,
}: ExpertTrustCardProps) {
  return (
    <article className="expert-card panel-card">
      <div className="expert-card-media">
        {profile.imageUrl ? (
          <Image
            src={profile.imageUrl}
            alt={profile.name}
            width={300}
            height={300}
            sizes="(max-width: 760px) 120px, 160px"
          />
        ) : (
          <div className="expert-card-avatar-fallback" aria-hidden="true">
            {profile.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
      </div>

      <div className="expert-card-copy">
        <span className="eyebrow eyebrow-brand">{eyebrow}</span>
        <h2>{title}</h2>
        <h3>{profile.name}</h3>
        <p className="expert-role">{profile.role}</p>
        <p>{profile.bio}</p>

        <ul className="expert-facts" aria-label="Expertise und Vertrauenssignale">
          {profile.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>

        <div className="button-row">
          <Link className="button button-primary" href={primaryHref || profile.profileUrl}>
            {primaryLabel}
          </Link>
          <Link className="button button-secondary" href="https://dich-mit-stich.de/registration/">
            Kostenlos registrieren
          </Link>
        </div>
      </div>
    </article>
  );
}
