# Staubmond

Eine entspannte Mondputz- und Automatisierungs-Simulation: von der Zahnbürste bis zur Roboterflotte.
Das ganze Spiel steckt in einer einzigen Datei, `index.html`. Es braucht keinen Build-Schritt und keine Assets: Grafik entsteht per Canvas, Klang per Web Audio.

## Starten

- `index.html` direkt im Browser öffnen, oder
- lokal ausliefern, z. B. `python3 -m http.server` in diesem Ordner und dann `http://localhost:8000` aufrufen.

Am Smartphone/iPad: Seite im Browser öffnen und „Zum Home-Bildschirm“ hinzufügen, dann läuft das Spiel im Vollbild.

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

Alle Tasten lassen sich in den Einstellungen neu belegen. Dort gibt es auch einen Linkshänder-Modus und den festen Joystick.

## Koop (optional)

Pausenmenü → **Koop (Einladungscode)** → **Hosten**. Mitspieler geben den 6-stelligen Code unter **Koop beitreten** ein (bis zu 8 Personen).

- **Internet:** WebRTC über PeerJS (wird nur für Koop von jsDelivr nachgeladen).
- **Dieses Gerät (Tabs):** BroadcastChannel, funktioniert offline, z. B. mit zwei Tabs.

Die Kasse ist gemeinsam, gespeichert wird beim Host. Clients behalten ihren eigenen Spielstand.

## Debug

F3 oder fünfmal auf den Geldbetrag tippen öffnet das Debug-Overlay. Dort gibt es FPS und Profiling, die Pacing-Simulation und den Zeitraffer (×1/×4/×16).

Alle Balancing-Werte stehen zentral im `CONFIG`-Objekt. Die Design-Entscheidungen sind im Kommentarblock am Anfang des Skripts dokumentiert.
