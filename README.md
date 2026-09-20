# Studio Kern – One-Page-Website

Moderne, vollständig responsive Agentur-Website mit Dark Mode als Standard.
Gebaut mit **Next.js (App Router)**, **Tailwind CSS v4**, **Framer Motion** und **TypeScript**.

Lighthouse (Produktions-Build, mobile Emulation):

| Performance | Accessibility | Best Practices | SEO |
| ----------- | ------------- | -------------- | --- |
| 96          | 100           | 100            | 100 |

---

## Schnellstart

```bash
npm install
npm run dev      # http://localhost:3000
```

Weitere Befehle:

```bash
npm run build    # Produktions-Build erzeugen
npm run start    # Produktions-Build lokal starten
npm run lint     # ESLint
```

---

## 1. Texte ändern

**Alle** Texte, Preise, FAQ-Einträge, Kontaktdaten und Links stehen in einer einzigen Datei:

```
content/site.ts
```

Die Datei ist nach Sektionen gegliedert und kommentiert:

| Abschnitt      | Inhalt                                                |
| -------------- | ----------------------------------------------------- |
| `brand`        | Name, Claim, Domain                                   |
| `seo`          | Seitentitel, Beschreibung, Keywords                   |
| `nav`          | Menüpunkte im Header                                  |
| `hero`         | Headline, Subline, Buttons, Vertrauenszeile, Kennzahlen |
| `services`     | Leistungs-Karten                                      |
| `process`      | Ablauf-Schritte                                       |
| `portfolio`    | Projekte                                              |
| `pricing`      | Pakete und Preise                                     |
| `testimonials` | Kundenstimmen                                         |
| `faq`          | Fragen und Antworten                                  |
| `contact`      | E-Mail, Telefon, Formular-Beschriftungen              |
| `footer`       | Footer-Spalten und Social-Links                       |
| `legal`        | Daten für Impressum und Datenschutz                   |

**Beispiel – Headline ändern:**

```ts
hero: {
  headlineBefore: "Websites, die aus Besuchern",
  headlineHighlight: "zahlende Kunden",   // dieser Teil ist farbig
  headlineAfter: "machen.",
  ...
}
```

**Ein Paket hinzufügen:** einfach einen weiteren Eintrag im Array `pricing.plans`
anlegen. `featured: true` hebt eine Karte hervor (nur bei einer Karte setzen).

**Eine FAQ-Frage hinzufügen:** neuen `{ question, answer }`-Eintrag in `faq.items`.
Die strukturierten Daten für Google aktualisieren sich automatisch mit.

> Nach dem Umbenennen der Marke auch `brand.url` auf die echte Domain setzen –
> davon hängen Open-Graph-Bild, Canonical-URL und `sitemap.xml` ab.

---

## 2. Farben ändern

Das komplette Farbschema liegt als CSS-Variablen in `app/globals.css`, ganz oben im
Block `:root`:

```css
:root {
  --bg: #07070c;        /* Seitenhintergrund       */
  --bg-soft: #0b0b14;   /* abwechselnde Sektionen  */
  --surface: #12121c;   /* Karten                  */
  --fg: #f6f6f9;        /* Überschriften           */
  --muted: #a3a7bd;     /* Fließtext               */
  --accent: #8b5cf6;    /* Akzent 1 (Violett)      */
  --accent-2: #3b82f6;  /* Akzent 2 (Blau)         */
}
```

Für ein anderes Farbthema reicht es, `--accent` und `--accent-2` zu tauschen –
alle Verläufe, Buttons, Icons und Hover-Effekte ziehen automatisch mit.

Beispiele:

```css
--accent: #06b6d4;  --accent-2: #3b82f6;   /* Cyan → Blau      */
--accent: #10b981;  --accent-2: #14b8a6;   /* Smaragd → Teal   */
--accent: #f43f5e;  --accent-2: #f97316;   /* Rosé → Orange    */
```

Heller Hintergrund gewünscht? `--bg`, `--bg-soft`, `--surface` aufhellen und
`--fg`/`--muted` abdunkeln – außerdem `color-scheme: dark` auf `light` ändern
und in `app/layout.tsx` `viewport.colorScheme` anpassen.

**Schrift ändern:** in `app/layout.tsx` den Import tauschen, z. B.

```ts
import { Manrope as Inter } from "next/font/google";
```

---

## 3. Bilder austauschen

Die Portfolio-Vorschauen sind derzeit **per CSS gezeichnete Platzhalter**
(`components/ui/Mockup.tsx`) – dadurch lädt die Seite ohne einen einzigen Bild-Request.

Für echte Screenshots:

1. Bilder nach `public/projekte/` legen (z. B. `praxis-nordlicht.webp`, ca. 1200 × 750 px).
2. In `content/site.ts` beim Projekt statt `mockup` ein Bild angeben:

   ```ts
   { title: "Praxis Nordlicht", image: "/projekte/praxis-nordlicht.webp", ... }
   ```

3. In `components/Portfolio.tsx` die Zeile

   ```tsx
   <Mockup variant={project.mockup} />
   ```

   ersetzen durch:

   ```tsx
   <Image
     src={project.image}
     alt={`Website-Projekt ${project.title}`}
     width={1200}
     height={750}
     className="h-auto w-full rounded-xl"
   />
   ```

   (oben ergänzen: `import Image from "next/image";`)

**Favicon:** `app/icon.svg` ersetzen.
**Social-Vorschaubild:** wird in `app/opengraph-image.tsx` erzeugt – Text und Farben
dort anpassen, oder die Datei löschen und stattdessen ein fertiges
`app/opengraph-image.png` (1200 × 630 px) ablegen.

---

## 4. Kontaktformular

Das Formular postet an die Route `app/api/kontakt/route.ts` (inkl. Validierung und
Honeypot-Spamschutz).

- **Ohne `RESEND_API_KEY`** läuft alles im Demo-Modus: Anfragen landen im Server-Log,
  der Besucher sieht trotzdem die Erfolgsmeldung.
- **Mit API-Key** wird die Anfrage per E-Mail zugestellt.

Dafür `.env.example` nach `.env.local` kopieren und ausfüllen:

```bash
cp .env.example .env.local
```

Auf [resend.com](https://resend.com) registrieren, API-Key erzeugen, eintragen –
fertig. Die gleichen Variablen später in Vercel unter *Settings → Environment
Variables* hinterlegen.

---

## 5. Veröffentlichen (Vercel)

1. Projekt auf GitHub pushen.
2. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New… → Project**
   → Repository auswählen.
3. Vercel erkennt Next.js automatisch – Einstellungen unverändert lassen, **Deploy**.
4. Unter *Settings → Environment Variables* die Werte aus `.env.local` eintragen
   und einmal neu deployen.
5. Unter *Settings → Domains* die eigene Domain verbinden und die DNS-Einträge
   beim Domain-Anbieter setzen (Vercel zeigt sie an).
6. In `content/site.ts` `brand.url` auf die finale Domain setzen und pushen –
   jeder Push auf `main` deployt automatisch.

Alternativ per CLI:

```bash
npx vercel          # Vorschau-Deployment
npx vercel --prod   # Produktion
```

---

## 6. Projektstruktur

```
app/
  layout.tsx           Metadaten, Open-Graph, strukturierte Daten, Font, Header/Footer
  page.tsx             Reihenfolge der Sektionen
  globals.css          Farben, Design-Tokens, Animationen
  not-found.tsx        404-Seite
  icon.svg             Favicon
  opengraph-image.tsx  Social-Vorschaubild (wird beim Build erzeugt)
  robots.ts            robots.txt
  sitemap.ts           sitemap.xml
  impressum/           Impressum (Platzhalter)
  datenschutz/         Datenschutzerklärung (Platzhalter)
  api/kontakt/         Endpoint des Kontaktformulars

components/
  Header.tsx           Sticky-Header mit mobilem Menü
  Hero.tsx             Fullscreen-Hero (CSS-Animation, kein JS → schnelles Laden)
  Leistungen.tsx       Leistungs-Karten
  Ablauf.tsx           Ablauf in 4 Schritten
  Portfolio.tsx        Projekte
  Preise.tsx           Preispakete
  Stimmen.tsx          Kundenstimmen
  FAQ.tsx              Akkordeon
  Kontakt.tsx          Kontaktformular
  Footer.tsx           Footer mit Rechts-Links
  ui/                  Bausteine: Section, Reveal, Button, Icons, Mockup, GradientMesh

content/
  site.ts              ← ALLE Inhalte
```

---

## 7. Hinweise

- **Barrierefreiheit:** semantisches HTML, Skip-Link, sichtbare Fokus-Ringe,
  ARIA-Attribute am Akkordeon und am mobilen Menü. Alle Animationen respektieren
  `prefers-reduced-motion`.
- **Rechtstexte:** Impressum und Datenschutzerklärung sind Platzhalter. Vor dem
  Livegang mit echten Daten füllen und rechtlich prüfen lassen.
- **Kundenstimmen und Projekte** sind ebenfalls Platzhalter – vor dem Livegang
  durch echte Referenzen ersetzen (erfundene Bewertungen sind wettbewerbswidrig).
