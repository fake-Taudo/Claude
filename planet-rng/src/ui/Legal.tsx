// Impressum and privacy policy of the game (opened from the settings).

import { LEGAL } from '../config/legal';

const L = LEGAL;

function Address() {
  return (
    <address class="legal-text__address">
      {L.name}
      <br />
      {L.street}
      <br />
      {L.city}
      <br />
      {L.country}
    </address>
  );
}

const Mail = () => <a href={`mailto:${L.email}`}>{L.email}</a>;

export function Impressum() {
  return (
    <div class="legal-text" data-testid="impressum">
      <h4>Angaben gemäß § 5 DDG</h4>
      <Address />
      <h4>Kontakt</h4>
      <p>
        E-Mail: <Mail />
      </p>
      <h4>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h4>
      <p>
        {L.name}, {L.street}, {L.city}
      </p>
      <h4>Verbraucherstreitbeilegung</h4>
      <p>Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      <h4>Haftung für Inhalte</h4>
      <p>
        Planet RNG ist ein kostenloses, privates Spieleprojekt ohne Werbung und ohne Käufe. Die Inhalte wurden mit Sorgfalt erstellt; für Richtigkeit, Vollständigkeit und
        Aktualität kann keine Gewähr übernommen werden. Alle Auren, Chancen, Spielwährungen und Gegenstände sind rein fiktiv und haben keinen Geldwert. Der „globale Feed“
        im Spiel ist simuliert; die dort genannten Spieler existieren nicht.
      </p>
      <h4>Haftung für Links</h4>
      <p>Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.</p>
      <h4>Urheberrecht</h4>
      <p>
        Spiel, Grafiken, Effekte, Texte und Töne sind eigene Werke und urheberrechtlich geschützt. Die Schrift „Fredoka“ steht unter der SIL Open Font License. Planet RNG ist
        von Spielen wie Sol's RNG inspiriert, steht aber in keiner Verbindung zu deren Entwicklern.
      </p>
      <p class="legal-text__updated">Stand: {L.updated}</p>
    </div>
  );
}

export function Datenschutz() {
  return (
    <div class="legal-text" data-testid="datenschutz">
      <h4>1. Verantwortlicher</h4>
      <p>Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO):</p>
      <Address />
      <p>
        E-Mail: <Mail />
      </p>

      <h4>2. Das Wichtigste in Kürze</h4>
      <p>
        Planet RNG braucht kein Konto, setzt keine Cookies, zeigt keine Werbung und verwendet keine Analyse- oder Tracking-Werkzeuge. Das Spiel lädt nach dem ersten Aufruf
        keine Inhalte von fremden Servern nach: Schrift, Grafiken und Töne sind in der Spieldatei enthalten. Dein Spielstand bleibt auf deinem Gerät.
      </p>

      <h4>3. Hosting und Server-Protokolle</h4>
      <p>
        Die Web-Version wird bei {L.host.name}, {L.host.address}, bereitgestellt. Beim Aufruf der Seite verarbeitet der Hoster technisch notwendige Daten, die dein Browser
        sendet: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene Datenmenge, Browser und Betriebssystem sowie die zuvor besuchte Seite. Das dient der
        Auslieferung und der Sicherheit der Seite (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse an einem stabilen und sicheren Betrieb). Die
        Protokolle werden vom Hoster nach kurzer Zeit gelöscht; ich werte sie nicht aus.
      </p>
      <p>
        Der Hoster sitzt in den USA. Die Übermittlung stützt sich auf die Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework, soweit der
        Anbieter danach zertifiziert ist. Mit dem Hoster besteht ein Vertrag zur Auftragsverarbeitung im Rahmen seiner Nutzungsbedingungen. Weitere Informationen:{' '}
        <a href={L.host.privacy} target="_blank" rel="noopener noreferrer">
          Datenschutzerklärung von Render
        </a>
        .
      </p>

      <h4>4. Spielstand und Einstellungen (lokaler Speicher)</h4>
      <p>
        Dein Spielstand (Auren, Gold Coins, Gegenstände, Fortschritt, Statistiken) und deine Einstellungen werden im lokalen Speicher deines Browsers (localStorage) auf
        deinem Gerät abgelegt, damit du beim nächsten Besuch weiterspielen kannst. Diese Daten werden nicht an mich oder Dritte übertragen. Das Speichern ist für das
        gewünschte Spiel unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst den Spielstand jederzeit in den Einstellungen unter „Spielstand löschen“ entfernen oder
        die Website-Daten in deinem Browser löschen. Der Export eines Spielstands erzeugt einen Text, den nur du selbst weitergibst.
      </p>

      <h4>5. Kontakt per E-Mail</h4>
      <p>
        Wenn du mir eine E-Mail schreibst, verarbeite ich deine Adresse und den Inhalt der Nachricht, um dir zu antworten (Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO). Die Daten
        werden gelöscht, sobald die Anfrage erledigt ist und keine gesetzlichen Aufbewahrungspflichten bestehen.
      </p>

      <h4>6. Deine Rechte</h4>
      <p>
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20)
        und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Eine formlose E-Mail an <Mail /> genügt.
      </p>
      <p>
        Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der für mich zuständigen Landesbeauftragten für Datenschutz und
        Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.
      </p>

      <h4>7. Kinder und Jugendliche</h4>
      <p>Das Spiel erhebt keine personenbezogenen Daten von Spielerinnen und Spielern; ein Alter wird nicht abgefragt.</p>

      <h4>8. Änderungen</h4>
      <p>Wenn sich das Spiel oder das Hosting ändert, passe ich diese Erklärung an. Es gilt die jeweils im Spiel angezeigte Fassung.</p>
      <p class="legal-text__updated">Stand: {L.updated}</p>
    </div>
  );
}
