# Planet RNG – Plan

## Architektur

```
config/   Alle Zahlen und Inhalte (Auren, Stufen, Tränke, Shop, Rebirth, Biome, Erfolge, Timings)
core/     Reine Spiellogik ohne DOM: RNG, Roll-Modell, Modifikatoren, Engine-Aktionen,
          Shop-Rotation, Biome, Quests/Erfolge, Offline-Nachholen, Speicherformat, Formatierung
store/    Zentraler Zustand + Event-Bus, Persistenz (localStorage + Backup), Einstellungen, UI-Zustand
game/     Ablaufsteuerung mit Timern: Roll-Schleife (manuell/Auto/Quick), Cutscene-Gating,
          Tick, Autosave, Sichtbarkeit/AFK
render/   Canvas-Renderer: Hintergrund, Biome, Planet, Aura-VFX (Partikel-Pool), Roll-/Reveal-FX,
          Cutscene-Baukasten, UI-Partikel
audio/    Web Audio: prozedurale SFX, Samples (Deep Boom, Plop), Ambient-Musik
ui/       Preact-Komponenten, rendern reaktiv aus dem Store
```

Datenfluss: UI/Tastatur → `game/controller` bzw. `store.apply(engineAction)` → Engine mutiert den
Zustand und liefert Events → Store benachrichtigt die UI (gebündelt) und sendet Events über den Bus →
Renderer, Audio und UI-Effekte reagieren. Kein Render-Code wird manuell synchron gehalten.

## Datenmodell (Kurzfassung)

- `GameState` (versioniert, JSON): Seed + RNG-Zustand, Gold (ganzzahlig in Tausendstel), Aura-Bestand,
  Entdeckungen, Sperren, Ausrüstung (Aura + Item), Tränke, Items, Buffs (absolute Zeitstempel oder
  Ladungen), Rebirth-Stufe, Shop-Käufe der aktuellen Rotation, Quests, Erfolge, Statistik, Verlauf,
  laufender Roll, Auto-Status, Tutorial.
- `Settings` getrennt gespeichert (bleiben beim Löschen des Spielstands erhalten).

## Phasen

1. Fundament: Setup, Konfiguration, RNG + Luck-Modell + Tests, Zustand, Speicherstand, Design-Tokens
2. Kern-UI und Roll-Loop: HUD, Roll/Auto/Quick, Reveal, Inventar, Index, Verkaufen, Einstellungen
3. Aura-VFX: Partikelsystem, Planet, Optik aller Auren, Stufen-Inszenierung
4. Cutscenes und Audio
5. Wirtschaft und Items: Shop, Items, Ausrüstung, Aktive Effekte
6. Tränke, Schmiede, Rebirth, Balancing-Simulation
7. Meta und Politur: Erfolge, Quests, Statistik, Biome, Feed, Tutorial, Performance, Abnahme
