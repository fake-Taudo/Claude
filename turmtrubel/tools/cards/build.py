# Baut data/cards.json und TODO_missing_stats.md aus den Definitionen.
# Aufruf (im Projektordner): python3 tools/cards/build.py
import json, os, sys, collections
import defs
import defs_troops_a, defs_troops_b, defs_spells, defs_heroes  # noqa: F401 (füllen defs.CARDS)
try:
    import defs_looks
except ImportError:
    defs_looks = None

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + os.sep
SNAP = json.load(open(ROOT + 'data/source/wiki-cards.json'))

ORDER = ['id', 'src', 'name', 'type', 'rarity', 'class', 'heroOf', 'elixir', 'elixirRule', 'forms', 'count', 'formation', 'notInStartingHand',
         'description', 'unit', 'groups', 'spell', 'look', 'evo', 'ability']

def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items() if v is not None}
    if isinstance(o, list):
        return [clean(v) for v in o]
    if isinstance(o, float) and o.is_integer() and abs(o) < 1e8:
        return int(o)
    return o

cards = []
for c in defs.CARDS:
    c = dict(c)
    if 'cls' in c:
        c['class'] = c.pop('cls')
    if defs_looks:
        defs_looks.apply(c)
    out = {k: c[k] for k in ORDER if k in c}
    extra = set(c) - set(ORDER)
    if extra:
        sys.exit(f"{c['id']}: unbekannte Felder {extra}")
    cards.append(clean(out))

tokens = {}
for tid, t in defs.TOKENS.items():
    t = dict(t)
    if defs_looks:
        defs_looks.apply_token(tid, t)
    tokens[tid] = clean(t)

ids = [c['id'] for c in cards]
dupe = [k for k, n in collections.Counter(ids + list(tokens)).items() if n > 1]
if dupe:
    sys.exit('Doppelte IDs: ' + ', '.join(dupe))

# Prüfen: jede reguläre Wiki-Karte genau einmal, jede Variante abgedeckt
srcs = {c['src'] for c in cards}
missing = [t for t in SNAP['regular'] if t not in srcs]
evo_srcs = {c['src'] + '/Evolution' for c in cards if 'evo' in c}
hero_srcs = {c['src'] for c in cards if c.get('class') == 'hero'}
for v in SNAP['variants']:
    if v.endswith('/Evolution') and v not in evo_srcs:
        missing.append(v)
    if v.endswith('/Hero') and v not in hero_srcs:
        missing.append(v)
if missing:
    print('FEHLT:', missing)

raw = json.load(open(ROOT + 'data/cards.json')) if '--keep-header' in sys.argv else {}
data = {
    '_info': 'Kartendatenbank von Turmtrubel – echte Clash-Royale-Karten (Quelle: Clash Royale Wiki, Snapshot data/source/wiki-cards.json). '
             'Werte auf Turnierstandard Level 11, Skalierung über rules.json → cardLevel. Einheiten: Leben/Schaden absolut, Zeiten in s, '
             'Reichweiten/Radien in Feldern, Tempo in Feldern/s (Wiki-Tempo ÷ 60). targets: ground | air | both | buildings. '
             'Namen, Beschreibungen und Aussehen lassen sich über data/skin.json ersetzen.',
    'version': 2,
    'level': 11,
    'rarities': {
        'common': {'name': 'Gewöhnlich', 'color': '#9fb3c8'},
        'rare': {'name': 'Selten', 'color': '#f39c3d'},
        'epic': {'name': 'Episch', 'color': '#b55cf0'},
        'legendary': {'name': 'Legendär', 'color': '#2fd3c6'},
        'champion': {'name': 'Champion', 'color': '#ffc93c'},
    },
    'cards': cards,
    'tokens': tokens,
}

def dump(d):
    # Eine Karte pro Block, kompakt aber lesbar
    lines = ['{']
    keys = list(d)
    for i, k in enumerate(keys):
        comma = ',' if i < len(keys) - 1 else ''
        if k == 'cards':
            lines.append('  "cards": [')
            for j, c in enumerate(d['cards']):
                lines.append('    ' + json.dumps(c, ensure_ascii=False) + (',' if j < len(d['cards']) - 1 else ''))
            lines.append('  ]' + comma)
        elif k == 'tokens':
            lines.append('  "tokens": {')
            tk = list(d['tokens'])
            for j, t in enumerate(tk):
                lines.append('    ' + json.dumps(t) + ': ' + json.dumps(d['tokens'][t], ensure_ascii=False) + (',' if j < len(tk) - 1 else ''))
            lines.append('  }' + comma)
        else:
            lines.append('  ' + json.dumps(k) + ': ' + json.dumps(d[k], ensure_ascii=False) + comma)
    lines.append('}')
    return '\n'.join(lines) + '\n'

open(ROOT + 'data/cards.json', 'w').write(dump(data))

# TODO-Liste
by = collections.defaultdict(list)
for cid, text in defs.NOTES:
    by[cid].append(text)
names = {c['id']: c['name'] for c in cards}
no_de = [c for c in cards if c.get('class') != 'hero' and not SNAP['pages'].get(c['src'], {}).get('de') and '/' not in c['src']]
md = ['# Fehlende und unsichere Kartenwerte', '',
      'Stand des Snapshots: ' + SNAP['fetchedAt'][:10] + ' (Quelle: Clash Royale Wiki, siehe `data/source/wiki-cards.json`).', '',
      'Regel beim Übernehmen: Die Werte der einzelnen Kartenseite (Level 11) gelten. Ist eine Balance-Änderung aus der Versionshistorie 2026 dort noch nicht eingepflegt, wurde sie angewendet. '
      'Widersprüche zur Vergleichstabelle der Wiki-Übersicht sind unten vermerkt. **Platzhalter** und **geschätzt** markieren Werte, die das Wiki nicht nennt.', '',
      '## Deutsche Namen', '',
      'Für diese Karten gibt es im deutschen Wiki noch keinen Eintrag; sie tragen vorerst den englischen Originalnamen:', '',
      ', '.join(sorted(c['name'] for c in no_de)) + '.', '',
      '## Werte je Karte', '']
for cid in sorted(by, key=lambda k: names.get(k, k)):
    md.append(f"- **{names.get(cid, cid)}** (`{cid}`): " + ' '.join(by[cid]))
open(ROOT + 'TODO_missing_stats.md', 'w').write('\n'.join(md) + '\n')
print(len(cards), 'Karten,', len(tokens), 'Tokens,', len(defs.NOTES), 'Notizen')
print(collections.Counter((c['type'], c.get('class', 'normal')) for c in cards))
print('Evos:', sum(1 for c in cards if 'evo' in c), 'Helden:', sum(1 for c in cards if c.get('class') == 'hero'))
