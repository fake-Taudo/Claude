---
# DESIGN.md – maschinenlesbare Tokens oben, Begründungen unten.
# Quelle der Wahrheit für alle Gestaltungsentscheidungen der HairMind-Website.
# Vor jeder Änderung an HTML/CSS lesen. Werte entsprechen :root in css/style.css.
projekt: "Friseur HairMind, Korschenbroich-Pesch"
stand: "2026-10-19"
modus: "hell"            # dunkel nur für Kopfzeile, Terminanfrage und Fußzeile
farben:
  surface-1: "#F7F5F2"   # Seitengrund (--c-paper)
  surface-dark: "#0E0D0C" # Kopfzeile, Terminanfrage, Fußzeile (--c-black, Logo-Schwarz)
  line:      "#E3DDD4"   # 1-px-Linien auf hell (--c-line)
  line-dark: "#6E665C"   # Rahmen auf Schwarz, 3,4:1 (--c-line-dark)
  ink-1:     "#161412"   # Haupttext, 16,9:1 (--c-ink)
  ink-2:     "#5E5850"   # Nebentext, 6,5:1 (--c-muted)
  ink-on-dark: "#F7F5F2" # Text auf Schwarz, 17,8:1
  ink-2-on-dark: "#ABA399" # Nebentext auf Schwarz, 7,8:1
  accent:    "#C2A06A"   # Gold: NUR Hauptbutton auf Schwarz und feine Linien (--c-gold)
  accent-ink: "#0E0D0C"  # Text auf Gold, 7,9:1
  gold-ink:  "#7E6036"   # Gold als Schrift/Unterstreichung auf hell, 5,3:1 (--c-gold-ink)
  focus:     "#7E6036 auf hell, #C2A06A auf Schwarz"
  error:     "#B3261E (Rahmen) · #FFB3A6 (Text auf Schwarz, 11,3:1)"
  todo:      "#FFF3B0 / #3A3000 / #D4A800 – bewusst außerhalb der Palette"
schrift:
  display: { familie: "Bodoni Moda", quelle: "lokal: fonts/bodoni-moda-500-opsz-latin.woff2", gewichte: "500, optische Größe 11–96, nie kursiv" }
  text:    { familie: "Archivo", quelle: "lokal: fonts/archivo-wght-latin.woff2", gewichte: "400-600" }
  daten:   { familie: "keine (Tabellen in Archivo mit tabular-nums)" }
  skala: { basis: "17px", h1: "42–76px", h2: "32–48px", h3: "24px" }
abstand:
  sektion: "clamp(6rem, 4.5rem + 4vw, 8rem)"   # 96–128 px
  gutter: "1.25rem / 2rem ab 48rem / 3rem ab 60rem"
  textbreite: "40rem"
radius:
  buttons: "0"            # feste Vorgabe, immer eckig
  steuerelemente: "0"     # Eingaben und Auswahlfelder, passend zu den Buttons
  flaechen: "keine Flächen – Linien statt Kästen"
  medien: "0"
schatten:
  erhoben: "keiner"
motion:
  dauer: { einblenden: "400ms" }
  kurven: { raus: "ease-out" }
icons: { set: "keine" }
---

# Gestaltung: Friseur HairMind

## Annahmen
- Die Vorgaben (Farben, Schriften, Aufbau, Motion) stammen aus dem Briefing des Auftraggebers und sind gesetzt.
- Zielgruppe: Menschen aus Pesch und Umgebung, überwiegend auf dem Handy, die Preis, Öffnungszeit oder Telefonnummer suchen.
- Anrede „Sie“, kurz, sachlich, freundlich.

## Projekt in drei Sätzen
- Wer/was/wo: Friseursalon für Damen, Herren und Kinder (Färben, Styling) in der Kleinenbroicher Str. 2A, 41352 Korschenbroich-Pesch.
- Für wen: Kundschaft aus dem Ort, die schnell prüfen will, ob sich der Anruf lohnt.
- Hauptaufgabe: anrufen oder einen Wunschtermin anfragen. Preise und Öffnungszeiten sind der Grund des Besuchs.

## Material-Ableitung
| Material | Abgeleitete Entscheidung |
|---|---|
| Logo: Didone-Monogramm „HM“ in Weiß und Gold auf Schwarz | Bodoni Moda (Didone) für Überschriften; Schwarz, Weiß und Gold als einzige Farben |
| Fein gezeichnete Haarsträhnen im Logo | Feine 1-px-Linien statt Kästen; Gold nur als dünne Linie oder Hauptbutton |
| Wortmarke „HAIRMIND / FRISEUR“ mit weiter Laufweite | Ruhige, sachliche Archivo für Text, damit die Serife allein das Elegante trägt |
| Salon: helle Wände, Kronleuchter, dunkle Vorhänge | Heller Seitengrund, schwarze Flächen nur für Kopf, Termin und Fuß |
| Echte Google-Rezensionen | Ruhige Zitate ohne Sterne-Grafik, Wortlaut unverändert |

## Richtung
**Arbeitstitel:** „Logo-Schwarz auf hellem Grund“
**Stimmung (1 Satz):** Ruhig und aufgeräumt wie ein gepflegter Salon, mit dem Gold des Logos als einzigem Schmuck.
**Warum diese Richtung zu genau diesem Projekt passt:** Farben und Schrift sind aus dem vorhandenen Logo abgeleitet, nicht aus einer Stilvorlage. Die Seite soll das Logo fortsetzen, nicht mit ihm konkurrieren.
**Verworfene Richtungen und warum:** nicht erarbeitet – Richtung war durch das Briefing vorgegeben.

## Signatur-Element
- Was: die zwei goldenen Haarsträhnen aus dem Logo, quer gelegt als Trennlinie. Die Umrisse sind per Skript direkt aus `assets/logo.jpg` ausgelesen (Goldpixel je Zeile), nicht frei gezeichnet. Inline-SVG mit `fill: var(--c-gold)`.
- Wo: einmal, oben im Abschnitt „Termin anfragen“. Nirgends sonst.
- Funktion: leitet in die Hauptaktion über und verbindet die Seite mit dem Logo. Rein dekorativ (`aria-hidden`).
- Verhalten mobil / bei Reduced Motion: skaliert auf Containerbreite (Höhe 28–48 px), keine Bewegung.

## Farbe
- Quelle der Palette: Logo (Schwarz, Weiß, Gold).
- Der Akzent Gold wird ausschließlich für den Hauptbutton auf Schwarz („Wunschtermin anfragen“), den Umriss-Button in der Kopfzeile, die Haarlinie und Unterstreichungen auf Schwarz verwendet. Die Linie über der Fußzeile ist bewusst dunkel, damit die Haarlinie das einzige goldene Schmuckelement bleibt. Auf hellem Grund erscheint Gold nur als `#7E6036`.
- Kontrast geprüft am 2026-10-19 mit `contrast.py --css css/style.css` und eigener Paarprüfung: alle genutzten Text- und UI-Paare ≥ AA. Der Fund „Gold-Schrift auf Gold“ (2,4:1) ist kein echtes Paar und kommt auf der Seite nicht vor.

## Typografie
- Display: Bodoni Moda 500 mit optischer Größe – weil das Logo eine Didone ist; bei großen Größen werden die Haarstriche fein wie im Logo.
- Text: Archivo 400–600 – sachlich und gut lesbar auf dem Handy, Gegengewicht zur Serife.
- Hierarchie: H1 bis 76 px zu 17 px Fließtext (≈ 4,5×).
- Deutsch: `lang="de"`, `hyphens: auto` für Fließtext und Überschriften (nicht für Buttons, Navigation, Labels), typografische Anführungszeichen bei Zitaten per CSS, Gedankenstrich –, geschütztes Leerzeichen in `02161&nbsp;5640891`.

## Layout
- Raster: auf Desktop Überschrift links (1 Teil), Inhalt rechts (2 Teile), Inhalt höchstens 40rem breit.
- Seitenstruktur (aus Besucherfragen): 1. Wer, wo, offen? Anrufen 2. Was kostet es? 3. Was sagen andere? 4. Wie sieht es aus? 5. Wann offen, wie hinkommen? 6. Termin anfragen.
- Bewusster Bruch: die Haarlinie über die volle Containerbreite vor dem dunklen Termin-Abschnitt. Ein Umbau weiterer Abschnitte folgt, sobald echte Salonfotos da sind.
- Rhythmus: Abstände 96–128 px; Tabellen dicht, Zitate luftig.

## Komponenten-Regeln
- Buttons: eckig (`border-radius: 0`, feste Vorgabe), min. 48 px hoch. Pro Bildschirm eine Hauptaktion: Start = schwarz „Jetzt anrufen“, Termin = gold „Wunschtermin anfragen“, Kopfzeile = Gold-Umriss.
- Eingabefelder: heller Grund auf Schwarz, eckig wie die Buttons, Fehler als Rahmen plus Text, per `aria-describedby` verknüpft.
- Auswahlfelder (Wunschtag, Wunschzeit, Leistung): antippbare Felder mit 1-px-Rahmen `#6E665C`, gewählt = heller Grund. Wunschtag zeigt die nächsten 5 Öffnungstage (erster vorgewählt) plus „Anderer Tag“ mit Kalender. Ist Samstag gewählt, ist „Nachmittag“ deaktiviert. Leistung wird nie vorgewählt.
- Hauptbutton der Anfrage: „Wunschtermin anfragen“ mit Zusammenfassung der Auswahl in zweiter Zeile. Nie „freie Termine“ oder Verfügbarkeit andeuten.
- Bilder: rechteckig ohne Radius, ruhige Zuschnitte (Startbild 4:5), AVIF/WebP/JPG, `width`/`height` gesetzt.
- Karten: keine. Linien, Tabellen und Listen statt Kästen.

## Bilder und Icons
- Bildquelle: nur Fotos des Salons. Fehlende Fotos als Platzhalter, nie Stock oder KI.
- Icons: keine.

## Motion
- Seitenauftritt: nur „Bewertungen“ und „Termin anfragen“ blenden beim Scrollen ein (400 ms, Versatz 12 px), alle anderen Abschnitte stehen sofort da. Nur Elemente unterhalb des sichtbaren Bereichs.
- Zustände: Hover und Focus-visible an allen interaktiven Elementen, keine Übergangsanimationen.
- Reduced Motion und ohne JavaScript: alles sofort sichtbar.

## Tonalität
- Anrede: Sie.
- Beispielsätze: „Wir schneiden, färben und stylen – für Damen, Herren und Kinder.“ „Wir rufen zur Bestätigung zurück.“
- Wörter, die wir nie benutzen: „Liebe zum Detail“, „Ihr Style, neu definiert“, „freie Termine“, Superlative ohne Beleg.

## Do / Don't
| Do | Don't |
|---|---|
| Fakten aus dem Google-Profil, Wortlaut der Rezensionen | Erfundene Preise, Dauern, Team, Gründungsjahr, Parken, Barrierefreiheit |
| Fehlendes als `[[INHALT: …]]` markieren und in CONTENT-TODO.md führen | Platzhalter unauffällig oder ohne Eintrag |
| Gold sparsam | Verläufe, Glas/Blur, Glows, Schatten, Kursivschrift, Deko-Icons, Labels über Überschriften, Sektionsnummern |
| Schriften lokal | Google-Fonts-CDN, eingebettete Karten ohne Einwilligung |

## Bewusste Ausnahmen (slop-ok)
| Muster | Wo | Begründung |
|---|---|---|
| Heller Papierton + Serifen-Überschriften + feine Linien | ganze Seite | Aus Logo und Briefing abgeleitet, nicht aus einem Standardstil |
| Einblenden beim Scrollen | `data-reveal` an Bewertungen und Termin | Vom Briefing verlangt; auf zwei Abschnitte reduziert |
| Roboto in der Schriftliste | `--font-sans` in css/style.css | Nur Systemersatz, falls Archivo nicht lädt |

## Offene Inhalte
Siehe `CONTENT-TODO.md`.
