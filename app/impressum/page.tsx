import type { Metadata } from "next";
import { site } from "@/content/site";
import { LegalPage, LegalSection } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Impressum und Anbieterkennzeichnung von ${site.brand.name}.`,
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  const { legal } = site;

  return (
    <LegalPage title="Impressum" updated={legal.lastUpdated}>
      <p className="rounded-xl border border-line bg-white/[0.03] p-4 text-xs">
        <strong className="text-fg">Hinweis:</strong> Diese Seite enthält
        Platzhalter. Ersetze die Angaben in{" "}
        <code className="text-fg">content/site.ts</code> (Abschnitt{" "}
        <code className="text-fg">legal</code>) durch deine echten Daten und lass
        den Text vor dem Livegang rechtlich prüfen.
      </p>

      <LegalSection title="Angaben gemäß § 5 DDG">
        <p>
          {legal.company}
          <br />
          {legal.owner}
          <br />
          {legal.street}
          <br />
          {legal.city}
          <br />
          {legal.country}
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: {legal.phone}
          <br />
          Telefon (alternativ): {legal.phoneSecondary}
          <br />
          E-Mail:{" "}
          <a
            href={`mailto:${legal.email}`}
            className="text-fg underline underline-offset-4 hover:text-accent"
          >
            {legal.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-Identifikationsnummer">
        <p>Gemäß § 27 a Umsatzsteuergesetz: {legal.vatId}</p>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt">
        <p>
          {legal.owner}, {legal.street}, {legal.city}
        </p>
      </LegalSection>

      <LegalSection title="EU-Streitschlichtung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline underline-offset-4 hover:text-accent"
          >
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte und Links">
        <p>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich. Für Inhalte externer Links
          ist stets der jeweilige Anbieter oder Betreiber der Seiten
          verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir
          derartige Inhalte umgehend.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
