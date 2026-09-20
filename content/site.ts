/**
 * ============================================================================
 *  ZENTRALE INHALTS-DATEI
 * ============================================================================
 *  Hier stehen ALLE Texte, Preise, Links und Kontaktdaten der Website.
 *  Wenn du etwas am Inhalt ändern willst, änderst du es NUR hier.
 *  (Farben änderst du in `app/globals.css` im Block `:root`.)
 * ============================================================================
 */

export type IconName =
  | "design"
  | "code"
  | "rocket"
  | "support"
  | "search"
  | "shield";

export const site = {
  /* ---------------------------------------------------------------- Marke */
  brand: {
    name: "Studio Kern",
    /** Kurzer Zusatz neben dem Logo, z. B. im Footer */
    claim: "Websites, die verkaufen",
    /** Wird in Metadaten und im Footer-Copyright verwendet */
    legalName: "Studio Kern – Max Mustermann",
    /** Für Open-Graph & Canonical-URLs. Nach dem Deploy auf deine Domain ändern. */
    url: "https://studio-kern.de",
  },

  /* ------------------------------------------------------------------ SEO */
  seo: {
    title: "Studio Kern – Websites, die Kunden gewinnen",
    titleTemplate: "%s | Studio Kern",
    description:
      "Moderne Websites für Selbstständige und kleine Unternehmen. Festpreis, in 7 Tagen live, messbar mehr Anfragen. Jetzt kostenloses Erstgespräch sichern.",
    keywords: [
      "Webdesign",
      "Website erstellen lassen",
      "Webentwicklung",
      "Landingpage",
      "Next.js",
      "SEO",
      "Freelancer Webdesigner",
    ],
    locale: "de_DE",
  },

  /* ------------------------------------------------------------ Navigation */
  nav: [
    { label: "Leistungen", href: "#leistungen" },
    { label: "Ablauf", href: "#ablauf" },
    { label: "Projekte", href: "#projekte" },
    { label: "Preise", href: "#preise" },
    { label: "FAQ", href: "#faq" },
  ],

  /* ----------------------------------------------------------------- Hero */
  hero: {
    badge: "Nur noch 2 freie Projektplätze im Q4",
    /** Die Headline wird an `|` umgebrochen. Der Teil in `highlight` wird farbig. */
    headlineBefore: "Websites, die aus Besuchern",
    headlineHighlight: "zahlende Kunden",
    headlineAfter: "machen.",
    subline:
      "Ich gestalte und entwickle schnelle, moderne Websites für Selbstständige und kleine Unternehmen – zum Festpreis und in 7 Tagen online.",
    primaryCta: { label: "Kostenloses Erstgespräch", href: "#kontakt" },
    secondaryCta: { label: "Projekte ansehen", href: "#projekte" },
    trustLine: [
      "Antwort innerhalb von 24 h",
      "Festpreis ohne Überraschungen",
      "Fertig in 7 Tagen",
    ],
    /** Kleine Kennzahlen unter dem Hero */
    stats: [
      { value: "50+", label: "Projekte umgesetzt" },
      { value: "7 Tage", label: "Ø bis zum Livegang" },
      { value: "98/100", label: "Ø Lighthouse-Score" },
      { value: "100 %", label: "Festpreis-Garantie" },
    ],
  },

  /* ----------------------------------------------------------- Leistungen */
  services: {
    eyebrow: "Leistungen",
    title: "Alles aus einer Hand",
    subtitle:
      "Von der ersten Idee bis zur fertigen Website, die bei Google gefunden wird – du hast einen Ansprechpartner.",
    items: [
      {
        icon: "design" as IconName,
        title: "Webdesign",
        description:
          "Ein individuelles Design, das zu deiner Marke passt – klar strukturiert und auf Anfragen optimiert. Kein Baukasten-Look.",
        bullets: ["Individuelles UI-Design", "Mobile-First", "Design-Vorschau vorab"],
      },
      {
        icon: "code" as IconName,
        title: "Entwicklung",
        description:
          "Sauber umgesetzt mit Next.js und Tailwind CSS. Schnell, sicher und wartbar – kein aufgeblähtes Plugin-Chaos.",
        bullets: ["Next.js & React", "Sichere Technik", "Eigenes CMS auf Wunsch"],
      },
      {
        icon: "search" as IconName,
        title: "SEO & Performance",
        description:
          "Ladezeiten unter einer Sekunde und eine saubere technische Basis, damit dich Google und deine Kunden finden.",
        bullets: ["Lighthouse 90+", "Technisches SEO", "Ladezeit-Optimierung"],
      },
      {
        icon: "support" as IconName,
        title: "Betreuung",
        description:
          "Hosting, Updates und kleine Änderungen übernehme ich – du kümmerst dich um dein Geschäft.",
        bullets: ["Hosting & Domain", "Monatliche Updates", "Support per WhatsApp"],
      },
    ],
  },

  /* --------------------------------------------------------------- Ablauf */
  process: {
    eyebrow: "Ablauf",
    title: "In 4 Schritten zur neuen Website",
    subtitle:
      "Transparent, planbar und ohne Fachchinesisch. Du weißt jederzeit, woran wir gerade arbeiten.",
    steps: [
      {
        title: "Kostenloses Erstgespräch",
        duration: "30 Minuten",
        description:
          "Wir sprechen über dein Vorhaben, deine Zielgruppe und dein Budget. Du bekommst eine ehrliche Einschätzung – kostenlos und unverbindlich.",
      },
      {
        title: "Konzept & Festpreis-Angebot",
        duration: "1–2 Tage",
        description:
          "Du erhältst eine klare Struktur für deine Seite und ein Angebot mit Festpreis. Keine versteckten Kosten, keine Stundenzettel.",
      },
      {
        title: "Design & Umsetzung",
        duration: "3–5 Tage",
        description:
          "Ich gestalte und entwickle deine Website. Nach dem ersten Entwurf gibt es eine Feedback-Runde, danach folgt der Feinschliff.",
      },
      {
        title: "Livegang & Betreuung",
        duration: "1 Tag",
        description:
          "Domain verbinden, Technik prüfen, online gehen. Auf Wunsch übernehme ich danach Hosting, Updates und Änderungen.",
      },
    ],
  },

  /* ------------------------------------------------------------ Portfolio */
  portfolio: {
    eyebrow: "Projekte",
    title: "Ausgewählte Arbeiten",
    subtitle:
      "Ein Auszug aus aktuellen Projekten. Die Bilder sind Platzhalter – tausche sie gegen deine echten Referenzen aus.",
    items: [
      {
        title: "Praxis Nordlicht",
        category: "Arztpraxis",
        description:
          "Neue Website mit Online-Terminbuchung – 3× mehr Terminanfragen in 2 Monaten.",
        tags: ["Webdesign", "Terminbuchung", "SEO"],
        /** Mockup-Variante: "browser" | "app" | "shop" */
        mockup: "browser" as const,
        href: "#kontakt",
      },
      {
        title: "Tischlerei Brandt",
        category: "Handwerk",
        description:
          "Referenz-Galerie und klare Anfragestrecke für ein Handwerksunternehmen.",
        tags: ["Landingpage", "Galerie", "Lokales SEO"],
        mockup: "shop" as const,
        href: "#kontakt",
      },
      {
        title: "Aurum Consulting",
        category: "Beratung",
        description:
          "Hochwertiger Auftritt mit Case-Studies und automatisierter Lead-Strecke.",
        tags: ["Corporate", "CMS", "Analytics"],
        mockup: "app" as const,
        href: "#kontakt",
      },
      {
        title: "Café Mira",
        category: "Gastronomie",
        description:
          "Digitale Speisekarte, Reservierung und Google-Maps-Anbindung.",
        tags: ["One-Pager", "Reservierung", "Maps"],
        mockup: "browser" as const,
        href: "#kontakt",
      },
    ],
  },

  /* ---------------------------------------------------------------- Preise */
  pricing: {
    eyebrow: "Preise",
    title: "Faire Festpreise",
    subtitle:
      "Du weißt vorher genau, was deine Website kostet. Alle Preise verstehen sich zzgl. 19 % MwSt.",
    plans: [
      {
        name: "Starter",
        price: "990 €",
        priceNote: "einmalig",
        description: "Für den schnellen, professionellen Auftritt.",
        features: [
          "One-Pager mit bis zu 5 Sektionen",
          "Individuelles Design",
          "Mobil optimiert",
          "Kontaktformular",
          "Basis-SEO & Google-Eintrag",
          "Livegang in 7 Tagen",
        ],
        cta: { label: "Projekt anfragen", href: "#kontakt" },
        featured: false,
      },
      {
        name: "Business",
        price: "1.890 €",
        priceNote: "einmalig",
        badge: "Beliebteste Wahl",
        description: "Die richtige Wahl für die meisten Unternehmen.",
        features: [
          "Bis zu 6 Unterseiten",
          "Individuelles Design & Bildkonzept",
          "Texte nach deinem Input",
          "Blog oder Referenzbereich",
          "Erweitertes SEO-Setup",
          "Analytics & Conversion-Tracking",
          "2 Feedback-Runden",
        ],
        cta: { label: "Projekt anfragen", href: "#kontakt" },
        featured: true,
      },
      {
        name: "Premium",
        price: "ab 3.490 €",
        priceNote: "individuell",
        description: "Für größere Vorhaben mit eigenem Redaktionssystem.",
        features: [
          "Unbegrenzte Unterseiten",
          "Eigenes CMS zum Selbstpflegen",
          "Mehrsprachigkeit",
          "Schnittstellen (CRM, Buchung, Shop)",
          "Individuelle Animationen",
          "Persönlicher Ansprechpartner",
        ],
        cta: { label: "Unverbindlich sprechen", href: "#kontakt" },
        featured: false,
      },
    ],
    /** Zusatzzeile unter den Karten */
    note: "Optional: Hosting, Updates und Support ab 39 € / Monat. Jederzeit kündbar.",
  },

  /* --------------------------------------------------------- Kundenstimmen */
  testimonials: {
    eyebrow: "Kundenstimmen",
    title: "Was Kunden sagen",
    subtitle: "Platzhalter-Texte – ersetze sie durch echte Zitate deiner Kunden.",
    items: [
      {
        quote:
          "Innerhalb einer Woche stand die neue Seite. Seitdem bekommen wir deutlich mehr Anfragen – und endlich die richtigen.",
        name: "Sandra Bergmann",
        role: "Inhaberin, Praxis Nordlicht",
        initials: "SB",
      },
      {
        quote:
          "Klare Kommunikation, Festpreis eingehalten, Termin eingehalten. So stelle ich mir Zusammenarbeit vor.",
        name: "Tobias Brandt",
        role: "Geschäftsführer, Tischlerei Brandt",
        initials: "TB",
      },
      {
        quote:
          "Die Seite lädt sofort und sieht auf dem Handy genauso gut aus wie am Rechner. Genau das wollten wir.",
        name: "Yasmin Aydin",
        role: "Partnerin, Aurum Consulting",
        initials: "YA",
      },
    ],
  },

  /* ------------------------------------------------------------------- FAQ */
  faq: {
    eyebrow: "FAQ",
    title: "Häufige Fragen",
    subtitle: "Noch etwas offen? Schreib mir einfach – ich antworte innerhalb von 24 Stunden.",
    items: [
      {
        question: "Was kostet eine Website bei dir?",
        answer:
          "Ein One-Pager startet bei 990 €, die meisten Unternehmensseiten liegen zwischen 1.890 € und 3.490 €. Du bekommst immer einen Festpreis vorab – es gibt keine Nachberechnung nach Stunden.",
      },
      {
        question: "Wie lange dauert die Umsetzung?",
        answer:
          "Ein One-Pager ist in der Regel nach 7 Tagen online, größere Projekte dauern zwei bis vier Wochen. Voraussetzung ist, dass Texte und Bilder zeitnah vorliegen – dabei helfe ich dir.",
      },
      {
        question: "Ich habe noch keine Texte und Bilder. Ist das ein Problem?",
        answer:
          "Nein. Ich arbeite mit einer erprobten Struktur und formuliere auf Wunsch die Texte anhand eines kurzen Fragebogens. Für Bilder nutzen wir hochwertige Lizenzbilder oder organisieren ein Fotoshooting.",
      },
      {
        question: "Kann ich die Website später selbst bearbeiten?",
        answer:
          "Ja. Auf Wunsch binde ich ein einfaches Redaktionssystem ein, mit dem du Texte, Bilder und Beiträge selbst pflegst – ohne technisches Vorwissen. Eine Einführung ist inklusive.",
      },
      {
        question: "Was passiert nach dem Livegang?",
        answer:
          "Auf Wunsch übernehme ich Hosting, Domain, Updates und Sicherung ab 39 € im Monat und setze kleine Änderungen für dich um. Du kannst das Paket monatlich kündigen.",
      },
      {
        question: "Ist die Website DSGVO-konform?",
        answer:
          "Ja. Ich setze auf datensparsame Technik, hoste in der EU, binde keine Schriftarten von externen Servern ein und liefere Impressum, Datenschutzerklärung und – falls nötig – einen Cookie-Banner mit.",
      },
    ],
  },

  /* --------------------------------------------------------------- Kontakt */
  contact: {
    eyebrow: "Kontakt",
    title: "Lass uns über dein Projekt sprechen",
    subtitle:
      "Erzähl mir kurz, was du vorhast. Du bekommst innerhalb von 24 Stunden eine persönliche Antwort mit einer ersten Einschätzung – kostenlos und unverbindlich.",
    email: "Paulmatuszek@icloud.com",
    /** Erste Nummer ist die Hauptnummer (auch für Google / strukturierte Daten) */
    phones: [
      { label: "Telefon", number: "+49 176 89098260" },
      { label: "Telefon (alternativ)", number: "+49 159 01901660" },
    ],
    /** Wird neben den Kontaktdaten als Vertrauens-Liste angezeigt */
    highlights: [
      "Antwort innerhalb von 24 Stunden",
      "Kostenlose Erstberatung, kein Verkaufsgespräch",
      "Festpreis-Angebot vor Projektstart",
    ],
    form: {
      nameLabel: "Name",
      namePlaceholder: "Max Mustermann",
      emailLabel: "E-Mail",
      emailPlaceholder: "max@unternehmen.de",
      companyLabel: "Unternehmen (optional)",
      companyPlaceholder: "Mustermann GmbH",
      budgetLabel: "Budget-Rahmen",
      budgetOptions: [
        "Noch unklar",
        "bis 1.000 €",
        "1.000 – 2.500 €",
        "2.500 – 5.000 €",
        "über 5.000 €",
      ],
      messageLabel: "Worum geht es?",
      messagePlaceholder:
        "Kurz zu meinem Vorhaben: Ich brauche eine neue Website für …",
      privacyLabel: "Ich habe die Datenschutzerklärung gelesen und stimme zu.",
      submitLabel: "Anfrage senden",
      submitPendingLabel: "Wird gesendet …",
      successTitle: "Danke für deine Anfrage!",
      successText:
        "Ich melde mich innerhalb von 24 Stunden bei dir. Schau sicherheitshalber auch in deinen Spam-Ordner.",
      errorText:
        "Das hat leider nicht geklappt. Bitte versuch es erneut oder schreib mir direkt eine E-Mail.",
    },
  },

  /* ---------------------------------------------------------------- Footer */
  footer: {
    description:
      "Studio Kern gestaltet und entwickelt Websites für Selbstständige und kleine Unternehmen – schnell, modern und zum Festpreis.",
    columns: [
      {
        title: "Seite",
        links: [
          { label: "Leistungen", href: "#leistungen" },
          { label: "Ablauf", href: "#ablauf" },
          { label: "Projekte", href: "#projekte" },
          { label: "Preise", href: "#preise" },
          { label: "FAQ", href: "#faq" },
        ],
      },
      {
        title: "Rechtliches",
        links: [
          { label: "Impressum", href: "/impressum" },
          { label: "Datenschutz", href: "/datenschutz" },
        ],
      },
    ],
    social: [
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "GitHub", href: "https://github.com/" },
    ],
  },

  /* ------------------------------------------------------------ Rechtstexte */
  legal: {
    /** Diese Angaben erscheinen auf /impressum und /datenschutz */
    owner: "Max Mustermann",
    company: "Studio Kern",
    street: "Musterstraße 1",
    city: "12345 Musterstadt",
    country: "Deutschland",
    email: "Paulmatuszek@icloud.com",
    phone: "+49 176 89098260",
    phoneSecondary: "+49 159 01901660",
    vatId: "DE123456789",
    /** Zuständige Aufsichtsbehörde / Kammer, falls zutreffend */
    supervisoryAuthority: "",
    /** Hoster für die Datenschutzerklärung */
    hosting: "Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA",
    lastUpdated: "September 2026",
  },
} as const;

export type Site = typeof site;
