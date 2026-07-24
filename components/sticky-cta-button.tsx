'use client';

import { usePathname } from 'next/navigation';

function ctaFromPathname(pathname: string) {
  if (pathname.startsWith('/tattoo-singles')) {
    return {
      text: 'Tattoo-Singles in deiner Stadt finden',
      href: 'https://dich-mit-stich.de/?AID=location',
    };
  }

  return {
    text: 'Jetzt kostenlos registrieren',
    href: 'https://dich-mit-stich.de/?AID=magazin',
  };
}

export function StickyCTAButton() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  const cta = ctaFromPathname(pathname);

  return (
    <a href={cta.href} className="sticky-cta-button" aria-label={cta.text}>
      <span className="sticky-cta-text">{cta.text}</span>
      <span className="sticky-cta-icon" aria-hidden="true">→</span>
    </a>
  );
}
