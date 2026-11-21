# Friseur HairMind – Website

Statische One-Page-Website für Friseur HairMind in Korschenbroich-Pesch.
HTML, CSS und etwas Vanilla-JS. Kein Framework, kein Build-Schritt, keine Cookies,
kein Tracking, keine externen Anfragen.

**Vor dem Livegang:** `CONTENT-TODO.md` abarbeiten, bis die Liste leer ist.

## Lokal starten

```bash
cd hairmind
python3 -m http.server 8000
# → http://localhost:8000
```

`index.html` per Doppelklick öffnen geht auch.

## Dateien

```
index.html          Startseite, alle Texte stehen hier
impressum.html      Impressum (Platzhalter, § 5 DDG)
datenschutz.html    Datenschutzerklärung (Platzhalter)
CONTENT-TODO.md     offene Inhalte, vor dem Livegang leer
DESIGN.md           Gestaltungsentscheidungen und Begründungen, vor Änderungen lesen
robots.txt, sitemap.xml
css/style.css       Gestaltung; Farben und Abstände oben in :root
js/main.js          Live-Status, Menü, Einblenden, Terminanfrage
fonts/              Bodoni Moda (Überschriften), Archivo (Text), lokal, mit OFL-Lizenz
assets/             Bilder
```

### Bilder in `assets/`

| Datei | Herkunft / Verwendung |
| --- | --- |
| `logo.jpg` | Original-Logo (Quelle) |
| `logo-monogramm.*` | daraus freigestellt, Kopfzeile |
| `logo-hairmind.*` | daraus freigestellt, Fußzeile |
| `favicon-32.png`, `apple-touch-icon.png`, `og-image.jpg` | aus dem Logo erzeugt |
| `salon-innen.jpg` | Original-Salonfoto (Quelle, nur 194 × 323 px) |
| `salon-innen-hero.avif/.webp/.jpg` | 4:5-Zuschnitt ohne die Gläser im Vordergrund, Startbereich |
| `instagram-qr.jpg` | Foto des Instagram-Aufstellers; nicht eingebunden, weil unscharf und auf dem Handy nutzlos. Instagram wird verlinkt. |
| `quelle-google-bewertungen.jpg`, `quelle-oeffnungszeiten.jpg` | Belege für Rezensionen und Öffnungszeiten; nicht eingebunden |

Die Rezensionen stehen im Originalwortlaut, auch mit Tippfehlern. Die Namen sind gekürzt
(Vorname bzw. Initiale und Anfangsbuchstabe des Nachnamens).

Bessere Fotos austauschen: Neues Bild ablegen und in `index.html` im `<picture>` die Pfade
sowie `width`/`height` anpassen. WebP und AVIF lassen sich z. B. mit
[squoosh.app](https://squoosh.app) erzeugen. Bilder unterhalb des Startbereichs mit
`loading="lazy"` einbinden.

## Inhalte pflegen

- **Platzhalter** haben die Form `<span class="todo">[[INHALT: …]]</span>`. Den ganzen
  `span` durch den echten Text ersetzen. Alle offenen Platzhalter zeigt
  `grep -rn "\[\[INHALT:" --include=*.html --include=*.xml --include=*.txt .`
- **Öffnungszeiten** stehen an drei Stellen: Tabelle in `index.html`, JSON-LD im `<head>`
  von `index.html` und `HOURS` in `js/main.js` (für den Live-Status).
- **Feiertage und Urlaub:** in `js/main.js` bei `CLOSED_DATES` eintragen, z. B.
  `['2026-12-24', '2026-12-26']`. Der Live-Status und die Prüfung des Wunschtags
  berücksichtigen sie dann.

## Terminanfrage: Versand einrichten

Das Formular nimmt **Wunschzeiten** an, keine verbindlichen Buchungen. Der Versand ist
austauschbar und wird über zwei Attribute am `<form id="anfrage">` in `index.html`
gesteuert:

```html
<form … data-endpoint="" data-mailto="[[INHALT: E-Mail-Adresse des Salons]]">
```

1. `data-endpoint`: URL eines Formular-Endpunkts (POST, `FormData`). Hat Vorrang.
   Empfohlen: Mailskript beim eigenen Hoster oder ein EU-Formulardienst mit
   Auftragsverarbeitungsvertrag.
2. `data-mailto`: E-Mail-Adresse. Öffnet das E-Mail-Programm mit fertig ausgefüllter
   Anfrage.
3. Ist beides leer, zeigt das Formular nach dem Absenden einen Hinweis mit der
   Telefonnummer.

Ohne JavaScript ist das Formular ausgeblendet. Stattdessen erscheint ein Hinweis zum Anrufen.
Die Entscheidung zum Versandweg steht in `CONTENT-TODO.md`.

## Gestaltung und Technik

- Farben aus dem Logo: Schwarz `#0E0D0C`, Grund `#F7F5F2`, Gold `#C2A06A` (auf hellem
  Grund als Schrift `#7E6036`), Text `#161412`, Nebentext `#5E5850`, Linien `#E3DDD4`.
- Platzhalter sind bewusst gelb gestrichelt und liegen außerhalb der Palette.
- Bewegung: nur sanftes Einblenden der Abschnitte beim Scrollen (400 ms). Bei „Bewegung
  reduzieren“ und ohne JavaScript ist alles sofort sichtbar.
- Barrierefreiheit: Sprunglink, ein `<h1>`, sichtbarer Fokus, Kontrast mindestens WCAG AA,
  Touch-Ziele mindestens 44 px, Formularfehler per `aria-describedby` verknüpft.
- SEO: `title`, `description`, Open Graph, JSON-LD `HairSalon` (nur belegte Angaben).
  Die Domain fehlt noch (`[[INHALT: Domain]]`).

## Geprüft

Mit Playwright (Chromium) bei 360, 768 und 1280 px, jeweils mit und ohne JavaScript
sowie mit „Bewegung reduzieren“:

- keine Konsolenfehler, keine externen Anfragen, kein horizontales Scrollen
- alle Anker und internen Links erreichbar
- Live-Status zu festen Zeitpunkten (auch bei fremder Zeitzone des Browsers)
- Formular: Tagesauswahl (nur Öffnungstage, erster vorgewählt), Samstagnachmittag gesperrt,
  „Anderer Tag“ mit Kalender (Montag/Sonntag und Vergangenheit abgelehnt), Zusammenfassung im
  Button, Versand über Endpunkt (Erfolg und Fehler), `mailto:`, Spam-Falle
