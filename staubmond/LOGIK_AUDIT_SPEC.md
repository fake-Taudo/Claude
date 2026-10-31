# Claude-Code-Prompt: Tiefen-Logikprüfung Staubmond

Oct 31, 2026 · @Paul Matuszek

## So benutzt du diesen Prompt

Lege das Dokument als `LOGIK_AUDIT_SPEC.md` neben die `index.html` und schreibe in Claude Code: „Lies LOGIK\_AUDIT\_SPEC.md und führe Phase A vollständig aus. Beginne Phase B erst, wenn der Bericht fertig ist.“ Rechne mit einer langen Sitzung: Die Prüfung ist bewusst gründlich und läuft am besten, ohne dass du zwischendurch eingreifst.

- Der Prompt ist so gebaut, dass Claude Code den **Code als Wahrheit** nimmt und die ursprüngliche Spielbeschreibung nur als Vergleich. Dein Spiel wurde seit dem ersten Prompt verändert (zum Beispiel hat der Kehrwagen im Terminal andere Werte als in der ersten Beschreibung). Solche Unterschiede meldet er als „Abweichung“, nicht automatisch als Fehler.
- Phase A verändert keinen Spielcode. Erst Phase B behebt eindeutige Fehler, jeweils klein und mit Regressionstest. Balancing-Fragen wandern nur in eine Liste, damit nichts an deinem Spielgefühl geändert wird, ohne dass du es entscheidest.
- Ein Teil der Beispiele stammt aus deiner Bildschirmaufnahme vom 26.10. und ist als „im Video auffällig“ markiert. Das sind Hinweise zum Nachprüfen, keine bestätigten Fehler.

## 1. Rolle, Ziel und Regeln

Du bist ein Senior-Gameplay-Engineer und QA-Architekt mit Erfahrung in Idle-, Automatisierungs- und Simulationsspielen. Prüfe das fertige Browser-Spiel **„Staubmond“** (eine `index.html`, Canvas, deutsche Oberfläche) **so tief wie möglich auf Logikfehler**: falsche Berechnungen, Randfälle, Zustandsfehler, Exploits, Dateninkonsistenzen, Speicherprobleme und Abweichungen zwischen Anzeige und echter Logik.

**Ziel:** Am Ende weißt du belegt, wo das Spiel falsch rechnet, hängen bleiben kann, Spielstände beschädigen kann oder sich ausnutzen lässt. Jede Aussage im Bericht ist durch Code-Stelle, Test oder Simulationslauf belegt. Vermutungen kennzeichnest du als solche.

### Grundregeln

1. **Der Code ist die Wahrheit.** Die ursprüngliche Spielbeschreibung (Kartengröße 6.144 × 6.144, Chunks mit 64 × 64 Zellen, Sektoren mit 4 × 4 Chunks, Abschluss ab 98 %, Sauber-Schwelle ≤ 8, Upgrade-Kostenfaktor 1,65 pro Stufe, Kapsel ab 200 kg und so weiter) dient nur als Vergleichswert. Weicht der Code ab, melde das als **Abweichung** mit dem Hinweis, ob sie plausibel gewollt aussieht. Nur wenn der Code in sich widersprüchlich ist (zwei Stellen rechnen unterschiedlich), ist es ein **Fehler**.
2. **Kein Raten.** Behaupte keinen Fehler, ohne ihn reproduziert oder die Code-Stelle mit Zeilenangabe gelesen zu haben. Kannst du etwas nicht prüfen (z. B. echte Touch-Hardware), schreibe das ausdrücklich in den Bericht.
3. **Keine Rückfragen.** Triff Entscheidungen selbst und dokumentiere sie im Bericht.
4. **Balancing ist nicht dein Thema.** Ob etwas zu teuer, zu billig oder zu langsam ist, gehört in die Liste „Balancing-Beobachtungen“ und wird nie geändert. Dein Thema ist, ob die Regeln so funktionieren, wie der Code sie selbst vorgibt.
5. **Arbeite auf einer Kopie.** Kopiere die `index.html` nach `index_audit_original.html` und lasse sie unberührt (Referenz für Vorher/Nachher).

### Ablauf in zwei Phasen

- **Phase A, Prüfung (nur lesen und messen):** Du änderst keinen Spielcode. Erlaubt sind nur neue Dateien für Tests und Berichte (`audit/`). Ergebnis ist `audit/BERICHT.md` nach dem Format in Abschnitt 5.
- **Phase B, Behebung:** Erst nach vollständigem Bericht. Du behebst nur Fehler der Schweregrade Kritisch und Hoch, die eindeutig sind (klare Ursache, klare richtige Soll-Aussage). Jede Behebung ist klein, bekommt einen Regressionstest und wird im Bericht mit Vorher/Nachher dokumentiert. Alles Unklare, jede Design-Entscheidung und alles mit Balancing-Wirkung bleibt unberührt und steht in der Liste „Entscheidung nötig“.

## 2. Methodik: so prüfst du

Kombiniere fünf Verfahren. Jedes findet andere Fehler, kein einzelnes reicht.

### 2.1 Code-Review mit Systemkarte

Lies die gesamte Datei, bevor du testest. Erstelle `audit/SYSTEMKARTE.md`: Module, Zustandsvariablen (wer schreibt, wer liest), Tick-Reihenfolge pro Frame, alle Ereignisse und ihre Auslöser, alle Stellen, die Geld verändern, alle Stellen, die Staubzellen verändern, alle Stellen, die speichern oder laden. Markiere jede **doppelte Berechnung** derselben Größe (z. B. Verkaufspreis in der Anzeige und im Verkauf) und vergleiche beide.

### 2.2 Headless-Test-Harness

Baue eine Testumgebung, die das Spiel ohne Grafik und ohne Eingabegerät treibt:

- Bevorzugt mit Playwright (Chromium ist vorinstalliert, `require('playwright')`), das die Seite lädt, das Spiel über ein Test-Interface (`window.__test`) steuert und Zustände ausliest. Füge dieses Interface **nur** in einer Test-Kopie `index_audit_instrumented.html` ein, nie in die echte Datei.
- Das Interface braucht: Zeit vorspulen um N Ticks ohne Rendern, Zustand lesen (Geld, Inventar, Zellen, Gebäude, Roboter, Forschung, Lizenzen), Aktionen auslösen (putzen an Position, abladen, kaufen, bauen, abreißen, Roboter zuweisen), Zufalls-Seed setzen, Spielstand speichern und laden.
- Alle Tests laufen **deterministisch** mit festem Seed und sind wiederholbar. Jeder gefundene Fehler wird mit einem minimalen, automatisch ausführbaren Reproduktionsfall dokumentiert.

### 2.3 Invarianten (Grundgesetze, die immer gelten müssen)

Formuliere Invarianten als Prüffunktionen und rufe sie nach jedem Testschritt auf. Mindestens:

- **Massenerhaltung:** Entfernter Staub = im Behälter + abgeladen + im Depot gepuffert + in Kapseln verkauft + auf Förderbändern und in Maschinen + in Robotern. Es entsteht nirgends Staub aus dem Nichts und verschwindet keiner.
- **Geldbilanz:** Kontostand = Startgeld + Einnahmen − Ausgaben. Keine Transaktion ändert den Kontostand zweimal oder gar nicht.
- **Nicht-negativ:** Geld, Staub, Kapazitäten, Lagerstände, Forschungspunkte sind nie negativ, nie `NaN`, nie `Infinity`.
- **Obergrenzen:** Behälterfüllstand ≤ Kapazität, Silo ≤ Siloinhalt, Zellenwert im Bereich 0–255, Fortschritt in Prozent im Bereich 0–100.
- **Fortschritt nur vorwärts:** Abgeschlossene Sektoren bleiben abgeschlossen (außer das Spiel hat bewusst eine Rücknahme), freigeschaltete Lizenzen und Forschungen bleiben freigeschaltet.
- **Konsistente Summen:** Sektor-, Regions- und Gesamtfortschritt stimmen mit einer vollständigen Neuzählung der Zellen überein (Neuzählung nur im Test, nie im Spiel).
- **Ein Ort pro Objekt:** Kein Gebäude liegt auf Staub, auf einem anderen Gebäude oder außerhalb der Karte. Kein Förderband-Paket existiert zweimal.
- **Speichern/Laden-Rundlauf:** Zustand → Speichern → Laden ergibt einen identischen Zustand (tief verglichen).

### 2.4 Zeitraffer-Simulation

Simuliere komplette Spielverläufe mit einem Bot, der nach einfachen Regeln spielt (nahe Zellen putzen, bei vollem Behälter abladen, kaufen, was bezahlbar ist, bauen, Roboter einsetzen). Läufe: 10 Min., 1 Std., 5 Std. und 20 Std. Spielzeit, mit mindestens 5 verschiedenen Seeds. Prüfe nach jedem Lauf alle Invarianten und vergleiche die Zeitpunkte der Meilensteine mit der Pacing-Tabelle der Spielbeschreibung (erste Kapsel, erster Sektor, Lizenz 1, erster Roboter und so weiter). Große Abweichungen → Balancing-Beobachtung, kein Fehler. Stillstand (Bot kommt nicht weiter, obwohl Geld da ist) oder eine Sackgasse → Fehler.

### 2.5 Fuzzing und Grenzwerte

- **Zufällige Aktionsfolgen:** 10.000 zufällige Aktionen (gleichmäßig über alle Aktionsarten) mit Invarianten-Prüfung nach jeder Aktion. Gefundene Abstürze, Hinweise in der Konsole und Invariantenbrüche werden auf die kleinste Aktionsfolge reduziert.
- **Grenzwerte:** Jede Zahl der Logik an 0, 1, Maximum, Maximum+1, −1, `NaN` und sehr großen Werten (10^15 und höher) testen.
- **Schnelle Eingaben:** Doppelklick, Mehrfachtipp, gleichzeitiges Kaufen und Abreißen im selben Frame, Menü öffnen und schließen während einer Aktion.
- **Gegenprobe:** Für jede berechnete Größe eine einfache, unabhängige Referenzrechnung im Test schreiben und mit der Spiellogik vergleichen.

## 3. Prüfbereiche

Gehe jeden Bereich vollständig durch. Jede Frage ist entweder mit „OK (belegt durch …)“, „Abweichung“, „Fehler“ oder „Nicht prüfbar (Grund)“ zu beantworten und erscheint so im Bericht. Mit „im Video auffällig“ sind Beobachtungen aus der Bildschirmaufnahme vom 26.10. markiert, die du gezielt nachprüfen sollst.

### 3.1 Welt, Chunks und Karte

- Werden Chunks nur bei Bedarf angelegt, und bleibt ein unberührter Chunk bei jedem Neuerzeugen **bitgleich** (gleicher Seed, gleiche Zellwerte)? Prüfe das über Speichern, Laden und Neustart.
- Ost-West-Umlauf: Bleiben Position, Kamera, Chunk-Zugriff, Putzradius, Abstandsberechnung, Roboter-Wegfindung, Minimap und Vollkarte an der Naht (x = 0 und x = Kartenbreite) korrekt? Putzen direkt an der Naht muss Zellen auf **beiden** Seiten treffen.
- Karten-Ränder oben und unten: Was passiert beim Putzen, Bauen, Fahren und Teleportieren an Zeile 0 und der letzten Zeile? Kein Zugriff außerhalb des Arrays, keine negativen Indizes.
- Sektorzuordnung: Liegt jede Zelle in genau einem Sektor und einer Region? Stimmen Sektorname (z. B. „M-13“) und Regionszuordnung mit den Zellkoordinaten überein? Gibt es Lücken oder Überlappungen an Chunk- und Sektorgrenzen?
- Regionsgrenzen: Ändert sich die Staubart sauber über die Grenze, und stimmt der Preis pro kg für jede Zelle mit ihrer Art überein?
- Hindernisse: Krater, Felsen, Schluchten. Kann man in Felsen oder Schluchten feststecken, durch sie hindurchgehen oder sich darüber hinaus teleportieren? Kann ein Startpunkt oder Depot auf einem Hindernis liegen?

### 3.2 Putzen und Staub

- Wie wird aus Putzradius, Leistung (kg/s) und Zeit die entfernte Staubmenge? Prüfe mit Referenzrechnung, ob kleine und große Frame-Zeiten (16 ms, 100 ms, 1 s) **dieselbe** Menge ergeben. Ist die Menge bildratenunabhängig?
- Wird Staub nur einmal entfernt, wenn Putzradien benachbarter Frames überlappen? Verliert oder verdoppelt das Spiel Staub an Zellgrenzen?
- Ruhende Zellen: Was passiert bei Staubwert 1 bis 8 (unter der Sauber-Schwelle)? Wird der Rest verrechnet, ignoriert oder verschwindet er? Ist die Fläche „sauber“, aber der Rest-Staub noch irgendwo gezählt?
- Putzen mit vollem Behälter: Wird Staub entfernt, aber nicht gespeichert (Staub verschwindet) oder wird gar nichts entfernt? Das muss konsistent mit der Anzeige und dem Hinweis für den Spieler sein.
- Behälter wird im selben Frame voll: Wird der Überschuss korrekt abgeschnitten, ohne dass Staub verloren geht oder überläuft?
- Werkzeugwechsel mitten im Putzen: bleibt der Staub im Behälter, wird die Kapazität neu berechnet, was passiert, wenn der Inhalt größer ist als die neue Kapazität (z. B. Wechsel von Fahrzeug zu Fuß)?
- Verschiedene Staubarten im selben Behälter: Wie wird der Wert pro kg berechnet (pro Art getrennt oder gemittelt)? Stimmt die Summe beim Verkauf mit der Summe beim Putzen überein?
- Gewicht pro Zelle: Passt „0,5 kg bei Wert 255“ (oder der tatsächliche Wert im Code) zu allen Verrechnungen?

### 3.3 Behälter, Depot, Kapsel und Verkauf

- Abladen: Wird exakt die Menge im Behälter übertragen? Was passiert bei leerem Behälter, bei Doppeltipp, bei Abladen während einer Kapselvorbereitung?
- Kapselstart: Ab welcher Menge und unter welcher Bedingung startet sie (Standard: 200 kg)? Was passiert mit Mengen unter der Schwelle (Reststau im Depot)? Geht Staub beim Start einer Kapsel verloren, wird er doppelt verkauft, oder bleibt ein Rest korrekt im Puffer?
- Verkaufspreis: Preis pro kg je Staubart × Menge × alle Multiplikatoren (Verhandlungsgeschick, Erdnachfrage, Sektor-Bonus, Forschung, Missionsbonus). Reihenfolge und Art der Multiplikation (additiv oder multiplikativ) dokumentieren und gegen die Anzeige im Terminal prüfen. **Im Video auffällig:** Die Kapsel-Tabelle zeigt „Einnahmen-Multiplikator ×1,00“ und Mondstaub 1,50 ₥/kg bei „Mondstaub +50 %“ Erdnachfrage. Prüfe, ob der Bonus in der Preisliste schon eingerechnet ist oder zusätzlich angewendet wird (Gefahr: doppelte oder fehlende Anwendung).
- Rundung: Wie werden Beträge gerundet (abgeschnitten, gerundet, gar nicht)? **Im Video auffällig:** Nach 2,2 kg Mondstaub erscheint „+3 ₥“ (rechnerisch 3,3 bei 1,50 ₥/kg). Geht der Rest 0,3 verloren, wird er mitgeführt oder ist die Anzeige nur gerundet? Bei sehr vielen kleinen Verkäufen darf kein systematischer Verlust oder Gewinn durch Rundung entstehen.
- **Im Video auffällig:** Das Depot zeigt nach dem Abladen weiter „Kapsel 0/200 kg“ und „Im Depot gepuffert 0,0 kg“, obwohl Geld hinzukommt, und im Terminal steht „Kapseln gestartet 6“. Prüfe, ob kleine Mengen sofort verkauft werden (dann ist die Anzeige nur missverständlich) oder ob Staub verschwindet, und ob der Zähler „Kapseln gestartet“ mit tatsächlichen Starts übereinstimmt.
- Erdnachfrage: Wechsel alle 20 Spielminuten, Bonus nur für die gewählte Staubart. Wird der Timer bei Pause, Tab-Wechsel und Offline-Zeit korrekt weitergezählt? **Im Video auffällig:** Der Countdown läuft sichtbar herunter (15:55 → 10:27). Prüfe, ob er auch bei geöffnetem Terminal weiterläuft und nach dem Laden nahtlos fortfährt.
- Weitere Depots (Außenposten): Teilen sie Puffer und Zähler mit dem Hauptdepot oder führen sie getrennte? Verhalten beim Abriss eines Depots mit gefüllter Kapsel.

### 3.4 Ökonomie, Upgrades und Preise

- Kostenformel jeder Upgrade-Linie: Prüfe Stufe 1 bis Maximalstufe mit der Referenzrechnung. Gibt es Rundungs- oder Gleitkommafehler bei hohen Stufen (z. B. Kosten, die kleiner werden, oder `NaN` bei Stufe 15+)?
- Kauf: Wird das Geld **vor** dem Effekt abgezogen und nie doppelt? Was passiert bei Kauf mit genau dem passenden Betrag, mit einem Cent zu wenig, bei zwei Kaufklicks im selben Frame?
- Maximalstufe: Verschwindet oder deaktiviert sich der Button korrekt, wird nie eine Stufe zu viel gekauft?
- Anzeige gegen Logik: Der Text „Es fehlen X ₥“ muss exakt Preis minus echtem Kontostand sein (aufgerundet). **Im Video auffällig:** „Es fehlen 233 ₥“ beim Besen (Preis 250, Konto 17) und „Es fehlen 383 ₥“ bei der Schubkarre (Preis 400): Rechne nach, auch während sich der Kontostand verändert.
- Werkzeuge: Gleiche Werkzeuge nicht doppelt kaufbar, Ausrüsten und Ablegen korrekt, „Im Besitz“ und „Ausgerüstet“ nach Neuladen identisch. Gibt es Preise, die Voraussetzungen (Lizenz) zwar anzeigen, aber den Kauf nicht verhindern, oder umgekehrt?
- Einnahmen pro Minute (HUD): Wie wird die Rate berechnet (gleitendes Fenster)? **Im Video auffällig:** Die Anzeige springt zwischen „30“, „20“, „23“ und „25 ₥/Min.“. Prüfe Fensterlänge, Verhalten direkt nach dem Start (Division durch fast null?), nach Pausen und nach dem Laden.
- Ziele und Aufgaben im HUD (z. B. „Laufschuhe 1 (noch 46 ₥)“): Stimmen Beträge und Fortschrittsbalken mit den echten Preisen und dem Kontostand überein?

### 3.5 Werkzeuge und Fahrzeuge

- Radius und Leistung jedes Werkzeugs gegen die Anzeige im Terminal. Ist die effektive Leistung bei Bewegung (70 % Lauftempo beim Putzen) richtig umgesetzt?
- Fahrzeuge: Kapazität, Tempo, Bürstenbreite gegen Anzeige. Ein- und Aussteigen: Wohin geht der Behälterinhalt (Figur und Fahrzeug haben getrennte oder gemeinsame Behälter)? Kann beim Aussteigen Staub verloren gehen oder dupliziert werden?
- Herbeirufen: Gebühr, Lieferzeit, mehrfaches Rufen, Rufen eines bereits nähestehenden Fahrzeugs, Rufen aus gesperrter Region.
- Fahrzeug in Hindernissen: festklemmen, durch Felsen fahren, in Schluchten fallen, Teleport mit Fahrzeug.
- Garage: Abriss mit geparkten Fahrzeugen (laut Beschreibung darf nichts verloren gehen), Platz für mehrere Fahrzeuge, Reihenfolge.
- Fahrzeug-Upgrades: Wirken sie sofort, bleiben sie nach Speichern und Laden, gelten sie pro Fahrzeug oder global?

### 3.6 Bauen und Gebäude

- Bauregeln: „nur auf sauberem Boden“. Wird das für **jede** Zelle der Gebäudefläche geprüft (nicht nur den Mittelpunkt)? Kann man bauen, während man die Fläche noch putzt, und kann Staub (z. B. durch Meteoriten) nachträglich unter ein Gebäude geraten?
- Überlappung: Zwei Gebäude auf derselben Zelle, Gebäude auf Förderband, Gebäude auf Spieler, Fahrzeug oder Roboter, Gebäude über die Kartennaht (Ost-West-Umlauf) oder den Kartenrand.
- Drehen, Verschieben, Abreißen: Bleibt die Belegung der Zellen nach Drehen und Verschieben korrekt (alte Zellen frei, neue belegt)? Abriss erstattet laut Beschreibung 100 %. Prüfe, ob wirklich genau der Kaufpreis (inklusive Rabatte aus Forschung zum Kaufzeitpunkt oder aktueller Rabatt) zurückfließt, und ob sich durch wiederholtes Bauen und Abreißen mit wechselnden Rabatten Geld erzeugen lässt (Exploit).
- Abriss mit Inhalt: Was passiert mit Staub oder Produkten in Silo, Verdichter, Presse, Sammeltrichter, Rampe oder Depot? Geht der Inhalt verloren, wird er erstattet oder verkauft? Das muss einheitlich sein und darf nicht zu Duplikation führen.
- Rückgängig (letzte 20 Aktionen): Stellt es Geld, Zellenbelegung und Inhalte exakt wieder her? Kann man es zum Geldvermehren nutzen (kaufen, abreißen, rückgängig, wiederholen)?
- Vorschau: Stimmt die Anzeige „gültig“ oder „ungültig“ immer mit dem, was beim Platzieren tatsächlich geschieht, überein?
- Freischaltung: Lassen sich gesperrte Gebäude über Umwege bauen (Tastenkürzel, Menü, Rückgängig, Spielstand laden)?
- Antennen und Funknetz: Reichweiten korrekt, Ketten korrekt, Abriss einer Kette in der Mitte, Roboter-Verhalten am Rand des Netzes.

### 3.7 Förderbänder und Verarbeitung

- **Paketerhaltung** (wichtigste Invariante hier): Summiere nach jedem Tick alle Pakete auf Bändern, in Trichtern, Silos, Maschinen und Rampen und vergleiche mit der Summe aller Eingänge minus Ausgänge. Keine Verluste, keine Duplikate. Teste insbesondere Verteiler, Zusammenführer, Rechtskurven und Linkskurven, Kreuzungen, Bänder in Sackgassen und Schleifen.
- Rückstau: Wenn ein Ziel voll ist, stauen sich die Pakete bis zur Quelle zurück. Wird der Quelle-Betrieb pausiert, ohne dass Staub verloren geht? Löst sich der Stau nach Freigabe sauber auf?
- Durchsatz: Entspricht der tatsächliche Durchsatz jeder Bandstufe (10/30/90 kg/s oder die Werte im Code) der Anzeige? Ist er unabhängig von Framerate und Zeitraffer?
- Verteiler: Verteilung gleichmäßig (Round-Robin), keine Verklemmung, wenn ein Ausgang blockiert ist.
- Maschinen: Umwandlungsverhältnis (z. B. 2 kg Staub → 1 kg Sand) exakt, ohne Restverlust bei ungeraden Mengen. Verhalten bei unvollständigem Eingang (1,5 kg bei Bedarf 2 kg): Warten oder Verlust? Mehrere Eingänge (Glasofen mit Glitzerstaub und Sand): Was bei nur einem Eingang? Was bei falschem Material auf dem Band?
- Verkauf per Rampe: Preis pro Produkt stimmt mit Anzeige und Erdnachfrage überein, gleicher Multiplikator wie beim Depot?
- Bandabriss und Umbau mit Paketen darauf: Pakete verschwinden nicht und werden nicht verdoppelt.

### 3.8 Roboter, Funknetz, Fernsimulation und Offline-Fortschritt

- Zuweisung: Kann ein Sektor mehreren Robotern gleichzeitig zugewiesen werden, ohne dass sie dieselbe Zelle doppelt „putzen“ (und damit Staub doppelt gutschreiben)? Was passiert bei Zuweisung eines schon fertigen Sektors, eines gesperrten Sektors oder eines Sektors außerhalb des Funknetzes?
- **Gleichwertigkeit der zwei Modi:** Roboter im Sichtbereich (detailliert) und außerhalb (vereinfacht) müssen pro Zeit **dieselbe Menge Staub** entfernen und abliefern. Messe beide Modi mit gleichem Setup und vergleiche (Toleranz 5 %). Größere Abweichung → Fehler oder Exploit (Roboter außerhalb des Bildschirms sind dann besser oder schlechter als drinnen).
- Übergang zwischen den Modi (Roboter kommt ins Bild oder verlässt es): kein Sprung der Position, kein Verlust und keine Verdopplung von Fracht, kein doppeltes Zielen.
- Abliefern: Roboter fahren zu Trichter, Hangar oder Depot. Was passiert, wenn das Ziel voll oder abgerissen ist, oder wenn kein Ziel erreichbar ist? Bleiben sie sinnvoll stehen, oder tritt eine Endlosschleife auf?
- Funknetz: Verlassen Roboter den Radius, bleiben sie mit Warnsymbol stehen. Kehren sie zurück, wenn eine Antenne gebaut wird? Zusammenspiel mit Teleport und Kartennaht.
- Roboter-Upgrades und Forschung: wirken auf bestehende und neue Roboter gleich?
- Offline-Fortschritt: Höchstens 8 Stunden mit 50 % (oder Code-Werte). Prüfe Berechnung gegen Referenz, Verhalten bei Systemuhr-Sprüngen (Uhr zurückgestellt, weit in die Zukunft gestellt, Zeitzonenwechsel), bei sehr kurzer Abwesenheit (< 1 Min.), bei mehrfachem Laden hintereinander (kein doppelter Offline-Bonus) und bei Abbruch während der Berechnung.
- Fensterwechsel: Wird beim Tab-Wechsel oder Sperrbildschirm (`visibilitychange`) zuverlässig pausiert oder weitergerechnet, ohne dass Zeit doppelt zählt (einmal live, einmal als Offline-Zeit)?

### 3.9 Progression: Sektoren, Lizenzen, Forschung, Aufträge, Events

- Sektoren: Abschluss ab Schwelle (z. B. 98 %), Belohnung **genau einmal**, auch bei Speichern und Laden, bei Staub durch Meteoriten nach dem Abschluss (soll nicht erneut auslösen oder zurücksetzen) und bei gleichzeitigem Abschluss mehrerer Sektoren (z. B. Roboter, Putzstrahl). **Im Video auffällig:** Sektor-Fortschritt „1,3 %“ und Mondglanz-Index „0,0022 %“: Stimmen beide Zahlen mit der echten Neuzählung überein, auch nach Putzen?
- Lizenzen: Bedingungen (Geld, Sektoranzahl) werden korrekt geprüft. **Im Video auffällig:** Das Ziel-Panel zeigt „Lizenz 1: 0/2 Sektoren · 2,0 T…“. Prüfe, ob beide Bedingungen kombiniert geprüft werden, ob das Geld erst beim Kauf abgezogen wird und ob die Freischaltungen (Regionen, Gebäude, Roboter) vollständig und nur einmal wirken.
- Forschung: Kosten in Forschungspunkten, Abhängigkeiten (Kettenfreischaltung), Doppelkauf, Wirkung jedes Knotens (z. B. „+10 % Putzleistung“, „Förderbänder +20 % schneller“) gegen die tatsächliche Wirkung im Code. Wirken Effekte mehrfach, additiv oder multiplikativ, und stimmt das mit der Beschreibung überein? Werden Forschungspunkte aus allen Quellen (Sektoren, Fundstücke, Aufträge) genau einmal vergeben?
- Aufträge: Fortschrittsberechnung, Belohnung genau einmal, Tauschen (1 pro Stunde oder Code-Wert) mit Zeitprüfung und Uhrsprüngen, Ersatzauftrag erscheint, Aufträge mit unmöglicher Bedingung (z. B. Sektor in gesperrter Region), doppelte Aufträge. **Im Video auffällig:** Der Lieferauftrag („die Erde bestellt 60 kg Mondstaub“) zeigt einen fast vollen Balken, nachdem nur 2,2 kg abgeladen wurden. Kläre, was der Balken misst (gesamte bisher verkaufte Menge, Menge seit Auftragsbeginn oder etwas anderes) und ob das zur Beschreibung passt. Der Auftrag „Sektor M-13 … 50 %“ zeigt einen anderen Fortschritt als das Sektorsymbol im HUD: Beide müssen aus derselben Quelle stammen.
- Events: Meteoritenschauer (Staubmenge, Wert, Haufen auf Bauten, Verhalten gegenüber abgeschlossenen Sektoren), Sonnenwind (Dauer, Stapeln mehrerer Effekte, Ende des Effekts nach Laden), Inspektion (Zeitfenster, Belohnung nur einmal, Zielsektor gesperrt?). Wird die Eventzeit pausiert, wenn das Spiel pausiert?
- Fundstücke: 150 Objekte werden erst beim Freiputzen sichtbar. Jedes Objekt exakt einmal einsammelbar, Zustand nach dem Laden gleich, Album-Zähler stimmt, keine Fundstücke unter Hindernissen oder außerhalb der erreichbaren Fläche.
- Tag und Nacht: Dauer, Übergang, keine Logikwirkung außer der gewollten (Sicht), Polare Schatten.
- Ende und „Neue Mondmission“: Endbedingung korrekt, Missionsbonus wird nur einmal vergeben, wirkt multiplikativ wie beschrieben, Seed-Wechsel erzeugt eine vollständig neue Welt ohne Reste des alten Zustands.

### 3.10 Speichern, Laden, Migration, Backups

- Rundlauf: Zustand speichern, Seite neu laden, Zustand vergleichen. Alle Felder identisch, inklusive Zufallszustand, Timer (Erdnachfrage, Events, Auftragstausch), Roboterpositionen und -fracht, Förderbandpakete, Platzierungen, Fahrzeugpositionen, Forschung, Lizenzen, Statistik, Einstellungen.
- Teilspeicherung: Nur veränderte Chunks werden gespeichert. Gehen Chunks verloren, wenn ein Speichervorgang unterbrochen wird (Tab schließen, Absturz)? Ist der Kerndatensatz je konsistent zu den Chunks (kein Zustand „Kern neu, Chunks alt“)? Atomarität: Wird bei Fehlern der alte Stand behalten?
- Backups: 5 rotierende pro Platz, richtige Reihenfolge, keine Verdrängung des einzigen guten Backups durch beschädigte. Prüfe das Laden eines absichtlich beschädigten Spielstands (Prüfsumme falsch, Pflichtfeld fehlt, abgeschnittene Daten, leeres Objekt, falscher Typ, riesige Zahl): sauberes Zurückfallen auf das Backup, verständliche Meldung, kein Absturz, kein halb geladener Zustand.
- Migration: Spielstände mit älterer Schema-Version laden und hochstufen. Fehlende neue Felder bekommen sinnvolle Standardwerte. Erzeuge dazu je einen alten Stand aus `index_audit_original.html` und lade ihn in die geprüfte Fassung.
- Plätze: Drei Speicherplätze beeinflussen sich nicht (Wechsel, Löschen, Kopieren). Welt-Seed pro Platz.
- Export und Import: Rundlauf, Import fremder oder manipulierter Dateien (siehe Abschnitt 4.5), Import in einen belegten Platz.
- Speicherplatz: Verhalten bei voller IndexedDB (Quota), bei gesperrtem Speicher (privates Fenster), bei zwei offenen Tabs desselben Spiels (Wettlauf beim Speichern, Datenverlust?). Das letzte ist ein typischer, oft übersehener Fehler und muss ausdrücklich getestet werden.

### 3.11 Eingabe, Steuerung und Menüs

- Aktionsschicht: Tastatur, Maus und Touch lösen exakt dieselbe Logik aus. Prüfe, ob es Aktionen gibt, die nur über ein Gerät erreichbar sind oder sich je nach Gerät anders verhalten.
- Gleichzeitige Eingaben: Joystick und Putzen-Button gleichzeitig, Mehrfachtipp, Tasten gedrückt halten beim Fensterwechsel (hängende Taste), Loslassen außerhalb des Fensters, Wechsel zwischen Touch und Tastatur.
- Menüs: Spiel läuft im Hintergrund weiter (so gewollt?). Dann müssen alle Kaufprüfungen im Menü gegen den aktuellen Kontostand rechnen, nicht gegen den Öffnungszeitpunkt. Ein im Menü angezeigter, inzwischen veralteter Preis darf nicht mit dem alten Wert gekauft werden können.
- Zustände: Kann man im Baumodus ein Menü öffnen und mit halbem Platzierungszustand zurückkehren, im Fahrzeug bauen, während einer Sequenz (Lizenz, Sektor) kaufen oder abreißen? Sind Sequenzen überspringbar, ohne dass Belohnungen verloren gehen oder doppelt vergeben werden?
- Einstellungen: Wirken sofort und persistieren, keine Logikwirkung (z. B. Effektstärke, Qualitätsstufe, Linkshänder-Modus verändern nie Spielwerte).

### 3.12 Koop (nur prüfen, falls im Code vorhanden)

- Host-Autorität: Kann ein Client Preise, Geld oder Zustände durch manipulierte Nachrichten verändern (Kauf ohne Geld, Verkauf nicht vorhandener Mengen, Teleport, Bauen auf gesperrter Fläche)?
- Geteilte Wirtschaft: Jeder Kauf wirkt für alle, gleichzeitige Käufe zweier Spieler führen nicht zu doppelter Abbuchung oder doppeltem Effekt, Abruf desselben Fundstücks durch zwei Spieler nur einmal.
- Synchronität: Zellenänderungen gehen nicht verloren oder kommen in falscher Reihenfolge an, Beitritt mitten im Spiel liefert den vollen aktuellen Zustand, Verbindungsabbruch verliert keine Daten, Wiederverbinden ist möglich.

## 4. Querschnittsprüfungen

Diese Prüfungen laufen quer durch alle Systeme aus Abschnitt 3.

### 4.1 Zahlen und Darstellung

- **Gleitkomma:** Wo wird Geld oder Staub über Millionen von Schritten aufaddiert? Entsteht Drift (Summe weicht von der Referenz ab)? Vergleiche nach 1, 10 und 100 Millionen Kleinstadditionen mit exakter Ganzzahlrechnung. Prüfe, ob Werte in Ganzzahlen (z. B. in Hundertstel) gehalten oder gerundet werden.
- **Große Zahlen:** Verhalten ab 2^53 (ca. 9 × 10^15): Gehen Beträge verloren, rastet der Kontostand ein, kippt die Anzeige? Kann man überhaupt so weit kommen (Endlos-Modus, Missionsbonus)? Falls ja, ist ein Obergrenzen-Konzept nötig.
- **Formatierung:** Kürzel (Tsd., Mio., Mrd., Bio.) an den Grenzen (999,9 Tsd. gegen 1,0 Mio.), Rundung nach oben (999.999 → „1000,0 Tsd.“ statt „1,0 Mio.“), Nachkommastellen, deutsches Zahlenformat, negative Werte, 0.
- **Anzeige gegen Logik:** Jede angezeigte Zahl (HUD, Terminal, Karte, Statistik) muss aus derselben Quelle stammen wie die rechnende Logik. Liste alle Stellen auf, an denen eine Zahl getrennt berechnet wird, und weise nach, dass beide Pfade gleich sind.
- **Zufall:** Wird der Logik-Zufallsgenerator nur für deterministische Dinge verwendet und der Effekt-Zufall getrennt (laut früherer Vorgabe)? Gibt es `Math.random()` in der Logik, das Ergebnisse nicht reproduzierbar macht?

### 4.2 Zeit und Schleife

- Feste Logikrate (z. B. 60 Hz): Verhalten bei langen Frames (Tab im Hintergrund, Debugger, langsames Gerät). Gibt es eine Obergrenze für nachgeholte Schritte (sonst „Spirale des Todes“)? Geht bei dieser Obergrenze Spielzeit verloren, und wird sie dann über Offline-Zeit oder gar nicht gutgeschrieben?
- Alle Timer (Erdnachfrage, Events, Auftragstausch, Tageszyklus, Kapselstart, Fahrzeuglieferung, Roboter-Akku falls vorhanden) laufen auf **einer** Zeitbasis. Mische nicht Spielzeit und Systemuhr ohne klare Regel. Prüfe Pause, Menü, Hintergrund-Tab, Laden und Zeitraffer.
- Zeitraffer im Test: 1 Tick gegen 60 Ticks gegen 3.600 Ticks ergeben dieselben Ergebnisse (Zustandsgleichheit nach gleicher Gesamtzeit, innerhalb einer kleinen, begründeten Toleranz).
- Reihenfolge innerhalb eines Ticks: Hat sie Auswirkungen (z. B. Verkauf vor oder nach dem Putzen, Preis vor oder nach Eventwechsel)? Sind Ergebnisse unabhängig von der Objektreihenfolge (Roboter A vor B)?

### 4.3 Zustand und Nebenläufigkeit

- Suche nach **doppeltem Zustand** (dieselbe Information an zwei Stellen) und prüfe, ob alle Schreibstellen beide aktualisieren.
- Suche nach **veralteten Verweisen** (Referenz auf ein abgerissenes Gebäude, ein gelöschtes Fahrzeug, einen entfernten Roboter, einen beendeten Auftrag) und nach Speicherlecks durch nie entfernte Objekte.
- Suche nach Stellen, die während einer Iteration die Liste ändern, über die iteriert wird (Überspringen oder doppelte Verarbeitung).
- **Wettlaufsituationen:** asynchrone Speichervorgänge, IndexedDB-Rückrufe, Timer, `await` mitten in der Logik. Kann der Spieler währenddessen den Zustand ändern?
- Fehlerbehandlung: `try/catch`, die Fehler verschlucken und mit kaputtem Zustand weiterlaufen. Jede Stelle melden, an der ein Fehler still ignoriert wird.

### 4.4 Exploits und Missbrauch

Suche gezielt nach Wegen, Geld, Staub oder Fortschritt ohne die vorgesehene Gegenleistung zu erhalten:

- Bauen und Abreißen, Rückgängig, Speichern und Laden zu günstigen Zeitpunkten (Save-Scumming gegen Zufallsereignisse ist akzeptabel, gegen Kaufpreise nicht).
- Tauschen von Aufträgen, bis ein guter erscheint (innerhalb der Regeln erlaubt, aber nur wenn die Begrenzung nicht umgehbar ist, z. B. durch Uhr stellen).
- Uhr zurückstellen oder vorstellen für Offline-Bonus, Eventtimer, Auftragstausch, Erdnachfrage.
- Fahrzeug-Duplikation (Herbeirufen, Garage, Abriss, Aussteigen an einer Kante).
- Roboter außerhalb des Bildschirms effizienter als innen (siehe 3.8).
- Geld verändern über die Browser-Konsole ist **nicht** Teil der Prüfung, aber melde, ob der Spielstand eine Prüfsumme hat (Manipulationsschutz ist optional und gilt nur als Hinweis).

### 4.5 Import, Eingaben von außen und Sicherheit

- Spielstand-Import: JSON mit unerwarteten Typen, überlangen Feldern, `__proto__`- und `constructor`-Schlüsseln (Prototype Pollution), extrem großen Arrays, Zahlen als Text, `null` an Pflichtstellen. Das Spiel darf nie abstürzen, nie Code ausführen und nie den globalen Zustand verseuchen.
- Keine Verwendung von `innerHTML` mit Daten aus Spielständen, Namen oder Importen (XSS). Ersetze, wo nötig, durch `textContent`. Liste alle Stellen.
- Keine `eval`, kein `Function(...)`, keine Daten-URLs aus Nutzereingaben.
- Koop (falls vorhanden): Eingabevalidierung für alle Nachrichten (Typ, Bereich, Absender, Rate).

### 4.6 Speicher und Leistung (Logikbezug)

- Speicherverbrauch über lange Läufe (20 Std. Spielzeit im Zeitraffer): Wachsen Arrays, Objekt-Listen, Chunk-Cache, Partikel oder Event-Listener unbegrenzt? Messe den Heap vorher und nachher und melde Trends.
- Worst-Case: Tausende berührte Chunks, 50 bis 200 Roboter, 5.000 Bandzellen, volle Karte gleichzeitig. Wo steigt die Frame-Zeit über 16 ms und was ist die Ursache (quadratische Schleifen, Suche in Listen, Neuzählungen im Spiel-Loop)?
- Speichern: Dauer und Größe des Spielstands bei Vollausbau. Gibt es Frames mit Stillstand beim Speichern (mehr als 50 ms)?
- Abgeschlossene Sektoren: Werden saubere Chunks komprimiert oder bleibt jeder berührte Chunk voll im Speicher und im Spielstand?

## 5. Bericht, Schweregrade und Behebung

### Schweregrade

| Grad | Bedeutung | Beispiele |
| --- | --- | --- |
| Kritisch | Spielstand-Verlust oder -Beschädigung, Absturz, Fortschrittsblocker, Geld oder Staub unbegrenzt erzeugbar | Beschränkungen umgehbar, Speichern zerstört Chunks, Roboter-Endlosschleife |
| Hoch | Falsche Berechnung mit klarer Auswirkung auf Geld, Staub oder Fortschritt, Exploit mit Aufwand | Bonus doppelt angewendet, Belohnung mehrfach, Offline-Zeit doppelt |
| Mittel | Falsche Anzeige, falsche Einzelfall-Berechnung, Randfall mit begrenzter Wirkung | Anzeige weicht von Logik ab, Rundungsverlust bei kleinen Mengen |
| Niedrig | Kosmetik der Logik, unklare Zustandsanzeige, kleine Inkonsistenz | Zähler falsch beschriftet, Tooltip veraltet |
| Hinweis | Beobachtung ohne Fehler | Abweichung von der Spielbeschreibung, Balancing-Beobachtung |

### Format von `audit/BERICHT.md`

1. **Zusammenfassung** (maximal 15 Zeilen): Anzahl Funde pro Schweregrad, die 5 wichtigsten Probleme, Gesamteindruck der Logikqualität, was nicht geprüft werden konnte.
2. **Prüfumfang:** Welche Abschnitte aus Dokument 3 und 4 wurden vollständig, teilweise oder gar nicht geprüft, mit Begründung.
3. **Testergebnisse:** Tabelle der Invarianten (bestanden, verletzt, wie oft), der Zeitraffer-Läufe (Dauer, Seed, Meilensteine, Auffälligkeiten) und des Fuzzings (Anzahl Aktionen, Funde).
4. **Funde**, jeweils im gleichen Format:
   - **ID** (z. B. `F-014`), **Schweregrad**, **Bereich**
   - **Beschreibung** in zwei Sätzen: Was ist falsch? Was wäre richtig?
   - **Fundstelle:** Funktion und Zeilennummer
   - **Reproduktion:** automatisch ausführbarer Testfall (Dateiname) und erwartetes gegen tatsächliches Ergebnis
   - **Auswirkung** für den Spieler, in einem Satz
   - **Vorschlag zur Behebung** (kleinstmögliche Änderung) und Risiko der Änderung
   - **Status:** offen, behoben, Entscheidung nötig
5. **Abweichungen von der Spielbeschreibung** (gewollt oder ungewollt wirkend).
6. **Balancing-Beobachtungen:** Meilensteinzeiten gegen Pacing-Tabelle, auffällige Preissprünge, tote Upgrades (kaum lohnend), dominante Strategien.
7. **Im Video auffällig:** Ergebnis zu jedem markierten Punkt aus Abschnitt 3 (ob bestätigt, widerlegt oder nicht prüfbar).
8. **Entscheidung nötig:** Alles, was nur du als Spieldesigner entscheiden kannst.
9. **Anhang:** Systemkarte, Testdateien, Befehl zum erneuten Ausführen aller Tests (ein Befehl, der in unter 10 Minuten durchläuft, plus ein optionaler Langlauf).

### Regeln für Phase B (Behebung)

- Nur Funde mit Grad Kritisch oder Hoch, die **eindeutig** sind, und nur nach vollständigem Bericht.
- Eine Behebung = eine kleine Änderung, die genau einen Fund adressiert. Keine Umbauten, kein Aufräumen nebenbei, kein Umbenennen.
- Vor jeder Behebung: Test schreiben, der den Fehler zeigt (rot). Nach der Behebung: derselbe Test ist grün, **alle** anderen Tests und Invarianten sind weiterhin grün, und ein 60-Sekunden-Testlauf ergibt dieselben Werte wie vorher, außer in der gezielt geänderten Größe.
- **Speicherformat-Schutz:** Behebungen dürfen das Speicherformat nur mit Migration ändern. Ein alter Spielstand muss danach weiter laden. Wenn nicht anders möglich, den Fund als „Entscheidung nötig“ markieren.
- **Balancing-Schutz:** Kein Wert aus `CONFIG` wird verändert, außer er ist nachweislich ein Tippfehler im Widerspruch zu einer zweiten Stelle im Code.
- Nach Phase B: aktualisierte `index.html`, `audit/BERICHT.md` mit Status pro Fund und eine kurze `audit/AENDERUNGEN.md` mit Vorher/Nachher jeder Behebung.

### Abnahmekriterien

- [ ] Systemkarte erstellt, alle Doppelberechnungen und doppelten Zustände aufgelistet
- [ ] Test-Harness läuft mit einem Befehl, alle Tests deterministisch
- [ ] Alle Invarianten aus 2.3 nach jedem Testschritt geprüft
- [ ] Zeitraffer-Läufe (10 Min., 1 Std., 5 Std., 20 Std.) mit mindestens 5 Seeds abgeschlossen
- [ ] Fuzzing mit mindestens 10.000 Aktionen pro Seed ohne ungeklärte Funde
- [ ] Jeder Prüfbereich aus Abschnitt 3 und 4 mit OK, Abweichung, Fehler oder „nicht prüfbar“ beantwortet
- [ ] Jeder „im Video auffällig“-Punkt hat ein Ergebnis
- [ ] Jeder Fund hat Fundstelle, Reproduktion und Vorschlag
- [ ] Phase B hat jeden eindeutigen kritischen und hohen Fund mit Regressionstest behoben
- [ ] Alter Spielstand lädt nach den Änderungen unverändert, `CONFIG` ist unverändert
- [ ] Bericht enthält eine ehrliche Liste dessen, was nicht geprüft werden konnte
