# Vergleich: Referenz ↔ Turmtrubel (Ist-Stand)

Dieses Dokument vergleicht Screen für Screen den Ist-Stand mit offiziellen Referenzbildern und leitet konkrete Maßnahmen ab. Daraus entsteht `docs/STYLE_GUIDE.md`.

**Rechtlicher Rahmen:**
- Die Referenzbilder dienen nur als Orientierung für Layout, Proportionen, Hierarchie, Farblogik und Effektaufbau.
- Nichts davon wird kopiert, abgepaust oder ins Repo übernommen.
- Alle Grafiken werden eigenständig als Vektor neu entworfen.

## Quellen

Alle Bilder liegen nur lokal in `reference/` (gitignored). Es sind offizielle Store-Screenshots.

| Kürzel | Datei(en) | Inhalt |
|---|---|---|
| R1, R7 | `appstore-CR_enUS_FullGameplay_V1_SS1…`, `…RoninSet_ActionV1_SS7…`, iPad `SS6` | Key-Art (3D-Illustration), nur für Farbe und Licht |
| R2 | `appstore-…FullGameplay_V1_SS2…` (iPad) | Arena „Gras“ mit Zuschauerrängen, Türmen, Brücken |
| R3, R3i | `…SS3_iOS_6.5…`, `…SS3_iOS_13…` | Arena „Lava“, Gebäude, Schwärme, Aufstell-Uhr |
| R4, R4i | `…SS4…` | Arena „Elektro“ (lila), Kanone, Turm-Einschlag mit Kuppel und Sternblitz |
| R5, R5i | `…SS5…` | Arena „Wüste“, Explosion mit Rauch und Trümmern, Aufstell-Uhren |
| R6 | `…SS6_iOS_6.5…` | Arena „Gras“ (Spezialmodus), Rakete mit Rauchspur, Blitzketten, Feuerkugeln, zerstörte Türme |
| D1–D6 | `appstore-de-CR_AppleStore_pic*0[1-6].jpg` | **mit HUD:** Spielerplakette, Timer „Time left“, ×2-Tropfen, Kartenhand (teils von Werbetext verdeckt), Chat-Knopf, Fähigkeitsknopf; D2 Deck-Bauer, D5 Kartendetail „Evolution“ |
| G1–G6 | `googleplay-gpo[1-6].jpg` | Werbebilder mit eingebetteten Screens: G2 Sammlung mit Navigationsleiste, G4 Ergebnis-Screen, G1/G3/G5 Arenen |

**Grenzen des Materials:**
- **Standbilder** zeigen keine Animationen und keine Effektdauern. Wo die Tabellen „Dauer“ oder „Animation“ nennen und nichts aus dem Bild ableitbar ist, steht „nicht ablesbar“. Dann gelten die Zeitregeln aus dem Auftrag: Vorlauf 80–200 ms, Kern 100–400 ms, Nachhall 300–1000 ms.
- **Ohne Referenz** sind: die **Elixierleiste** (in allen HUD-Bildern vom Werbetext verdeckt), das **Emote-Auswahlmenü**, die **Lobby mit Einladungscode** (gibt es so im Original nicht), die **Einstellungen** und ein vollständiges **Hauptmenü**.
- Für diese Elemente leite ich die Gestaltung aus den allgemeinen Regeln des Style Guides ab. Es werden keine Referenzdetails erfunden.

**Eigene Ist-Bilder:** `docs/before_after/before/` (390×844, 844×390, 1440×900) und `…/before/szene/` (Extremszene).

---

## 1. Arena (Spielfeld)

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Boden | **Proportion:** 18 Felder breit, Schachbrett aus 2 eng verwandten Tönen; je Arena-Thema Gras (D1, R6), Stein (R3), Lila-Fliesen (R4), Sand (R5). **Farbe:** gedämpftes, gelbliches Grün mit Kachel-Rauschen. **Licht:** großflächige, weiche Schlagschatten von Bauten außerhalb des Felds (D1, R6). | Grelles Schachbrett in 2 satten Grüntönen, ohne Textur und ohne Schatten (`before/*-14-kampf`) | zu gesättigt, steril, keine Tiefe | Grün entsättigen und ins Gelbe ziehen; Schachbrett-Kontrast ≤ 6 % Helligkeit; leichtes Pro-Kachel-Rauschen und Grasbüschel (Vektor-Tupfer); weicher Verlaufs-Schatten vom oberen Rand und von den Seiten (Vignette) |
| Wege | Gepflasterte Bahnen von Turm zu Turm und zur Brücke, warmgelbe Ziegel mit dunkleren Fugen (D1, R6); auf Stein-Arenen dunklere Fliesen (R3) | Helle, flache, beige Bahnen ohne Fugen | keine Material-Anmutung | Ziegelband in Ocker mit Fugenlinien und Kantenschatten; im Hintergrund-Cache gezeichnet, kostet also keine Laufzeit |
| Fluss | Quer verlaufender Wasserkanal, türkis-blau, mit dunkleren Uferkanten aus Stein (R2, D1); Lava-Variante mit gelbem Kern und Glut (R3) | Flaches blaues Band, 7 helle Wellenstriche | keine Ufer, kein Tiefenverlauf | Ufermauer oben und unten (Steinkante mit Licht oben), Wasserverlauf hell → tief, animierte Glanzlinien und Schaumtupfer an den Ufern (gecachte Streifen, verschoben) |
| Brücken | Holzbrücken mit Pfosten an den Enden (R2: blaue Metallbänder; D1/R6: goldene Pfosten); Elektro-Variante als Metallgitter (R4) | Braune Rechtecke mit Plankenstrichen | flach, ohne Pfosten | Holzplanken mit Lichtkante und Fugen, 4 Pfosten mit Metallbändern, Schlagschatten aufs Wasser |
| Rand und Deko | Steinmauern, Zuschauerränge mit Markisen (oben rot, unten blau, R2), Seilzäune mit Holzpfosten (R5), Felsen, Laternen; große goldene Kronen-Plaketten mittig oben und unten am Feldrand (R2–R6, D1) | Dunkelgrüner Rahmen, Bäume als flache Kreise | kein Rahmen-Erzählwert, kein Teambezug | Rand aus Steinmauer + Holzzaun; seitliche Banner in Teamfarbe (oben rot, unten blau); Bäume und Büsche als mehrstufige Vektorformen mit Licht; goldene Kronen-Plakette mittig oben und unten (eigene Form). Alles im Hintergrund-Cache |
| Turmplätze | Turm steht auf gepflastertem Sockelfeld (D1) | Graue Quadrate | kaum sichtbar | Steinplatten-Sockel mit Fugen und Kantenschatten |
| Ambiente | Statisch nicht ablesbar (Wasser-Glanz, Funken in den Elektro-Gläsern R4 deuten Animation an) | Nur Flusswellen | — | Langsame Wolkenschatten, Wasser-Glitzern, gelegentliche Blätter; nur auf „Hoch“, gecacht |

## 2. Arena-HUD

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Gegner-Plakette | Oben links ohne Hintergrundplatte direkt über dem Feld: Clan-Wappen (Schild), **Name in Pink** mit dunkler Kontur, darunter Clanname weiß, Pokal + Zahl (D1, D3, D4) | Rote Pill mit Name und 3 kleinen Kronen in der Top-Bar | ähnliche Funktion, aber flache Pill, keine Hierarchie | Gegnername groß in Gegner-Rot-Hell mit Kontur und Schlagschatten, Teamwappen (eigenes Schildsymbol) davor; Kronenzähler darunter. Die Top-Bar bleibt (Layout-Engine), bekommt aber das Plaketten-Styling |
| Timer | Oben rechts: fast schwarze, abgerundete Box mit dicker dunkler Kontur; kleines cremefarbenes Label „Time left:“, darunter große Ziffern weiß, **in der Schlussphase rot** (D1 „0:18“ rot, D3/D4 weiß) | Dunkle Pill mit Ziffern, rot in den letzten 10 s, sanfter Puls | Label fehlt, Pill statt Box | Box mit Label „Restzeit“ (klein, creme), Ziffern 1,6× größer als jetzt, tabellarisch; letzte 10 s rot + Puls (Skalierung 1 → 1,12 → 1 je Sekunde, Ease-out) |
| Doppel-Elixier | Magenta Tropfen unter dem Timer mit „x2“ in Weiß mit Kontur; Glanzlicht oben links am Tropfen (D1) | Eck-Badge „×2“ am Timer | kleiner, nicht als Tropfen | Eigener Tropfen (Vektor, Verlauf, Glanz) mit „×2“/„×3“ unter der Timer-Box; Einblendung mit Pop (Back-out) |
| König-LP oben | Goldener Kronen-Schild mit Level, LP-Balken mit Goldrahmen, Herz-Symbol + Zahl (D1, R6) | König-LP als Pill unter dem Turm | — | Bleibt am Turm (siehe Türme); kein Extra-Balken oben, damit die Top-Bar frei bleibt |
| Kronen-Zähler | Im Kampf nicht sichtbar in den Bildern; auf dem Ergebnis-Screen große 3D-Kronen auf Kissen (G4) | Teamfarbene Pills mit 3 Kronen (gefüllt gold, leer dunkel) | — | Kronen-Slots als kleine Kissen-Mulden; gewonnene Krone fliegt in den Slot, Pop + Glanz (bereits vorhanden, Optik aufwerten) |
| Typografie | Dicke, runde Display-Schrift, weiß/farbig mit dunkler, gleichmäßiger Kontur (≈ 12–15 % der Schrifthöhe) und leichtem Schlagschatten | Lilita One mit Kontur, ohne Schlagschatten | kein Schatten, Konturstärke uneinheitlich | Einheitliche Textstufen mit Kontur 12 % und Schlagschatten 0/6 % (siehe Style Guide), alles über den Text-Sprite-Cache |

## 3. Kartenhand

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Panel | Dunkelblaue Leiste, obere Ecken gerundet, hellere Oberkante (Fase), unten bis zum Rand (D1, D3, D4) | Dunkles Indigo-Panel mit Kontur | ähnlich; Fase fehlt | Panel mit 2-stufiger Fase (hell oben, dunkel unten), Innenschatten oben, Textur aus feinem Rautenmuster (eigenes, sehr dezent) |
| Karten | 4 Karten im Hochformat (≈ 0,8 Seitenverhältnis), Bild füllt die Karte, dünner dunkler Rand, gerundete Ecken, kleiner Abstand (≈ 12 % der Kartenbreite) (D1) | Karten mit seltenheitsfarbigem Hintergrund und Sunburst, Tropfen oben links, Stern oben rechts | eigener Stil passt; Rahmen und Innenschatten fehlen | Seltenheitsrahmen (2 px dunkle Außenkontur, 3 px Seltenheitsfarbe mit Verlauf, 1 px Glanzkante innen), Innenschatten am Bildrand, diagonaler Glanzstreifen beim Bezahlbar-Werden |
| Kosten | Nicht sichtbar in der Hand (verdeckt); in Deck und Sammlung: magenta Tropfen oben links, ragt über den Rahmen, weiße Zahl mit Kontur (D2, G2) | Lila Tropfen oben links | passt | Tropfen über den Rahmen hinausragen lassen (−15 %), Glanzlicht oben links, Kontur |
| Evo-Markierung | Lila Kappe (Trapez) oben auf der Karte mit 2 Rauten-Pips (gefüllt/leer) = Evo-Zyklus (D4) | „EVO“-Pips unter der Karte | andere Stelle | Evo-Kappe oben auf der Karte mit Zyklus-Pips (eigene Form: Kappe mit abgeschrägten Ecken, Pips als Kristalle) |
| Champion/Held | Nicht in der Hand sichtbar | Stern oben rechts | — | Champion: goldener Rahmen mit Kronen-Kerbe; Held: Kupfer-Orange-Rahmen mit Stern; zusätzlich Badge |
| Zu wenig Elixier | Karten **vollständig in Graustufen** (D3: alle 4 grau; D4: die 4. grau) | 35 % entsättigt, leicht abgedunkelt, Tropfen mit Rotstich | zu schwach | Graustufen 100 % + 15 % dunkler; von unten füllt sich die Farbe als Fortschritt bis zur Bezahlbarkeit (Clip-Rechteck), dann Glanzstreifen + Pop |
| Nächste Karte | Links unter dem Chat-Knopf: Label „Next:“ + kleinere Karte (D1, D4 teils verdeckt) | „Nächste“ + kleine Karte links | passt | Kleinere Karte mit 60 % Größe, Label in Creme; Rotation: neue Karte gleitet mit Overshoot in den Slot (250 ms, Back-out) |
| Zustände | Statisch: Graustufen. Hover, gedrückt und gezogen nicht ablesbar | Ausgewählt: Lift 10 px, 1,06, blauer Glow; Ziehen: Platzhalter im Slot | — | Hover: Lift 4 px; gedrückt: 0,96; ausgewählt: Lift 12 px, 1,08, weißer Rand + blauer Glow; gezogen: Neigung ±8° nach Ziehrichtung, Schatten wächst |
| Fähigkeitsknopf | Großer runder dunkelblauer Knopf rechts über der Hand, dicker hellblauer Ring, grauer Kosten-Tropfen oben links, goldenes Ladesegment am Ring (D4) | Grauer Kreis mit Stern | flach | Runder 3D-Knopf mit Ring, Kosten-Tropfen, Lade- bzw. Abklingring in Gold, Puls wenn bereit |

## 4. Elixierleiste

> **Keine Referenz:** In D1–D6 vom Werbetext verdeckt. Gestaltung nach Style Guide und Auftrag.

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Leiste | — (verdeckt) | 10 Segmente, Verlauf, Schimmer, Kostenkerbe, Puls bei 10 | — | Flüssigkeit mit Oberflächen-Glanzlinie, aufsteigenden Blasen (gecachte Kreise), Welle am Füllstand; Segmenttrenner als Glas-Fugen |
| Zahl | Magenta-Tropfen als Elixier-Symbol (D2 „3.8“, D1 „x2“) | Zahl im Tropfen links | passt | Größere Zahl (≥ 22 px) mit Kontur; Tropfen mit Glanz |
| Doppel- und Dreifach-Elixier | Tropfen „x2“ am Timer (D1) | Badge am Timer | — | Leiste wechselt in eine heller pulsierende Magenta-Variante mit schnellerem Blasenstrom; Banner „Doppeltes Elixier!“ mit Tropfen-Explosion |

## 5. Türme

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Form | Quaderturm aus grauen Steinblöcken, **weiße Zinnen** oben, Ecken in Teamfarbe (rote bzw. blaue Stoffbahnen und Kappen), goldene Kronen-Plakette vorne, kleine Dreiecks-Stacheln am Sockel, Holzleiter vorne (eigene Prinzessin), Bretterboden oben (König) (R2–R5, D1, D3) | Hellgraue Quader, Teamfahnen, Figur oben | flach, kaum Material, kein Teambezug außer Fahnen | Neu gezeichneter Turm: Steinblöcke mit Licht oben links, Zinnen hell, teamfarbene Dachkappen und Wappenbanner, goldene Plakette (eigene Form: Schild mit Turm-Symbol), Schießscharten, Sockel mit Steinplatten |
| Größe | Prinzessinturm ≈ 3 Felder, König ≈ 4 Felder; die Figur oben ist ≈ 1/3 der Turmhöhe und deutlich lesbar (Prinzessin mit Armbrust, König mit Krone) | 3 bzw. 4 Felder | passt | Proportion bleibt (Spiellogik), Figur oben größer (Überzeichnung 1,2×) |
| Ansicht | Gegnerturm zeigt die Figur von vorn, der eigene König ist **von hinten** zu sehen (blauer Umhang) (R3, R5, D1) | Figur immer von vorn | keine Seitenlogik | Eigene Turmfiguren als Rückansicht, gegnerische von vorn |
| LP-Anzeige | Links goldener **Kronen-Schild** mit Level, rechts Balken: dunkler Navy-Track, Füllung Rot (Gegner) bzw. Blau (eigen) mit hellerem oberem Glanzband, dunkle Kontur; **Gegner:** Zahl hellrosa über dem Balken; **eigen:** Zahl hellblau im Balken (D1-Ausschnitt) | Pill unter dem Turm, Zahl weiß | anderes Layout | Schild-Abzeichen (eigene Kronen-Silhouette) + Balken mit Glanzband und Zahl; Position über dem Turm (Gegner) bzw. unter dem Turm (eigen), wie bisher am Turm verankert |
| Treffer | Getroffener Turm **rot eingefärbt**, Balkenfüllung hellt auf (weißer Anteil), Einschlag als halbtransparente rote Kuppel mit dunklerem Rand und weiß-blauem Sternblitz in der Mitte (R4i) | Hit-Flash über `fill()`, Nachlauf am Balken | schwächer | Treffer-Tönung (rot, 120 ms), weißer Nachzieher am Balken, Funken + kleiner Shockwave-Ring; bei schweren Treffern Kuppel + Sternblitz (additiv) |
| Schadenstufen | Nicht im Material (nur intakt oder zerstört) | Keine | — | 3 Stufen nach LP (> 66 %, > 33 %, ≤ 33 %): Risse, abgebrochene Zinnen, Rauchfahne; gecachte Varianten |
| Zerstört | Trümmerfeld: graue Steinblöcke und zerbrochene Holzbretter auf dem Sockel, kein Rauch im Ruhezustand (D1, R6) | Rauchfleck, Brocken | zu schwach | Trümmer-Decal (Steine, Bretter, Brandfleck) dauerhaft; Zerstörung: Vorlauf-Blitz → Explosion mit Trümmern und Rauch → Kamera-Wackeln → Krone fliegt zur Anzeige |
| König-Erwachen | Aktiver König bedient eine Kanone (D1, R6) | „!“-Text | fehlt | Erwachen: Goldener Ring + Funken, König steht auf, Kanone fährt aus, Banner „Der König ist erwacht!“ |

## 6. Truppen

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Stil | 3D-gerenderte, gedrungene Figuren mit großen Köpfen, kräftigen Farben und weichem Licht | Flache Vektor-Chibis mit gleich dicker Kontur | Licht fehlt | 2D-Vektor bleibt (Vorgabe). Dazu Licht-Modell: Verlauf von oben links, Glanzlicht oben, Rim-Light unten rechts, dunkle Außenkontur dicker als Innenlinien |
| Größe | Einheiten ≈ 0,8–1,2 Felder, Riesen und Golems ≈ 2 Felder; Köpfe ≈ 40 % der Figur | ähnlich (`uf = 0.42 + r·0.8`) | passt | Silhouetten überzeichnen: Köpfe +10 %, Waffen +15 % |
| Richtung | Eigene Einheiten, die nach oben laufen, zeigen den **Rücken** (D1: Kobolde von hinten, Träger sichtbar) | Immer Gesicht | fehlt | Rückansicht je Körper (ohne Augen, Hinterkopf, Umhang); Wahl nach Laufrichtung |
| Schatten | Weiche, dunkle Bodenschatten, nach **unten links** versetzt (Licht von oben rechts; D1-Ausschnitt) | Harte Ellipse, 28 %, mittig | zu hart | Weicher radialer Schatten (gecacht), nach **unten rechts** versetzt: Der Auftrag legt das Licht ausdrücklich nach oben links fest, das ist eine bewusste Abweichung von der Referenz |
| Level und LP | Pro Einheit kleines abgerundetes Quadrat in Teamfarbe (blau/rot) mit weißem Rand und Level-Zahl, rechts daran ein schmaler Balken (Navy-Track, Teamfarbe); bei vollem Leben **nur das Quadrat**, kein Balken (R5: „6“, „3“ ohne Balken) | Teamring am Boden, Balken nur bei Schaden | anderes Konzept | Level-Abzeichen (Zahl aus `rules.cardLevel`) + Balken; Balken nur bei Schaden; bei Schwärmen das Abzeichen nur bei Schaden; Farbenblind-Modus: Gegner-Abzeichen als Schild-Form |
| Aufstellen | Runde **Taschenuhr** mit Goldrand und Öse, Zifferblatt in Teamfarbe (rot/blau), dunkler Zeiger, unter der Figur (R3, R5) | Kein Aufstell-Indikator, nur Staub | fehlt | Eigene Aufstell-Uhr (Sanduhr-Ring in Teamfarbe mit Goldrand), Fortschritt als Kreissegment; danach Landestaub + kleiner Ring |
| Angriff | Bewegungsschlieren: weißer Bogen bei Schwung (R4: Axt-Wirbel) | Squash und Stretch, Waffenschwung | kein Schwungbogen | Schwungbogen (weiße Sichel, additiv, 120 ms) bei Nahkampf; Mündungsblitz bei Fernkampf |
| Treffer | Rot-Tönung der getroffenen Figur (R2-Beobachtung) | Weiß-Aufhellen per `fill()` | anders | Weißer Silhouetten-Flash (60 ms) und danach kurzes Rot (80 ms); bei schweren Treffern Hit-Stop 40–60 ms nur im Client |
| Tod | Nicht ablesbar | Rauch-Poof | — | Kleiner Staubring, 3–6 Partikel, Seelen-Funke; Schwärme gebündelt, also ein Effekt pro Gruppe pro Frame |

## 7. Zauber und Projektile

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Explosion (Feuerball, Rakete, Bomben) | Große, dunkelbraun-schwarze Rauchwolke aus runden Ballen, darunter **orange-rote Glut**, rote Funken, dunkle **Trümmer-Splitter** fliegen radial, dunkler Brandfleck am Boden (R5-Ausschnitt) | Funkenball + grauer Rauch, kleiner Ring | viel zu schwach, keine Schichtung | Preset in 3 Schichten: **Vorlauf** (Zielmarker, Projektil mit Glut-Trail) → **Kern** (weißer Flash, additiver Feuerball, Shockwave-Ring, Splitter, Wackeln) → **Nachhall** (Rauchballen dunkel → transparent, Brand-Decal 2 s, Glutfunken) |
| Raketen- und Projektilspur | Rakete mit Feuerschweif: gelber Kern → orange → große runde Rauchballen, die braun und dunkel werden und wachsen (R6) | Projektil ohne Spur | fehlt | Trail-Emitter: Kern additiv gelb-orange, Rauch normal geblendet, Größe wächst, Farbe über Lebensdauer-Kurve |
| Brand-Pfeile | Drei glühende Pfeile mit langem gelb-orangem Schweif und vielen Sternfunken (D1-Ausschnitt) | Pfeile als Linien | — | Pfeile als Vektor mit Spur (Linie mit Verlauf) und Funken; Pfeilregen: Vorlauf-Schatten am Boden, Pfeilschwarm von oben, Einschlag-Staubringe |
| Blitz (Elektro) | Gezackte Linie mit weißem Kern und cyanblauem Glühen, Verästelungen, kleine weiße Funken an getroffenen Zielen, betäubte Ziele mit Funken (D3-Ausschnitt) | Dünne Linie, 1 Farbe | zu dünn | Zickzack-Blitz mit 2 Schichten (Glow additiv breit + Kern weiß schmal), Neu-Zacken alle 40 ms, Verästelungen, Einschlagfunken |
| Einschlag am Turm | Halbtransparente rote Kuppel mit dunklerem Rand, Mitte weiß-blauer Sternblitz (R4i) | Funken | fehlt | Kuppel-Ring + Sternblitz (additiv) als Teil des Treffer-Presets für schwere Treffer |
| Elixier | Magenta Farbspritzer und Wölkchen am Boden (R3, R4, D1) | Lila Tropfen-Partikel | ähnlich | Elixier-Spritzer als kleine Decals (1 s) |
| Frost, Gift, Heilung, Wut, Tornado, Klon, Spiegel, Fluch, Leere, Erdbeben, Gewitter | **Keine Referenz im Material** | Meist nur ein Ring | — | Eigene, aufwendige Presets je Zauber (siehe Style Guide → VFX-Katalog), immer mit Bodenkreis (Radius lesbar), Teamfarben-Rand und Vorlauf, Kern und Nachhall |

## 8. Deck-Bauer

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Kopf | Tabs „Decks“ (aktiv: heller, glänzend) / „Collection“ (inaktiv: dunkler, vertieft); Reihe mit Deck-Knöpfen 1–5 (aktiv **gold**, inaktiv blau), Tausch- und Karten-Knopf (D2) | Zurück-Pfeil + Deck-Tabs „1★ 2 3 4 5“ (aktiv gelb) | ähnlich | 3D-Quadrat-Knöpfe (Fase + Lippe unten), aktiv gold mit Glanz; Tab-Leiste „Deck / Sammlung“ mit vertieftem Inaktiv-Zustand |
| Hintergrund und Panels | Blauer Verlauf mit dezentem Rautenmuster, Karten in dunkleren, abgerundeten **Mulden** (Innenschatten) (D2, G2) | Lila Streifen-Hintergrund, cremefarbene Panels | anderer Farbton, keine Mulden | Panels in Nachtblau mit Fase, Kartenplätze als Mulden mit Innenschatten; Creme nur noch für Info-Plaketten |
| Karte | Hochformat, Bild füllt die Karte, Rahmen in Seltenheitsfarbe (gewöhnlich: blaugrau, selten: orange, episch: lila), Band „Level 11“ unten in Seltenheitsfarbe, Kosten-Tropfen oben links über dem Rahmen; Evo-Karte mit **lila Kappe + Kristall** und leuchtendem Magenta-Rahmen (D2) | Seltenheitsfarbe als Hintergrund, Name unten in dunkler Pill, Tropfen oben links | Rahmen fehlt, Name statt Level | Seltenheitsrahmen wie in der Hand; Namensband unten in Seltenheitsfarbe (Name statt Level, Level steht im Detail); Evo-Kappe + Leuchtrahmen |
| Auswahl | Ausgewählte Deckkarte hat einen **hellblauen leuchtenden Rahmen** um die Mulde (D2) | Blauer Schein | passt | Leucht-Rahmen + Lift; Slot-Animation beim Tausch (Karte fliegt, Ziel-Mulde pulsiert) |
| Drag & Drop | Nicht ablesbar | Nur Tippen | Auftrag verlangt D&D | Zusätzlich Ziehen (Pointer Events) aus der Sammlung in Slots und zwischen Slots, mit Geisterkarte, Ziel-Highlight und Einrasten (Back-out) |
| Durchschnitt | Pill mit großem Magenta-Tropfen und „3.8“ (D2) | Kachel „2,6 Ø Elixier“ | ok | Tropfen-Pill wie Hand-Tropfen |
| Detail | Modal: dunkles Panel, Tabs „Info / Evolution“, **roter quadratischer Schließen-Knopf** mit weißem X oben rechts, große Karte links mit Leuchtrahmen, Titel weiß + Untertitel magenta, Zyklus-Anzeige (Kristall im Kreispfeil) (D5) | Bottom-Sheet, Creme, runder X-Knopf | anderer Look | Detail-Modal in Nachtblau mit Tabs „Info / Evo“, roter 3D-Schließen-Knopf, Evo-Vorschau (Karte mit Evo-Rahmen + Zyklus-Kristalle) |
| Navigationsleiste | Unten 5 Tabs mit großen Icons, aktiver Tab erhöht und heller, Badge-Zahl (G2) | Keine (Zurück-Pfeil) | Spiel hat keine Tab-Struktur | Nicht übernehmen (andere App-Struktur); Zurück-Knopf als 3D-Knopf |

## 9. Hauptmenü

> **Teilweise Referenz:** Die Navigationsleiste (G2), die Ressourcenleiste oben (D5) und die Arena-Vorschau mit Zelten (G5). Ein vollständiges Hauptmenü ist nicht im Material.

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Aufbau | Große Arena-Illustration als Bühne (G5), Leisten oben und unten | Logo, Namens-Chip, 2 Panels (Freundschaftskampf, Aktives Deck) auf lila Streifen | Struktur bleibt (Spiellogik: Code-Kampf) | Bühne: kleine animierte Arena-Vignette (eigene Vektor-Szene: Türme + Fahnen) hinter dem Haupt-CTA; Panels in Nachtblau |
| Knöpfe | Gelb-gold für Hauptaktion, blau für Bestätigung (G4 „Play Again“ gelb, „OK“ blau) | Gold „Kampf erstellen“, Blau „Mit Code beitreten“, Grün „Training“ | Logik passt | Mehrstufige 3D-Knöpfe: Glanz oben, Körper-Verlauf, dunkle Lippe 4–6 px, Kontur; Zustände normal, Hover (+4 % hell), gedrückt (Lippe 1 px, +2 px nach unten), deaktiviert (grau, 60 %), Laden (Spinner) |
| Logo | — (eigenes Spiel) | Farbige Lilita-Buchstaben | — | Logo mit Kontur, Schlagschatten und Glanzkante; Krone über dem „T“ (eigene Form) |

## 10. Lobby (Einladungscode)

> **Keine Referenz:** Im Original gibt es keinen Raum mit 6-stelligem Code.

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Code | — | Großer Code in dunkler Box, „Code kopieren“, „Link teilen“ | — | Code-Kacheln einzeln (je Zeichen ein Plättchen mit Fase), Kopieren mit Häkchen-Pop + Toast „Kopiert!“ |
| Spielerkarten | — (Ergebnis-Screen G4: teamfarbene Banner mit Name weiß und Clan in Hellfarbe) | Blaue und rote Karte, „VS“ gold | passt sinngemäß | Teamfarbene Banner (Band mit gefalteten Enden), Bereit-Status als Häkchen-Siegel, „VS“ als Plakette mit Blitz-Kerbe |
| Countdown | — | Ziffer ersetzt „VS“ | — | Ziffer mit Pop + Shockwave-Ring |

## 11. Ergebnis

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Aufbau | Oben Gegner-Banner (Magenta-Band mit Wappen, Name weiß, Clan rosa), darüber 3 Kronen-Kissen (leer, rot); Mitte „VS“ weiß und „**Winner!**“ in Türkis mit Kontur; darunter 3 **goldene 3D-Kronen** auf blauen Kissen, eigenes blaues Band mit Pokal „+30“ (G4) | „Sieg!“ groß gelb, 2 Zeilen mit Kronen (rot/blau), 3 Stat-Kacheln, 2 Knöpfe | ähnlich; Kronen klein, keine Kissen, keine Bänder | Gegner-Band oben mit Kronen-Kissen, eigenes Band unten; Kronen groß (3D-Vektor mit Glanz) springen einzeln auf ihre Kissen (Back-out, 250 ms gestaffelt) |
| Belohnungen | 3 Kacheln (Truhe, Gold, Kronen ×6) mit dunkler Fläche und hellblauem Rand (G4) | 3 Stat-Kacheln | Spiel hat keine Belohnungen | Stat-Kacheln im gleichen Kachel-Stil (dunkel, heller Rand, Icon oben) |
| Knöpfe | „Play Again“ gelb, „OK“ blau, beide 3D (G4) | „Rematch“ gold, „Zurück zum Menü“ blau | passt | 3D-Knöpfe nach Style Guide; Rematch zeigt den Status des Gegners (Häkchen-Siegel) |
| Hintergrund | Abgedunkelte Arena mit fallendem Konfetti in Blau und Türkis (G4) | Lila Streifen + Konfetti (Sieg) | — | Abgedunkelter Arena-Hintergrund (Bild vom Kampfende) + Konfetti in Teamfarben; Niederlage ohne Konfetti, ruhiger |

## 12. Emotes

| Element | Referenz (Beobachtung) | Mein Spiel (Ist) | Abweichung | Konkrete Maßnahme |
|---|---|---|---|---|
| Knopf | Weiße Sprechblase mit „…“ auf dunkel abgerundetem Quadrat, dicke dunkle Kontur, links über der Hand (D1, D3, D4) | Gelber Kreis mit Smiley rechts unten | anderes Symbol | Sprechblasen-Knopf (eigene Form), Abklingzeit als Ring |
| Auswahl | Nicht im Material | 3×2-Raster in Creme-Panel | — | Radial- oder Leistenmenü mit Pop-Animation (gestaffelt 30 ms), Panel in Nachtblau |
| Anzeige | Emote als Figur in **weißer abgerundeter Sprechblase** mit Rand (D5) | Smiley in Creme-Blase neben dem Turm | ähnlich | Weiße Blase mit Zipfel, Pop (0 → 1,15 → 1), Wackeln, Ausblenden nach 2,2 s |

---

## Zusammenfassung der größten Abweichungen

1. **Licht und Material fehlen überall.** Arena, Türme und Figuren sind flach. → Licht-Modell im Zeichen-Primitiv, neue Arena und neue Türme.
2. **VFX ohne Schichtung und Wucht.** Explosionen, Blitze, Spuren und Einschläge sind deutlich schwächer als in der Referenz. → Partikel-Engine mit Pool, additivem Leuchten, Presets aus Vorlauf, Kern und Nachhall, Decals, Shake und Hit-Stop.
3. **Einheiten-Info zu laut.** Unser Teamring plus Balken für jede Einheit wirkt unruhiger als Abzeichen plus Balken nur bei Schaden. → Level-Abzeichen, Balken nur bei Schaden, Schwärme gebündelt.
4. **Turm-LP-Layout** weicht ab. → Schild-Abzeichen, Balken mit Glanzband und Zahl.
5. **DOM-Screens** sind cremefarben auf Lila, die Referenz nutzt Nachtblau-Panels mit Mulden. → Panels, Mulden und Fasen auf Nachtblau; 3D-Knöpfe mehrstufig; Seltenheitsrahmen auf allen Karten.
6. **Seitenlogik:** Die Referenz zeigt eigene Figuren von hinten. → Rückansichten.
