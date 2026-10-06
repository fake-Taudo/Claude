# Handgepflegte Kartendefinitionen (Quelle: data/source/wiki-cards.json, Level 11).
# Erzeugt data/cards.json. Werte: Leben/Schaden absolut (Level 11), Zeiten in s,
# Reichweiten/Radien in Feldern, Tempo in Feldern/s (Wiki-Tempo / 60).
CARDS = []
TOKENS = {}
NOTES = []  # → TODO_missing_stats.md: (karte, text)

def note(card, text):
    NOTES.append((card, text))

def card(**kw):
    CARDS.append(kw)
    return kw

def token(id, **kw):
    TOKENS[id] = kw
    return kw

# Tempo-Klassen des Wikis (Wert/60 = Felder pro Sekunde)
VSLOW, SLOW, MED, FAST, VFAST, UFAST = 0.5, 0.75, 1.0, 1.5, 2.0, 2.25

# Körpergrößen (eigene Näherung für Kollision/Schieben, keine Kartenwerte)
def size(kind):
    return {
        'tiny': {'radius': 0.3, 'mass': 1},
        'small': {'radius': 0.4, 'mass': 3},
        'med': {'radius': 0.5, 'mass': 6},
        'large': {'radius': 0.6, 'mass': 10},
        'big': {'radius': 0.75, 'mass': 18},
        'huge': {'radius': 0.9, 'mass': 22},
    }[kind]

def U(**kw):
    """Einheit: size=… setzt radius/mass, Rest 1:1."""
    s = kw.pop('size', 'med')
    out = dict(size(s))
    out.update(kw)
    return out

def P(kind, speed, **kw):
    out = {'kind': kind, 'speed': speed}
    out.update(kw)
    return out
