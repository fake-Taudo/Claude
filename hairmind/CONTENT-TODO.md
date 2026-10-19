# CONTENT-TODO – Friseur HairMind

Offene Punkte vor dem Livegang. **Vor dem Livegang muss diese Liste leer sein.**
Erledigte Punkte bitte löschen.

Jeder fehlende Inhalt steht auf der Seite als `[[INHALT: …]]` (gelb gestrichelt umrandet).
Alle noch offenen Platzhalter findet dieser Befehl im Ordner `hairmind/`:

```bash
grep -rn "\[\[INHALT:" --include=*.html --include=*.xml --include=*.txt .
```

---

## Preise und Leistungen (`index.html`, Abschnitt „Preise“)

- [ ] `[[INHALT: Preis]]`: Preis „ab“ in Euro für Damen, Herren, Kinder, Färben, Styling und jede weitere Leistung (6 Stellen).
- [ ] `[[INHALT: Dauer]]`: Dauer je Leistung (6 Stellen).
- [ ] `[[INHALT: weitere Leistungen]]`: weitere Leistungen. Pro Leistung eine Tabellenzeile kopieren. Gibt es keine, die Zeile löschen.
- [ ] `[[INHALT: Altersgrenze Kinder]]`: z. B. „bis … Jahre“.
- [ ] `[[INHALT: Hinweis zur Umsatzsteuer]]`: „inkl. MwSt.“ oder Hinweis nach § 19 UStG (Kleinunternehmer). Wenn keiner nötig ist, Zeile löschen.

## Salon und Bilder

- [ ] `[[INHALT: Marke der Pflegeprodukte]]` (Abschnitt „Der Salon“).
- [ ] `[[INHALT: Salonfoto 2, Querformat]]` und `[[INHALT: Salonfoto 3, Hochformat]]`: echte Salonfotos, lange Kante mindestens 1600 px. Am besten ohne erkennbare Personen.
- [ ] **Einwilligung nötig:** Auf dem Salonfoto im Startbereich (`assets/salon-innen.jpg` und Varianten `salon-innen-hero.*`) sind Personen erkennbar (ein Friseur und eine Kundin). Vor der Veröffentlichung eine schriftliche Einwilligung beider Personen einholen oder das Foto ersetzen.
- [ ] **Startfoto in besserer Auflösung:** `assets/salon-innen.jpg` hat nur 194 × 323 px und wirkt groß dargestellt unscharf. Bitte das Originalfoto liefern (mindestens 1200 × 1500 px). Die Varianten werden dann neu erzeugt (siehe README).

## Kontakt und Formular

- [ ] `[[INHALT: E-Mail-Adresse des Salons]]`: steht in `index.html` (Formular, Attribut `data-mailto`), `impressum.html` und `datenschutz.html`.
- [ ] **Versandweg der Terminanfrage festlegen.** Stand der Entscheidung:
  - Oberfläche und Prüfung der Eingaben sind fertig. Es gibt bewusst kein erfundenes Backend.
  - Der Versand ist austauschbar über zwei Attribute am Formular `<form id="anfrage">`:
    `data-endpoint` (Formular-Endpunkt, POST, hat Vorrang) und `data-mailto` (E-Mail-Adresse).
  - **Empfehlung:** ein kleines Mailskript beim eigenen Hoster (kein Drittanbieter) oder ein
    Formular-Dienst mit Sitz und Servern in der EU und Vertrag zur Auftragsverarbeitung.
    Dessen URL in `data-endpoint` eintragen.
  - **Übergang:** Sobald die E-Mail-Adresse eingetragen ist, öffnet das Formular das
    E-Mail-Programm der Besucher mit der fertigen Anfrage (`mailto:`). Das funktioniert ohne
    Dienst, setzt aber ein eingerichtetes E-Mail-Programm voraus.
  - **Jetzt:** Ohne beides zeigt das Formular nach dem Absenden: „Die Online-Anfrage ist noch
    nicht freigeschaltet. Bitte rufen Sie uns an: 02161 5640891.“
  - Nach der Entscheidung den Abschnitt „Terminanfrage“ in `datenschutz.html` anpassen.

## Impressum (`impressum.html`, § 5 DDG)

- [ ] `[[INHALT: Name der Inhaberin / des Inhabers]]` (auch in `datenschutz.html`)
- [ ] `[[INHALT: Rechtsform]]`
- [ ] `[[INHALT: USt-IdNr. nach § 27a UStG, falls vorhanden]]`
- [ ] `[[INHALT: Berufsbezeichnung und Staat der Verleihung]]`
- [ ] `[[INHALT: zuständige Handwerkskammer mit Anschrift]]`
- [ ] `[[INHALT: Handwerksrolle, Eintragungsnummer]]`
- [ ] `[[INHALT: berufsrechtliche Regelungen, z. B. Handwerksordnung, mit Fundstelle]]`
- [ ] `[[INHALT: Angabe zur Verbraucherstreitbeilegung nach § 36 VSBG]]`
- [ ] Bestätigen, dass Kleinenbroicher Str. 2A, 41352 Korschenbroich-Pesch die ladungsfähige Anschrift ist.

## Datenschutz (`datenschutz.html`)

- [ ] `[[INHALT: Hosting-Anbieter mit Anschrift]]`
- [ ] `[[INHALT: Speicherdauer der Server-Logdateien laut Hoster]]`
- [ ] `[[INHALT: Formular-Dienst mit Anschrift und Serverstandort, oder Versand per E-Mail]]`
- [ ] `[[INHALT: Speicherdauer der Terminanfragen]]`
- [ ] `[[INHALT: Datum der Datenschutzerklärung]]`
- [ ] `[[INHALT: Datenschutzerklärung rechtlich prüfen lassen und diesen Hinweis entfernen]]`

## Domain und Livegang

- [ ] `[[INHALT: Domain]]`: in `index.html` (canonical, `og:url`, `og:image`, JSON-LD `url` und `image`), `robots.txt` und `sitemap.xml`. Ohne `https://` und ohne Schrägstrich am Ende eintragen, z. B. `www.beispiel.de`.
