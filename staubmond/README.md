# Staubmond

Eine entspannte Mondputz- und Automatisierungs-Simulation: von der Zahnbürste bis zur Roboterflotte.
Das ganze Spiel steckt in einer einzigen Datei, `index.html`. Es braucht keinen Build-Schritt und keine Assets: Grafik entsteht per Canvas, Klang per Web Audio.

## Starten

- `index.html` direkt im Browser öffnen, oder
- lokal ausliefern, z. B. `python3 -m http.server` in diesem Ordner und dann `http://localhost:8000` aufrufen.

Am Smartphone/iPad: Seite im Browser öffnen und „Zum Home-Bildschirm“ hinzufügen, dann läuft das Spiel im Vollbild. Beim ersten Start am Touch-Gerät erklärt eine kleine Karte, wie das geht.

## Steuerung

| | Desktop | Touch (Handy/iPad) |
|---|---|---|
| Bewegen / Fahren | WASD / Pfeiltasten | virtueller Joystick (links) |
| Putzen | Leertaste oder linke Maustaste (halten) | Putz-Knopf (rechts, halten) |
| Interagieren | E | Kontext-Knöpfe |
| Bauen / Drehen / Verschieben / Abreißen | B / R / M / X, Strg+Z | Bauleiste |
| Karte | Tab oder M | Minimap antippen |
| Zoom | Mausrad, + / − | Zwei-Finger-Pinch |
| Crew & Emotes (Koop) | C | Crew-Knopf im HUD |

Alle Tasten lassen sich in den Einstellungen (Steuerung) neu belegen. Dort gibt es auch einen Linkshänder-Modus und den festen Joystick. Tastenkürzel werden nur angezeigt, wenn eine Tastatur benutzt wird.

Panels schließen per X, Esc, Antippen der abgedunkelten Welt oder Wischen nach rechts (am Handy: Griff nach unten ziehen). Wischen nach links/rechts wechselt die Tabs.

## Koop (optional)

Pausenmenü → **Koop (Einladungscode)** → **Hosten**. Mitspieler geben den 6-stelligen Code unter **Koop beitreten** ein (bis zu 8 Personen).

- **Internet:** WebRTC über PeerJS (wird nur für Koop von jsDelivr nachgeladen).
- **Dieses Gerät (Tabs):** BroadcastChannel, funktioniert offline, z. B. mit zwei Tabs.

Die Kasse ist gemeinsam, gespeichert wird beim Host. Clients behalten ihren eigenen Spielstand.

## Grafik und Effekte

Einstellungen → **Grafik** (Qualitätsstufe Niedrig/Mittel/Hoch/Ultra oder Automatisch) und **Effekte** (Effektstärke, Lichtblitze, Kamera-Wackeln, Kamera-Impulse, Bewegung reduzieren) – jeweils mit Live-Vorschau. „Bewegung reduzieren“ übernimmt beim ersten Start die Systemeinstellung. Der Boden wird per WebGL gezeichnet; ohne WebGL fällt das Spiel auf Canvas zurück.

## Ladebildschirm

Beim Öffnen erscheint sofort (noch ohne JavaScript) eine einfache Mondszene, die dann in die animierte Szene „Der Mond hat einen Termin“ überblendet: Ein Astronaut putzt mit der Zahnbürste den Mond, die geputzte Fläche und der **Mondglanz-Index** folgen dem echten Fortschritt der sechs Start-Stufen. Am Ende startet eine Kapsel, danach führt „Zum Starten tippen“ (Desktop: Klick oder Enter) ins Hauptmenü und schaltet den Ton frei.

- „Effekte vereinfachen“ (unten links) und der Lautsprecher (unten rechts) werden gemerkt.
- „Bewegung reduzieren“ (System oder Einstellungen) zeigt ruhige Standbilder statt Animation.
- Fehler beim Start zeigen eine Meldung mit „Neu laden“ und technischen Details; fehlt IndexedDB oder ist ein Spielstand beschädigt, erscheint ein gelber Hinweis, und das Spiel nutzt wie gewohnt den Notfall-Speicher bzw. das letzte Backup.

Die Vorgabe steht in `LADEBILDSCHIRM_SPEC.md`.

## Debug

F3 oder fünfmal auf den Geldbetrag tippen öffnet das Debug-Overlay. Dort gibt es FPS und Profiling (inkl. Effektkosten pro Frame), die Pacing-Simulation, den Zeitraffer (×1/×4/×16) und ein Effekt-Testmenü (Sektor, Lizenz, Kapsel, Meteorschauer, Fundstück, Kauf, Auftrag), das die Effekte rein optisch abspielt, ohne Spielwerte zu ändern.

Alle Balancing-Werte stehen zentral im `CONFIG`-Objekt, alle optischen Werte in `THEME` (Farben, Bewegung, HUD) und `FX_CONFIG` (Qualitätsstufen, Partikel, Effekte). Die Design-Entscheidungen sind im Kommentarblock am Anfang des Skripts dokumentiert; die Vorgaben für die VFX- und UI-Überarbeitung und den Ladebildschirm stehen in `VFX_UI_SPEC.md` und `LADEBILDSCHIRM_SPEC.md`.
