# Cutscene-Prüfung

Erzeugt mit `npx tsx scripts/cutscene-review.ts` aus den Definitionen in `src/config/cutscenes`.
Kontaktbögen (0/10/25/50/75/90/100 % der Dauer): `docs/cutscenes/cutscene-<id>.png`, alle zusammen:
[cutscene-contact-sheet.png](cutscene-contact-sheet.png). Kosten pro Bild: [perf.json](perf.json).

## Checkliste

| Aura | Stufe | Dauer | Entzug | Atmosphäre | Aufbau mit Rampe | Bruch | Stille davor | Impact | Enthüllung | Nachhall | Flash-Limit | Skip | Logik vorher |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Singularität** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo | Kollaps auf einen Punkt (12,15 s) | 0,53 s | impact | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Akkretion** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo, Motivtempo | Sog (12,4 s) | 0,35 s | impact | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Blutmond** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Motivtempo | Verfinsterung (12,1 s) | 0,35 s | splash | Randglühen | Stufe 1, mono | 1/s | Einstellung | ja |
| **Seraph** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Motivtempo, Strahlen | Lichtsäule (11,85 s) | 0,35 s | chime | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Zeitriss** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Motivtempo | Zeitriss (11,7 s) | 0,35 s | slash | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Ewigkeit** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Motivtempo | Stillstand, dann Spektrum-Blüte (12 s) | 0,55 s | bloom | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Chronosphäre** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Ticken | Mitternacht (12 s) | 0,40 s | gong | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Ereignishorizont** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo | Der Horizont schließt sich (12,5 s) | 0,50 s | impact | Randglühen | Stufe 1, mono | 0/s | Einstellung | ja |
| **Quasar** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo, Strahlen | Jet-Flare (11,9 s) | 0,35 s | laser | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Supernova** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Motivtempo, Zähler Kernstabilität | Kern bricht (12,3 s) | 0,40 s | impact | Weißblende | Stufe 1, tint | 1/s | Einstellung | ja |
| **Andromeda** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | – | Galaxienkollision (11,9 s) | 0,35 s | shimmer | Weißblende | Stufe 1, mono | 1/s | Einstellung | ja |
| **Magnetar** | T1 | 13,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo, Motivtempo, Strahlen | Magnetsturm (11,6 s) | 0,35 s | zap | Weißblende | Stufe 1, mono | 2/s | Einstellung | ja |
| **Multiversum** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Schnitte, Partikeltempo, Motivtempo | Die Welten verschmelzen (15,5 s) | 0,50 s | impact | Weißblende | Stufe 2, swap | 1/s | Einstellung | ja |
| **Kosmisches Netz** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Motivtempo, Zähler Verbindungen | Der Faden reißt (15,1 s) | 0,40 s | impact | Weißblende | Stufe 2, mono | 1/s | Einstellung | ja |
| **Urknall** | T2 | 19,5 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Zähler, Motivtempo, Ticken | Das Bild zerspringt (13,5 s) | 0,50 s | impact | Weißblende | Stufe 2, tint | 1/s | Einstellung | ja |
| **Ursuppe** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Zähler Zellen, Strahlen, Motivtempo | Der Lebensfunke schlägt ein (14,6 s) | 0,50 s | zap | Weißblende | Stufe 2, tint | 1/s | Einstellung | ja |
| **Entropie** | T2 | 21 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Partikeltempo, Motivtempo, Zähler Ordnung | Kollaps und stille Wiederkehr (14,7 s) | 0,50 s | impact | Weißblende | Stufe 2, mono | 1/s | Einstellung | ja |
| **Wärmetod** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Wind | Zähler Temperatur, Motivtempo | Die letzte Glut erblüht (14,6 s) | 0,60 s | bloom | Randglühen | Stufe 2, tint | 1/s | Einstellung | ja |
| **Paradoxon** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Partikeltempo, Motivtempo, Inversion im Beat | Zweiteilung: Farbe und Zeit kehren sich um (14,6 s) | 0,50 s | slash | Weißblende | Stufe 2, swap | 2/s | Einstellung | ja |
| **Möbius** | T2 | 20 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Motivtempo, Inversion im Beat | Das Bild stülpt sich um (14,7 s) | 0,50 s | impact | Weißblende | Stufe 2, swap | 1/s | Einstellung | ja |
| **Omniversum** | T3 | 32 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Schnitte, Motivtempo, Partikeltempo, Strahlen, Zähler Universen | Alles fällt in einen Punkt: spektrale Schockwelle (25,7 s) | 0,60 s | impact | Weißblende | Stufe 3, swap | 1/s | immer | ja |
| **Schöpfung** | T3 | 30 s | Schwarz 0,4 s + Jingle | Partikel, Szenen, Wind | Schnitte, Partikeltempo, Motivtempo, Zähler Farben, Strahlen | Die Farbe flutet die Welt (19 s) | 0,50 s | bloom | Weißblende | Stufe 3, tint | 1/s | immer | ja |
| **Nullpunkt** | T3 | 28 s | wie singularitaet | Nebel, Szenen, Wind | Zähler Rest, Inversion im Beat | Der Nullstrich öffnet das Licht (22,6 s) | 0,60 s | laser | Weißblende | Stufe 3, mono | 2/s | immer | ja |
| **Archetyp** | T3 | 30 s | Schwarz 0,4 s + Jingle | Partikel, Szenen, Wind | Schnitte, Motivtempo, Zähler Ecken, Strahlen | Alle Formen rasten zur Urform ein (21,2 s) | 0,50 s | gong | Weißblende | Stufe 3, tint | 1/s | immer | ja |
| **Äon** | T3 | 34 s | Schwarz 0,4 s + Jingle | Nebel, Partikel, Szenen, Wind | Schnitte, Partikeltempo, Motivtempo, Ticken, Zähler Jahre | Die Zeit läuft zurück bis zum Ursprung (24,1 s) | 0,50 s | gong | Weißblende | Stufe 3, mono | 1/s | immer | ja |
| **Weltenkern** | T3 | 36 s | Schwarz 0,4 s + Jingle | Partikel, Szenen, Wind | Schnitte, Partikeltempo, Zähler Tiefe, Motivtempo, Strahlen | Der Kern öffnet sich wie eine Blüte (24 s) | 0,60 s | impact | Weißblende | Stufe 3, swap | 1/s | immer | ja |

Flash-Limit: höchstens 3 Blitze, Inversionen oder helle Schnitte in jedem 1-s-Fenster (Unit-Test
`tests/cutscenes.test.ts`). „Logik vorher“: Aura, Statistik und Speicherstand sind vor dem Start der Cutscene
geschrieben (Playwright-Smoke-Test). Skip: „Einstellung“ = Schaltfläche/langes Drücken, wenn „Überspringen erlauben“
an ist; T3-Filme sind immer überspringbar, beim erneuten Ansehen genügt Tippen.

## Bewertung der Kontaktbögen

- **Singularität** ([Bogen](cutscene-singularitaet.png)): Spiralsog mit Linse um ein schwarzes Loch, Kollaps auf einen Punkt, 0,5 s Schwarz, Explosion. Ende stark.
- **Akkretion** ([Bogen](cutscene-akkretion.png)): Kreis-Stern mit Glutpartikeln, die hineinspiralen; Ringe werden eingesogen, der Stern „schluckt“.
- **Blutmond** ([Bogen](cutscene-blutmond.png)): Roter Mond steigt durch fallende Tropfen, Finsternis legt sich über ihn, Ränder bluten (Randglühen statt Weiß).
- **Seraph** ([Bogen](cutscene-seraph.png)): Federn und Goldregen, Strahlen sammeln sich zur Lichtsäule. Hellstes T1-Ende, ohne Vollbildblitz.
- **Zeitriss** ([Bogen](cutscene-zeitriss.png)): Pixel-Glitches, Sanduhr-Puls, das Bild wird schräg zerschnitten und verrutscht.
- **Ewigkeit** ([Bogen](cutscene-ewigkeit.png)): Lemniskate zeichnet sich im Spektrum, Stillstand in Grau, dann Spektrum-Blüte.
- **Chronosphäre** ([Bogen](cutscene-chronosphaere.png)): Uhr mit immer schnelleren Zeigern und Ticken, Stopp um Mitternacht, Gong.
- **Ereignishorizont** ([Bogen](cutscene-ereignishorizont.png)): Schwarzes Loch von der Kante, Lichtströme fallen hinein, Dunkelheit, dann violette Ränder.
- **Quasar** ([Bogen](cutscene-quasar.png)): Zwei Jets wachsen bis an die Bildränder, Flare über die volle Höhe, lange Weißsättigung.
- **Supernova** ([Bogen](cutscene-supernova.png)): Roter Nebel, Herzschlag-Pulse, Zähler „Kernstabilität“, grauer Stillstand, Ausbruch.
- **Andromeda** ([Bogen](cutscene-andromeda.png)): Geneigte Spiralgalaxie, eine zweite fliegt heran, Kollision mit Ringen.
- **Magnetar** ([Bogen](cutscene-magnetar.png)): Kreis-Stern mit Feldlinien, Funken auf Umlaufbahnen, Blitzsturm mit Wackeln, Ränder blau/pink.
- **Multiversum** ([Bogen](cutscene-multiversum.png)): Kinobalken, Schnitte zwischen Kugel-Universen werden schneller, drei Kugeln verschmelzen.
- **Kosmisches Netz** ([Bogen](cutscene-kosmischesnetz.png)): Netz wächst Knoten für Knoten, Impulse rasen, wird zu einem Faden gespannt, der reißt.
- **Urknall** ([Bogen](cutscene-urknall.png)): Countdown im Dunkeln, Herzschlag-Kern, Kollaps, Stille, das ganze Bild zerspringt in Glutscherben.
- **Ursuppe** ([Bogen](cutscene-ursuppe.png)): Zellteilung mit Zähler, Verschmelzung, Blitz als Lebensfunke.
- **Entropie** ([Bogen](cutscene-entropie.png)): Gitter zerfällt zu Staub, Farbe weicht, Kollaps, dann stille Wiederkehr.
- **Wärmetod** ([Bogen](cutscene-waermetod.png)): Sterne verlöschen, Temperatur fällt, letzte Glut in Dunkelheit und Stille, warmes Aufblühen.
- **Paradoxon** ([Bogen](cutscene-paradoxon.png)): Orange/Cyan-Hälften, Wahr/Falsch im Beat mit Inversion, Schnitt: Farbe und Zeit drehen sich.
- **Möbius** ([Bogen](cutscene-moebius.png)): 3D-Möbiusband mit Läufern, das ganze Bild stülpt sich auf die andere Seite.
- **Omniversum** ([Bogen](cutscene-omniversum.png)): Reprise aller Motive im Beat, Spektral-Mandala mit Universen-Zähler, Kollaps, Stille, Schockwelle.
- **Schöpfung** ([Bogen](cutscene-schoepfung.png)): Lichtpunkt, graue Welt entsteht Schnitt für Schnitt, Farbe flutet von der Mitte, Sonnenaufgang.
- **Nullpunkt** ([Bogen](cutscene-nullpunkt.png)): Beginnt wie Singularität, Schnitt auf Weiß, schwarze Null, Schwarz-Weiß im Beat, Lichtstrich.
- **Archetyp** ([Bogen](cutscene-archetyp.png)): Polygone gewinnen im Beat Ecken bis zum Kreis, rasten mit Strahlenkranz zur Urform ein, Kristall.
- **Äon** ([Bogen](cutscene-aeon.png)): Zeitringe durch die Zeitalter, Jahre-Zähler, Rücklauf durch dieselben Zeitalter bis zum Ursprung.
- **Weltenkern** ([Bogen](cutscene-weltenkern.png)): Reise nach innen in Kinobalken, Tiefen-Zähler, Herz im Takt, Kern öffnet sich zur Lichtblüte.
