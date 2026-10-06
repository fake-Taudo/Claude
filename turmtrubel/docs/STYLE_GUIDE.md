# Style Guide: Turmtrubel-Vektor-Look

Abgeleitet aus `docs/COMPARISON.md`.

- **Code-Quelle der Werte:** `client/js/design/` (JS) und `client/css/style.css` (`:root`). Die CSS-Variablen sind die gemeinsame Quelle für DOM und Canvas. Das JS liest sie über `client/js/ui/tokens.js` ein und ergänzt Werte, die nur der Canvas braucht (Licht, Sprite-Konturen, VFX).
- **Grundsatz:** eigenständige Vektorgrafik. Die Referenz gibt nur Orientierung für Hierarchie, Proportionen, Farblogik und Effektaufbau. Keine Formen, Icons oder Schriften werden übernommen.

---

## 1. Bildsprache

- **Geschlossene Formen, dicke dunkle Außenkontur, dünnere Innenlinien.** Die Außenkontur ist etwa 1,6× so dick wie die Innenlinien.
- **2–3 Farbtöne pro Fläche plus Verlauf:** Grundton, Schattenton (dunkler und kühler) und Lichtton (heller und wärmer).
- **Überzeichnete Silhouetten:** große Köpfe, große Waffen, kräftige Schultern. Lesbarkeit bei 20–40 px Figurenhöhe hat Vorrang vor Details.
- **Leicht schräge Draufsicht:** Bodenobjekte zeigen ihre Oberseite und ein Stück Vorderseite. Gebäude und Türme haben eine sichtbare Front (Höhe ≈ 0,6 × Grundfläche).
- **Farbe ist Information.** Teamblau und Gegnerrot sind für Teams reserviert. Gold steht für Belohnung und Hauptaktion, Magenta für Elixier.

## 2. Licht-Regel

Vorgabe aus dem Auftrag; sie gilt für Sprites, Türme, Arena und UI.

| Regel | Umsetzung |
|---|---|
| Licht von **oben links** | Flächenverlauf von oben links (Lichtton) nach unten rechts (Schattenton), Winkel 135°. Startpunkt bei 25 %/15 % der Pfad-Bounds, Endpunkt bei 85 %/95 % |
| Glanzlicht oben | Weiße Sichel oder Ellipse im oberen linken Drittel großer Flächen, Deckkraft 35–55 %, ohne Kontur |
| Dunkle Außenkontur | Konturfarbe `ink` (`#1c1830`); bei Teamfiguren in der Schattenhälfte leicht in den Teamton gemischt (8 %) |
| Rim-Light auf der Schattenseite | Schmale helle Kante unten rechts innerhalb der Form: Pfad versetzt (−0,06 U, −0,06 U), auf die Form geclippt, 2 px, Farbe Lichtton bei 45 % |
| Weicher Bodenschatten | Radialer Verlauf (Mitte `rgba(10,14,28,.38)` → Rand 0), Ellipse 1 : 0,42, Versatz **nach unten rechts** (+0,10 r / +0,05 r), einmal je Größe gecacht |

**Bewusste Abweichung von der Referenz:** Dort fallen die Schatten nach unten links. Wir folgen der Vorgabe „Licht von oben links“, die Schatten fallen also nach unten rechts.

## 3. Farben (Tokens)

### Teams

| Token | Hell (300) | Grund (500) | Dunkel (700) | Tief (900) | Glanz |
|---|---|---|---|---|---|
| `team-blue` | `#9cc8ff` | `#3d8bff` | `#1f5fc9` | `#0f3a85` | `#e3f0ff` |
| `team-red` | `#ffb0b5` | `#ff4d57` | `#c42233` | `#7a1020` | `#ffe3e5` |

### Akzente

| Token | 300 | 400/500 | 600/700 | 800/900 |
|---|---|---|---|---|
| `gold` | `#ffe066` | `#ffd84d` | `#f5a623` | `#b86b0b` |
| `elixir` | `#ff9af0` | `#d13cf0` | `#8a1fb5` | `#4d0d6b` |
| `green` | `#7fe38a` | `#5ad16a` | `#2e9a43` | `#1c6b2c` |
| `crown` (Kronen-Gold) | `#fff3a0` | `#ffcf33` | `#e09a12` | `#8a5a06` |

### Neutral und Oberflächen

Die UI wechselt von Creme auf Nachtblau. Creme bleibt nur für Info-Plaketten, Eingabefelder und Sprechblasen.

| Token | Wert | Verwendung |
|---|---|---|
| `night-950` | `#0b0f2a` | tiefster Hintergrund, Modal-Backdrop (60 %) |
| `night-900` | `#111842` | Mulden (vertiefte Flächen) |
| `night-800` | `#17205a` | Panel unten, Hand-Panel |
| `night-700` | `#1e2b72` | Panel-Körper |
| `night-600` | `#283a8f` | Panel oben, inaktive Tabs |
| `night-500` | `#3652b3` | Fase hell, aktive Tabs |
| `night-300` | `#93a9f2` | Lichtkante (2 px innen oben) |
| `bg-top` → `bg-bottom` | `#2c3c9e` → `#1a1c5c` → `#120e3a` | Screen-Hintergrund (Verlauf von oben nach unten, dazu dezentes Rautenmuster mit 5 % Deckkraft) |
| `ink-900` | `#1c1830` | Konturen, Schatten-Lippen |
| `on-dark` / `on-dark-muted` | `#ffffff` / `#c9d3ff` | Text auf Nachtblau |
| `surface-cream` | `#fdf6e3` | Plaketten, Eingabefelder, Sprechblasen |

### Seltenheiten

Rahmen und Bänder.

| Seltenheit | Grund | Licht | Schatten | Besonderheit |
|---|---|---|---|---|
| gewöhnlich | `#9fb3c8` | `#dfe9f5` | `#5f7590` | — |
| selten | `#f39c3d` | `#ffd29a` | `#b0611a` | — |
| episch | `#b55cf0` | `#e3b8ff` | `#6f2aa8` | — |
| legendär | `#2fd3c6` | `#b8fff7` | `#178a86` | Verlauf Türkis → Violett → Rosa (schillernd) |
| Champion | `#ffd84d` | `#fff3a0` | `#c08a10` | Kronen-Kerbe oben |
| Held | `#ff7a5c` | `#ffc2b0` | `#b8432b` | Stern-Kerbe oben |
| Evo | `#e04cff` | `#ffb8ff` | `#7a1fb5` | Leuchtrahmen (Glow 6 px, pulsierend), Evo-Kappe mit Kristallen |

### Effekt-Paletten

Kern → Mitte → Rand → Nachhall.

| Element | Farben | Blending |
|---|---|---|
| Feuer | `#fff6c8` → `#ffc23d` → `#ff6a2b` → `#c2301f`; Rauch `#4a3a33` → `#7d6d63` | Kern additiv, Rauch normal |
| Eis | `#ffffff` → `#d4f4ff` → `#74d6ff` → `#2a8fd6` | Glanz additiv, Kristalle normal |
| Elektro | `#ffffff` → `#bff4ff` → `#4fc3ff` | additiv |
| Gift | `#e2ff8a` → `#9ad44f` → `#5a9a2b` → `#2f4a1f` | normal, Blasen-Glanz additiv |
| Heilung | `#fffbe0` → `#ffe066` → `#9dff8a` | additiv |
| Wut | `#ffd0ff` → `#e07bff` → `#a03ad0` | additiv + normaler Bodenkreis |
| Leere, Fluch | `#e6d0ff` → `#9a5cf0` → `#4a1c8a` → `#1a0a33` | Kern normal (dunkel), Rand additiv |
| Erde | `#f0d29a` → `#c08a50` → `#7a5230` | normal |
| Elixier | `#ffd0fb` → `#ff9af0` → `#d13cf0` | additiv |
| Gold, Belohnung | `#fffbe0` → `#ffe066` → `#f5a623` | additiv |

**Lesbarkeit:** Bodenkreise von Zaubern tragen am Rand die **Teamfarbe** des Wirkers (eigen blau, Gegner rot), Strichstärke 0,08 Felder. Die Effektfarbe füllt die Fläche.

## 4. Konturen, Radien, Abstände, Schatten

| Token | Wert | Verwendung |
|---|---|---|
| `stroke-thin` | 1,5 px | Innenlinien UI, Trenner |
| `stroke-mid` | 3 px | Standard-Kontur UI (Knöpfe, Panels, Karten) |
| `stroke-thick` | 5 px | große Plaketten, Logo, Banner |
| Sprite-Außenkontur | `clamp(1.4px, 0.10·U, 4px)` | U = Figurmaßstab in px |
| Sprite-Innenlinie | 0,6 × Außenkontur | Details |
| Radien | `xs 6`, `s 10`, `m 16`, `l 24`, `pill 999` px | Abzeichen, Knöpfe, Panels, Modals |
| Abstände | 4er-Raster: 4, 8, 12, 16, 24, 32, 48 px | überall |
| Lippe (3D-Tiefe) | 5 px (groß), 3 px (klein) in der Dunkelstufe der Fläche | Knöpfe, Karten, Kacheln |
| Schlagschatten weich | `0 10px 24px rgb(10 6 30 / .35)` | Panels, Modals |
| Innenschatten Mulde | `inset 0 4px 0 rgb(0 0 0 / .30)` | vertiefte Flächen |
| Touch-Ziel | ≥ 44 px | alle Bedienelemente |

## 5. Z-Ebenen

**DOM:** arena 0 · fx 10 · hud 20 · hand 30 · modal 50 · toast 55 · overlay 60

**Canvas** (Zeichenreihenfolge):
1. Boden-Cache
2. Wasser-Animation
3. Boden-Decals (Brandflecken, Risse, Elixier-Spritzer)
4. Bodenzonen und Zauberkreise
5. Schatten (gebündelt)
6. Trümmer
7. Einheiten am Boden (nach y sortiert)
8. Boden-VFX (normal)
9. Luft-Einheiten
10. Projektile mit Trails
11. VFX normal (Rauch, Splitter)
12. VFX additiv (Feuer, Funken, Blitze, Glow)
13. Abzeichen und LP-Balken
14. Schadenszahlen und Texte
15. Geister, Marker, Emotes
16. Bildschirm-Flash
17. HUD
18. gezogene Karte

## 6. Typografie

- **Display:** **Lilita One** (SIL Open Font License, lokal über `@fontsource/lilita-one`). Für alle Überschriften, Zahlen, Knopftexte und Canvas-Texte.
- **Fließtext:** **Nunito** 600–900 (SIL OFL, lokal). Für Beschreibungen, Hinweise und Listen.
- Display-Text steht immer mit Kontur `ink-900`, Stärke 12 % der Schriftgröße (min. 2 px), und Schlagschatten `0 / 6 %` der Schriftgröße in `rgb(0 0 0 / .35)`. Im Canvas läuft das über den Text-Sprite-Cache (`canvastext.js`), im DOM über `-webkit-text-stroke` + `paint-order` + `text-shadow`.

| Stufe | Größe | Verwendung |
|---|---|---|
| `display-xl` | 64 px | Sieg/Niederlage, Countdown |
| `display-l` | 40 px | Screen-Titel, Banner |
| `display-m` | 28 px | Panel-Titel, Timer |
| `display-s` | 20 px | Knopftexte, Kartennamen groß |
| `label` | 16 px | Chips, Tabs |
| `caption` | 12–14 px | Hinweise (Nunito 800) |

**Zahlen:** immer tabellarisch (`tnum()` im Canvas, `font-variant-numeric: tabular-nums` im DOM). Zahlen von Gegner-Werten sind hellrot (`team-red-300`), eigene hellblau (`team-blue-300`) oder weiß.

## 7. Komponenten

### Mehrstufiger 3D-Knopf

Schichten von hinten nach vorn:
1. Kontur 3 px `ink`
2. Lippe 5 px (Dunkelstufe)
3. Körper mit Verlauf (Licht → Grund)
4. Glanzband in der oberen Hälfte (weiß 35 % → 0)
5. Lichtkante 2 px innen oben (weiß 45 %)
6. Text weiß mit Kontur und Schatten

| Rolle | Licht | Grund | Lippe |
|---|---|---|---|
| primär (Gold) | `#ffe680` | `#ffc22e` | `#b86b0b` |
| sekundär (Blau) | `#7cc0ff` | `#2f7de0` | `#1a4fa8` |
| Erfolg (Grün) | `#9cf0a6` | `#38b04e` | `#1c6b2c` |
| Gefahr (Rot) | `#ff9a9a` | `#e5484d` | `#9c1f2a` |
| Akzent (Lila) | `#e0b0ff` | `#9b4ee0` | `#5a1f99` |
| neutral | `#f4f6fb` | `#c9d0e2` | `#7d86a3` |

| Zustand | Darstellung |
|---|---|
| normal | wie oben |
| Hover | Helligkeit +6 %, 1 px hoch |
| gedrückt | Lippe 1 px, Körper 4 px nach unten, 80 ms |
| deaktiviert | Grau-Verlauf `#b7bdcc` → `#9aa1b3`, Text 70 %, kein Glanz |
| Laden | Text 60 %, rotierender Ring links, Klick gesperrt |

### Weitere Komponenten

- **Panel:**
  - Körper-Verlauf `night-600` → `night-800`
  - Kontur 3 px `ink`
  - Lichtkante oben 2 px `night-300` bei 40 %
  - Innenschatten unten
  - Titel-Band optional als Plakette
- **Mulde:** `night-900` mit Innenschatten oben, Radius m. Hält Karten, Zahlen und Listen.
- **Tabs:** Aktiv ist heller (`night-500`), oben gerundet, mit Glanz; inaktiv dunkler (`night-700`), 3 px tiefer, ohne Glanz.
- **Karte (UI und Hand):**
  1. Seltenheitsrahmen (Außen 2 px `ink`, 3–4 px Seltenheitsverlauf, Innenkante 1 px Licht)
  2. Bild mit Innenschatten oben 6 %
  3. Namensband unten in Seltenheitsfarbe
  4. Kosten-Tropfen oben links, ragt 15 % hinaus
  5. Evo-Kappe oben mittig
  6. Champion- und Held-Kerbe
- **Abzeichen:**
  - Einheiten: abgerundetes Quadrat, Teamfarbe, 2 px weißer Rand, 1,5 px Kontur, Zahl weiß.
  - Turm: Kronen-Schild in Gold (eigene Silhouette: Schild mit drei Zacken).
  - Farbenblind-Modus: Gegner-Abzeichen als Schild mit Spitze unten.
- **LP-Balken:**
  - Track `night-900`, Füllung in Teamfarbe mit Glanzband (oberes Drittel heller), weißer Nachzieher.
  - Kontur 1,5 px.
  - Bei vollem Leben ausgeblendet (Fade 200 ms).
  - Turm-Balken immer sichtbar.
- **Sprechblase:** Creme-weiß, Kontur, Zipfel, Pop-Einblendung.
- **Icons:** eigene SVG- bzw. Canvas-Pfade, 24er-Raster, Kontur 2,5 px, gefüllt mit 2 Tönen. Emojis werden in der UI ersetzt.

## 8. Bewegung und Easing

Die zentrale Bibliothek liegt in `client/js/design/easing.js`; dieselben Kurven stehen in CSS.

| Name | Kurve | Einsatz |
|---|---|---|
| `outCubic` (`--ease-out`) | `cubic-bezier(0.22, 1, 0.36, 1)` | Standard für Bewegung und Einblenden |
| `backOut` (`--ease-pop`) | `cubic-bezier(0.34, 1.56, 0.64, 1)`, s = 1,7 | Pop, Einrasten, Kronen |
| `elasticOut` | Feder (Periode 0,3) | Banner, große Zahlen, Belohnung |
| `inOutSine` | Sinus | Idle-Wippen, Pulsieren |
| `outExpo` | expo | Shockwaves, Flash-Abbau |

| Dauer | Wert |
|---|---|
| press | 80 ms |
| fast | 120 ms |
| base | 220 ms |
| pop | 260 ms |
| screen | 320 ms |
| slow | 420 ms |
| banner | 1200 ms |

**VFX-Zeitstaffelung:**
- Vorlauf 80–200 ms
- Kern 100–400 ms
- Nachhall 300–1000 ms
- Bewegungen nie linear; Partikel nutzen Lebensdauer-Kurven für Größe, Alpha und Farbe.

**Reduzierte Bewegung** (`prefers-reduced-motion` oder Einstellung):
- kein Shake, kein Hit-Stop
- Flash nur als kurzes Abdunkeln (≤ 10 %)
- keine Parallaxe
- Pop wird zum Einblenden

## 9. Figuren-Archetypen

Alle Figuren werden einmal je Look, Team, Evo, Richtung, Frame und Pixelgröße gerendert und gecacht. Animation entsteht aus wenigen gecachten Schlüsselbildern plus prozeduralem Squash, Stretch und Wippen beim Kopieren.

| Archetyp | Silhouette | Idle | Laufen | Angriff |
|---|---|---|---|---|
| Nahkämpfer | breite Schultern, große Waffe | Wippen 1,2 s | 2 Frames Bein/Arm, Hüpfer | Ausholen (Frame A, 0,2 s) → Schlag (Frame B) mit Schwungbogen |
| Fernkämpfer | Waffe nach vorn, schmaler | Wippen | 2 Frames | Anlegen → Schuss mit Mündungsblitz |
| Schwarm | klein, Kopf 50 % | — | 2 Frames, schneller | wie Nahkampf, Effekte gebündelt |
| Tank | massig, Kopf klein | langsames Atmen | 2 Frames, Bodenstaub | Wuchtschlag, Mini-Shake |
| Flieger | Flügel, Schatten weit unten | Flügelschlag 2 Frames | Flügelschlag | wie Fernkampf |
| Belagerer | Maschine, Rad oder Fass | — | Räder drehen (prozedural) | Rückstoß |
| Gebäude | Sockel + Aufbau, Front sichtbar | Fahne oder Licht pulsiert | — | Rückstoß, Mündungsblitz |
| Zauber-Icon | rundes Symbol mit Glanz | — | — | — |

**Richtung:**
- Figuren, die sich nach oben bewegen (vom Spieler weg), zeigen die **Rückansicht**, also keine Augen, Hinterkopf, Umhang und Rückenteile.
- Nach unten zeigen sie die Vorderansicht.
- Links/rechts entsteht durch Spiegeln beim Kopieren.

## 10. VFX-Katalog (Regeln)

1. **Jeder Zauber hat ein eigenes Preset** aus Vorlauf, Kern und Nachhall, dazu einen Bodenkreis mit Teamfarben-Rand für die Wirkungsdauer.
2. **Additives Leuchten** nur für Licht (Feuerkern, Funken, Blitze, Heil- und Elixierglanz). Rauch, Splitter und Decals werden normal geblendet.
3. **Grenzen je Qualitätsstufe:**
   - Partikel: hoch 900, mittel 500, niedrig 220
   - Decals: 24 / 12 / 6
   - Trails: 40 / 24 / 10
4. **Prioritäten:**
   - Gameplay-relevant (Zauberradius, Treffer am Turm) > Wucht (Explosion) > Deko (Funken, Ambiente)
   - Bei Überlast wird Deko zuerst gekappt.
5. **Schwärme:** Todes- und Treffereffekte gleichartiger Ereignisse im selben Frame werden zu einem Effekt zusammengefasst.
6. **Wucht-Werkzeuge:**
   - Bildschirm-Wackeln (leicht 0,08, mittel 0,18, schwer 0,35 Felder; 150–450 ms; exponentieller Abbau; Regler 0–1 in den Einstellungen)
   - Hit-Stop 30–70 ms (nur Turmzerstörung und schwere Einschläge; nur Darstellung)
   - Bildschirm-Flash ≤ 25 % für 80 ms

## 11. Schnittstellen

Sie werden vor der Umsetzung festgelegt.

### Design-Tokens

**Modul:** `client/js/design/tokens.js`. Es exportiert `C` (Farben aus §3), `STROKE`, `RADIUS`, `SPACE`, `Z`, `DUR`, `LIGHT` (Licht-Regel als Parameter) und `RARITY` (Rahmenfarben).
- CSS-Werte kommen über `ui/tokens.js`.
- Canvas-spezifische Werte stehen im Modul.

### VFX-Ereignisse

Semantische Namen, die `game.js` aus Server-Ereignissen ableitet. Das Protokoll bleibt unverändert, neue Namen entstehen nur im Client.

| Gruppe | Ereignisse |
|---|---|
| Einheiten | `unit.deploy`, `unit.deploy.heavy`, `unit.swing`, `unit.muzzle`, `unit.hit`, `unit.hit.heavy`, `unit.death`, `unit.death.flying` |
| Gebäude | `building.death` |
| Projektile | `proj.impact.<art>` (clientseitig erkannt: Projektil-ID verschwindet) |
| Zauber | `spell.<fx>` für arrows, fire, comet, shock, storm, frost, poison, heal, rage, clone, mirror, tornado, quake, curse, void, vines, log, barrelRoll, barrel, crate, snow, grave |
| Explosionen | `blast.<art>` |
| Türme | `tower.hit`, `tower.hit.heavy`, `tower.damage.<stufe>`, `tower.destroy`, `king.awake` |
| Fähigkeiten, Evo | `ability.activate`, `evo.deploy` |
| Elixier und Phasen | `elixir.collect`, `phase.battle`, `phase.double`, `phase.triple`, `phase.overtime`, `phase.win`, `phase.lose` |

### Preset-Format

`client/data/vfx-presets.json`, per `fetch` geladen und beim Laden validiert.

```json
{
  "spell.fire": {
    "layers": {
      "pre":  [{ "type": "decal", "shape": "target", "color": "team", "life": 0.18 }],
      "core": [{ "type": "flash", "radius": 1.2, "color": "#fff6c8", "life": 0.12, "blend": "add" },
               { "type": "burst", "count": 28, "shape": "fire", "speed": [2, 6], "life": [0.25, 0.5],
                 "size": { "from": 0.35, "to": 0.05, "ease": "outCubic" }, "colors": ["#fff6c8", "#ffc23d", "#ff6a2b"], "blend": "add" },
               { "type": "ring", "radius": 1.0, "width": 0.25, "color": "#ffd29a", "life": 0.35, "ease": "outExpo" },
               { "type": "shake", "strength": "medium" }],
      "post": [{ "type": "burst", "count": 10, "shape": "smoke", "life": [0.6, 1.0], "colors": ["#4a3a33", "#7d6d63"] },
               { "type": "decal", "shape": "scorch", "life": 2.0 }]
    },
    "delays": { "pre": 0, "core": 0.1, "post": 0.18 },
    "scaleWith": "radius"
  }
}
```

- **Schicht-Typen:** `burst` (Partikel), `emitter` (Dauer-Emitter), `ring` (Shockwave), `flash`, `glow`, `decal`, `bolt` (Zickzack-Blitz), `trail`, `shake`, `hitstop`, `text`.
- **Größen** in Feldern, **Zeiten** in Sekunden.
- **Farben:** `"team"` steht für die Teamfarbe des Auslösers, `"enemy"` für die Gegnerfarbe.

### Sprite-Cache

- **API:** `spriteCache.get(kind, look, { team, evo, dir, frame, px, dpr })` liefert `{ canvas, ox, oy }`.
- **Schlüssel:** `kind|lookKey|team|evo|dir|frame|round(px·dpr)`.
- **Speicher:** LRU mit Budget in Megapixeln je Qualitätsstufe; Erzeugung lazy, höchstens N neue pro Frame (Rest im nächsten Frame, bis dahin direktes Zeichnen).

### Asset-Manifest

`client/js/design/manifest.js` listet Archetypen, Körper, Waffen, Hüte, Gebäude, Turm-Teile und Icons mit ihren Zeichenfunktionen und Standardgrößen. Es dient dem Vorrendern im Ladescreen und dem Bericht.

### skin.json (Erweiterung, abwärtskompatibel)

Pro Karte zusätzlich optional:
- `fx: { "preset": "<name>", "tint": "#rrggbb" }`: eigenes oder umgefärbtes VFX-Preset
- `archetype`: Archetyp-Override für Animationen

Fehlende Felder fallen wie bisher auf das Original zurück.
