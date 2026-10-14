# Netzwerkprotokoll (Version 2)

JSON-Nachrichten über WebSocket (`/ws`), jede mit Feld `type`. Definiert in `shared/protocol.js` (`C2S`, `S2C`, Fehlertexte), ausgewertet in `server/index.js` und `server/rooms.js`.

- Pro Verbindung höchstens 30 Nachrichten/s (Burst 60), größere Mengen werden verworfen, dauerhaftes Fluten trennt die Verbindung. Einzelne Nachrichten dürfen höchstens 16 KB groß sein.
- Der Server ist autoritativ. Clients schicken nur Wünsche: Karten-IDs, Plätze, Koordinaten, Modus-ID. Alle Werte wie Elixier, Zeiten oder Draft-Angebote setzt und prüft der Server.

## Versionsprüfung

`hello` muss `protocol: 2` enthalten. Fehlt die Angabe oder passt sie nicht, antwortet der Server mit `{ type: 'error', code: 'OUTDATED', message: 'Turmtrubel wurde aktualisiert – bitte Seite neu laden.' }` und legt keine Sitzung an. Alte Clients (Version 1) zeigen diese Meldung als Hinweis an. Der aktuelle Client zeigt zusätzlich ein Banner mit „Seite neu laden“.

## Client → Server

| Typ | Felder | Neu in v2 | Bedeutung |
|---|---|---|---|
| `hello` | `name`, `token?`, `protocol` | `protocol` | Anmelden oder Sitzung fortsetzen (Reconnect) |
| `create` | `deck?`, `mode?` | `mode` | Freundschaftskampf erstellen. `mode` ist eine **ID** aus `data/modes.json` (Standard `classic`). Draft-Modi brauchen kein `deck`. |
| `join` | `code`, `deck?` | – | Raum per Code betreten. Das Deck prüft der Server je nach Modus des Raums. |
| `training` | `deck?`, `mode?`, `difficulty?` | `mode`, `difficulty` | Einzelspieler gegen Bot. `difficulty`: `easy`, `medium` (Standard) oder `hard`. Nur für Modi mit `botsAllowed`. |
| `deck` | `deck` | – | Deck in der Lobby wechseln (in Draft-Modi ohne Wirkung) |
| `ready` | `ready` | – | Bereit / nicht bereit |
| `seat` | `seat` | ✓ | Team-Lobby: freien Platz wählen (auch im anderen Team) |
| `move` | `from`, `to` | ✓ | Nur Gastgeber: Spieler auf freien Platz verschieben oder zwei Spieler tauschen |
| `kick` | `seat` | ✓ | Nur Gastgeber: Spieler aus der Lobby entfernen |
| `draftPick` | `card` | ✓ | Karte im Draft wählen (Karten-ID als Text) |
| `loaded` | – | – | Ladebildschirm fertig |
| `play` | `slot`, `card`, `x`, `y`, `seq` | – | Karte ausspielen. Zusatzfelder (z. B. `elixir`, `cost`) werden ignoriert. |
| `ability` | `seq` | – | Champion-/Heldenfähigkeit |
| `emote` | `id` | – | Emote (Index 0–5) |
| `mapPing` | `x`, `y` | ✓ | Nur 2 gegen 2: Zeichen für den Teamkollegen (Arena-Koordinaten, Abklingzeit 2 s) |
| `perkPick` | `perk` | Chaos | Einen der zwei angebotenen Perks wählen (Perk-ID als Text, z. B. `giant.rare`), siehe Abschnitt „Modus Chaos“ |
| `surrender` | – | – | Aufgeben. Im 2 gegen 2 heißt das „Kampf verlassen“: ein Bot übernimmt den Platz. |
| `rematch` | `want` | – | Rematch-Wunsch; startet erst, wenn alle Plätze zustimmen |
| `leave`, `name`, `ping` | – | – | wie Version 1 |

## Server → Client

| Typ | Felder | Neu in v2 |
|---|---|---|
| `welcome` | `token`, `name`, `resumed`, `inRoom`, `dataVersion`, `protocol` | – |
| `lobby` | `code`, `state`, `you` (Platz), `training`, `expiresIn`, `players[]`, **`mode`** (Kurzinfo mit `id`, `name`, `short`, `icon`, `players`, `teams`, `deckSource`, `draft`, `rules[]`), **`host`** (Platz des Gastgebers), **`teams`** (Platz → Team), **`difficulty`** | `mode`, `host`, `teams`, `difficulty`, `players[i].team` |
| `countdown` | `n` (−1 = Abbruch) | wird auch nach dem Draft-Reveal genutzt |
| `draft` | `you`, `mode`, `names[]`, `bots[]`, `timer` (`total` = eine Frist für alle Picks, `pick` = Frist pro Wahl), `timerSeconds` (Länge der Frist), `timeLeft`, `kind` plus je Art: **Triple** `round` (eigene Runde, jeder im eigenen Tempo), `rounds`, `offer[]` (eigenes Angebot, leer wenn fertig), `picks[]` (eigene), `mineDone`, `oppOffers[]` (aktuelle Angebote der anderen, eigener Platz `null`), `oppCounts[]` (nur Anzahl ihrer Picks, eigener Platz `null`), `done` · **Mega** `pool[40]`, `taken[[id, platz]]`, `turn`, `first`, `perPlayer`, `picks[][]`, `allowed[]` (für mich wählbar), `done` | ✓ |
| `draftReveal` | `decks[][]`, `names[]`, `teams[]`, `seconds` | ✓ |
| `matchInit` | `side` (**Team**), **`me`** (Platz), **`teams`**, `names[]` (alle Plätze), **`bots[]`**, `types`, `deck`, `training`, `matchNo`, **`mode`**, `rules` (effektive Regeln des Modus, z. B. `elixir.rate` 7, `elixir.phases` false) | `me`, `teams`, `bots`, `mode` |
| `matchStart` | `resume?` | – |
| `s` (Snapshot) | siehe unten | Team-Felder |
| `reject` | `seq`, `code`, `message` | neuer Code `TOO_FAST` |
| `matchEnd` | `you` (**Team**), **`me`** (Platz), **`teams`**, `winner` (Team), `reason`, `crowns[2]`, `names[]`, **`bots[]`**, `towerHp`, `stats[]` (**pro Platz**), `time`, `rematch[]`, `rematchAvailable`, `training`, **`mode`**, **`decks`** (Draft-Decks oder `null`) | ✓ |
| `rematchState` | `want[]` (pro Platz), `available` | Länge = Spielerzahl |
| `presence` | `side` (Platz), **`team`**, **`name`**, `connected`, `graceLeft` | `team`, `name` |
| `teamPing` | `seat`, `name`, `x`, `y` | ✓ (nur an das eigene Team) |
| `takeover` | `seat`, `name`, `bot` | ✓ |
| `notice` | `message`, `takenOver?` | `takenOver`: Rückkehr nach Ablauf der Frist |
| `perkRound` | siehe „Modus Chaos“ | Chaos |
| `perkResult` | siehe „Modus Chaos“ | Chaos |
| `roomClosed` | `reason` (`left`, `hostLeft`, `expired`, **`kicked`**), `message` | `kicked` |
| `error` | `code`, `message` | neue Codes siehe unten |

### Snapshot `s`

Gemeinsamer Teil pro Tick, unverändert gegenüber Version 1:

- `k` Tick, `t` Zeit, `tl` Restzeit, `ph` Phase
- `em` Elixier-Faktor: klassisch 1/2/3, Unendlich-Elixier durchgehend 7
- `cr` Kronen pro Team
- `e` Entitäten, `p` Geschosse, `z` Zonen, `ev` Ereignisse

Dazu `me` pro Spieler. Erweiterungen nur in Team-Modi (mehr Spieler als Teams), damit der klassische Snapshot Byte für Byte gleich bleibt:

- **Entität:** `[id, typ, owner, x, y, hp, maxHp, flags, shield, target, facing, aux, pl]`. `owner` ist das Team (Farbe, Freund/Feind), `pl` der Spieler, dem die Einheit gehört. Daran markiert der Client Einheiten des Teamkollegen.
- **`me.tm`:** `[[platz, elixier, zuletztGespielt], …]` für die eigenen Teamkollegen. Gegner sehen das nicht.
- **Ereignisse mit Spieler-Index:** `pl` (Karte gespielt), `em` (Emote), `ab` (Fähigkeit), `el` (Elixier erhalten) tragen den **Platz**. Der Client rechnet daraus über `teams` das Team aus. Ereignisse mit `owner` (Tod, Turm, Einschläge) tragen das Team.

## Fehler- und Ablehnungscodes (neu)

| Code | Text |
|---|---|
| `OUTDATED` | Turmtrubel wurde aktualisiert – bitte Seite neu laden. |
| `UNKNOWN_MODE` | Diesen Spielmodus gibt es nicht. (auch bei gefälschten Modus-Objekten statt ID) |
| `NO_BOTS` | Diesen Modus gibt es nur mit Freunden (Multiplayer). |
| `BAD_DIFFICULTY` | Unbekannte Schwierigkeitsstufe. |
| `NOT_HOST` | Das darf nur der Gastgeber. |
| `SEAT_TAKEN` / `BAD_SEAT` | Platz besetzt / gibt es nicht |
| `NOT_IN_LOBBY` | Das geht nur in der Lobby. |
| `KICKED` | Der Gastgeber hat dich aus dem Raum entfernt. |
| `TAKEN_OVER` | Die Frist zum Wiederverbinden ist abgelaufen – ein Bot hat deinen Platz übernommen. |
| Draft: `NOT_DRAFTING`, `NOT_YOUR_TURN`, `NOT_OFFERED`, `ALREADY_PICKED`, `TAKEN`, `CHAMPION_LIMIT`, `HERO_LIMIT`, `CONFLICT` | siehe `DRAFT_REJECTS` |
| Kampf: `TOO_FAST` | Zu schnell – warte kurz bis zur nächsten Karte. (Eingabe-Limit, z. B. Unendlich-Elixier) |
| Kampf: `MIRROR_CHAMPION` | Der Spiegel kann keinen Champion kopieren. |
| Kampf: `PAUSED` | Perk-Auswahl läuft – gleich geht es weiter. (Chaos: `play` und `ability` während einer Auswahlpause) |
| `NOT_IN_POOL` | Im Chaos-Modus sind nur Karten aus dem Chaos-Kartenpool erlaubt. Nicht erlaubt: … (`create`, `join`, `training`, `deck`) |
| Perk-Wahl: `NO_ROUND`, `PERK_NOT_OFFERED`, `ALREADY_PICKED` | siehe `PERK_REJECTS` |

## Ablauf eines Raums

```
lobby ──(alle Plätze besetzt + bereit)──▶ countdown (3 s)
   ├─ deckSource "saved" ──▶ loading ──▶ playing ──▶ ended ──(alle wollen Rematch)──▶ countdown …
   └─ deckSource "draft" ──▶ draft ──▶ reveal (5 s, letzte 3 s Countdown) ──▶ loading ──▶ playing …
```

- **Reconnect:** `hello` mit Token innerhalb von 30 s. Der Server schickt den Zustand der aktuellen Phase: Lobby, Draft mit Restzeit, Reveal, `matchInit` mit `resume` oder das Ergebnis. Auto-Picks laufen im Draft auch ohne Verbindung weiter.
- **Endgültige Trennung:**
  - Klassisch und Draft im Kampf: Niederlage durch Verbindungsabbruch.
  - Während des Drafts: Der Draft wird abgebrochen, der andere bekommt eine Meldung. Ist der Gastgeber weg, wird der Raum geschlossen.
  - 2 gegen 2 im Kampf: Ein Bot übernimmt den Platz, solange noch ein Mensch im Raum ist. Danach ist kein Rematch mehr möglich.

## Modus Chaos (Erweiterung, Version bleibt 2)

Alle Felder kommen nur in Räumen mit dem Modus `chaos` vor; klassische Nachrichten und Snapshots bleiben Byte für Byte gleich.

- **Daten:** `/data/chaos.json` (Kartenpool, Faktoren, Rundenplan, Seltenheiten) und `/data/chaos_perks.json` (120 Perks) liefert der Server wie die übrigen Daten aus dem Speicher. Sie fließen in `dataVersion` ein.
- **Decks:** `create`, `join`, `training` und `deck` mit Karten außerhalb von `cardPool` → `NOT_IN_POOL`. Der Bot bekommt ein Zufallsdeck nur aus dem Pool.
- **`matchInit.chaos`:** `towerHpMultiplier`, `elixirRateMultiplier`, `fixedLevel`, `rounds`, `schedule[]` (Spielzeit der Runden in s), `lastRoundOvertimeOnly`, `pickSeconds`, `chosen[][]` (bisher gewählte Perks je Platz, siehe unten), `pauseTotal` (s). Die Turm-Leben stehen wie immer in `maxHp` der Entitäten.
- **Snapshot-Zusätze:** `pt` Pausenzeit gesamt in s (Wanduhr, zählt nicht zur Spielzeit) · `pz` `[runde, restzeit]` nur während einer Auswahlpause · `pe` flach `[id, stufe, id, stufe, …]` für Einheiten mit Perk (Stufe 1 Gewöhnlich, 2 Selten, 3 Episch). Während der Pause schickt der Server zwei Snapshots pro Sekunde mit unverändertem `k`/`t`.
- **Ereignis `pk`:** `['pk', platz, typIndexDerKarte, stufe]` – ein Perk wurde einer Karte zugewiesen (für die Kennzeichnung im Kampf).

### Auswahlrunde

1. Erreicht die Spielzeit eine Rundenzeit (nach einem vollständigen Tick), hält der Server die Simulation an. Die letzte Runde gibt es nur in der Verlängerung.
2. `perkRound` an jeden Spieler einzeln: `round` (1-basiert), `rounds`, `timeLeft` (s), `pickSeconds`, `weights` (Seltenheiten dieser Runde in %), `options[]` (eigene zwei Optionen: `{ id, card, tier, name, description, mechanic }`, leer wenn übersprungen), `skipped`, `picked` (eigene Wahl oder `null`), `done[]` (je Platz: fertig oder übersprungen), `pauseTotal`. Nach jeder Wahl kommt ein aktualisiertes `perkRound`.
3. `perkPick { perk }` – der Server nimmt nur eine der eigenen zwei Optionen an (`PERK_NOT_OFFERED`, `ALREADY_PICKED`, `NO_ROUND`).
4. Haben alle gewählt (oder ist die Frist abgelaufen – dann wählt der Server zufällig), kommt `perkResult` an alle: `round`, `rounds`, `skipped`, `picks[]` (Perk je Platz oder `null`), `auto[]` (zufällig gewählt?), `chosen[][]` (alle Perks bisher: `{ round, auto, id, card, tier, name, description, mechanic }`), `pauseTotal`. Danach läuft die Simulation sofort weiter.
5. Hat kein Spieler mehr eine perk-freie Karte, entfällt die Runde ohne Pause (`perkResult` mit `skipped: true`).

- **Reconnect während einer Pause:** nach `matchInit` (mit `resume`) und `matchStart` folgt `perkRound` mit denselben Optionen und der exakten Restzeit. Die Frist läuft auf der Wanduhr weiter; wer nicht zurückkommt, bekommt nach Ablauf eine zufällige Wahl.
- **`matchEnd`:** zusätzlich `perks[][]` (wie `chosen`) und `pauseTotal`.
