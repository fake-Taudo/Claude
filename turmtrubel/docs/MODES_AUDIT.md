# Audit: Neue Spielmodi (2v2, Triple Draft, Mega Draft, Unendlich-Elixier)

Stand vor dem Umbau (Commit `ded3934`). Ziel des Audits: alle Stellen finden, die „genau 2 Spieler“, „ein Deck aus dem Speicher“ oder „feste Elixierregeln“ annehmen, und daraus die Schnittstellen für den Umbau ableiten.

Referenz für die Regression: `test/fixtures/classic-replay.json` wurde **vor** jeder Änderung mit `node tools/modes/classic-replay.mjs --write` erzeugt (12 Bot-gegen-Bot-Kämpfe mit festen Seeds, 745 Eingaben, Prüfsumme über den kompletten Snapshot jedes Ticks). `test/classic-regression.test.js` spielt die Eingaben nach dem Umbau erneut ab und verlangt Tick für Tick identische Snapshots.

---

## 1. Räume, Lobby, Code, Start und Rematch

| Baustein | Datei | Heute |
|---|---|---|
| Sitzung | `server/rooms.js` `Session` | `side` ∈ {-1, 0, 1}, `isBot`, Reconnect-Timer |
| Raum | `server/rooms.js` `Room` | `players = [null, null]`, `decks`, `ready`, `loaded`, `rematch` jeweils Länge 2 |
| Ablauf | `Room` | `lobby` → `countdown` (3 s) → `loading` (max. 8 s) → `playing` → `ended` → Rematch → `countdown` |
| Code | `RoomManager.generateCode` | 6 Zeichen, 10 Minuten gültig, abgelaufene Codes 1 h gemerkt |
| Training | `RoomManager.createTraining` | Raum `T…`, Bot-Sitzung auf Seite 1, beide sofort bereit |

**Stellen mit fester Spielerzahl 2:**

| Ort | Annahme |
|---|---|
| `rooms.js` `Room` Konstruktor | Arrays `[null, null]`, `[false, false]` |
| `addPlayer` | `side = players[0] ? 1 : 0` |
| `opponent(s)` | `players[1 - s.side]` |
| `joinRoom` | voll, wenn `players[0] && players[1]` |
| `setReady`, `requestRematch`, `onLoaded` | Start, wenn `[0]` und `[1]` bereit / geladen / einverstanden |
| `leave` | `other = players[1 - side]`; Gastgeber = Seite 0 |
| `cleanup` | „wartet allein“ = nicht beide Plätze belegt |
| `resultFor`, `matchInitFor` | `names` als Liste, `side` = Spielerindex = Teamindex |
| `server/sim/match.js` Konstruktor | `players = [0, 1].map(...)`, `stats` für 2, `crowns = [0, 0]` |
| `forfeit(side)` | Gewinner `1 - side` |
| `finishByScore`, `checkEnd`, `updateClock` | Vergleich `crowns[0]` gegen `crowns[1]` |
| `end` → `towerHp` | `[0, 1].map(...)` |
| `canPlace` | `enemyPrincessDown = [0, 1].map(...)` mit `owner !== side` |
| `traits.js` `onTowerDestroyed` | `opp = 1 - t.owner` |
| `traits.js` `deathElixir` | Elixier an `1 - e.owner` |
| `traits.js` `maybeReturnChampion` | `players[e.owner]` – Besitzer = Spieler |
| `traits.js` `elixirGen`, `abilities.js` `refundCast` | `addElixir(e.owner, …)` |
| `abilities.js` `abilityEntity(side)` | sucht Einheiten mit `owner === side` |
| `combat.js` `damage` | `stats[srcOwner]` für 0/1, Sudden Death `1 - o.owner` |
| Entitäten allgemein (182 Stellen) | `owner` ist zugleich Team (Feind = `owner !== x`, Geometrie per `forwardDir(owner)`) und Spieler |
| `server/bot.js` | `side` ist Spieler, Team und Hälfte zugleich |
| `client/js/game/game.js` | `side`, `names[1 - side]`, `teamOf(owner)`, Marker für gegnerische Karten (`owner !== side`), Emotes je `owner` |
| `client/js/game/hud.js` | eine Gegner- und eine eigene Gruppe, `oppDisconnected` |
| `client/js/game/renderer.js` | Teamfarbe = `owner === game.side` |
| `client/js/main.js` | Lobby mit zwei Spielerkarten `#lobby-p0/#lobby-p1`, Ergebnis mit `you`/`opp = 1 - you`, Rematch-Status `want[1 - you]` |
| Snapshot | `cr` (2 Kronen), Entität ohne Spieler-Feld |
| Emotes / Ereignisse | `['em', side, i]`, `['pl', side, …]`, `['ab', id, side, …]`, `['el', side, …]` – „side“ = Spieler |

**Gute Nachricht für 2v2:** Alle Kampfregeln (Zielwahl, Schaden, Heilung, Wut, Kollision, Turm-Zuordnung, Platzierung) fragen nur „gleiches Team?“ über `owner`. Wenn `owner` künftig ausschließlich das **Team** bedeutet und ein neues Feld `pl` den **Spieler**, funktionieren Friendly-Fire-Schutz, Buffs für Verbündete, gemeinsame Türme und die gemeinsame Hälfte ohne Änderungen an `combat.js`, `motion.js` und `spells.js`. Pro Spieler müssen nur Elixier, Hand, Champion-Rückkehr, Fähigkeiten, Elixiersammler und Statistik laufen.

## 2. Bots

Es gibt bereits einen Einzelspieler-Modus („Training gegen Bot“):

- `server/bot.js` `Bot(match, side, seed)` läuft **serverseitig** im Raum (`Room.bot`), wird pro Tick vor `match.step()` aufgerufen und spielt über `match.play()` / `match.useAbility()` – also mit denselben Prüfungen wie ein Mensch (Elixier, Hand, Platzierung). Der Netzweg (`index.js` → `m.play`) endet in derselben Funktion.
- Eine Schwierigkeitsstufe; Entscheidungen alle 0,45–1,35 s: Verteidigung gegen die tiefste Bedrohung (Flächenzauber gegen Schwärme, Lufttruppen gegen Flieger), Angriff ab gespartem Elixier (6–9), Turm-Finisher mit Zauber, Champion-/Heldenfähigkeit bei ≥ 2 Gegnern in Reichweite.
- Der Bot liest `match.entities` direkt. Dabei sieht er auch Dinge, die ein Mensch nicht sieht (z. B. unterirdische Bergarbeiter, versteckte Tesla). → Schwer/Mittel/Leicht filtern künftig nach Sichtbarkeit.
- Kein Draft, keine Aktionsbremse (bei ×7 Elixier würde er alle 0,45 s spielen).

## 3. Elixier, Phasen, Timer, Verlängerung

Definiert in `data/rules.json`, ausgewertet in `server/sim/match.js`:

| Wert | rules.json | Verwendung |
|---|---|---|
| Start / Max | `elixir.start` 5, `elixir.max` 10 | `makePlayer`, `updateElixir`, `addElixir` |
| Regeneration | `elixir.regenSeconds` 2,8 | `updateElixir`: `rate = elixirMultiplier() / regenSeconds`, pro Tick `+rate·dt` |
| Doppel-Elixier | `doubleElixirLastSeconds` 60, `elixir.doubleMultiplier` 2 | ab `regularSeconds − 60` |
| Verlängerung | `overtimeSeconds` 120, `elixir.overtimeMultiplier` 3 | Phase `overtime`, wenn Kronen gleich |
| Spielzeit | `regularSeconds` 180 | `updateClock`, `timeLeft` |
| Sudden Death | `suddenDeath` `firstCrown` | `checkEnd` bzw. `combat.js` (`firstHit`) |
| Tick | `tickRate` 20 | fester Schritt `dt = 1/20 s`, Server-Schleife mit Drift-Ausgleich (`index.js`) |

Elixier ist eine Fließkommazahl; Prüfungen nutzen `+ 1e-9`. Bei ×7 steigt Elixier um 0,125 pro Tick – genau darstellbar, also keine Drift. Der Client sagt Elixier zwischen Snapshots voraus (`game.js` `elixirNow`: `me.el + dt·em/regenSeconds`) und zeigt beim Anstieg von `em` ein Banner „Doppeltes/Dreifaches Elixier“. **Achtung:** Mit ×7 von Anfang an würde dieses Banner fälschlich beim ersten Snapshot erscheinen (`snapMult` startet bei 1) → Startwert aus der Modus-Konfiguration übernehmen.

## 4. Decks

- Gespeichert im Browser (`client/js/store.js`, `localStorage` `turmtrubel.v1`, 5 Plätze, Startdecks aus `shared/decks.js`).
- Format: 8 Karten-IDs; **Platz 1–2 = Evo-Plätze** (eine Karte mit Evo-Version wird dort zur Evolution), **Platz 3 = Champion/Held-Platz** (`EVO_SLOTS`, `SPECIAL_SLOT` in `shared/cards.js`).
- `validateDeck`: genau 8 Karten, keine Doppelten, höchstens ein Champion **oder** Held (nur in Platz 3), Held und Basiskarte nicht zusammen. Max. 2 Evos folgt aus den zwei Evo-Plätzen.
- Übergabe: `create`/`join`/`training`/`deck` schicken `deck`; der Server prüft (`RoomManager.checkDeck`), speichert `room.decks[side]` und reicht beim Laden `decks` an `new Match(...)`. `makePlayer` mischt per Seed und bestimmt Evo-Karten aus den Plätzen 1–2.
- **Für Drafts:** Das Draft-Deck wird serverseitig zusammengesetzt. Champion/Held muss in Platz 3, und weil Evos aus sind, braucht `Match` einen Schalter „keine Evolutionen“ (sonst würde eine Evo-fähige Karte in Platz 1–2 automatisch zur Evo).

## 5. Netzwerkprotokoll (Version 1)

`shared/protocol.js`, JSON über WebSocket `/ws`, Token-Bucket 30 Nachrichten/s (Burst 60) pro Verbindung, max. 16 KB pro Nachricht.

| Richtung | Typ | Inhalt |
|---|---|---|
| C→S | `hello` | `name`, `token?` |
| C→S | `create` / `join` / `training` | `deck` (+ `code`) |
| C→S | `leave`, `deck`, `ready`, `loaded`, `surrender`, `rematch`, `name`, `ping` | – |
| C→S | `play` | `slot, card, x, y, seq` |
| C→S | `ability`, `emote` | `seq` bzw. `id` |
| S→C | `welcome` | `token, name, resumed, inRoom, dataVersion, protocol` |
| S→C | `lobby` | `code, state, you, training, expiresIn, players[2]` |
| S→C | `countdown` | `n` (−1 = Abbruch) |
| S→C | `matchInit` | `side, names, types, deck, training, matchNo, rules` |
| S→C | `matchStart`, `s` (Snapshot), `reject`, `matchEnd`, `rematchState`, `pong`, `roomClosed`, `notice`, `presence`, `error` | – |

**Snapshot `s`** (jeder Tick): `k` Tick, `t` Zeit, `tl` Restzeit, `ph` Phase, `em` Elixier-Multiplikator, `cr` Kronen, `e` Entitäten `[id, typ, owner, x, y, hp, maxHp, flags, shield, target, facing, aux]`, `p` Geschosse, `z` Zonen, `ev` Ereignisse, `me` (Elixier, Hand, nächste Karte, Bereitschaft, Evo-Ladung, Fähigkeit, Emote-Abklingzeit, Champion, letzte Karte).

**Reconnect:** Token in `sessionStorage`; nach Abbruch 30 s Frist (`lobby.reconnectSeconds`). `hello` mit Token → `RoomManager.resume` → `room.sendState` (Lobby, `matchInit` mit `resume`, Ergebnis). Läuft die Frist ab: `room.leave(s, 'disconnect')` → im Kampf Niederlage durch Verbindungsabbruch.

**Protokollversion:** Der Server sendet `protocol` im `welcome`, prüft aber nichts; der Client liest den Wert nicht. Alte Clients würden neue Nachrichten stumm ignorieren.

## 6. Notwendige Änderungen und Risiken

### Schnittstellen (zuerst festgelegt)

1. **`data/modes.json`** – Modi als Daten (id, Name, Beschreibung, Spieler, Teams, `multiplayerOnly`, `botsAllowed`, `deckSource`, Elixier-Parameter, Match-Dauer, Phasen-Schalter, Evos, Draft-Parameter, 2v2-Parameter, Eingabe-Limits, Bot-Parameter).
2. **`shared/modes.js`** – `resolveMode(rules, def)` erzeugt eine **Match-Konfiguration** aus komponierbaren Modifikatoren (Elixier-Faktor, Phasen an/aus, Unendlich-Flag, Zeiten, Evos an/aus, Teams, Eingabe-Limit). Der klassische Modus ist die Konfiguration 2 Spieler / 2 Teams ohne Modifikatoren.
3. **Protokoll v2** (`docs/PROTOCOL.md`): `hello.protocol`; `create`/`training` mit `mode` (+ `difficulty`); neue Nachrichten für Platzwahl (`seat`, `move`, `kick`), Draft (`draftPick` / `draft`, `draftReveal`), Team-Ping (`mapPing` / `teamPing`), Bot-Übernahme (`takeover`). Alte Clients erhalten `error` `OUTDATED` „Bitte Seite neu laden“.
4. **Snapshot für Teams:** Entität bekommt in Team-Modi ein 13. Feld `pl` (Spieler); `tm` mit Elixier und letzter Karte des Teamkollegen. Im klassischen Modus bleibt der Snapshot byte-gleich.
5. **Draft-Zustand:** eigene Nachricht pro Spieler (Angebot bzw. Pool, gewählte Karten, Restzeit, wer dran ist).

### Pro Datei

| Datei | Änderung | Risiko |
|---|---|---|
| `server/sim/match.js` | `config` (Spielerzahl, Teams, Elixier, Zeiten, Evos, Limits); `players` mit N Einträgen und Team; `owner` = Team, `pl` = Spieler; Elixier-Faktor aus Konfiguration; Kronen/Sieg pro Team; Platzierungs-Limit | hoch – Kernsimulation. Abgesichert durch Replay-Regression mit Prüfsumme pro Tick |
| `server/sim/traits.js`, `abilities.js`, `combat.js` | Spieler-bezogene Stellen auf `pl` umstellen (Elixiersammler, Todes-Elixier, Champion-Rückkehr, Fähigkeit, Statistik) | mittel – Ursprung von Folge-Einheiten muss sauber weitergereicht werden (Spawner, Todes-Spawns, Zauber-Beschwörungen, Klone, Verwandlungen) |
| `server/rooms.js` | Plätze N statt 2, Modus pro Raum, Draft-Zustand, Team-Lobby (Platz wählen, verschieben, entfernen), Bot-Übernahme, Rematch mit allen | hoch – Lobby/Reconnect-Tests vorhanden, werden erweitert |
| `server/draft.js` (neu) | Triple/Mega-Draft, seed-basiert, Auto-Pick, Champion-Sperre, Pool-Garantien | mittel – reine Logik, gut testbar |
| `server/bot.js` | Spieler ≠ Team trennen, Schwierigkeiten, Sichtbarkeit, Aktionsbremse, Draft-Logik | mittel – Standardstufe muss exakt das bisherige Verhalten behalten (Regressionstest) |
| `server/index.js` | neue Nachrichten, Protokollprüfung | gering |
| `shared/protocol.js` | Version 2, neue Typen, Fehlertexte | gering |
| `client/js/main.js` | Modi-Bereich, Modus-Lobby, Team-Lobby, Draft-Screens, Ergebnis je Modus, Regel-Info | mittel – UI-Prüfskript `tools/ui-shots.mjs` deckt alte Screens ab |
| `client/js/game/*.js` | Team statt Seite, Teamkollegen-Anzeige, Verbündeten-Markierung, Ping, ×7-Banner | mittel – Darstellung des klassischen Modus darf sich nicht ändern |
| `client/index.html`, `style.css` | neue Screens im bestehenden Stil | gering |
| `tools/e2e/*`, Tests | Protokoll v2, neue Szenarien | gering |

### Weitere Risiken

- **Last bei ×7 Elixier:** `maxEntities` 260 begrenzt bereits; zusätzlich Platzierungen pro Sekunde pro Spieler begrenzen (Server) und den Bot bremsen. Rendering hat automatische Qualitätsstufen (Auflösung, Effekte, Figuren).
- **Arena-Geometrie kennt genau zwei Hälften.** Teams werden deshalb auf 2 festgelegt (N Spieler, 2 Teams). Mehr Teams bräuchten eine neue Arena und sind nicht Teil dieses Auftrags.
- **Nachrichten-Limit 30/s:** Draft-Picks und Pings sind selten, kein Problem.
- **Kompatibilität:** Gespeicherte Decks bleiben unberührt; Draft-Decks werden nur auf Wunsch gespeichert.
