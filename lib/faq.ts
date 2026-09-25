import { getMarket, publicUrl, type MarketCode } from "./markets.ts";

export const FAQ_PATH = "/faq";

export type FaqAnswerPart =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string; external?: boolean };

export type FaqItem = {
  question: string;
  answer: FaqAnswerPart[];
};

export type FaqSection = {
  eyebrow: string;
  title: string;
  lead?: string;
  items: FaqItem[];
};

const text = (value: string): FaqAnswerPart => ({ type: "text", value });
const link = (label: string, href: string, external = false): FaqAnswerPart => ({ type: "link", label, href, external });
const platformLink = (label: string, path: string): FaqAnswerPart => link(label, publicUrl("de", path));

export const faqSections: FaqSection[] = [
  {
    eyebrow: "Plattform kennenlernen",
    title: "Allgemeines über dich-mit-stich.de",
    items: [
      {
        question: "An wen richtet sich dich-mit-stich.de?",
        answer: [text("Du möchtest neue Leute kennenlernen, suchst einen Freizeitpartner für bestimmte Aktivitäten oder die große Liebe fürs Leben? Vielleicht suchst du einen heißen Flirt, aus dem mehr werden kann? dich-mit-stich.de richtet sich an Menschen, die einfach und schnell Kontakt zu anderen Menschen finden möchten.")],
      },
      {
        question: "Was ist das Besondere an euch?",
        answer: [text("Bei uns triffst du gezielt Singles, die Tattoos und Piercings als Ausdruck ihrer Persönlichkeit leben. Unser Fokus: respektvolle Community, ehrlicher Austausch und Funktionen, die dir das Kennenlernen erleichtern.")],
      },
      {
        question: "Wer betreibt dich-mit-stich.de?",
        answer: [text("dich-mit-stich.de ist Partner im ICONY-Netzwerk und wird von der Icony GmbH betrieben. Details findest du im "), platformLink("Impressum", "/impressum.html"), text(".")],
      },
    ],
  },
  {
    eyebrow: "Seriosität",
    title: "Erfahrungen & Seriosität von dich-mit-stich.de",
    items: [
      {
        question: "Welche Erfahrungen machen Singles mit dich-mit-stich.de?",
        answer: [text("Viele Singles berichten von schnellen, echten Begegnungen und guten Erfahrungen. Einige fanden ihren Traumpartner bereits nach wenigen Tagen, andere schätzen den respektvollen Austausch mit Gleichgesinnten – oft führt die gemeinsame Leidenschaft für Tattoos zu einem besonderen Draht.")],
      },
      {
        question: "Gibt es externe Bewertungen zu dich-mit-stich.de?",
        answer: [text("Ja. Aktuelle Bewertungen findest du direkt bei "), link("Trustpilot", "https://de.trustpilot.com/review/dich-mit-stich.de", true), text(". Auch "), link("Singlebörsen-Überblick", "https://singleboersen-ueberblick.de/partnersuche/dich-mit-stich/", true), text(" stellt die Singlebörse vor. Bewertungsstände können sich verändern; deshalb verlinken wir auf die aktuellen externen Quellen.")],
      },
      {
        question: "Ist dich-mit-stich.de seriös?",
        answer: [text("Ja. Das Team von dich-mit-stich.de setzt auf Transparenz, überprüfte Profile und klare Richtlinien. Datenschutz und Sicherheit stehen im Mittelpunkt, sodass Singles vertrauensvoll nach Liebe und Partnerschaft suchen können.")],
      },
      {
        question: "Gibt es Erfahrungsberichte?",
        answer: [text("Ja, auf unserer Seite findest du "), platformLink("Erfolgsgeschichten", "/unsere-erfolgsgeschichten.html"), text(" von Paaren, die sich über dich-mit-stich.de kennengelernt haben.")],
      },
    ],
  },
  {
    eyebrow: "Mitgliedschaft verstehen",
    title: "Anmeldung, Mitgliedschaft & Kosten",
    items: [
      {
        question: "Ist die Registrierung kostenlos?",
        answer: [text("Ja. Du kannst dich kostenlos anmelden, ein Profil anlegen und die Plattform kennenlernen – das ist unsere "), platformLink("Basis-Mitgliedschaft", "/kostenlose-basis-mitgliedschaft.html"), text(".")],
      },
      {
        question: "Brauche ich Premium, um unbegrenzt zu schreiben?",
        answer: [text("Für die volle Kontaktaufnahme und zusätzliche Funktionen ist eine Premium-Mitgliedschaft erforderlich. Die genauen Leistungen und Preise variieren je nach Laufzeit; Hinweise findest du in den "), platformLink("AGB", "/agb.html"), text(" und im Bereich Hilfe/Service in deinem Konto.")],
      },
      {
        question: "Wie melde ich mich an?",
        answer: [text("Einfach registrieren, E-Mail bestätigen, Profil ausfüllen – fertig. Hier geht es zu "), platformLink("Login und Registrierung", "/login/"), text(".")],
      },
      {
        question: "Wie kann ich Premium kündigen?",
        answer: [text("Du kannst deine Premium-Mitgliedschaft über das "), platformLink("Kündigungsformular", "/kontakt/k%C3%BCndigen/"), text(" beenden. Halte dafür idealerweise deine Kundennummer bereit.")],
      },
    ],
  },
  {
    eyebrow: "Dich mit Stich nutzen",
    title: "Nutzung & Funktionen",
    items: [
      {
        question: "Wie finde ich passende Tattoo-Singles?",
        answer: [text("Erstelle dein Profil mit ein paar Worten zu dir, deinen Vorlieben und deiner Körperkunst – und nutze die Suche und Filter, um Menschen mit ähnlichen Interessen zu finden. Nachrichten verschickst du direkt über das interne Postfach.")],
      },
      {
        question: "Gibt es eine redaktionelle Profilprüfung?",
        answer: [text("Ja. Unser geschultes Support-Team prüft Neuanmeldungen sowie Bilder und Freitexte auf Auffälligkeiten und Missbrauch. Mehr dazu erfährst du unter "), platformLink("Redaktionelle Kontrolle", "/redaktionelle-kontrolle.html"), text(".")],
      },
    ],
  },
  {
    eyebrow: "Profil verwalten",
    title: "Profil & persönliche Einstellungen",
    items: [
      {
        question: "Kann ich mein Profil später wieder löschen?",
        answer: [text("Ja, du kannst dein Profil jederzeit in den Einstellungen selbstständig und vollständig löschen – ohne Angabe von Gründen. Tipp: Kündige vorher laufende Abos rechtzeitig, falls du eine Premium-Mitgliedschaft nutzt.")],
      },
      {
        question: "Wie kann ich sicher sein, dass jemand wirklich Tattoo-affin ist?",
        answer: [text("In den Profilen siehst du Angaben zu Tattoos, Stilrichtungen und Interessen. Beim Schreiben merkst du schnell, ob echte Tattoo-Leidenschaft da ist. Praktischer Tipp: Frag nach der Bedeutung einzelner Motive, nach dem Lieblings-Tätowierer oder geplanten Projekten – wer tatsächlich begeistert ist, antwortet offen und konkret.")],
      },
    ],
  },
  {
    eyebrow: "Sicher unterwegs",
    title: "Sicherheit & Datenschutz",
    items: [
      {
        question: "Wie schützt ihr meine Daten?",
        answer: [text("Wir verarbeiten personenbezogene Daten nach den geltenden Datenschutzvorgaben und setzen auf zeitgemäße Sicherheitsmaßnahmen. Details stehen in unseren "), platformLink("Datenschutzbestimmungen", "/datenschutz.html"), text(".")],
      },
      {
        question: "Tipps gegen Fake-Profile & Betrug?",
        answer: [text("Gib keine sensiblen Daten vorschnell heraus, reagiere skeptisch bei Geldforderungen und melde verdächtiges Verhalten unserem Support. Praktische Hinweise findest du unter "), platformLink("Sicherheit und Datenschutz", "/sicherheit-und-datenschutz.html"), text(".")],
      },
    ],
  },
  {
    eyebrow: "Hilfe erhalten",
    title: "Konto & Support",
    items: [
      {
        question: "Wo bekomme ich Hilfe?",
        answer: [text("Im eingeloggten Bereich findest du Hilfe- und Support-Optionen. Rechtliche Informationen findest du im "), platformLink("Impressum", "/impressum.html"), text(", in den "), platformLink("AGB", "/agb.html"), text(" und im "), platformLink("Datenschutz", "/datenschutz.html"), text(".")],
      },
    ],
  },
  {
    eyebrow: "Offene Antworten",
    title: "Transparenz & häufige Rückfragen zu dich-mit-stich.de",
    lead: "Online-Dating wirft naturgemäß Fragen auf – besonders bei spezialisierten Plattformen wie dich-mit-stich.de. Uns ist Transparenz wichtig. Deshalb beantworten wir hier offen einige Punkte, die immer wieder angesprochen werden.",
    items: [
      {
        question: "Ist dich-mit-stich.de eine Abo-Abzocke?",
        answer: [text("Nein. Preise, Laufzeiten und Leistungen werden vor Abschluss einer Premium-Mitgliedschaft angezeigt. Kostenpflichtige Mitgliedschaften sind im Online-Dating branchenüblich und dienen unter anderem dem Betrieb, dem Support sowie der Qualität und Sicherheit der Community.")],
      },
      {
        question: "Warum gibt es unterschiedliche Laufzeiten bei Abonnements?",
        answer: [text("Unterschiedliche Laufzeiten geben dir Flexibilität: Du kannst die Mitgliedschaft passend zu deinen Zielen wählen. Viele Nutzer entscheiden sich bewusst für mehrere Monate, weil erfolgreiche Partnersuche meist Zeit braucht.")],
      },
      {
        question: "Gibt es bei dich-mit-stich.de aktive Frauen?",
        answer: [text("Ja. dich-mit-stich.de richtet sich an Tattoo-Singles und Menschen, die Tattoo-Kultur mögen. Durch die Einbindung in ein größeres Datingnetzwerk entsteht eine breite Mitgliederbasis – darunter aktive Frauen und Männer.")],
      },
      {
        question: "Warum antwortet nicht jede angeschriebene Person?",
        answer: [text("Das Antwortverhalten ist individuell und hängt zum Beispiel von Erwartungen, Zeit, Sympathie und Lebenssituation ab. Eine ausbleibende Antwort ist kein Beleg für unechte Profile, sondern Teil normaler Dating-Dynamiken.")],
      },
      {
        question: "Gibt es bei dich-mit-stich.de Fake-Profile oder Bots?",
        answer: [text("dich-mit-stich.de setzt keine Chatbots zur Kontaktanbahnung ein. Neue Profile werden geprüft, um Missbrauch zu minimieren und die Qualität der Plattform zu sichern.")],
      },
      {
        question: "Sind Profile auf dich-mit-stich.de aktuell oder „veraltet“?",
        answer: [text("Profile werden von Nutzern erstellt und gepflegt. Wie in jeder Community gibt es Phasen, in denen Mitglieder aktiver sind, und Zeiten, in denen sie pausieren. Gleichzeitig kommen fortlaufend neue Anmeldungen hinzu.")],
      },
      {
        question: "Warum gibt es auch kritische Stimmen oder Bewertungen zu dich-mit-stich.de?",
        answer: [text("Online-Dating ist ein emotionales Thema. Erfahrungen können je nach Erwartungshaltung und persönlicher Situation stark variieren. Kritische Bewertungen gibt es bei allen Dating-Plattformen – wir nehmen konstruktives Feedback ernst und entwickeln das Angebot weiter.")],
      },
    ],
  },
];

export function getFaqSections(market: MarketCode): FaqSection[] {
  if (market === "de") return faqSections;

  const sourceOrigin = publicUrl("de");
  const marketOrigin = publicUrl(market);
  const sourceDomain = getMarket("de").domain;
  const marketDomain = getMarket(market).domain;
  const localize = (value: string) => value.split(sourceDomain).join(marketDomain);

  return faqSections.map((section) => ({
    ...section,
    title: localize(section.title),
    lead: section.lead ? localize(section.lead) : undefined,
    items: section.items.map((item) => {
      const question = localize(item.question);
      if (item.question === "Gibt es externe Bewertungen zu dich-mit-stich.de?") {
        return {
          question,
          answer: [
            text("Ja. "),
            link("Singlebörsen-Überblick", "https://singleboersen-ueberblick.de/partnersuche/dich-mit-stich/", true),
            text(" stellt die Singlebörse vor. Bewertungsstände können sich verändern; deshalb verlinken wir auf die aktuelle externe Quelle."),
          ],
        };
      }

      return {
        question,
        answer: item.answer.map((part) => {
          if (part.type === "text") return { ...part, value: localize(part.value) };
          if (part.href.startsWith(sourceOrigin)) {
            return { ...part, href: `${marketOrigin}${part.href.slice(sourceOrigin.length)}` };
          }
          return part;
        }),
      };
    }),
  }));
}

export function faqAnswerText(answer: FaqAnswerPart[]): string {
  return answer.map((part) => part.type === "text" ? part.value : part.label).join("").replace(/\s+/g, " ").trim();
}

export function buildFaqGraph(market: MarketCode = "de") {
  const canonical = publicUrl(market, FAQ_PATH);
  const siteRoot = publicUrl(market);
  const items = getFaqSections(market).flatMap((section) => section.items);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteRoot}#website`,
        name: "Dich mit Stich",
        url: siteRoot,
        inLanguage: getMarket(market).locale,
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: "Häufig gestellte Fragen zu Dich mit Stich",
        description: "Antworten zu Anmeldung, Mitgliedschaft, Funktionen, Sicherheit, Datenschutz und Support bei Dich mit Stich.",
        inLanguage: getMarket(market).locale,
        isPartOf: { "@id": `${siteRoot}#website` },
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faqAnswerText(item.answer),
          },
        })),
      },
    ],
  };
}
