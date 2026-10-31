# Systemkarte Staubmond (Logik)

Stand: `index_audit_original.html` = `index.html` vor Phase B (Commit 4aad8fa). Zeilenangaben beziehen sich auf diese Datei. Das Hauptskript steht in `<script type="text/plain" id="sm-main">` und wird nach dem ersten Frame ausgeführt; alle Module sind globale `const`-Objekte.

## 1. Module

| Modul | Zeilen | Aufgabe | eigener Zustand |
|---|---|---|---|
| `CONFIG`, `TXT` | 1563–1896 | Balancing-Werte, Texte | unveränderlich |
| `U`, `Bus`, `Prof` | 1966–2064 | Mathe, Hash/Rauschen, Formatierung (`U.big`, `U.kg`, `U.pct`), Ereignis-Bus | – |
| `World` | 2074–2737 | Karte, Chunks, Staub, Sektoren, Fundstücke, Putzen (`stroke`), Meteorstaub | `chunks[]`, `cleanable`, `chunkClean`, `secClean/secCleanable/secKnown/secProgress/secDone`, `glanzSum`, Caches, `dirtySave/dirtyTex/dirtyMap`, `bridgeCells`, `rnd` |
| `Economy` | 2742–2867 | Preise, Forschungseffekte, Verkauf, Gutschrift, Abbuchung, Einnahmen-Fenster, Nachfrage, Lizenzen | `fxCache`, `incBuckets`, `incSec` |
| `Move`, `Player`, `Vehicles` | 2873–3129 | Kollision, Laufen, Werkzeug, Behälter, Fahrzeuge, Herbeirufen | `Player.load`, `Player.veh`; `Vehicles.list[].load/up/incoming/garage` |
| `Buildings` | 3135–3646 | Bauen/Abreißen/Rückgängig, Bänder, Depots, Rampen, Maschinen, Verteiler, Funknetz | `list`, `map`, `occ`, `belts`, `active`, `undo`, `coverage`, `online` |
| `Settings`, `Input`, `Actions` | 3660–3942 | Einstellungen, Eingabe → Absicht, Kontextaktionen | `Input.keys/joy/mouse/intent` |
| `Camera`, `Renderer`, `VFX`, … | 3947–6700 | Darstellung (liest Logik, schreibt nur Optik) | – |
| `Robots` | 6704–6966 | Kauf/Verkauf, Zuweisung, Bahnen, Nah-/Fernmodus, Abliefern, Offline-Schritte | `list`, `assigns`, `tick`, `offlineMode`, `offlineKg` |
| `Progression`, `Fx` | 6988–7218 | Sektorabschluss, Fundstücke, Tag/Nacht, Events, Aufträge, Tutorial, Ende; fliegende Meteore | `rates`, `carpetSecs`, `tutFlags`, `Fx.meteors` |
| `Build` | 7223–7426 | Baumodus (Vorschau, Bänder ziehen) | `active`, `sel`, `ghost`, `path` |
| `UI` | 7429–9262 | HUD, Panels, Karte (liest Logik, ruft `Shop` über `UI.act`) | Anzeige-Caches |
| `Save` | 9398–9560 | IndexedDB/localStorage, Kern + Chunks, Backups, Migration, Export/Import | `saving`, `timer`, `soonT`, `count`, `fallback` |
| `Shop` | 9566–9651 | alle zustandsändernden Befehle (UI, Tastatur, Koop) | – |
| `Net` | 9654–10101 | Koop (host-autoritativ) | `role`, `peers`, `tr` |
| `Game` | 10105–10303 | Start, Hauptschleife, Tick, Laden, Offline, neue Mission | `state`, `acc`, `paused` |
| `Debug` | 10362– | Pacing-Simulation, Zeitraffer | `timeScale` |

## 2. Spielzustand `G` (serialisiert) – wer schreibt, wer liest

| Feld | schreibt | liest |
|---|---|---|
| `money` | nur `Economy.sell/grant/spend` (2812–2831) | Shop, UI, Build-Vorschau |
| `t`, `day` | `Game.tick` (+dt), `Progression.update` (`day`), `Game.offline` | alle Zeitgeber |
| `licence` | `Economy.buyLicence` | `World.updateLocks`, Shop, Robots.fleetCap |
| `tools`, `tool`, `up` | `Shop.tool/upgrade` | Economy |
| `research`, `fp` | `Shop.research`; FP: `Progression.sectorDone/onFind/checkOrders` | `Economy.fx` (Cache `fxCache`) |
| `player` | `Player.save` (nur beim Speichern) | `Player.init` |
| `vehicles`, `buildings`, `belts`, `robots`, `assigns` | jeweils `*.save()` in `Save.coreJSON` | `*.init()` beim Laden |
| `finds` | `World.cellCleaned` | Progression, UI |
| `secDone` (Liste) | `Progression.sectorDone` | `Game.startWorld` → `World.secDone` |
| `chunkStats` | `Save.coreJSON` aus `World.cleanable/chunkClean` | `Game.startWorld` |
| `stats.*` | verteilt (siehe 5/6), `builtBy` über Bus `built/beltsBuilt`, Shop.robot | Aufträge, UI |
| `orders`, `orderSeq`, `swapsUsed`, `swapHour` | `Progression.fillOrders/checkOrders/swapOrder` | UI |
| `demand` | `Economy.updateDemand` | `Economy.demandMul`, UI |
| `ev` (Meteor/Wind/Inspektion/Nacht) | `Progression.events/update` | Robots.speed, UI |
| `avgVal` | `Economy.sell` (gleitend) | `Game.offline` |
| `lastReal`, `saved` | `Save.coreJSON` | `Game.offline` (Systemuhr) |

Nicht gespeichert, aber logikrelevant: `Buildings.prog` (Maschinen-Fortschritt), `World.rnd` (Rundungs-Zufall), `Math.random`-Zustand, `Fx.meteors` (fliegende Meteore), `Buildings.undo`, `Economy.incBuckets`, `Progression.rates`, `Robots.near/far`.

## 3. Ablauf pro Frame und Tick

`Game.loop` (10251): Bildzeit ≤ 250 ms; feste Ticks `STEP = 1/60 s`, höchstens 8 × `Debug.timeScale` pro Bild, Überhang wird verworfen. Danach nur Darstellung (Camera, VFX, Renderer, UI).

`Game.tick(dt)` (10275), Reihenfolge:
1. `Actions.run` (leere Warteschlange, Aktionen laufen sofort)
2. `Input.poll` → Absicht `{mx, my, clean, aimX, aimY}`
3. Koop-Client: nur `Net.update` (Host rechnet)
4. `G.t += dt`
5. `Player.update` (Laufen/Fahren, Putzen → `World.stroke`, `takeCol`)
6. `Vehicles.update` (Lieferungen, Ausrollen)
7. `Buildings.update` (Bänder, dann alle Gebäude: Depots, Rampen, Maschinen, Ausgänge, Verteiler; Funknetz bei Bedarf)
8. `Robots.update` (nah: jeder Tick; fern: Gruppe `i % 6` alle 6 Ticks mit 6·dt)
9. `Progression.update` (Tag/Nacht, Nachfrage, Events; alle 0,5 s Aufträge/Tutorial/Ende)
10. `World.processPending(1,2 ms)` (Chunk-Statistik nachrechnen)
11. `Save.update` (Autosave 30 s, `soon` 1,5 s)
12. `Audio.update`, `Net.update`, `Game.effects` (optisch)

## 4. Ereignisse (Bus)

| Ereignis | ausgelöst in | Abnehmer |
|---|---|---|
| `collect` | Player.takeCol, Vehicles.drive | (Statistik/Tutorial) |
| `unload` | Player.unloadTo | Tutorial-Flag, Payday (Optik) |
| `launch` | Buildings.launch/updateRamp | Net, Audio, Payday |
| `sold`, `grant`, `spend` | Economy | HUD-Geldanimation (`grant` außer `refund`) |
| `built`, `beltsBuilt` | Buildings.place/placeBeltPath | **`G.stats.builtBy` (+1, nie −1)** |
| `removed` | Buildings.remove | Actors (Optik) |
| `licence` | Economy.buyLicence | Save.soon, updateDemand, Urkunde |
| `research`, `purchase`, `vehicleBought`, `robotBought`, `assigned`, `enter`, `exit`, `vehicleArrived`, `find`, `sectorDone`, `orderDone`, `produced`, `coverage`, `night`, `settings`, `profile`, `touchmode` | jeweilige Module | UI/VFX/Audio |

## 5. Alle Stellen, die Geld verändern

Schreibzugriffe auf `G.money` gibt es nur in `Economy.sell` (2820), `Economy.grant` (2828), `Economy.spend` (2831).

- **sell** (Ware × Wert × Nachfrage × Multiplikator, Rampe × Rampenbonus): `Buildings.launch` (3546, Depot/Außenposten), `Buildings.updateRamp` (3559).
- **grant**: Sektorprämie (7003, 7000 offline), Fundstück (7017), Inspektion (7060), Auftrag (7147), Tutorial (7176), Offline-Erlös (10224), **Erstattungen** `refund`: Abriss (3302), Rückgängig (3336, 3347, 3358), Band-Abriss (3379), Band-Umbau billiger (3398), Roboterverkauf (6743).
- **spend**: Werkzeug/Upgrade/Fahrzeug/Fahrzeug-Upgrade/Roboter/Roboter-Upgrade/Lizenz (Shop 9575–9617, Economy.buyLicence), Bauen (3280, 3397), Rückgängig von Abriss/Bandabriss (3334, 3352), Fahrzeug herbeirufen (3097).
- `grant` erhöht immer auch `stats.moneyEarned` und das Einnahmen-Fenster (`track`) – auch bei Erstattungen.

## 6. Alle Stellen, die Staubzellen verändern

- `World.stroke` (2602): einzige Stelle, die `chunk.dust` und `chunk.meteor` verringert. Aufrufer: `Player.update` (2988), `Vehicles.drive` (3088), `Robots.cleanAlong` (6866, Fern-/Offline mit `full`), `Net.hostData` (9807, 9813, Koop-Mitspieler).
- `World.addMeteor` (2711): erhöht nur `chunk.meteor` (Meteorschauer über `Fx.updateMeteors` 7209).
- `World.applyChunk` (2688): Koop-Client übernimmt Chunks des Hosts.
- `Save.decodeChunk`/`Game.startWorld` (10189): Chunks aus dem Spielstand.
- Zähler: `World.cellCleaned` (2698) erhöht `chunkClean`, `secClean`, `stats.cells`, prüft Fundstücke und ruft `updateSector` (Sektorabschluss genau einmal über `secDone`).

## 7. Alle Stellen, die speichern oder laden

- Speichern: `Save.saveNow` (9469) ← `Save.update` (Autosave 30 s, `soon` 1,5 s nach Sektor/Lizenz/Offline/Ende), `Game.toMenu`, `visibilitychange` (hidden), `pagehide`, `beforeunload`, `Game.newGame` (voll). Kern (`core` 's<slot>', alle 4 Speicherungen zusätzlich Backup 's<slot>b<n>') in einer Transaktion, danach geänderte Chunks (`dirtySave`) in 64er-Paketen mit `await` dazwischen.
- Laden: `Game.loadGame` → `Save.loadSlot` → `bestCore` (Hauptdatensatz, sonst jüngstes gültiges Backup) → `migrate` → alle Chunks des Platzes → `Game.startWorld` → `Game.offline`.
- Platz löschen: `Save.deleteSlot` (Menü „Löschen“, `Game.newMission`, Import). **Nicht** bei „Neu“ auf belegtem Platz.
- Export/Import: `Save.exportSlot` / `Save.importDialog`.
- Einstellungen: `Settings.save` (localStorage, getrennt vom Spielstand).

## 8. Doppelte Berechnungen (Anzeige gegen Logik)

| Größe | Logik | Anzeige | Ergebnis |
|---|---|---|---|
| Verkaufspreis/kg | `Economy.sell` | Kapsel-Tab `renderCapsule` (8561): `value × demandMul × incomeMul` | gleich (D-08) |
| „Einnahmen-Multiplikator“ | `incomeMul` | Kapsel-Tab | gleich, ohne Nachfrage (D-08) |
| Upgrade-/Werkzeug-/Fahrzeugpreis | `Economy.upPrice/toolPrice`, `Shop.vehicle` | HUD-Ziel `nextGoal` (7746), Terminal | gleich (E-12) |
| „Es fehlen X ₥“ | – | `Shop.miss`, `Economy.canBuyLicence`, Build-Vorschau: `U.money(p − money)` | abgerundet statt aufgerundet (E-06) |
| Sektorfortschritt | `World.secProgress` | HUD-Ring, Karte, Auftrag `orderNums` | gleiche Quelle (G-11) |
| Auftragsfortschritt | `Progression.orderProgress` | HUD-Ziel, Memo-Balken | gleiche Funktion |
| Lizenz-Ziel | `Economy.canBuyLicence` | HUD `goalList` (50 % Sektoren + 50 % Geld) | Bedingungen gleich (E-13) |
| Einnahmen/Min. | `Economy.incomePerMin` | HUD | Fenster 60 s, enthält Erstattungen (E-09, E-11) |
| Band-Durchsatz | `Buildings.update` | Beschreibung 10/30/90 kg/s | 35–89 % des Nennwerts (P-04) |
| Fahrzeugwerte | `Vehicles.cap/maxSpeed/width` | Fahrzeugshop zeigt CONFIG-Grundwerte | Anzeige ohne Forschung (V-05) |
| Erstattung beim Abriss | `Buildings.remove` (aktueller Preis) | `Actors.onRemoved(b, Buildings.price)` | gleich, aber ≠ bezahlter Preis (B-08) |

## 9. Doppelter Zustand

| Information | Orte | konsistent? |
|---|---|---|
| Sektor fertig | `World.secDone[]`, `G.secDone`, `G.stats.sectors` | ja (Invariante nach jedem Schritt) |
| Fundstücke | `G.finds`, `G.stats.findsFound` | ja |
| Chunk-Statistik | `World.cleanable/chunkClean` ↔ gespeicherte `G.chunkStats` ↔ Chunk-Daten | **nein** bei S-02, S-03, S-04, S-07, S-11 |
| Gebäudebelegung | `Buildings.list` ↔ `occ`-Karte ↔ `World.bridgeCells` | ja |
| Fahrzeug in Garage | `v.garage` ↔ Garage existiert | **nein** nach Rückgängig (B-14) |
| Roboter-Hangar | `r.hangar` ↔ Hangar existiert | **nein** nach Rückgängig (B-12) |
| Spielerposition mit Schubkarre | `Player.x/y` ↔ `veh.x/y` | **nein** nach Laden (V-06) |

## 10. Zeitbasen

- Spielzeit `G.t` (feste 60-Hz-Ticks): Erdnachfrage, Meteor, Sonnenwind, Inspektion, Auftragstausch (`swapHour = floor(G.t/3600)`), Kapsel-Abklingzeit, Fahrzeuglieferung, Rampenintervall, Einnahmen-Fenster.
- Systemuhr `Date.now()`: nur Offline-Dauer (`G.lastReal`) und Zeitstempel der Speicherstände.
- `performance.now()`: Koop-Zeitüberschreitung, Budgets.

## 11. Zufall

- Weltgenerierung: deterministisch aus dem Seed (`U.hash`, `U.rng`).
- Putz-Rundung: `World._rand` (Xorshift `World.rnd`, nicht gespeichert, nicht zurückgesetzt).
- `Math.random()` in der Logik: Nachfrage-Staubart (2848), Meteor/Wind/Inspektion-Zeitpunkte und Meteorpositionen (7053–7075), Aufträge (7111–7130), Startposition gekaufter Roboter (6738), Seed neuer Missionen (10230), Koop-Code. Dasselbe `Math.random` nutzen Musik/Klänge (9278–9386) und eine Partikelentscheidung in `Robots.update` (6956).
- Optik: eigener Effekt-Zufall `VFX.r`.
