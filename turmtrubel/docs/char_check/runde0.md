> Stand vor Runde 1 (Iteration 0 von 2). Bilder nur im aktuellen Ergebnis (docs/char_check.md).

# Prüfergebnis der Figuren – Runde 0

Erzeugt von `npm run check:characters` (tools/characters/check.mjs) am 2026-10-11. Schwellen: `CHECK` in tools/characters/system.mjs.

| Prüfung | Ergebnis | Fehler | Hinweise |
|---|---|---|---|
| silhouette | **nicht bestanden** | 22 | 303 |
| color | **nicht bestanden** | 5 | 11 |
| small | **nicht bestanden** | 4 | 3 |
| team | **nicht bestanden** | 153 | 0 |
| anim | **nicht bestanden** | 88 | 35 |
| review | bestanden mit Hinweisen | 0 | 57 |

## 2. Silhouetten

Ruhebild jeder Figur als Maske (Team Blau, vorn, 50 px pro Feld, Fußpunkte deckungsgleich), IoU aller 8385 Paare; zusätzlich höhennormiert (150 px hoch). Fehler ab IoU 0,80, Hinweis ab 0,70 bzw. höhennormiert ab 0,85. Verwandte Paare (29) zählen nicht.

Mittelwert 0,425. Verteilung: 0,0–0,1: 89 · 0,1–0,2: 610 · 0,2–0,3: 1254 · 0,3–0,4: 1834 · 0,4–0,5: 1813 · 0,5–0,6: 1472 · 0,6–0,7: 978 · 0,7–0,8: 302 · 0,8–0,9: 25 · 0,9–1,0: 8.

| Paar (unverwandt) | IoU | höhennormiert |
|---|---|---|
| Fluch-Schwein ↔ Königsschweinchen | 0,92 | 0,74 |
| Riese (Held) ↔ Megaritter | 0,89 | 0,88 |
| Bowler ↔ Rune Giant | 0,86 | 0,86 |
| Riese ↔ Megaritter | 0,86 | 0,84 |
| Elektroriese ↔ Riese (Held) | 0,85 | 0,84 |
| Monster ↔ Rune Giant | 0,85 | 0,80 |
| Riese (Held) ↔ Riesenskelett | 0,85 | 0,86 |
| Bowler ↔ Monster | 0,84 | 0,82 |
| Koboldkäfig ↔ Grabstein (Held) | 0,83 | 0,81 |
| Bowler ↔ Riesenskelett | 0,83 | 0,80 |
| Elektroriese ↔ Riese | 0,83 | 0,76 |
| Riese ↔ Riesenskelett | 0,82 | 0,84 |


**Fehler:**

- cursed-hog ~ royal-hogs: IoU 0.92
- giant-hero ~ mega-knight: IoU 0.89
- bowler ~ rune-giant: IoU 0.86
- giant ~ mega-knight: IoU 0.86
- electro-giant ~ giant-hero: IoU 0.85
- goblinstein-monster ~ rune-giant: IoU 0.85
- giant-hero ~ giant-skeleton: IoU 0.85
- bowler ~ goblinstein-monster: IoU 0.84
- goblin-cage ~ tombstone-hero: IoU 0.83
- bowler ~ giant-skeleton: IoU 0.83
- electro-giant ~ giant: IoU 0.83
- giant ~ giant-skeleton: IoU 0.82
- goblin-machine ~ rune-giant: IoU 0.82
- goblin-machine ~ goblinstein-monster: IoU 0.82
- boss-bandit ~ elite-barbarians: IoU 0.81
- elixir-golem ~ giant-skeleton: IoU 0.81
- bowler ~ goblin-machine: IoU 0.81
- giant-hero ~ rune-giant: IoU 0.81
- boss-bandit ~ ronin: IoU 0.80
- bowler ~ giant-hero: IoU 0.80
- giant-hero ~ goblinstein-monster: IoU 0.80
- berserker-hero ~ ronin: IoU 0.80

**Hinweise:**

- elite-barbarians ~ ronin: IoU 0.80, höhennormiert 0.70
- giant ~ rune-giant: IoU 0.80, höhennormiert 0.72
- barbarians ~ golemite: IoU 0.80, höhennormiert 0.74
- pekka ~ rune-giant: IoU 0.80, höhennormiert 0.77
- barbarians ~ knight-hero: IoU 0.80, höhennormiert 0.80
- goblinstein-monster ~ mega-knight: IoU 0.80, höhennormiert 0.70
- ice-golem-hero ~ knight-hero: IoU 0.80, höhennormiert 0.81
- goblin-cage ~ snowman: IoU 0.79, höhennormiert 0.74
- electro-giant ~ rune-giant: IoU 0.79, höhennormiert 0.78
- electro-giant ~ goblin-giant: IoU 0.79, höhennormiert 0.76
- giant-skeleton ~ rune-giant: IoU 0.79, höhennormiert 0.78
- barbarians ~ ice-golem-hero: IoU 0.79, höhennormiert 0.77
- bowler ~ giant: IoU 0.79, höhennormiert 0.71
- magic-archer ~ ronin: IoU 0.79, höhennormiert 0.74
- magic-archer-hero ~ ronin: IoU 0.79, höhennormiert 0.74
- mega-knight ~ rune-giant: IoU 0.79, höhennormiert 0.79
- magic-archer ~ spirit-empress-ground: IoU 0.79, höhennormiert 0.82
- magic-archer-hero ~ spirit-empress-ground: IoU 0.79, höhennormiert 0.82
- goblin-demolisher ~ hunter: IoU 0.79, höhennormiert 0.78
- barbarians ~ knight: IoU 0.78, höhennormiert 0.79
- … 283 weitere (siehe char_check.json)

## 3. Farben (CIEDE2000)

Geplante Farben: 0 Verstöße gegen die Farbregeln, 0 gegen die Matrix-Regeln. Gerendert: Anteil der Eigenfarbfläche (ohne Kontur und Teamzonen), der höchstens ΔE2000 10 von der Materialrampe der Haupt- bzw. Akzentfarbe entfernt ist (Fehler unter 15,0 % Hauptfarbe, Hinweis unter 1,0 % Akzent).

| engste unverwandte Farbschemata | Schema-Abstand |
|---|---|
| Ballon ↔ Mönch | 8,4 |
| Kobolde ↔ Skelettfass | 9,2 |
| Riese ↔ Koboldbohrer | 9,3 |
| Eisgeist ↔ Schneemann | 10,0 |
| Ballon ↔ Magier | 10,2 |
| Feuergeist ↔ Speerkobolde | 10,2 |

Median Hauptfarb-Anteil 62,9 %, Akzent 9,2 %.

**Fehler:**

- dart-goblin: Hauptfarbe nur 14,9 % der Eigenfarbfläche
- little-prince: Hauptfarbe nur 10,5 % der Eigenfarbfläche
- lumberjack: Hauptfarbe nur 5,0 % der Eigenfarbfläche
- musketeer-hero: Hauptfarbe nur 14,6 % der Eigenfarbfläche
- prince: Hauptfarbe nur 12,7 % der Eigenfarbfläche

**Hinweise:**

- balloon-hero: Akzentfarbe nur 0,7 %
- bomber: Akzentfarbe nur 0,3 %
- cursed-hog: Akzentfarbe nur 0,8 %
- dark-prince-hero: Akzentfarbe nur 0,4 %
- electro-giant: Akzentfarbe nur 0,0 %
- electro-spirit: Akzentfarbe nur 0,6 %
- flying-machine: Akzentfarbe nur 0,0 %
- night-witch: Akzentfarbe nur 0,7 %
- rune-giant: Akzentfarbe nur 0,3 %
- wall-breaker-runner: Akzentfarbe nur 0,0 %
- witch: Akzentfarbe nur 0,0 %

## 4. 40-px-Test

Jede Figur 40 px hoch auf Arena-Gras, einmal mit und einmal ohne ihre Signature-Teile (`data-sig`). Gezählt werden Pixel, die sich sichtbar ändern (ΔE76 > 12). Fehler unter 20 px, Hinweis unter 4,0 % der Figurfläche. Median 20,1 %.


**Fehler:**

- dark-prince: keine Signature-Teile (data-sig)
- executioner: Signature bei 40 px nur 3 px sichtbar
- flying-machine: keine Signature-Teile (data-sig)
- furnace: keine Signature-Teile (data-sig)

**Hinweise:**

- barbarian-hut: Signature-Fläche 3,4 % der Figur
- giant-skeleton: Signature-Fläche 3,6 % der Figur
- goblin-machine: Signature-Fläche 3,3 % der Figur

## 5. Team-Test

Ruhebild in Blau und Rot (52 px pro Feld = Spielgröße bei 2-facher Pixeldichte). Teamfläche = Pixel, die sich zwischen Blau und Rot unterscheiden (ΔE76 > 8); erlaubt 3,0 %–25,0 %, größte 22,7 %. Teamsymbol (Kreis/Dreieck) muss mit mindestens 8 px sichtbar sein, sich in Graustufen auf ebenso vielen Pixeln unterscheiden (Blau und Rot sind fast gleich hell, die Form trägt die Information) und im Farbenblind-Modus um mindestens 1,4× wachsen. Fehlsichtigkeit (Machado 2009: Protanopie, Deuteranopie, Tritanopie): Anteil der Teamfläche, der unterscheidbar bleibt (≥ 60,0 %).


**Fehler:**

- archer-queen: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- archers: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- baby-dragon: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- balloon: Farbenblind-Modus vergrößert das Teamsymbol nicht (49 → 49 px)
- balloon-hero: Farbenblind-Modus vergrößert das Teamsymbol nicht (49 → 49 px)
- bandit: Farbenblind-Modus vergrößert das Teamsymbol nicht (16 → 16 px)
- barbarian-hut: Farbenblind-Modus vergrößert das Teamsymbol nicht (45 → 45 px)
- barbarians: Farbenblind-Modus vergrößert das Teamsymbol nicht (10 → 10 px)
- barbarians: in Graustufen unterscheiden sich Blau und Rot nur auf 7 px
- bats: Farbenblind-Modus vergrößert das Teamsymbol nicht (12 → 12 px)
- battle-healer: Farbenblind-Modus vergrößert das Teamsymbol nicht (14 → 14 px)
- battle-ram: Farbenblind-Modus vergrößert das Teamsymbol nicht (39 → 39 px)
- berserker: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- berserker-hero: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- bomber: Farbenblind-Modus vergrößert das Teamsymbol nicht (18 → 18 px)
- boss-bandit: Farbenblind-Modus vergrößert das Teamsymbol nicht (28 → 28 px)
- bowler: Farbenblind-Modus vergrößert das Teamsymbol nicht (42 → 42 px)
- bowler-hero: Farbenblind-Modus vergrößert das Teamsymbol nicht (40 → 40 px)
- bush-goblin: Farbenblind-Modus vergrößert das Teamsymbol nicht (13 → 13 px)
- cannon-cart: Farbenblind-Modus vergrößert das Teamsymbol nicht (30 → 30 px)
- cursed-hog: Farbenblind-Modus vergrößert das Teamsymbol nicht (21 → 21 px)
- dark-prince: Farbenblind-Modus vergrößert das Teamsymbol nicht (17 → 17 px)
- dark-prince-hero: Farbenblind-Modus vergrößert das Teamsymbol nicht (33 → 33 px)
- dart-goblin: Farbenblind-Modus vergrößert das Teamsymbol nicht (21 → 21 px)
- decoy-goblin: Farbenblind-Modus vergrößert das Teamsymbol nicht (19 → 19 px)
- electro-dragon: Farbenblind-Modus vergrößert das Teamsymbol nicht (17 → 17 px)
- electro-giant: Farbenblind-Modus vergrößert das Teamsymbol nicht (39 → 39 px)
- electro-spirit: Teamfläche nur 2,2 %
- electro-spirit: Teamsymbol im Ruhebild nur 0 px
- electro-wizard: Farbenblind-Modus vergrößert das Teamsymbol nicht (30 → 30 px)
- elite-barbarians: Farbenblind-Modus vergrößert das Teamsymbol nicht (30 → 30 px)
- elixir-blob: Teamsymbol im Ruhebild nur 0 px
- elixir-golem: Farbenblind-Modus vergrößert das Teamsymbol nicht (52 → 52 px)
- elixir-golemite: Farbenblind-Modus vergrößert das Teamsymbol nicht (25 → 25 px)
- executioner: Farbenblind-Modus vergrößert das Teamsymbol nicht (28 → 28 px)
- fire-spirit: Teamsymbol im Ruhebild nur 7 px
- firecracker: Farbenblind-Modus vergrößert das Teamsymbol nicht (23 → 23 px)
- fisherman: Farbenblind-Modus vergrößert das Teamsymbol nicht (39 → 39 px)
- flying-machine: Farbenblind-Modus vergrößert das Teamsymbol nicht (31 → 32 px)
- furnace: Farbenblind-Modus vergrößert das Teamsymbol nicht (34 → 34 px)
- … 113 weitere (siehe char_check.json)

## 6. Animationen

8760 Bilder aller Zustände (Basis, Evo, Formen) so gebacken wie im Spiel (Qualität Hoch), dazu je Zustand 64 fein abgetastete Posen (81575 insgesamt, ohne Rastern). Geprüft: kein deckendes Pixel am Bildrand (abgeschnitten); Unstetigkeiten – Schritte, in denen ein Teil um mehr als 6,0 % der Ruhehöhe wandert, werden per Halbierung eingegrenzt, bleibt dort mehr als 4,0 %, springt das Teil (bei Schleifen auch über das Ende); Einstieg aus der Ruhepose (Hinweis ab 40,0 %); Füße der Bodenfiguren: in Ruhe am Fußpunkt (± 6 mu), in keinem Zustand mehr als 6 mu tiefer, in Ruhe und beim Laufen mit Bodenkontakt (höchstens 4 mu darüber).

**Fehler:**

- archer-queen spawn: Teil „train“ springt um 68 mu (61,0 % der Höhe) bei u ≈ 0,550
- archers spawn: Teil „hairBack“ springt um 25 mu (30,1 % der Höhe) bei u ≈ 0,550
- bandit spawn: Teil „earF“ springt um 25 mu (30,8 % der Höhe) bei u ≈ 0,550
- barbarian-hut idle: Teil „smoke“ springt um 6 mu (5,1 % der Höhe) bei u ≈ 1,000
- barbarians spawn: Teil „ears“ springt um 32 mu (31,3 % der Höhe) bei u ≈ 0,550
- battle-healer spawn: Teil „pestle“ springt um 33 mu (37,9 % der Höhe) bei u ≈ 0,550
- berserker spawn: Teil „panF“ springt um 29 mu (35,0 % der Höhe) bei u ≈ 0,550
- berserker-hero spawn: Teil „bearHood“ springt um 30 mu (33,0 % der Höhe) bei u ≈ 0,550
- bomber spawn: Teil „hatSparks“ springt um 26 mu (30,2 % der Höhe) bei u ≈ 0,550
- boss-bandit spawn: Teil „lining“ springt um 36 mu (35,6 % der Höhe) bei u ≈ 0,550
- bowler spawn: Teil „handF“ springt um 40 mu (32,0 % der Höhe) bei u ≈ 0,550
- bowler-hero spawn: Teil „handF“ springt um 40 mu (31,5 % der Höhe) bei u ≈ 0,550
- bush-goblin spawn: Teil „leafBurst“ springt um 22 mu (33,6 % der Höhe) bei u ≈ 0,550
- dark-prince spawn: Teil „helm“ springt um 20 mu (19,4 % der Höhe) bei u ≈ 0,550
- dark-prince-hero spawn: Teil „helm“ springt um 25 mu (19,1 % der Höhe) bei u ≈ 0,550
- dart-goblin spawn: Teil „pipe“ springt um 51 mu (74,0 % der Höhe) bei u ≈ 0,550
- decoy-goblin spawn: Teil „dagger“ springt um 23 mu (36,8 % der Höhe) bei u ≈ 0,550
- electro-giant spawn: Teil „spark“ springt um 47 mu (32,7 % der Höhe) bei u ≈ 0,550
- electro-wizard spawn: Teil „coatBack“ springt um 35 mu (33,7 % der Höhe) bei u ≈ 0,550
- elite-barbarians spawn: Teil „cape“ springt um 31 mu (28,9 % der Höhe) bei u ≈ 0,550
- elixir-golem spawn: Teil „seal“ springt um 35 mu (27,2 % der Höhe) bei u ≈ 0,550
- executioner spawn: Teil „axe“ springt um 44 mu (41,4 % der Höhe) bei u ≈ 0,550
- firecracker spawn: Teil „sparkle“ springt um 26 mu (25,0 % der Höhe) bei u ≈ 0,550
- fisherman spawn: Teil „rod“ springt um 42 mu (40,2 % der Höhe) bei u ≈ 0,550
- furnace spawn: Teil „pipe“ springt um 38 mu (30,6 % der Höhe) bei u ≈ 0,550
- general-gerry spawn: Teil „saber“ springt um 34 mu (41,3 % der Höhe) bei u ≈ 0,550
- giant spawn: Teil „bobble“ springt um 48 mu (30,7 % der Höhe) bei u ≈ 0,550
- giant-hero spawn: Teil „handF“ springt um 46 mu (32,7 % der Höhe) bei u ≈ 0,550
- giant-skeleton spawn: Teil „handF“ springt um 45 mu (32,6 % der Höhe) bei u ≈ 0,550
- goblin-brawler spawn: Teil „fistB“ springt um 36 mu (42,5 % der Höhe) bei u ≈ 0,550
- goblin-demolisher spawn: Teil „suit“ springt um 29 mu (33,8 % der Höhe) bei u ≈ 0,550
- goblin-giant spawn: Teil „riderA“ springt um 51 mu (30,8 % der Höhe) bei u ≈ 0,550
- goblin-machine spawn: Teil „rocketFlag“ springt um 42 mu (30,6 % der Höhe) bei u ≈ 0,550
- goblins spawn: Teil „spoon“ springt um 23 mu (41,0 % der Höhe) bei u ≈ 0,550
- goblins-hero spawn: Teil „bannerPole“ springt um 27 mu (30,0 % der Höhe) bei u ≈ 0,550
- goblinstein spawn: Teil „coatTail“ springt um 37 mu (34,8 % der Höhe) bei u ≈ 0,550
- goblinstein-monster spawn: Teil „handF“ springt um 49 mu (39,4 % der Höhe) bei u ≈ 0,550
- golden-knight spawn: Teil „rapier“ springt um 58 mu (52,1 % der Höhe) bei u ≈ 0,550
- golem spawn: Teil „tree“ springt um 61 mu (31,2 % der Höhe) bei u ≈ 0,550
- guardienne spawn: Teil „halberd“ springt um 43 mu (37,9 % der Höhe) bei u ≈ 0,550
- … 48 weitere (siehe char_check.json)

**Hinweise:**

- archer-queen: Bodenkontakt -18 mu neben dem Fußpunkt
- bandit charge: Einstieg aus der Ruhe, Teil „tailScarf“ 40,7 % der Höhe entfernt
- battle-healer stun: Einstieg aus der Ruhe, Teil „pestle“ 41,0 % der Höhe entfernt
- battle-ram: Bodenkontakt -20 mu neben dem Fußpunkt
- bowler-hero walk: Einstieg aus der Ruhe, Teil „handF“ 80,5 % der Höhe entfernt
- bowler-hero charge: Einstieg aus der Ruhe, Teil „handF“ 83,0 % der Höhe entfernt
- bowler-hero attack: Einstieg aus der Ruhe, Teil „handF“ 81,8 % der Höhe entfernt
- bowler-hero hit: Einstieg aus der Ruhe, Teil „handF“ 81,8 % der Höhe entfernt
- bowler-hero death: Einstieg aus der Ruhe, Teil „handF“ 81,8 % der Höhe entfernt
- bowler-hero stun: Einstieg aus der Ruhe, Teil „handF“ 78,6 % der Höhe entfernt
- bowler-hero sleep: Einstieg aus der Ruhe, Teil „handF“ 81,7 % der Höhe entfernt
- bowler-hero ability: Einstieg aus der Ruhe, Teil „boulder“ 104,8 % der Höhe entfernt
- cannon-cart: Bodenkontakt -16 mu neben dem Fußpunkt
- dart-goblin stun: Einstieg aus der Ruhe, Teil „pipe“ 56,2 % der Höhe entfernt
- executioner stun: Einstieg aus der Ruhe, Teil „axe“ 47,3 % der Höhe entfernt
- firecracker stun: Einstieg aus der Ruhe, Teil „rockets“ 59,6 % der Höhe entfernt
- fisherman stun: Einstieg aus der Ruhe, Teil „rod“ 42,6 % der Höhe entfernt
- guardienne stun: Einstieg aus der Ruhe, Teil „halberd“ 41,0 % der Höhe entfernt
- guards stun: Einstieg aus der Ruhe, Teil „spear“ 51,2 % der Höhe entfernt
- ice-wizard stun: Einstieg aus der Ruhe, Teil „staff“ 51,2 % der Höhe entfernt
- ice-wizard-hero stun: Einstieg aus der Ruhe, Teil „staff“ 50,5 % der Höhe entfernt
- mini-pekka stun: Einstieg aus der Ruhe, Teil „wrench“ 55,7 % der Höhe entfernt
- mini-pekka-hero stun: Einstieg aus der Ruhe, Teil „wrench“ 55,9 % der Höhe entfernt
- musketeer: Bodenkontakt 41 mu neben dem Fußpunkt
- musketeer-hero: Bodenkontakt 41 mu neben dem Fußpunkt
- night-witch stun: Einstieg aus der Ruhe, Teil „staff“ 51,7 % der Höhe entfernt
- princess stun: Einstieg aus der Ruhe, Teil „midString“ 45,7 % der Höhe entfernt
- skeletrooper stun: Einstieg aus der Ruhe, Teil „spear“ 59,9 % der Höhe entfernt
- tower-guard stun: Einstieg aus der Ruhe, Teil „bow“ 61,5 % der Höhe entfernt
- tower-king charge: Einstieg aus der Ruhe, Teil „mantleHem“ 43,1 % der Höhe entfernt
- … 5 weitere (siehe char_check.json)

## 8. Eigenständigkeits-Review

Ein Satz pro Figur aus Brief und Matrix, dazu der nächste unverwandte Nachbar nach Silhouette und Farbe. **generisch?** heißt: mindestens zwei Nähe-Signale (Silhouette, Familie, Farbe, schwache Signature bei 40 px).

| Figur | Satz | nächste Silhouette | nächstes Farbschema | Markierung |
|---|---|---|---|---|
| Bogenschützen-Königin | Bogenschützen-Königin (Hochgewachsen, L): Mondsichel-Armbrust; übertrieben: steife Spitzenkrause bis über die Ohren; kühl und überlegen, hochgezogene Augenbraue. | Barbaren (0,72) | Grabkönigin (11,0) | Silhouette wie Barbaren (IoU 0,72) |
| Bogenschützen | Bogenschützen (Schlank, S): Fächerköcher wie ein Pfauenrad; übertrieben: Pfeilfächer breiter als die Schultern; sportlich und eifrig, zwinkern beim Zielen. | Elixiergolemit (0,74) | Fischer (10,4) | Silhouette wie Elixiergolemit (IoU 0,74) |
| Drachenbaby | Drachenbaby (Geflügelt, M): Eierschalen-Mütze; übertrieben: Kopf so groß wie der Bauch, Stummelflügel; verspielt und neugierig. | Berserker (Held) (0,74) | Seelensoldat (11,8) | Silhouette wie Berserker (Held) (IoU 0,74) |
| Ballon | Ballon (Schwebend, XL): Zwiebelkuppel-Ballon aus Flicken mit Messingpropeller; übertrieben: Gnom-Pilot mit Riesen-Hörrohr; schadenfroh kichernder Pilot. | Nachthexe (0,65) | Mönch (8,4) |  |
| Ballon (Held) | Ballon (Held) (Schwebend, XL): Skelett-Kadett mit Fallschirm im Korb; übertrieben: Fallschirm-Ausleger am Korb; Pilot und Kadett salutieren. | Holzfäller (0,65) | Banditin (13,6) |  |
| Banditin | Banditin (Geduckt, M): Fuchsohr-Kapuze mit Fuchsschwanz-Schal; übertrieben: buschiger Schwanzschal; verschlagen, grinst. | Goblin Demolisher (0,67) | Ballon (Held) (13,6) |  |
| Barbarenhütte | Barbarenhütte (Bauwerk, XL): Langhaus mit Wolfsschädel über dem Tor; übertrieben: tief heruntergezogenes Grassodendach; rauchend und lärmend. | Elixiergolem (0,75) | Bowler (14,4) | **generisch?** Silhouette wie Elixiergolem (IoU 0,75); Signature bei 40 px schwach (3,4 %) |
| Barbaren | Barbaren (Breit, M): Wolfskopf-Kapuze mit offenem Maul; übertrieben: gewaltige umwickelte Unterarme; laut und draufgängerisch, brüllt. | Golemit (0,80) | Koboldhütte (13,3) | Silhouette wie Golemit (IoU 0,80) |
| Fledermäuse | Fledermäuse (Geflügelt, XS): Lindenblatt-Ohren und ein einzelner Zahn; übertrieben: Ohren größer als der Körper; hibbelig, quietscht. | Suspicious Bush (0,68) | Schattenskelett (20,2) |  |
| Kampfheilerin | Kampfheilerin (Breit, M): Mörser-Rucksack mit Kräutern; übertrieben: Riesenstößel als Keule; resolut und fürsorglich. | Golemit (0,77) | Turmwache (Prinzessinnenturm) (15,3) | Silhouette wie Golemit (IoU 0,77) |
| Rammbock | Rammbock (Fahrzeug, M): geschnitzter Widderkopf mit eisernen Spiralhörnern am Stamm; übertrieben: riesige eiserne Spiralhörner; zwei schnaufende Schieber, entschlossen. | Kanonenkarre (0,55) | Kobold-Raufbold (13,9) |  |
| Berserker | Berserker (Keil, M): Kochtopf-Helm mit Henkeln wie Hörner; übertrieben: zwei riesige Bratpfannen; wild, lacht gackernd. | Magier (0,75) | Banditin (16,1) | Silhouette wie Magier (IoU 0,75) |
| Berserker (Held) | Berserker (Held) (Keil, M): Bärenfell-Umhang mit Bärenkopf-Kapuze; übertrieben: Bärengeist-Schemen bei der Wut; wild, brüllt wie ein Bär. | Ronin (0,80) | Rammbock (17,1) | Silhouette wie Ronin (IoU 0,80) |
| Bomber | Bomber (Kugelig, S): Zylinder voller Bomben; übertrieben: Zylinder höher als der Körper; kichernd und schelmisch. | Goblin Demolisher (0,74) | Skelettfass (15,7) | **generisch?** Silhouette wie Goblin Demolisher (IoU 0,74); gleiche Familie wie Goblin Demolisher |
| Boss Bandit | Boss Bandit (Keil, M): Beutesack über der Schulter, aus dem Münzen fallen; übertrieben: riesiger Silberfuchs-Kragen; selbstsicher und arrogant. | Elitebarbaren (0,81) | Mönch (11,5) | **generisch?** Silhouette wie Elitebarbaren (IoU 0,81); gleiche Familie wie Elitebarbaren |
| Bowler | Bowler (Massig, XL): winziger Melonenhut auf riesigem Kopf; übertrieben: Moos-Rücken eines Steintrolls; gemütlich, konzentriert wie beim Kegeln. | Rune Giant (0,86) | Barbarenhütte (14,4) | **generisch?** Silhouette wie Rune Giant (IoU 0,86); gleiche Familie wie Rune Giant |
| Bowler (Held) | Bowler (Held) (Massig, XL): Krone aus Kegeln; übertrieben: Kegelkrone; triumphierender Kegelkönig. | Rune Giant (0,72) | Zappys (12,7) | **generisch?** Silhouette wie Rune Giant (IoU 0,72); gleiche Familie wie Rune Giant |
| Busch-Kobold | Busch-Kobold (Geduckt, S): Tarnanzug aus Zweigen und Blättern; übertrieben: Blätterschopf wie ein Strauch; verschwörerisch, flüstert. | Lockvogel-Kobold (0,75) | Koboldriese (13,8) | Silhouette wie Lockvogel-Kobold (IoU 0,75) |
| Kanonenkarre | Kanonenkarre (Fahrzeug, M): Hechtkopf-Kanonenrohr; übertrieben: Fischmaul-Mündung mit Zähnen; Kanonier mit Ohrenschützern, pfeift. | Rammbock (0,55) | Mini-P.E.K.K.A. (Held) (10,9) |  |
| Fluch-Schwein | Fluch-Schwein (Vierbeinig, XS): Mini-Hexenhut mit Fluchsternchen; übertrieben: Fluchrauch aus den Ohren; verwirrt und grantig. | Königsschweinchen (0,92) | Megalakai (Held) (24,0) | **generisch?** Silhouette wie Königsschweinchen (IoU 0,92); gleiche Familie wie Königsschweinchen |
| Dunkler Prinz | Dunkler Prinz (Reiter, L): gepanzerter Waran als Reittier; übertrieben: Waran-Krallen und Stachelschulter; düster und arrogant. | Schweinereiter (0,60) | Magieschütze (15,3) | **generisch?** gleiche Familie wie Schweinereiter; Signature bei 40 px schwach (0,0 %) |
| Dunkler Prinz (Held) | Dunkler Prinz (Held) (Reiter, XL): Sichelmond-Krone über dem Visier; übertrieben: reitet ein gepanzertes Nashorn; eiskalt und siegesgewiss. | Widderreiterin (0,71) | Drei Musketierinnen (16,9) | **generisch?** Silhouette wie Widderreiterin (IoU 0,71); gleiche Familie wie Widderreiterin |
| Blasrohrkobold | Blasrohrkobold (Geduckt, S): Blasrohr doppelt so lang wie er selbst; übertrieben: Blasrohr; hibbelig, schielt beim Zielen. | Skelett-Fallschirmjäger (0,65) | Boss Bandit (16,8) |  |
| Lockvogel-Kobold | Lockvogel-Kobold (Winzig, S): Lockente-Kostüm mit Holzschnabel; übertrieben: Entenschnabel-Kapuze; albern, quakt. | Busch-Kobold (0,75) | Flugmaschine (12,9) | Silhouette wie Busch-Kobold (IoU 0,75) |
| Elektrodrache | Elektrodrache (Geflügelt, M): Blitzableiter-Horn mit Kupferspule; übertrieben: statisch abstehende Mähne; nervös, zuckt. | Skelettdrachen (0,73) | Magieschütze (10,8) | **generisch?** Silhouette wie Skelettdrachen (IoU 0,73); gleiche Familie wie Skelettdrachen |
| Elektroriese | Elektroriese (Massig, XL): Teslaspulen als Schulterpolster; übertrieben: riesige Gummihandschuhe; grimmig, knurrt durch das Schweißervisier. | Riese (Held) (0,85) | Golemit (21,0) | **generisch?** Silhouette wie Riese (Held) (IoU 0,85); gleiche Familie wie Riese (Held) |
| Elektrogeist | Elektrogeist (Schwebend, XS): Steckerzinken als Ohren; übertrieben: Zickzack-Schwanz; aufgekratzt. | Feuergeist (0,64) | Großer Gräber (21,7) | gleiche Familie wie Feuergeist |
| Elektromagier | Elektromagier (Hochgewachsen, M): Rucksack aus Blitzflaschen mit Kupferbügeln; übertrieben: Kupferspulen-Handschuhe; exzentrisch, grinst manisch. | Holzfäller (0,75) | Grabkönigin (12,4) | **generisch?** Silhouette wie Holzfäller (IoU 0,75); gleiche Familie wie Holzfäller |
| Elitebarbaren | Elitebarbaren (Keil, M): Bärenschädel-Schulterpanzer; übertrieben: Schultern doppelt so breit wie die Hüfte; angeberisch, grinst überlegen. | Boss Bandit (0,81) | Koboldkäfig (13,2) | **generisch?** Silhouette wie Boss Bandit (IoU 0,81); gleiche Familie wie Boss Bandit |
| Elixierklecks | Elixierklecks (Amorph, XS): Korkhütchen auf dem Klecks; übertrieben: riesige glänzende Augen; quietschfidel. | Eisgeist (0,71) | Rabaukin (24,2) | Silhouette wie Eisgeist (IoU 0,71) |
| Elixiergolem | Elixiergolem (Massig, XL): Glasbauch voller blubbernder Flüssigkeit; übertrieben: Korken als Kopf; tumb-fröhlich, blubbert. | Riesenskelett (0,81) | Guardienne (23,7) | **generisch?** Silhouette wie Riesenskelett (IoU 0,81); gleiche Familie wie Riesenskelett |
| Elixiergolemit | Elixiergolemit (Kugelig, M): Erlenmeyerkolben-Körper mit Stopfen; übertrieben: Glasbauch mit Messskala; aufgeregt. | König (Königsturm) (0,76) | Guardienne (20,1) | Silhouette wie König (Königsturm) (IoU 0,76) |
| Scharfrichter | Scharfrichter (Hochgewachsen, L): Sichelaxt an einer Kette; übertrieben: Eisenmaske mit zwei runden Gucklöchern; stoisch, summt unheimlich. | Magieschütze (0,70) | Infernodrache (14,8) | **generisch?** Silhouette wie Magieschütze (IoU 0,70); Signature bei 40 px schwach (0,4 %) |
| Feuergeist | Feuergeist (Schwebend, XS): Kerzenwachs-Körper mit Flammenhaar; übertrieben: Flammenhaar höher als der Körper; übermütig. | Elektrogeist (0,64) | Speerkobolde (10,2) | gleiche Familie wie Elektrogeist |
| Feuerwerkerin | Feuerwerkerin (Schlank, S): Papierschirm, dessen Speichen Raketen sind; übertrieben: Wunderkerzen im Haarknoten; aufgekratzt, lacht laut. | Goblinstein (0,68) | Eisgolem (26,3) | gleiche Familie wie Goblinstein |
| Fischer | Fischer (Breit, M): Angelrute mit Riesen-Blinker; übertrieben: Südwester mit breiter Krempe; knurrig-gemütlich, Pfeife im Mund. | Golemit (0,73) | Bogenschützen (10,4) | Silhouette wie Golemit (IoU 0,73) |
| Flugmaschine | Flugmaschine (Mechanisch, M): Schlagflügel aus Segeltuch mit Holzrippen; übertrieben: Flügelspannweite doppelt so groß wie die Höhe; Pilotin mit Zunge im Mundwinkel. | Infernodrache (0,60) | Widderreiterin (10,8) | Signature bei 40 px schwach (0,0 %) |
| Ofen | Ofen (Mechanisch, L): glühende Ofenklappe als Bauch; übertrieben: Ofenrohr als hoher Hut; brummig und hitzköpfig. | Ritter (Held) (0,73) | Lavahund (12,5) | **generisch?** Silhouette wie Ritter (Held) (IoU 0,73); Signature bei 40 px schwach (1,1 %) |
| General Gerry | General Gerry (Winzig, S): Zweispitz mit Federbusch; übertrieben: goldene Epauletten breiter als der Schädel; kommandierend, zeigt mit dem Säbel. | Rabaukin (0,73) | Ofen (13,3) | **generisch?** Silhouette wie Rabaukin (IoU 0,73); gleiche Familie wie Rabaukin |
| Riese | Riese (Massig, XL): Bommelmütze mit Riesenbommel; übertrieben: riesige Arbeitshandschuhe; gutmütig und schnaufend. | Megaritter (0,86) | Koboldbohrer (9,3) | **generisch?** Silhouette wie Megaritter (IoU 0,86); gleiche Familie wie Megaritter |
| Riese (Held) | Riese (Held) (Massig, XL): Erntekrone aus Weizenähren; übertrieben: Steppdecken-Umhang; stolzer Erntekönig. | Megaritter (0,89) | Speerkobolde (10,9) | **generisch?** Silhouette wie Megaritter (IoU 0,89); gleiche Familie wie Megaritter |
| Riesenskelett | Riesenskelett (Massig, XL): Uhrwerk-Bombe im Brustkorb; übertrieben: Riesenfäuste aus Fingerknochen; dröhnend lachend. | Riese (Held) (0,85) | Flugmaschine (15,0) | **generisch?** Silhouette wie Riese (Held) (IoU 0,85); gleiche Familie wie Riese (Held); Signature bei 40 px schwach (3,6 %) |
| Kobold-Raufbold | Kobold-Raufbold (Keil, M): gesprengte Handschellen mit Kettenresten; übertrieben: Fäuste groß wie der Kopf; wütend und befreit, schnaubt. | Berserker (0,75) | Rammbock (13,9) | **generisch?** Silhouette wie Berserker (IoU 0,75); gleiche Familie wie Berserker |
| Koboldkäfig | Koboldkäfig (Bauwerk, L): vergoldeter Vogelkäfig mit rüttelndem Raufbold; übertrieben: riesiges Vorhängeschloss; wackelnd, der Gefangene tobt. | Grabstein (Held) (0,83) | Elitebarbaren (13,2) | **generisch?** Silhouette wie Grabstein (Held) (IoU 0,83); gleiche Familie wie Grabstein (Held) |
| Goblin Demolisher | Goblin Demolisher (Kugelig, M): Bullaugen-Helm am gepolsterten Bombenanzug; übertrieben: kugelrunder Polsteranzug; fröhlich-leichtsinnig. | Jäger (0,79) | Riese (Held) (12,4) | Silhouette wie Jäger (IoU 0,79) |
| Koboldbohrer | Koboldbohrer (Bauwerk, XL): Bohrturm mit Schraubenspitze und Kobold-Fahrer; übertrieben: Riesenschraube; rattert und ruckelt. | Magieschütze (0,70) | Riese (9,3) |  |
| Koboldriese | Koboldriese (Massig, XL): Fass-Krähennest mit zwei Speerkobolden; übertrieben: Riesenohren mit Ohrringen wie Fassreifen; tumb und gutmütig, grinst schief. | Elektroriese (0,79) | Busch-Kobold (13,8) | **generisch?** Silhouette wie Elektroriese (IoU 0,79); gleiche Familie wie Elektroriese |
| Koboldhütte | Koboldhütte (Bauwerk, XL): schiefe Flickwerk-Hütte mit Kürbis-Schornstein; übertrieben: krummer Kürbisschornstein; knarzend, Kobolde gucken heraus. | Barbarenhütte (0,74) | Barbaren (13,3) | **generisch?** Silhouette wie Barbarenhütte (IoU 0,74); gleiche Familie wie Barbarenhütte |
| Goblin Machine | Goblin Machine (Mechanisch, XL): Kolbenfaust mit Dampfzylinder; übertrieben: Kolbenfaust größer als der Pilot; Pilot jauchzt, Maschine stampft. | Rune Giant (0,82) | Golemit (15,5) | **generisch?** Silhouette wie Rune Giant (IoU 0,82); Signature bei 40 px schwach (3,3 %) |
| Kobolde | Kobolde (Winzig, S): geschliffener Löffeldolch; übertrieben: Riesenohren mit Goldringen; frech und gierig. | Skelette (0,72) | Skelettfass (9,2) | **generisch?** Silhouette wie Skelette (IoU 0,72); gleiche Familie wie Skelette |
| Kobolde (Held) | Kobolde (Held) (Winzig, S): Brigade-Banner auf dem Rücken; übertrieben: Banner doppelt so hoch wie der Kobold; kriegerisch-frech, Kriegsbemalung. | Speerkobolde (0,60) | Ballon (13,9) |  |
| Goblinstein | Goblinstein (Schlank, M): Fernsteuerkasten mit Blitzantenne; übertrieben: Schweißerbrille mit dicken Gläsern; größenwahnsinnig, lacht irre. | Ronin (0,78) | Eismagier (11,4) | **generisch?** Silhouette wie Ronin (IoU 0,78); gleiche Familie wie Ronin |
| Monster | Monster (Massig, XL): Rücken-Akku mit Kabeln zu Kupferklemmen am Hals; übertrieben: Flickenkörper mit ungleich großen Armen; sanftes Monster, brummt Wiegenlieder. | Rune Giant (0,85) | Koboldriese (13,8) | **generisch?** Silhouette wie Rune Giant (IoU 0,85); gleiche Familie wie Rune Giant |
| Goldener Ritter | Goldener Ritter (Schlank, L): Strahlenkranz-Helmzier; übertrieben: Strahlenkranz wie eine Sonne hinter dem Kopf; eitel und strahlend, posiert. | Magieschütze (0,75) | Riese (Held) (20,4) | **generisch?** Silhouette wie Magieschütze (IoU 0,75); gleiche Familie wie Magieschütze |
| Golem | Golem (Massig, XXL): Bäumchen mit Vogelnest auf der Schulter; übertrieben: Felsfäuste so groß wie der Rumpf; uralt und träge, brummt. | Megaritter (0,68) | Prinzessin (12,9) | gleiche Familie wie Megaritter |
| Golemit | Golemit (Kugelig, M): halbe Säule als Rumpf mit Kapitell-Kopf; übertrieben: abgebrochenes Säulenkapitell; trotzig. | Barbaren (0,80) | Goblin Machine (15,5) | Silhouette wie Barbaren (IoU 0,80) |
| Guardienne | Guardienne (Keil, L): echte Holztür als Schild; übertrieben: Tür-Schild mit Klinke und Briefschlitz; wachsam, beschützend, wortkarg. | Ritter (0,67) | Magieschütze (Held) (11,4) |  |
| Wächter | Wächter (Winzig, S): Sargdeckel-Schild; übertrieben: Sargdeckel länger als der Wächter; steif und pflichtbewusst, salutieren. | Little Prince (0,68) | Tunnelgräber (16,8) | gleiche Familie wie Little Prince |
| Heilungsgeist | Heilungsgeist (Schwebend, XS): Pusteblumen-Kopf; übertrieben: Samenschirmchen; sanft und kichernd. | Schattenskelett (0,66) | Elektrogeist (23,2) |  |
| Schweinereiter | Schweinereiter (Reiter, L): Karottenangel vor der Schweineschnauze; übertrieben: Rennbrille und flatternde Jockeymütze; übermütig, jauchzt. | Dunkler Prinz (Held) (0,70) | Koboldhütte (13,7) | **generisch?** Silhouette wie Dunkler Prinz (Held) (IoU 0,70); gleiche Familie wie Dunkler Prinz (Held) |
| Jäger | Jäger (Breit, M): Donnerbüchse mit Trichtermündung; übertrieben: Biberfellmütze mit Schwanz; brummig, kneift ein Auge zu. | Goblin Demolisher (0,79) | Scharfrichter (16,1) | Silhouette wie Goblin Demolisher (IoU 0,79) |
| Eisgolem | Eisgolem (Kugelig, M): eingefrorener Fisch im Bauch; übertrieben: kugelrunder Eisbauch; verschlafen-friedlich. | Golemit (0,78) | Königsgeist (18,8) | **generisch?** Silhouette wie Golemit (IoU 0,78); gleiche Familie wie Golemit |
| Eisgolem (Held) | Eisgolem (Held) (Kugelig, L): Eiskrone mit Schneeflocken-Zacken; übertrieben: Schneesturm-Wirbel um den Bauch; majestätisch-verschlafen. | Ritter (Held) (0,80) | Zappys (13,5) | Silhouette wie Ritter (Held) (IoU 0,80) |
| Eisgeist | Eisgeist (Winzig, XS): Eiskristall-Stacheln wie ein Igel; übertrieben: Stachelkranz; kichernd, kalt. | Elixierklecks (0,71) | Schneemann (10,0) | Silhouette wie Elixierklecks (IoU 0,71) |
| Eismagier | Eismagier (Dreieckig, M): Schneekugel-Stab mit Winterlandschaft; übertrieben: Eiszapfen-Bart bis zum Gürtel; gelassen und schusselig. | Goblinstein (0,75) | Goblinstein (11,4) | **generisch?** Silhouette wie Goblinstein (IoU 0,75); ähnliche Farben wie Goblinstein (Schema 11,4) |
| Eismagier (Held) | Eismagier (Held) (Dreieckig, M): kleiner Schneemann-Gehilfe auf der Schulter; übertrieben: Schneekugel-Stab mit Schneemann darin; großväterlich, lacht. | Goblinstein (0,76) | Eisgeist (12,8) | Silhouette wie Goblinstein (IoU 0,76) |
| Infernodrache | Infernodrache (Geflügelt, L): Brennglas in Messingfassung vor dem Maul; übertrieben: Brennglas so groß wie der Kopf; brütend und konzentriert. | Elektrodrache (0,68) | Lavawelpe (12,6) | gleiche Familie wie Elektrodrache |
| Ritter | Ritter (Breit, M): Zinnenschild in Burgturm-Form; übertrieben: Zinnenschild fast so hoch wie er selbst; stur und pflichtbewusst, Pflaster quer über der Nase. | Barbaren (0,78) | Walküre (18,9) | **generisch?** Silhouette wie Barbaren (IoU 0,78); gleiche Familie wie Barbaren |
| Ritter (Held) | Ritter (Held) (Breit, M): Löwenmähnen-Kragen mit Heldenumhang; übertrieben: Zinnenschild mit goldener Krone; herausfordernd, ruft zum Kampf. | Barbaren (0,80) | Königsschweinchen (12,6) | **generisch?** Silhouette wie Barbaren (IoU 0,80); gleiche Familie wie Barbaren |
| Lavahund | Lavahund (Schwebend, XXL): Vulkankrater auf dem Rücken; übertrieben: Basaltplatten-Panzer; hechelnd und gutmütig. | Spirit Empress (Drache) (0,64) | Ofen (12,5) |  |
| Lavawelpe | Lavawelpe (Geflügelt, XS): Glutkringel-Schwanz; übertrieben: riesige Welpenaugen; tapsig. | Heilungsgeist (0,63) | Boss Bandit (12,4) |  |
| Little Prince | Little Prince (Winzig, S): viel zu große Krone, die über die Augen rutscht; übertrieben: Krone so breit wie der ganze Prinz; verwöhnt und ungeduldig, stampft. | General Gerry (0,72) | Drachenbaby (15,6) | **generisch?** Silhouette wie General Gerry (IoU 0,72); gleiche Familie wie General Gerry |
| Holzfäller | Holzfäller (Hochgewachsen, M): Holzkraxe mit Holzscheiten und Wutflasche; übertrieben: Bart voller Tannenzweige; hektisch und gutgelaunt. | Elektromagier (0,75) | Busch-Kobold (14,4) | **generisch?** Silhouette wie Elektromagier (IoU 0,75); gleiche Familie wie Elektromagier |
| Magieschütze | Magieschütze (Schlank, M): Fernrohr-Bogen mit Messingvisier; übertrieben: Astrolabium-Hutkrempe mit Messingringen; verträumter Sterngucker, präzise. | Ronin (0,79) | Elektrodrache (10,8) | **generisch?** Silhouette wie Ronin (IoU 0,79); gleiche Familie wie Ronin |
| Magieschütze (Held) | Magieschütze (Held) (Schlank, L): Sternbild-Mantel mit drei leuchtenden Pfeilsternen; übertrieben: Sternbilder, die sich auf dem Mantel bewegen; gerissen und verspielt. | Ronin (0,79) | Guardienne (11,4) | **generisch?** Silhouette wie Ronin (IoU 0,79); gleiche Familie wie Ronin |
| Megaritter | Megaritter (Massig, XL): Glockenhelm, der beim Landen läutet; übertrieben: Kugelfäuste aus Gusseisen; wuchtig und selbstgefällig. | Riese (Held) (0,89) | Walküre (12,4) | **generisch?** Silhouette wie Riese (Held) (IoU 0,89); gleiche Familie wie Riese (Held) |
| Megalakai | Megalakai (Geflügelt, M): Steinbauch-Panzer mit Wasserspeier-Hörnern; übertrieben: kleine Flügel tragen einen schweren Steinbauch; grimmig, ächzt. | Koboldkäfig (0,72) | Grabstein (Held) (12,4) | Silhouette wie Koboldkäfig (IoU 0,72) |
| Megalakai (Held) | Megalakai (Held) (Geflügelt, M): Visierhelm mit Heldenstern; übertrieben: Steinbauch mit Goldgravur; jagend, fixiert sein Ziel. | Berserker (Held) (0,71) | Grabstein (Held) (16,4) | Silhouette wie Berserker (Held) (IoU 0,71) |
| Großer Gräber | Großer Gräber (Breit, L): Bohrer statt rechtem Arm; übertrieben: Bauhelm mit greller Stirnlampe; polternd und zufrieden. | Mönch (0,73) | Koboldkäfig (14,3) | **generisch?** Silhouette wie Mönch (IoU 0,73); gleiche Familie wie Mönch |
| Tunnelgräber | Tunnelgräber (Geduckt, M): Maulwurf-Schaufelkrallen; übertrieben: Krallen breiter als der Kopf; kurzsichtig und fleißig. | Busch-Kobold (0,64) | Lavawelpe (13,6) | gleiche Familie wie Busch-Kobold |
| Mini-P.E.K.K.A. | Mini-P.E.K.K.A. (Mechanisch, M): Dampfpfeife auf dem Kessel, pfeift beim Schlag; übertrieben: Riesen-Rohrzange; eifrig und tollpatschig, ein großes Zyklopenauge. | Fischer (0,71) | Walküre (10,2) | Silhouette wie Fischer (IoU 0,71) |
| Mini-P.E.K.K.A. (Held) | Mini-P.E.K.K.A. (Held) (Mechanisch, M): Pfannkuchen-Turm auf dem Rücken mit Sirupflasche; übertrieben: Pfannkuchen-Stapel mit drei Füllleisten; verfressen und begeistert. | Ofen (0,67) | Kanonenkarre (10,9) | gleiche Familie wie Ofen |
| Minion Giant | Minion Giant (Geflügelt, XL): Kehlsack, der sich vor dem Spucken aufbläht; übertrieben: genähte Laborflügel; träge und verfressen. | Mönch (0,63) | Magieschütze (15,4) |  |
| Lakaien | Lakaien (Geflügelt, S): einzelnes Stirnhorn und Pik-Schwanz; übertrieben: Pik-Schwanzspitze; frech und zappelig. | Speerkobolde (0,61) | Walküre (14,4) |  |
| Mönch | Mönch (Breit, L): Bronzegong auf dem Rücken; übertrieben: riesige Handflächen; heiter und unerschütterlich. | Ritter (Held) (0,74) | Ballon (8,4) | **generisch?** Silhouette wie Ritter (Held) (IoU 0,74); gleiche Familie wie Ritter (Held) |
| Hexenmutter | Hexenmutter (Dreieckig, M): Kessel-Rucksack mit blubberndem Fluchsud; übertrieben: Lockenwickler unter dem Hut; resolute Hexen-Oma, droht mit der Kelle. | Rabauke (0,76) | Hexe (16,3) | Silhouette wie Rabauke (IoU 0,76) |
| Musketierin | Musketierin (Schlank, M): Musketengabel als Stütze; übertrieben: Muskete länger als sie selbst; ruhig und präzise, hebt eine Augenbraue. | Scharfrichter (0,67) | Skelett-Fallschirmjäger (13,5) |  |
| Musketierin (Held) | Musketierin (Held) (Schlank, L): Werkzeuggürtel mit Kurbel und Bauplan-Rolle; übertrieben: Federhut mit Orden; tüchtig, plant voraus. | Scharfrichter (0,67) | Suspicious Bush (11,5) |  |
| Nachthexe | Nachthexe (Hochgewachsen, L): Glockenturm-Hut, aus dem Fledermäuse fliegen; übertrieben: Hut mit kleinem Glockenstuhl; träge und spöttisch, gähnt. | Eismagier (0,73) | Schattenskelett (13,6) | Silhouette wie Eismagier (IoU 0,73) |
| P.E.K.K.A. | P.E.K.K.A. (Mechanisch, XL): Laternenkopf mit Flamme; übertrieben: Fallbeil-Schwert länger als der Rumpf; stumm und unaufhaltsam, die Flamme flackert vor Zorn. | Rune Giant (0,80) | Bomber (16,2) | Silhouette wie Rune Giant (IoU 0,80) |
| Phönix | Phönix (Geflügelt, M): Schleppfedern wie Flammenbänder; übertrieben: Flammenkamm; stolz und feurig. | Elektrodrache (0,57) | Großer Gräber (19,5) |  |
| Prinz | Prinz (Reiter, XL): Froschmaul-Stechhelm; übertrieben: Turnierlanze mit Spiralstreifen; edel und ungeduldig. | Rune Giant (0,62) | Kampfheilerin (16,8) |  |
| Prinzessin | Prinzessin (Dreieckig, S): Harfenbogen mit Saiten; übertrieben: Glockenkleid fast so breit wie hoch; verträumt, summt beim Zielen. | König (Königsturm) (0,76) | Golem (12,9) | **generisch?** Silhouette wie König (Königsturm) (IoU 0,76); gleiche Familie wie König (Königsturm) |
| Widderreiterin | Widderreiterin (Reiter, L): Widder mit Doppelspiral-Hörnern und Glöckchen; übertrieben: Hörner groß wie Wagenräder; abenteuerlustig, ruft. | Dunkler Prinz (Held) (0,71) | Flugmaschine (10,8) | **generisch?** Silhouette wie Dunkler Prinz (Held) (IoU 0,71); gleiche Familie wie Dunkler Prinz (Held) |
| Rabauke | Rabauke (Breit, M): Rüstung aus Pappkartons mit Klebeband; übertrieben: Kochtopfdeckel als Schild; großspurig, Zahnlücke. | Golemit (0,78) | Flugmaschine (13,6) | Silhouette wie Golemit (IoU 0,78) |
| Rabaukin | Rabaukin (Winzig, S): Astgabel-Schleuder; übertrieben: Zöpfe, die beim Schießen hochfliegen; frech, Sommersprossen. | Skelett-Fallschirmjäger (0,75) | Ballon (Held) (22,6) | **generisch?** Silhouette wie Skelett-Fallschirmjäger (IoU 0,75); gleiche Familie wie Skelett-Fallschirmjäger |
| Nashorn | Nashorn (Vierbeinig, M): Doppelhorn mit Sichelmond-Schutzplatte; übertrieben: Panzerfalten wie Plattenrüstung; stur und schnaubend. | Dunkler Prinz (Held) (0,70) | Turmwache (Prinzessinnenturm) (13,0) | Silhouette wie Dunkler Prinz (Held) (IoU 0,70) |
| Ronin | Ronin (Schlank, M): tiefer Strohhut mit Papiersiegel; übertrieben: Hutkrempe breiter als die Schultern; ruhig und wachsam. | Boss Bandit (0,80) | Skelett-Fallschirmjäger (11,5) | Silhouette wie Boss Bandit (IoU 0,80) |
| Königsgeist | Königsgeist (Schwebend, M): schwebende Krone über leerem Helm; übertrieben: leerer Helm, aus dem Licht scheint; melancholisch, seufzt. | Drachenbaby (0,69) | Eisgolem (Held) (16,5) |  |
| Königsriese | Königsriese (Massig, XL): hohe Bärenfellmütze der Leibgarde; übertrieben: Schulterkanone mit Löwenmaul-Mündung; streng und stolz, Schnurrbart zuckt. | Riese (0,78) | Ronin (15,7) | **generisch?** Silhouette wie Riese (IoU 0,78); gleiche Familie wie Riese |
| Königsschweinchen | Königsschweinchen (Vierbeinig, XS): Minikrone zwischen den Ohren; übertrieben: Schweineschnauze groß wie der Kopf; quiekend und stolz. | Fluch-Schwein (0,92) | Ritter (Held) (12,6) | **generisch?** Silhouette wie Fluch-Schwein (IoU 0,92); gleiche Familie wie Fluch-Schwein |
| Königsrekruten | Königsrekruten (Breit, M): übergroßer Schüsselhelm, der über die Augen rutscht; übertrieben: Helm so groß wie der Oberkörper; jung, nervös und tapfer. | Goblin Demolisher (0,70) | Bowler (18,2) | Silhouette wie Goblin Demolisher (IoU 0,70) |
| Rune Giant | Rune Giant (Massig, XL): Runentafel als Schild und Waffe; übertrieben: leuchtende Runen-Tätowierungen; feierlich und weise, murmelt. | Bowler (0,86) | Golemit (19,7) | **generisch?** Silhouette wie Bowler (IoU 0,86); gleiche Familie wie Bowler |
| Schattenskelett | Schattenskelett (Winzig, XS): Rauchschweif statt Beine; übertrieben: leuchtende Augenhöhlen; flüsternd, unheimlich. | Heilungsgeist (0,66) | Nachthexe (13,6) |  |
| Skelettfass | Skelettfass (Schwebend, L): Propellerkappe auf dem Fass; übertrieben: Knochen gucken aus den Spundlöchern; ratternd und kichernd. | Megalakai (Held) (0,70) | Kobolde (9,2) |  |
| Skelettdrachen | Skelettdrachen (Geflügelt, M): grünes Geisterfeuer im Brustkorb; übertrieben: Knochenflügel mit zerfetzter Haut; gierig, schnappt. | Elektrodrache (0,73) | Flugmaschine (18,4) | **generisch?** Silhouette wie Elektrodrache (IoU 0,73); gleiche Familie wie Elektrodrache |
| Skelettkönig | Skelettkönig (Massig, XXL): Geweihkrone; übertrieben: Grabstein-Keule; majestätisch und hohl lachend. | Königsriese (0,73) | Guardienne (15,3) | **generisch?** Silhouette wie Königsriese (IoU 0,73); gleiche Familie wie Königsriese |
| Skelette | Skelette (Winzig, XS): riesiger rissiger Schädel mit Geisteraugen; übertrieben: Schädel halb so groß wie der ganze Körper; klapprig-fröhlich. | Kobolde (0,72) | Schneemann (16,3) | **generisch?** Silhouette wie Kobolde (IoU 0,72); gleiche Familie wie Kobolde |
| Skelett-Fallschirmjäger | Skelett-Fallschirmjäger (Winzig, S): Fallschirm-Packsack mit Reißleine; übertrieben: Fliegerbrille über leeren Augenhöhlen; tollkühn, salutiert. | Turmwache (Prinzessinnenturm) (0,77) | Turmwache (Prinzessinnenturm) (10,9) | **generisch?** Silhouette wie Turmwache (Prinzessinnenturm) (IoU 0,77); ähnliche Farben wie Turmwache (Prinzessinnenturm) (Schema 10,9) |
| Schneemann | Schneemann (Kugelig, M): Frostkrone aus Eiszapfen; übertrieben: Rübennase mit Raureif; frostig-freundlich. | Koboldkäfig (0,79) | Eisgeist (10,0) | Silhouette wie Koboldkäfig (IoU 0,79) |
| Seelensoldat | Seelensoldat (Schwebend, S): Geisterpike mit Wimpelfetzen; übertrieben: Pike doppelt so lang wie der Geist; eifrig und durchscheinend. | Skelett-Fallschirmjäger (0,54) | Drachenbaby (11,8) |  |
| Funki | Funki (Mechanisch, XL): Kondensator-Schüssel mit Ladebalken; übertrieben: Schüssel größer als der Käferpanzer; brummt ungeduldig, Ladebalken als Gesichtsausdruck. | Grabstein (Held) (0,66) | Ronin (19,8) |  |
| Speerkobolde | Speerkobolde (Schlank, S): Bambusspeer-Bündel auf dem Rücken; übertrieben: Anglerhut mit Haken an der Krempe; eifrig, streckt die Zunge raus. | Skelett-Fallschirmjäger (0,72) | Feuergeist (10,2) | Silhouette wie Skelett-Fallschirmjäger (IoU 0,72) |
| Spirit Empress (Drache) | Spirit Empress (Drache) (Schlangenartig, XL): Nebelband-Drache, auf dem die Kaiserin reitet; übertrieben: Drachenleib als endloses Nebelband; schwebend und erhaben. | Lavahund (0,64) | Bowler (Held) (21,3) |  |
| Spirit Empress (zu Fuß) | Spirit Empress (zu Fuß) (Dreieckig, M): Laternenkrone mit schwebenden Lichtern; übertrieben: bodenlange Seidenärmel; würdevoll, lächelt geheimnisvoll. | Magieschütze (0,79) | Mini-P.E.K.K.A. (Held) (11,1) | Silhouette wie Magieschütze (IoU 0,79) |
| Suspicious Bush | Suspicious Bush (Amorph, S): zwei Augenpaare im Busch und große Schuhe; übertrieben: Schuhe unter dem Busch; verdächtig unschuldig. | König (Königsturm) (0,72) | Musketierin (Held) (11,5) | Silhouette wie König (Königsturm) (IoU 0,72) |
| Drei Musketierinnen | Drei Musketierinnen (Schlank, M): Dreispitz mit großer Kokarde; übertrieben: riesige Kokarden am Dreispitz; eingespielt und keck, Schwestern-Grinsen. | Spirit Empress (zu Fuß) (0,75) | Elektromagier (13,8) | Silhouette wie Spirit Empress (zu Fuß) (IoU 0,75) |
| Grabkönigin | Grabkönigin (Massig, XL): aufrechter Sarkophag als Kleid; übertrieben: Sarkophag-Rumpf mit bemalter Maske; eisig und erhaben. | Königsriese (0,74) | Bogenschützen-Königin (11,0) | **generisch?** Silhouette wie Königsriese (IoU 0,74); gleiche Familie wie Königsriese |
| Grabstein | Grabstein (Bauwerk, M): Grabstein mit winkender Skeletthand; übertrieben: schiefer Grabstein mit Moos; unheimlich-witzig. | Schneemann (0,65) | Wächter (19,1) |  |
| Grabstein (Held) | Grabstein (Held) (Bauwerk, XL): Mausoleum mit Säulen und Krone über dem Tor; übertrieben: Krone über dem Portal; feierlich und unheimlich. | Koboldkäfig (0,83) | Walküre (12,0) | **generisch?** Silhouette wie Koboldkäfig (IoU 0,83); gleiche Familie wie Koboldkäfig |
| Turmwache (Prinzessinnenturm) | Turmwache (Prinzessinnenturm) (Schlank, S): Signalhorn am Schulterriemen; übertrieben: langer Turmbogen; aufmerksam, streng. | Skelett-Fallschirmjäger (0,77) | Skelett-Fallschirmjäger (10,9) | **generisch?** Silhouette wie Skelett-Fallschirmjäger (IoU 0,77); ähnliche Farben wie Skelett-Fallschirmjäger (Schema 10,9) |
| König (Königsturm) | König (Königsturm) (Dreieckig, S): Zinnenkrone wie ein kleiner Turm; übertrieben: runder Königsbauch im Hermelinmantel; gemütlich und stolz, im Schlaf mit Zipfelmütze. | Prinzessin (0,76) | Ballon (11,7) | **generisch?** Silhouette wie Prinzessin (IoU 0,76); gleiche Familie wie Prinzessin |
| Walküre | Walküre (Breit, M): Rad-Doppelaxt mit Speichen; übertrieben: Axt mit Radnabe, so breit wie sie; kampflustig, lacht beim Wirbeln. | Ritter (Held) (0,73) | Mini-P.E.K.K.A. (10,2) | **generisch?** Silhouette wie Ritter (Held) (IoU 0,73); gleiche Familie wie Ritter (Held) |
| Walküre (Held) | Walküre (Held) (Breit, L): Sturmflügelhelm mit goldenen Schwingen; übertrieben: Windbänder an der Axt; stürmisch. | Ritter (Held) (0,74) | Grabstein (Held) (13,0) | **generisch?** Silhouette wie Ritter (Held) (IoU 0,74); gleiche Familie wie Ritter (Held) |
| Läufer | Läufer (Geduckt, S): flatterndes Sprinter-Stirnband; übertrieben: extrem lange Knochenbeine; gehetzt, rudert mit den Armen. | General Gerry (0,59) | Bowler (Held) (20,5) |  |
| Mauerbrecher | Mauerbrecher (Geduckt, S): Pulverfass über dem Kopf mit glimmender Lunte; übertrieben: Fass größer als der Träger; begeistert, rennt kichernd. | Magieschütze (0,64) | Banditin (14,3) |  |
| Hexe | Hexe (Hochgewachsen, L): Krähe auf der Hutspitze; übertrieben: krummer, zweimal geknickter Hut; gackernd und verschlagen. | Nachthexe (0,72) | Hexenmutter (16,3) | **generisch?** Silhouette wie Nachthexe (IoU 0,72); gleiche Familie wie Nachthexe |
| Magier | Magier (Dreieckig, M): fliegendes, feuerspuckendes Zauberbuch; übertrieben: Ballonärmel; theatralisch, deklamiert. | Berserker (0,75) | Ballon (10,2) | Silhouette wie Berserker (IoU 0,75) |
| Magier (Held) | Magier (Held) (Dreieckig, L): Flammenumhang, der sich zu Flügeln öffnet; übertrieben: Feuerflügel im Flug; großspurig, hebt ab. | Ronin (0,74) | Mönch (11,0) | Silhouette wie Ronin (IoU 0,74) |
| Zappys | Zappys (Mechanisch, S): Glühbirnen-Kopf mit Wendelfaden; übertrieben: Batterie-Rucksack größer als der Rumpf; aufgekratzt, flackern beim Reden. | Turmwache (Prinzessinnenturm) (0,73) | Bowler (Held) (12,7) | Silhouette wie Turmwache (Prinzessinnenturm) (IoU 0,73) |

