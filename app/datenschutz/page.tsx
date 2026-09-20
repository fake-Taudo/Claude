import type { Metadata } from "next";
import { site } from "@/content/site";
import { LegalPage, LegalSection } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: `Informationen zum Datenschutz bei ${site.brand.name}.`,
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  const { legal } = site;

  return (
    <LegalPage title="Datenschutzerklärung" updated={legal.lastUpdated}>
      <p className="rounded-xl border border-line bg-white/[0.03] p-4 text-xs">
        <strong className="text-fg">Hinweis:</strong> Dies ist eine
        Muster-Datenschutzerklärung als Platzhalter. Passe sie an deine
        tatsächlich eingesetzten Dienste an und lass sie vor dem Livegang
        rechtlich prüfen.
      </p>

      <LegalSection title="1. Verantwortliche Stelle">
        <p>
          {legal.company}, {legal.owner}
          <br />
          {legal.street}, {legal.city}
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

      <LegalSection title="2. Hosting">
        <p>
          Diese Website wird bei einem externen Dienstleister gehostet:{" "}
          {legal.hosting}. Beim Aufruf der Seite werden automatisch
          Server-Logfiles verarbeitet (IP-Adresse, Datum und Uhrzeit,
          aufgerufene Seite, Browsertyp). Rechtsgrundlage ist Art. 6 Abs. 1
          lit. f DSGVO – unser berechtigtes Interesse an einem sicheren und
          stabilen Betrieb.
        </p>
      </LegalSection>

      <LegalSection title="3. Kontaktformular und E-Mail-Kontakt">
        <p>
          Wenn du uns über das Formular oder per E-Mail kontaktierst,
          verarbeiten wir die von dir angegebenen Daten (Name, E-Mail-Adresse,
          Unternehmen, Budget-Rahmen und Nachricht), um deine Anfrage zu
          beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
          (vorvertragliche Maßnahmen) bzw. lit. f DSGVO. Die Daten werden
          gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind und
          keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies und Analyse">
        <p>
          Diese Website setzt keine Tracking-Cookies und bindet keine externen
          Analysedienste ein. Schriftarten werden lokal ausgeliefert, es
          entsteht dadurch keine Verbindung zu Servern Dritter. Sollten später
          Analyse- oder Marketing-Dienste hinzukommen, holen wir vorab deine
          Einwilligung über einen Cookie-Banner ein.
        </p>
      </LegalSection>

      <LegalSection title="5. Deine Rechte">
        <p>
          Du hast jederzeit das Recht auf Auskunft (Art. 15 DSGVO),
          Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
          Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie
          Widerspruch gegen die Verarbeitung (Art. 21). Wende dich dafür an die
          oben genannte Adresse. Außerdem steht dir ein Beschwerderecht bei
          einer Datenschutz-Aufsichtsbehörde zu.
        </p>
      </LegalSection>

      <LegalSection title="6. SSL-/TLS-Verschlüsselung">
        <p>
          Diese Seite nutzt aus Sicherheitsgründen eine TLS-Verschlüsselung. Du
          erkennst sie an der Adresszeile deines Browsers, die mit „https://“
          beginnt.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
