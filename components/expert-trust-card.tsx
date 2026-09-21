import Image from "next/image";
import { MarketLink } from "@/components/market-link";
import { conversionUrl, type ConversionAid } from "@/lib/conversion-links";
import type { ExpertProfile } from "@/lib/expert-profile";
import { localizeFirstPartyText } from "@/lib/market-html";
import { publicUrl, type MarketCode } from "@/lib/markets";

type ExpertTrustCardProps = {
  profile: ExpertProfile;
  eyebrow?: string;
  title?: string;
  primaryLabel?: string;
  primaryHref?: string;
  market?: MarketCode;
  aid?: ConversionAid;
};

export function ExpertTrustCard({
  profile,
  eyebrow = "Begleitet von unserem Datingexperten",
  title = "Vertrauen statt Blindflug: Die Inhalte orientieren sich am echten Szene- und Dating-Know-how von Christian M. Haas.",
  primaryLabel = "Zum Expertenprofil",
  primaryHref,
  market = "de",
  aid = "location",
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
        <p>{localizeFirstPartyText(profile.bio, publicUrl(market))}</p>

        <ul className="expert-facts" aria-label="Expertise und Vertrauenssignale">
          {profile.facts.map((fact) => (
            <li key={fact}>{localizeFirstPartyText(fact, publicUrl(market))}</li>
          ))}
        </ul>

        <div className="button-row">
          <MarketLink className="button button-primary" targetMarket={market} pathname={primaryHref || profile.profileUrl}>
            {primaryLabel}
          </MarketLink>
          <a className="button button-secondary" href={conversionUrl(publicUrl(market), "/registration/", aid)}>
            Kostenlos registrieren
          </a>
        </div>
      </div>
    </article>
  );
}
