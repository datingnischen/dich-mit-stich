import Image from "next/image";
import { AuthorSocialIcon } from "@/components/author-social-icon";
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
  variant?: "full" | "compact";
};

export function ExpertTrustCard({
  profile,
  eyebrow = "Begleitet von unserem Datingexperten",
  title = "Vertrauen statt Blindflug: Die Inhalte orientieren sich am echten Szene- und Dating-Know-how von Christian M. Haas.",
  primaryLabel = "Zum Expertenprofil",
  primaryHref,
  market = "de",
  aid = "location",
  variant = "full",
}: ExpertTrustCardProps) {
  const compact = variant === "compact";
  const profilePath = primaryHref || profile.profileUrl;

  return (
    <article className={`author-box panel-card${compact ? " author-box-compact" : ""}`}>
      {compact ? null : (
        <div className="author-box-intro">
          <span className="eyebrow eyebrow-brand">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      )}

      <div className="author-box-body">
        <div className="author-box-media">
          {profile.imageUrl ? (
            <Image
              src={profile.imageUrl}
              alt={`${profile.name} – ${profile.jobTitle}`}
              width={300}
              height={300}
              sizes={compact ? "(max-width: 760px) 96px, 120px" : "(max-width: 760px) 120px, 180px"}
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

        <div className="author-box-copy">
          {compact ? <span className="eyebrow eyebrow-brand">{eyebrow}</span> : null}

          <div className="author-box-identity">
            <h3>
              <MarketLink targetMarket={market} pathname={profilePath}>
                {profile.name}
              </MarketLink>
            </h3>
            <span className="author-box-jobtitle">{profile.jobTitle}</span>
          </div>

          {compact ? null : <p className="expert-role">{profile.role}</p>}

          <p className="author-box-bio">
            {localizeFirstPartyText(profile.bio, publicUrl(market))}
            {compact ? (
              <>
                {" "}
                <MarketLink className="author-box-bio-link" targetMarket={market} pathname={profilePath}>
                  {primaryLabel} <span aria-hidden="true">›</span>
                </MarketLink>
              </>
            ) : null}
          </p>

          {profile.expertise.length ? (
            <ul className="author-box-expertise" aria-label={`Schwerpunkte von ${profile.name}`}>
              {profile.expertise.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          ) : null}

          {compact ? null : (
            <ul className="expert-facts" aria-label="Expertise und Vertrauenssignale">
              {profile.facts.map((fact) => (
                <li key={fact}>{localizeFirstPartyText(fact, publicUrl(market))}</li>
              ))}
            </ul>
          )}

          <div className="author-box-footer">
            {profile.socials.length ? (
              <ul className="author-box-socials" aria-label={`${profile.name} in sozialen Netzwerken`}>
                {profile.socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      aria-label={`${profile.name} auf ${social.label}`}
                      title={`${profile.name} auf ${social.label}`}
                    >
                      <AuthorSocialIcon platform={social.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="button-row">
              {compact ? null : (
                <MarketLink className="button button-primary" targetMarket={market} pathname={profilePath}>
                  {primaryLabel}
                </MarketLink>
              )}
              <a
                className={`button ${compact ? "button-primary button-small" : "button-secondary"}`}
                href={conversionUrl(publicUrl(market), "/registration/", aid)}
              >
                Kostenlos registrieren
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
