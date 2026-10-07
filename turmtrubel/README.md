# Turmtrubel

**Turmtrubel** ist ein 1v1-Echtzeit-Kartenspiel für den Browser: zwei Lanes, ein Fluss mit zwei Brücken, drei Türme pro Seite, Elixier, Karten ziehen und platzieren. Gespielt wird mit den **echten Clash-Royale-Karten** (Namen, Elixier, Seltenheit, Typ und Werte wie im Original, Turnierstandard Level 11), alle von Anfang an freigeschaltet. Grafik und Ton sind eigene Entwürfe und werden komplett im Code erzeugt; es gibt keine kopierten Original-Assets und keine Bild- oder Audiodateien.

> Privates Hobbyprojekt, nicht mit Supercell verbunden. Clash Royale ist eine Marke von Supercell. Die Kartenwerte stammen aus dem Community-Wiki (siehe [Datenquelle](#datenquelle)).

![Kampf am Desktop](docs/kampf-desktop.jpg)

<p>
  <img src="docs/kampf-handy-quer.jpg" alt="Kampf am Handy im Querformat" width="560">
  <img src="docs/kampf-handy-hoch.jpg" alt="Kampf am Handy im Hochformat" width="200">
</p>

---

## Schnellstart

Voraussetzung: **Node.js 18.17 oder neuer**.

```bash
cd turmtrubel
npm install
npm start
```

Dann im Browser **http://localhost:3000** öffnen.

* **Mit einem Freund im selben WLAN:** Beide öffnen `http://<IP-des-Rechners>:3000` (die IP zeigt z. B. `ipconfig` bzw. `ip addr`). Einer tippt auf *Kampf erstellen* und nennt dem anderen den 6-stelligen Code. Alternativ *Link teilen*: Der Link enthält den Code, der Beitritt läuft dann automatisch.
* **Übers Internet:** Den Server auf einem VPS oder Hoster mit WebSocket-Unterstützung starten (z. B. hinter nginx/Caddy mit HTTPS; `wss://` wird automatisch genutzt) oder zum Testen einen Tunnel verwenden.
* **Alleine testen:** *Training gegen Bot* im Hauptmenü. Oder zwei Browser-Tabs öffnen: Jeder Tab ist ein eigener Spieler.

| Variable | Standard | Bedeutung |
| -------- | -------- | --------- |
| `PORT` | `3000` | HTTP- und WebSocket-Port |
| `HOST` | `0.0.0.0` | Bind-Adresse |

`npm run dev` startet den Server mit automatischem Neustart bei Codeänderungen. `npm test` führt die Tests aus.

---

## Steuerung

| Aktion | Maus / Touch | Tastatur |
| ------ | ------------ | -------- |
| Karte spielen | Karte aufs Feld **ziehen** *oder* Karte **antippen**, dann Feld antippen | `1`–`4` wählt die Karte, dann Klick aufs Feld |
| Auswahl abbrechen | Karte erneut antippen oder zurück auf die Hand ziehen | `Esc` |
| Champion-/Helden-Fähigkeit | runder Knopf neben dem Emote-Knopf (Kartenpanel bzw. neben der Arena) | `Leertaste` oder `Q` |
| Emote | Sprechblasen-Knopf, dann eines von 6 Emotes aus der Leiste | `E` |
| Menü, Ton, Aufgeben | Menü-Knopf (drei Striche) oben links bzw. oben im Kartenpanel | – |
| Leistungsanzeige (FPS, Partikel, Sprite-Cache) | – | `F3` |

Solange eine Karte ausgewählt ist, ist der gesperrte Bereich rot schraffiert, die Elixierleiste markiert die Kosten, und eine Vorschau zeigt Formation, Reichweite bzw. Zauberradius. Liegt der Finger auf der gegnerischen Hälfte, rastet die Truppe am Flussufer ein.

**Layouts:** Kein Bedienelement liegt über der Arena. Bei *Auto* wählt das Spiel die größte lesbare Arena. Auf breiten Bildschirmen (Desktop, Handy quer) ist die Arena um 90° gedreht (die eigene Seite liegt rechts), das Kartenpanel mit Timer, Kronen und Hand steht rechts. Auf Tablets quer steht die Arena hochkant mit Panel rechts, im Hochformat gibt es oben eine Kopfleiste und unten die Hand. Einstellbar unter *Einstellungen → Grafik & Anzeige → Arena-Ausrichtung*.

---

## Spielregeln

* **Arena:** 18 × 32 Felder, zwei Lanes, Fluss in der Mitte, zwei Brücken. Bodentruppen kommen nur über die Brücken hinüber (Ausnahme: Flussspringer wie *Schweinereiter*, *Prinz* oder *Widderreiterin*).
* **Türme:** pro Spieler 2 **Wachtürme** (entsprechen den Prinzessinnentürmen, 3000 LP) und 1 **Burgturm** (Königsturm, 4800 LP). Der Burgturm schläft, bis er Schaden nimmt oder ein eigener Wachturm fällt.
* **Elixier:** Start bei 5, maximal 10, +1 alle 2,8 s. In der letzten Minute doppelt so schnell, in der Verlängerung dreifach.
* **Dauer:** 3 Minuten. Bei Kronengleichstand folgen 2 Minuten **Verlängerung mit Sudden Death**: Der erste zerstörte Turm gewinnt. Steht es danach immer noch gleich, verliert der Spieler mit dem Turm mit den wenigsten Lebenspunkten; sind auch diese gleich, endet das Spiel unentschieden.
* **Kronen:** 1 pro Wachturm, 3 für den Burgturm (sofortiger Sieg). Aufgeben oder eine Trennung von mehr als 30 s werten ebenfalls als 3 Kronen für den Gegner.
* **Deck:** 8 Karten, 4 auf der Hand, die nächste wird angezeigt. Die gespielte Karte wandert ans Ende der Warteschlange, die nächste rückt in den freien Platz nach (Rotation wie im Original).
* **Platzieren:** Truppen und Gebäude nur auf der eigenen Hälfte, Zauber überall. Fällt ein gegnerischer Wachturm, wird in seiner Lane eine *Tasche* auf der Gegnerseite freigeschaltet.
* **Truppen-KI:** Einheiten laufen zum nächsten Ziel ihres Typs (Boden, Luft, Gebäude) und suchen den Weg per A* über die Brücken. Sie greifen Gegner an, die in Sichtweite kommen (Ausnahme: Gebäudejäger), und bleiben am Ziel, solange es in Reichweite ist.

### Kartenarten

140 Karteneinträge: alle **123 regulären Karten** des Originals plus **17 Helden-Varianten**, alle freigeschaltet und auf Level 11:

| Art | Anzahl | Beispiele |
| --- | ------ | --------- |
| Truppen | 82 | Ritter, Bogenschützen, Riese, P.E.K.K.A., Schweinereiter, Lakaienhorde, Megaritter, Spirit Empress |
| Gebäude | 12 | Kanone, Tesla, Infernoturm, X-Bogen, Minenwerfer, Grabstein, Elixiersammler, Koboldbohrer |
| Zauber | 21 | Feuerball, Pfeile, Gift, Blitz, Baumstamm, Tornado, Spiegel, Klonzauber, Friedhof, Ranken, Leere |
| Champions | 8 | Bogenkönigin, Goldener Ritter, Skelettkönig, Mächtiger Mineur, Mönch, Little Prince, Goblinstein, Boss Bandit |
| Helden | 17 | Eigene Karten `<basis>-hero` (z. B. *Ritter (Held)*), nur im ★-Platz und nie zusammen mit ihrer Basiskarte |
| Evolutionen | 42 | Liegt eine solche Karte in einem der **2 Evo-Plätze**, lädt sie sich durch Ausspielen auf. Nach `cycles` Einsätzen kommt die nächste als **Evo** mit Zusatzeffekt und verändertem Aussehen. |

**Fähigkeiten:** Champions und Helden haben eine Fähigkeit, die Elixier kostet. Seit der Balance-Änderung vom 04.08.2026 wirkt sie **einmal pro Einsatz** (Boss Bandit: zweimal, 3 s Abklingzeit). Ein Champion kehrt erst nach seinem Tod in den Zyklus zurück.

Seltenheiten: Gewöhnlich, Selten, Episch, Legendär, Champion.

**Deckregeln:** 8 verschiedene Karten. Platz 1–2 sind Evo-Plätze, Platz 3 ist der **Champion/Held-Platz**. Champions und Helden dürfen nur dort liegen, also höchstens einer pro Deck; ein Held darf nicht zusammen mit seiner Basiskarte im Deck stehen. Der Server prüft das Deck beim Erstellen und Beitreten erneut. Gespeicherte Decks, die Karten enthalten, die es nicht mehr gibt, werden beim Laden automatisch auf das Startdeck zurückgesetzt.

**Sonderkosten:** Der *Spiegel* kostet die zuletzt gespielte Karte + 1 und spielt sie eine Stufe stärker; die *Spirit Empress* kommt ab 6 Elixier fliegend für 6, sonst zu Fuß für 3. Beides berechnet der Server und schickt es mit dem Snapshot (`me.hc`).

---

## Architektur

```
Browser (Canvas-Client)                     Node.js-Server (autoritativ)
┌──────────────────────────┐   WebSocket   ┌───────────────────────────────────┐
│ Eingaben: play/ability/   │ ───────────► │ rooms.js  Codes, Lobby, Countdown, │
│ emote/ready/rematch       │              │           Reconnect, Rematch       │
│                           │ ◄─────────── │ sim/  20 Ticks/s                    │
│ Snapshot-Puffer (110 ms)  │  Snapshots   │   prüft Elixier, Handkarte,         │
│ → Interpolation → Zeichnen│   20/s       │   Platzierung, Cooldowns            │
└──────────────────────────┘              └───────────────────────────────────┘
              ▲  shared/ (arena.js, cards.js, protocol.js) – identische Regeln  ▲
```

* **Autoritativer Server:** Clients senden nur Eingaben wie *Karte X aus Handplatz Y an Position (x, y)*. Der Server simuliert mit festem Tick (20/s, Drift-Ausgleich), prüft jede Eingabe (Kampf läuft, Karte auf der Hand, Ankunftsverzögerung, Elixier, Platzierungsbereich, Einheitenlimit, Fähigkeits- und Emote-Abklingzeit) und sendet nach jedem Tick einen Snapshot.
* **Snapshots:** Entitäten als kompakte Arrays (`[id, typ, besitzer, x, y, lp, maxLp, flags, schild, ziel, blickrichtung, aux]`), Projektile, Zauberzonen und Ereignisse (Treffer, Tod, Zauber, Emotes …). Jeder Spieler erhält zusätzlich nur seinen eigenen Teil (`me`: Hand, Elixier, Evo-Ladung, Fähigkeit). Die gegnerische Hand bleibt geheim.
* **Client:** puffert Snapshots, rendert mit etwa 110 ms Verzögerung und interpoliert Positionen. Ereignisse werden synchron zur interpolierten Zeit als Effekte und Sounds abgespielt. Elixierleiste und Timer werden lokal fortgeschrieben.
* **Reconnect:** Das Sitzungstoken liegt im `sessionStorage` (pro Tab). Bricht die Verbindung ab, versucht der Client 30 s lang, sich neu zu verbinden. Der Server hält den Platz frei, der Kampf läuft weiter. Nach 30 s verliert der getrennte Spieler.
* **Schutz:** Rate-Limit (Token-Bucket, 30 Nachrichten/s), maximal 16 KB pro Nachricht, Deckvalidierung, bereinigte Namen, Schutz gegen Pfad-Traversal beim Ausliefern von Dateien und ein Heartbeat gegen tote Verbindungen.

### Dateien

```
turmtrubel/
├─ data/cards.json          Kartendatenbank (erzeugt aus tools/cards/, Level 11)
├─ data/rules.json          Spielregeln (Zeiten, Elixier, Türme, Lobby, cardLevel)
├─ data/skin.json           Namens-/Grafik-Mapping: „original“ (Standard) oder „custom“
├─ data/source/             Wiki-Snapshot (wiki-cards.json) als Datenquelle
├─ TODO_missing_stats.md    fehlende, geschätzte und widersprüchliche Werte
├─ shared/arena.js          Geometrie, Brücken, Türme, Platzierungsregeln
├─ shared/cards.js          DB-Aufbau, Einheiten-/Evo-Auflösung, Deck-Validierung, Zufallsdeck
├─ shared/decks.js          Startdecks
├─ shared/protocol.js       Nachrichtentypen, Fehlertexte, Emotes, Flags
├─ server/index.js          HTTP + WebSocket, Routing, Rate-Limit, Tick-Schleife
├─ server/rooms.js          RoomManager/Room: Codes, Lobby, Reconnect, Rematch, Training
├─ server/bot.js            Trainingsgegner (spielt über dieselben Prüfungen)
├─ server/sim/match.js      Simulation: Kern, Ausspielen, Ticks, Snapshots, Sieg
├─ server/sim/combat.js     Zielwahl, Angriffe, Geschosse, Schaden, Buffs, Schild/Rüstung
├─ server/sim/motion.js     Laufen, Ansturm, Sprint, Sprung, Haken, Wurf, Untergrund, Kollision
├─ server/sim/traits.js     Spawner, Auren, Todes-Effekte, Verwandlung, Tarnung, Fallen
├─ server/sim/spells.js     Zauberzonen, Rollzauber, Beschwörungen, Spiegel, Klon, Ranken, Leere
├─ server/sim/abilities.js  Champion- und Heldenfähigkeiten
├─ server/sim/geom.js       Geometrie-Helfer
├─ server/sim/nav.js        Navigationsraster + A*
├─ client/index.html        Alle Screens
├─ client/css/style.css     Cartoon-UI
├─ client/js/main.js        App-Steuerung: Screens, Netz-Ereignisse
├─ client/js/net.js         WebSocket, Reconnect, Ping
├─ client/js/audio.js       Web-Audio-SFX + prozedurale Musik
├─ client/js/store.js       localStorage (Name, Einstellungen, 5 Deck-Plätze)
├─ client/js/ui/…           Deck-Bauer (mit Drag-and-Drop), Kartenansicht, Einstellungen, DOM-Helfer (Modal, Toast), icons.js (SVG-Icon-Set), tokens.js
├─ client/js/game/…         game.js (Interpolation, Eingabe, Effekt-Ereignisse), renderer.js, hud.js (Layout-Engine), hudart.js (HUD-Grafiken), canvastext.js, sprites.js
├─ client/js/design/…       Designsystem: Tokens, Easing, Licht-Modell, Sprite-Cache, Asset-Manifest
├─ client/js/vfx/…          VFX-Engine, Partikel-Texturen, presets.json (Effekt-Presets) und deren Prüfung
├─ tools/fetch-cards.mjs    lädt den Wiki-Snapshot (MediaWiki-API)
├─ tools/cards/             Kartendefinitionen + build.py → data/cards.json, TODO_missing_stats.md
├─ tools/e2e/               Test-Clients, die über WebSocket komplette Kämpfe spielen; browser-match.mjs (zwei Browser-Clients)
├─ tools/ui-shots.mjs       Screenshots aller Zustände in 8 Viewports + automatische UI-Prüfungen
├─ tools/bench/             Extremszene, Performance-Messung, CPU-Profil
├─ tools/vfx-gallery.mjs    alle VFX-Presets als Kontaktbögen
├─ docs/ui-*.md             UI-Audit, Entscheidungen, Vorher/Nachher (erste UI-Überarbeitung)
├─ docs/REPORT.md           Bericht zum visuellen Upgrade (mit AUDIT, COMPARISON, STYLE_GUIDE, vfx-katalog/, before_after/)
└─ test/…                   node:test-Tests
```

---

## Datenquelle

Alle Kartenwerte stammen aus dem **Clash Royale Wiki** auf Fandom (<https://clashroyale.fandom.com/wiki/Cards>, Inhalte unter CC BY-SA). `tools/fetch-cards.mjs` lädt über die MediaWiki-API je Karte Infobox, deutschen Namen (Sprachlink) und die Werte-Tabellen auf **Turnierstandard Level 11** und speichert alles als Snapshot in `data/source/wiki-cards.json` (Stand: siehe `fetchedAt`). Es werden keine Werte aus dem Gedächtnis ergänzt:

* Es gelten die Werte der jeweiligen Kartenseite. Ist eine Balance-Änderung aus der Versionshistorie 2026 dort noch nicht eingepflegt, wird sie angewendet.
* Widersprüche zur Übersichtstabelle, fehlende Angaben und vorläufige Platzhalter stehen in **`TODO_missing_stats.md`**. `test/carddata.test.js` stellt sicher, dass Elixier, Seltenheit und Typ mit dem Snapshot übereinstimmen und Leben/Schaden nur dort abweichen, wo das dokumentiert ist.
* Umrechnung: Wiki-Tempo ÷ 60 = Felder pro Sekunde (langsam 0,75 · mittel 1 · schnell 1,5 · sehr schnell 2), Geschosstempo ebenso ÷ 60; Reichweiten und Radien in Feldern, Zeiten in Sekunden.
* Karten ohne deutschen Wiki-Eintrag tragen vorerst den englischen Namen (Liste in `TODO_missing_stats.md`).

```bash
node tools/fetch-cards.mjs        # Snapshot neu laden (überschreibt data/source/wiki-cards.json)
npm run cards                     # data/cards.json + TODO_missing_stats.md aus tools/cards/ neu erzeugen (Python 3)
```

### Kartenlevel

`data/rules.json → cardLevel` (Standard **11**) gilt für beide Spieler. Jede Stufe darüber oder darunter ändert Leben, Schaden, Schilde und Heilung um den Faktor 1,1 (Tempo, Reichweiten und Zeiten bleiben gleich). Der *Spiegel* spielt seine Karte eine Stufe höher.

### Namen und Grafik: skin.json

`data/skin.json` legt fest, welche Namen, Beschreibungen und Grafiken angezeigt werden:

* `"active": "original"` (Standard): Namen und Aussehen aus `cards.json`, also die echten Kartennamen mit den eigenen prozeduralen Figuren.
* `"active": "custom"`: eigene Inhalte. Für jede Karte und jedes Token gibt es einen Eintrag mit `name`, `description`, `look` (Baukasten, z. B. `{"cloth": "#2e86c1"}`), optional `image` (eigenes Bild unter `client/`, z. B. `"/img/skin/knight.png"`) sowie `evo`/`ability` mit `name` und `description`. **Leere Felder fallen auf das Original zurück.** Werte (Leben, Schaden …) ändert ein Skin nie.

Umschalten über `active` oder per Umgebungsvariable: `SKIN=custom npm start`.

## Karten und Regeln anpassen

Nach Änderungen an `data/cards.json`, `data/rules.json` oder `data/skin.json` den Server neu starten. Clients laden die Daten direkt vom Server und sind dadurch immer synchron. Am besten ändert man die Definitionen in `tools/cards/` und erzeugt `cards.json` mit `npm run cards` neu. `npm test` prüft anschließend, dass jede Karte gültig ist und spielbar bleibt.

**Truppe/Gebäude** (`unit`):

| Feld | Bedeutung |
| ---- | --------- |
| `hp`, `damage`, `hitSpeed`, `firstHit` | Leben, Schaden, Sekunden zwischen Angriffen, Verzögerung des ersten Treffers |
| `range`, `minRange`, `sight` | Reichweite (Kante zu Kante), toter Winkel, Sichtweite (Standard 5,5) |
| `speed` | Felder pro Sekunde (Wiki-Tempo ÷ 60) |
| `targets` | `ground`, `air`, `both`, `buildings` |
| `flying`, `hover`, `radius`, `mass` | Fliegt bzw. schwebt über den Fluss? Kollisionsgröße; Masse fürs gegenseitige Schieben (≥ 12 immun gegen Rückstoß) |
| `splash`, `splashSelf` | Flächenradius um das Ziel bzw. um sich selbst |
| `projectile` | `{ kind, speed, arc }` (Geschwindigkeit 0 = sofortiger Treffer) |
| `towerDamage` | Schadensfaktor gegen Kronentürme |
| `size`, `lifetime`, `deployTime` | Gebäude: Kantenlänge, Lebensdauer; Aufstellzeit |
| `count`, `formation`, `groups` (Karte) | Anzahl, Aufstellung (`line`, `split`), gemischte Gruppen; `unit` darf auch ein Verweis auf eine andere Karte sein (z. B. Lakaienhorde → `"minions"`) |
| `forms`, `elixirRule` (Karte) | Formen nach Elixier (Spirit Empress), `"mirror"` für den Spiegel |

**Traits** (`unit.traits`, wiederverwendbare Bausteine): Angriff `charge`, `dash`, `leap`, `hook`, `kamikaze`, `ramp`, `attackRamp`, `multiTarget`, `pierce`, `spread`, `shrapnel`, `secondary`, `sniper`, `melee`, `combo`, `chargeUp`, `uppercut`, `recoil`, `bounce`, `poisonDart`, `slowShot`, `net`, `onHit { stun, freeze, slow, chain, curse, spawn }`; Verteidigung `shield`, `armor`, `parry`, `veil`, `zapBack`, `untargetable`, `invulnerable`; Bewegung `riverJump`, `deployAnywhere`, `hidden`, `stealth`, `glide`, `resurface`; Erzeugen/Tod `spawner`, `deathSpawn`, `deathDamage`, `deathSpell`, `deathElixir`, `deployBlast`, `transform`, `hatch`, `dropAt`, `shadowOnDeath`, `leader`; Sonstiges `aura`, `enchant`, `elixirGen`, `healOnAttack`, `selfHealOnHit`, `killHeal`, `rageOnHit`, `souls`, `trap`, `freezeAura`, `barrage`, `whirl`.

**Zauber** (`spell`): `radius`, `damage`, `towerDamage`, `buildingDamage`, `waves`, `travel`, `delay`, `duration`+`pulse`, `stun`/`freeze`, `slow`, `knockback`, `pull`, `rage`, `curse`, `heal`, `roll`, `ownSide`, `spawn`, `spawnAtEnd`, `mirrorSpawn`, `graveyard`, `strikes`, `vines`, `voidTiers`, `clone`, `mirror`, `gather`, `echo`.

**Evo** (`evo`): `cycles`, `name`, `description` und `unit`- bzw. `spell`-Overrides, die über die Basiswerte gelegt werden, inklusive `look` für das veränderte Aussehen.

**Fähigkeiten** (`ability`): `name`, `cost`, `uses` (Standard 1), `cooldown`, `castTime` und ein Effekt-Baustein, z. B. `cloak`, `vanish`, `dash`, `burrow`, `guard`, `souls`, `taunt`, `hurl`, `build`, `summon`, `flight`, `banner`, `warp`, `reroll`, `decoy`, `tripleShot`, `paratrooper`, `stance`, `dismount`, `frenzy`, `spin`, `link`, `pulses`, `pancakes`, `summonCharge`.

**Aussehen** (`look`): `body` (`hum`, `imp`, `skel`, `brute`, `golem`, `bot`, `moth`, `bug`, `winged`, `dragon`, `balloon`, `whale`, `spirit`, `rider`, `blob`, `barrel`, `cart`, `ghost`, `hog`, `bush`, `machine`, `wagon` bzw. Gebäude wie `cannon`, `tesla`, `inferno`, `cage`, `drill`, `bombtower` …), `hat`, `weapon`, `shield`, `cape`, `beard`, `mount`, Farben (`skin`, `cloth`, `accent`), `scale`, `hero`; Zauber `icon` + `color`. Fehlt ein Look, zeichnet der Client einen Platzhalter mit dem Kartennamen.

**Regeln** (`data/rules.json`): Spielzeit, Verlängerung, Doppel-Elixier-Phase, Elixierwerte, Turmwerte, `cardLevel`, Code-Gültigkeit (600 s), Reconnect-Fenster (30 s), Countdown, Emote-Abklingzeit, Einheitenlimit. `suddenDeath` steht standardmäßig auf `"firstCrown"` (erster zerstörter Turm gewinnt, wie im Vorbild); mit `"firstHit"` gewinnt der erste Treffer auf einen Kronenturm.

---

## Tests

```bash
npm test
```

Die Tests laufen mit dem eingebauten `node:test`, ohne zusätzliche Abhängigkeiten:

* **elixir**: Startwert, 2,8-s-Regeneration, Obergrenze 10, doppelte und dreifache Rate, Kosten, Elixiersammler
* **simulation**: fester Tick, Determinismus, Brücken-Pfadsuche, Turm-KI, Burgturm-Aktivierung, Platzierung und Taschen, Handrotation, Anti-Cheat, Champion-Zyklus, Fähigkeiten, Evo-Ladung, Zauber, Todeseffekte, Gebäudeverfall, 20 Bot-gegen-Bot-Kämpfe
* **victory**: Burgturm-Sieg, Kronen, Zeitablauf, Sudden Death, Tiebreak, Unentschieden, `firstHit`-Variante, Aufgabe
* **cards/allcards**: Umfang und Integrität der Datenbank, Kartenlevel, auflösbare Verweise, Deckregeln (inkl. Held + Basiskarte), Zufallsdecks, jede Karte, jede Evo und jede Fähigkeit spielbar
* **carddata**: Abgleich mit dem Wiki-Snapshot (Elixier, Seltenheit, Typ, Leben/Schaden, nur dokumentierte Abweichungen)
* **mechanics**: je Mechanik-Gruppe eine typische Karte – Ansturm, Kamikaze, Rampe, Kette, Verlangsamung, Durchschlag, Schild, Spawner, Todesbombe, Elixiergolem, Flusssprung, Sprint, Sprung, Haken, Untergrund, Tarnung, versteckte Tesla, Zielwahl, Zauber (Pfeile, Tornado, Baumstamm, Wut, Frost, Klon, Friedhof, Koboldfass, Erdbeben, Spiegel), Spirit Empress, Champions, Helden, Evolutionen
* **skin**: „original“/„custom“, Rückfall bei leeren Feldern, `SKIN`-Variable
* **placement**: Zonen, Fluss, Türme, Gebäude, Taschen, gedrehte Ansicht
* **rooms**: Codeformat und Eindeutigkeit, Fehler (ungültig, unbekannt, voll, abgelaufen), Countdown, Lade-Timeout, Reconnect innerhalb und nach 30 s, Rematch, Verlassen, Training
* **integration**: echter Server auf zufälligem Port mit zwei WebSocket-Clients: Lobby, Kampf, gültige und ungültige Züge, Emote, Ping, Reconnect, Aufgabe, Rematch
* **e2e**: zwei automatische Test-Clients (`tools/e2e/`) spielen über WebSocket drei **komplette Kämpfe** gegeneinander (Server im Zeitraffer ×8, Regeln unverändert). Zusammen decken die Testdecks jede Mechanik-Gruppe ab und lösen Champion- und Heldenfähigkeiten sowie Evolutionen aus. `npm run e2e` zeigt dazu einen ausführlichen Bericht.

### UI-Screenshots und Prüfungen

```bash
node tools/ui-shots.mjs                          # alle 8 Viewports → docs/ui-nachher/ (+ checks.json)
node tools/ui-shots.mjs --only=phone-360x640     # nur einzelne Viewports
node tools/ui-shots.mjs --perf                   # FPS und Long Tasks im Bot-Kampf, CPU 4× gedrosselt
node tools/ui-shots.mjs --perf --fixed           # dito mit fester Auflösung (automatische Qualität aus)
node tools/bench/run.mjs                         # Extremszene (222 Entitäten) in drei Profilen
node tools/vfx-gallery.mjs --out=docs/vfx-katalog # alle Effekte als Kontaktbögen
node tools/e2e/browser-match.mjs                 # zwei Browser-Clients: volles Match inkl. Verlängerung, Desync- und Konsolenprüfung
```

Das Skript startet selbst einen Server auf einem freien Port und spielt pro Viewport den ganzen Ablauf durch: Name → Menü → Einstellungen → Beitreten → Deck-Bauer → Kartendetail → Training → Countdown → Laden → Kampf → Karte wählen/ziehen/ausspielen → Fehlertoast → Emote → Pause → letzte 10 s → zerstörter Turm → Aufgeben → Ergebnis (Niederlage und Sieg) → Multiplayer-Lobby mit zwei Seiten. Jeder Zustand wird geprüft: Touch-Ziele unter 44 px, Elemente außerhalb des Bildschirms, abgeschnittene Texte ohne Volltext, HUD über der Arena (über `hud.blocks()`), Toast über dem Kampfgeschehen und Konsolenfehler. Ein nicht leerer Befund bei Arena-Überdeckung oder Seitenfehlern führt zu Exit-Code 1.

Playwright ist **keine** Projektabhängigkeit (damit `npm install` schlank bleibt). Nötig ist eine lokale oder globale Installation, z. B. `npm i -g playwright && npx playwright install chromium`. Einen eigenen Browser setzt `CHROMIUM_PATH=/pfad/zu/chrome`.

---

## Bekannte Einschränkungen

* **Kein Persistenz-Backend:** Sitzungen und Räume liegen im Arbeitsspeicher. Ein Server-Neustart beendet laufende Kämpfe. Decks, Name und Einstellungen speichert jeder Browser lokal.
* **Ein Prozess, keine Skalierung:** Es gibt keine öffentliche Spielersuche (nur Einladungscodes), keine Ranglisten, keinen Zuschauermodus und keine Replays.
* **Werte wie im Original, Mechanik teils vereinfacht:** Die Zahlen stammen aus dem Wiki-Snapshot (Level 11). Einige Effekte sind vereinfacht nachgebaut, und wo das Wiki keine Angabe macht, stehen geschätzte Platzhalter (siehe `TODO_missing_stats.md`). Die Türme behalten die Turmtrubel-Werte (3000/4800 LP).
* **Vereinfachte Physik:** Die Wegfindung nutzt ein 0,5-Feld-Raster mit A*, die Kollisionen weiche Kreis- und Rechteck-Trennung. In großen Gedrängen oder an Turmecken können Einheiten kurz ruckeln oder sich stauen.
* **Keine Vorhersage beim Platzieren:** Eigene Karten erscheinen erst nach der Server-Bestätigung (Ping + ca. 110 ms Interpolationspuffer). Bis dahin ist eine Vorschau sichtbar.
* **Netzlast:** Snapshots werden jeden Tick komplett als JSON gesendet (typisch 0,5–6 KB), ohne Delta-Kompression. Das reicht für LAN und normales Internet, ist aber nicht optimiert.
* **Anti-Cheat** prüft alle Eingaben auf dem Server. Gegen automatisierte Clients (Bots), die gültige Eingaben senden, schützt er nicht.
* **Grafik vollständig prozedural:** Figuren, Türme, HUD und Effekte sind als Vektorgrafik im Code gezeichnet (Licht-Modell und Regeln in `docs/STYLE_GUIDE.md`) und werden als Sprites gecacht. Auf sehr alten Geräten hilft *Grafikqualität: Niedrig*; die automatische Qualität senkt bei Ruckeln Auflösung und Effektmenge.
* **Audio:** Browser (besonders iOS) starten Ton erst nach der ersten Berührung. Musik und Effekte sind synthetisch.
* **Oberfläche:** Im Hochformat erscheint der Hinweis-Toast (z. B. „Nicht genug Elixier!“) für 1,4 s am unteren Arenarand über dem eigenen Burgturm. Vibration gibt es nur, wo der Browser `navigator.vibrate` anbietet (nicht auf iOS). Die Performance ist bisher nur in Chromium ohne GPU gemessen (siehe `docs/REPORT.md`, Abschnitt 4).
* **Designentscheidungen:** Champions und Helden lösen ihre Fähigkeit per Knopf aus. Evo-Karten starten ungeladen (`evo.startCharged` in `rules.json`). Die Turmnamen (Wachturm, Burgturm) sind eigenständig, die Kartennamen kommen aus dem Original (umschaltbar über `skin.json`).

---

## Lizenzen

Der Code ist Teil dieses Repositories. Die Kartenwerte und -texte im Snapshot `data/source/wiki-cards.json` stammen aus dem Clash Royale Wiki (Fandom) und stehen unter CC BY-SA. Die Schriften *Lilita One* und *Nunito* kommen über npm (`@fontsource`) und stehen unter der SIL Open Font License; sie werden lokal ausgeliefert, sodass das Spiel auch offline im LAN läuft.
