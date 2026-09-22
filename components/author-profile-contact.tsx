import { AuthorSocialIcon } from "@/components/author-social-icon";
import type { AuthorProfilePage } from "@/lib/author-profile-pages";
import type { AuthorProfile } from "@/lib/author-profiles";

export function AuthorProfileContact({
  profile,
  page,
}: {
  profile: AuthorProfile;
  page: AuthorProfilePage;
}) {
  if (!page.studio && !profile.socials.length) return null;

  return (
    <section className="author-contact-panel" aria-label={`Kontakt und Profile von ${profile.name}`}>
      {page.studio ? (
        <article className="author-contact-card panel-card">
          <span className="eyebrow eyebrow-brand">Studio &amp; Kontakt</span>
          <h2>{page.studio.name}</h2>
          <address className="author-contact-address">
            {page.studio.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <div className="button-row">
            {page.studio.websites.map((site, index) => (
              <a
                key={site.href}
                className={`button ${index === 0 ? "button-primary" : "button-secondary"}`}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {site.label}
              </a>
            ))}
          </div>
        </article>
      ) : null}

      {profile.socials.length ? (
        <article className="author-contact-card panel-card">
          <span className="eyebrow eyebrow-brand">Social Media</span>
          <h2>{page.socialsHeading}</h2>
          <ul className="author-contact-socials">
            {profile.socials.map((social) => (
              <li key={social.href}>
                <a href={social.href} target="_blank" rel="noopener noreferrer nofollow">
                  <AuthorSocialIcon platform={social.platform} />
                  <span>{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
