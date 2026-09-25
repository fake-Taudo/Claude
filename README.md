# Studio Kern – Website

Minimalistische One-Page-Website im Apple-Stil für ein Webdesign-Business.
Reines **HTML, CSS und JavaScript**: kein Framework, kein Build-Schritt, kein npm.

Lighthouse (mobil, lokal gemessen):

| Performance | Accessibility | Best Practices | SEO |
| ----------- | ------------- | -------------- | --- |
| 99          | 100           | 100            | 100 |

Gesamtgewicht der Startseite: ca. 140 KB. Auf Apple-Geräten sind es ca. 90 KB, weil dort die
Systemschrift genutzt und keine Schrift nachgeladen wird.

**Gestaltung angelehnt an Apples Produktseiten:**

- Dunkler Hero mit leuchtenden Geräten.
- Die Navigation ist eine schwebende Glas-Kapsel. Über dunklen Sektionen ist sie dunkel,
  über hellen hell.
- Oben eine graue Hinweis-Leiste.
- Grauer Fließtext, in dem die Kernaussagen hell hervortreten.
- Kennzahlen mit feiner Linie darüber.
- Die Projekte als horizontale Galerie mit Bildunterschriften.

**Markenzeichen – der „Kern-Punkt“:** Ein blauer Punkt beendet die Wortmarke, jede große
Überschrift und die Aufzählungen und markiert die Stationen im Ablauf. Auch das Favicon ist
dieser Punkt. Bei neuen Überschriften den Schlusspunkt so schreiben:

```html
<h2 class="section-title">Neue Überschrift<span class="punkt">.</span></h2>
```

---

## Anschauen

`index.html` per Doppelklick im Browser öffnen, fertig.

Mit lokalem Server (empfohlen, verhält sich wie später online):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

## Dateien

```
index.html          Startseite mit allen Sektionen (Texte stehen direkt hier)
impressum.html      Impressum (Platzhalter!)
datenschutz.html    Datenschutzerklärung (Platzhalter!)
favicon.svg         Browser-Icon
robots.txt          Hinweise für Suchmaschinen
sitemap.xml         Seitenverzeichnis für Suchmaschinen

assets/css/style.css   Gestaltung – Farben & Abstände ganz oben in :root
assets/js/main.js      Menü, Einblend-Effekte, Zeitleiste im Ablauf, Kontaktformular
assets/fonts/          Schrift Inter (nur für Nicht-Apple-Geräte) + Lizenz
assets/img/            Mockups und Illustrationen (SVG)
  hero-geraete.svg     Hero auf Tablet/Desktop (Laptop + Smartphone)
  phone-*.svg          Hero auf dem Handy: drei aufgefächerte Smartphones
```

---

## 1. Texte ändern

Alle Texte stehen direkt in `index.html`. Jede Sektion ist mit einem großen Kommentar
markiert (`1. HERO`, `2. LEISTUNGEN`, `3. ARBEITEN` …). Einfach den Text zwischen den
Tags ersetzen.

Die Seite spricht Besucher mit **„Sie“** an. Bei neuen Texten bitte beibehalten.

Auch anpassen, wenn sich etwas Grundlegendes ändert:

- `<title>` und `<meta name="description">` oben in `index.html` (Google-Vorschau)
- der Block `application/ld+json` im `<head>` (Firmendaten für Suchmaschinen)

### Die Messwerte im Hero

Unter dem Hero steht: „Die beste Arbeitsprobe ist diese Seite selbst“, darunter die
Lighthouse-Werte **dieser** Seite (99 / 100 / 100, 0 Tracking-Cookies). Die Zahlen müssen
stimmen. Nach größeren Änderungen daher neu messen und in `index.html` (Block `proof`)
anpassen:

Chrome → Rechtsklick → *Untersuchen* → Reiter *Lighthouse* → Gerät *Mobil* → *Analyse*.
Am besten die veröffentlichte Seite messen und nicht die lokale Datei.

---

## 2. Farben ändern

Alle Farben liegen als Variablen ganz oben in `assets/css/style.css`:

```css
:root {
  --c-accent: #0071e3;          /* Akzentfarbe: Buttons, Links, Ziffern */
  --c-accent-hover: #0077ed;    /* Button beim Überfahren */
  --c-accent-on-dark: #2997ff;  /* Links auf schwarzen Flächen */
  --c-bg-alt: #f5f5f7;          /* hellgraue Sektionen */
  --c-dark-bg: #000000;         /* schwarze Sektionen */
  ...
}
```

Für eine andere Akzentfarbe reichen die drei `--c-accent…`-Werte.
Die SVG-Illustrationen in `assets/img/` nutzen das Blau `#0071e3` ebenfalls.
Bei einem Farbwechsel dort per Suchen & Ersetzen mit tauschen.

---

## 3. Bilder austauschen

Alle Bilder sind derzeit **gezeichnete Platzhalter** (SVG, je 3–10 KB).

### Portfolio (Sektion „Arbeiten“)

Die Projekte stehen in einer horizontalen Galerie: Wischen, Trackpad oder die
Pfeil-Knöpfe unten rechts. Jedes Projekt ist ein `<figure class="slide">`. Für ein
weiteres Projekt einfach einen Block kopieren. Die Bildunterschrift beginnt mit dem Namen
in `<strong>`, das hebt ihn hervor.

Die vier Projekte (Praxis Nordlicht, Tischlerei Brandt, Aurum Consulting, Café Mira) sind
**erfunden**. Vor dem Livegang bitte durch echte Referenzen ersetzen oder entfernen.

1. Screenshot im Format 16:10 anlegen, z. B. 1600 × 1000 px, als `.webp` oder `.jpg`
   (Tipp: [squoosh.app](https://squoosh.app) verkleinert Bilder ohne sichtbaren Verlust).
2. Datei nach `assets/img/` legen, z. B. `projekt-mueller.webp`.
3. In `index.html` beim Projekt `src`, `alt`, Titel und Beschreibung anpassen:

   ```html
   <img src="assets/img/projekt-mueller.webp" width="1600" height="1000"
        alt="Startseite von Müller Immobilien" loading="lazy" decoding="async">
   ```

`width`/`height` sollten zum echten Bild passen. Das verhindert Springen beim Laden.
`loading="lazy"` sorgt dafür, dass das Bild erst beim Scrollen geladen wird.

### Hero

Die Geräte im Hero zeigen die Platzhalter-Projekte:

- **Desktop:** `hero-geraete.svg` (1120 × 720) mit Laptop und Smartphone, beide mit
  „Praxis Nordlicht“.
- **Handy:** drei Smartphones. In der Mitte `phone-nordlicht.svg`, links
  `phone-brandt.svg`, rechts `phone-mira.svg` (je 218 × 442).

Die Meldung „Neuer Online-Termin“ ist kein Bild, sondern HTML (`class="notify"` in
`index.html`). Der Text lässt sich dort direkt ändern.

Sobald echte Projekte da sind:

- **Einfach:** Die SVGs durch eigene Bilder mit Geräte-Mockups ersetzen, z. B. als
  `.webp`. Die Smartphones müssen im Hochformat 218 × 442 bleiben. Dann in `index.html`
  im Hero `src`/`srcset` und `width`/`height` anpassen.
- Kostenlose Geräte-Rahmen für eigene Screenshots gibt es z. B. bei
  [mockuuups.studio](https://mockuuups.studio) oder als Figma-Vorlagen.

### Über mich

`assets/img/ueber-mich.svg` lässt sich durch ein Foto ersetzen, z. B. Portrait oder
Arbeitsplatz. Format 4:5 im Hochformat, z. B. 960 × 1200 px.

### Favicon

`favicon.svg` ersetzen.

---

## 4. Kontaktformular einrichten (Web3Forms)

Eine reine HTML-Seite hat keinen eigenen Server, der E-Mails verschickt. Den Versand
übernimmt der kostenlose Dienst [Web3Forms](https://web3forms.com)
(250 Anfragen/Monat gratis, kein Konto nötig).

1. Auf [web3forms.com](https://web3forms.com) die eigene E-Mail-Adresse eingeben.
   Der **Access Key** kommt per Mail.
2. In `index.html` diese Zeile suchen und `DEIN-ACCESS-KEY` ersetzen:

   ```html
   <input type="hidden" name="access_key" value="DEIN-ACCESS-KEY">
   ```

3. Fertig. Anfragen landen ab jetzt per E-Mail im Postfach.

**Solange kein Key eingetragen ist**, funktioniert das Formular trotzdem: Es öffnet das
E-Mail-Programm des Besuchers mit einer fertig ausgefüllten Nachricht an
`Paulmatuszek@icloud.com`. Die Adresse steht im `<form>`-Tag unter
`data-fallback-email`.

Das Formular enthält eine Prüfung aller Pflichtfelder mit deutschen Fehlermeldungen und
eine unsichtbare Spam-Falle (Honeypot).

---

## 5. Vor dem Livegang – Checkliste

- [ ] **Impressum** (`impressum.html`) ausfüllen: alle farbig markierten `[Platzhalter]`
- [ ] **Datenschutzerklärung** (`datenschutz.html`) ausfüllen, v. a. Hoster und Web3Forms,
      und rechtlich prüfen lassen
- [ ] **Portfolio und Hero** durch echte Projekte ersetzen (siehe Abschnitt 3)
- [ ] **Messwerte im Hero** auf der veröffentlichten Seite nachmessen (siehe Abschnitt 1)
- [ ] **Web3Forms-Key** eintragen und eine Test-Anfrage schicken
- [ ] **Domain** anpassen. `studio-kern.de` steht als Platzhalter in:
      `index.html` (canonical, og:url, JSON-LD), `robots.txt`, `sitemap.xml`

---

## 6. Veröffentlichen

Die Seite besteht nur aus statischen Dateien und läuft auf jedem Webspace.

**Netlify (am einfachsten):** Auf [app.netlify.com/drop](https://app.netlify.com/drop)
den ganzen Projektordner ins Browserfenster ziehen. Die Seite ist sofort online, die eigene
Domain lässt sich danach verbinden.

**Klassisches Hosting (IONOS, Strato, All-Inkl …):** Alle Dateien und den Ordner
`assets/` per FTP in das Hauptverzeichnis des Webspace laden.

**GitHub Pages / Vercel / Cloudflare Pages:** Repository verbinden. Es gibt keinen
Build-Befehl, das Ausgabeverzeichnis ist das Hauptverzeichnis (`/`).

Tipp: Die meisten Hoster komprimieren Dateien automatisch (gzip/Brotli). Das verkleinert
CSS und HTML noch einmal um rund zwei Drittel.

---

## 7. Technik

- **Design:** viel Weißraum, Systemschrift (SF Pro auf Apple-Geräten, sonst Inter),
  hell/dunkel wechselnde Sektionen, eine Akzentfarbe, abgerundete Karten, dezente Schatten.
- **Responsive:** Mobile-first mit Umbrüchen bei 734 px und 1068 px (wie apple.com),
  getestet von 320 px bis 1440 px Breite.
- **Material:** Navigation und Menü sind Glasflächen (`backdrop-filter`).
  - Das offene Menü wächst aus dem Menü-Knopf heraus und dunkelt die Seite ab. Ein Tipp
    daneben schließt es.
  - Bei „Transparenz reduzieren“ werden die Flächen massiv, bei „Kontrast erhöhen“
    bekommen sie deutliche Kanten.
- **Bewegung:**
  - Übergänge folgen einer kritisch gedämpften Feder (`--ease-spring` in `style.css`),
    so wie Apple Oberflächen ohne Überschwingen bewegt.
  - Der Hero blendet beim Laden ein.
  - Kurz danach schwebt die Termin-Meldung ein.
  - Beim Scrollen kommen die Geräte im Hero auf den Betrachter zu. Das läuft über
    CSS-Scroll-Timelines ohne JavaScript; Browser ohne diese Technik zeigen die Bilder
    einfach statisch.
  - Im Ablauf füllt sich die Zeitleiste mit dem Scrollen, erreichte Schritte werden blau.
  - Bei „Bewegung reduzieren“ im Betriebssystem ist alles sofort und ohne Effekte
    sichtbar. Ohne JavaScript ist ebenfalls alles sichtbar.
- **Barrierefreiheit:** Sprunglink, sinnvolle Überschriften-Struktur, sichtbare
  Fokus-Ringe, beschriftete Formularfelder mit angekündigten Fehlern, Tastaturbedienung
  des mobilen Menüs (Esc schließt, Hintergrund wird gesperrt).
- **Datenschutz:** keine Cookies, kein Tracking, keine externen Schriften oder Skripte.
  Externe Verbindungen gibt es nur beim Absenden des Formulars (Web3Forms).
