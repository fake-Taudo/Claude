# Aussehen der Karten für die prozeduralen Cartoon-Sprites (client/js/game/sprites.js).
# Eigene Gestaltung aus Körper/Hut/Waffe/Farben – keine Original-Grafiken.
# body: hum | imp | skel | brute | golem | bot | moth | bug | winged | dragon | balloon | whale | spirit
#       | rider | blob | barrel | cart | ghost | hog | bush | machine | wagon
# Gebäude-body: cannon | turret | tesla | hut | grave | pump | inferno | mortar | ballista | barricade
#       | cage | drill | bombtower
# Zauber: icon + color. Fehlt ein Look, zeichnet der Client einen Platzhalter mit dem Kartennamen.

GOLD = '#ffd54a'
EVO = '#b98cff'

def H(**kw):
    return dict(body='hum', **kw)

UNITS = {
    'archer-queen': H(skin='#f3d2b8', cloth='#4b2a6e', hat='crown', weapon='crossbow', cape=True, accent=GOLD),
    'archers': H(skin='#f5d0b0', cloth='#d6457a', hat='ponytail', weapon='bow', hairColor='#e8743b'),
    'baby-dragon': dict(body='dragon', cloth='#5bbf6a', accent='#ffcc4d', scale=0.9),
    'balloon': dict(body='balloon', cloth='#c0392b', accent='#f4d03f'),
    'bandit': H(skin='#f2c7a5', cloth='#3b3b58', hat='mask', weapon='dagger', hairColor='#d94b4b'),
    'barbarians': H(skin='#e8b48c', cloth='#8a5a2b', hat='horns', weapon='sword', beard='#d98b2b'),
    'bats': dict(body='moth', cloth='#4a3b6b', accent='#8e7bd1', scale=0.7),
    'battle-healer': H(skin='#f3cfae', cloth='#f0e6c8', hat='helmet', weapon='hammer', accent='#ffd966'),
    'battle-ram': dict(body='cart', cloth='#8b5a2b', accent='#c9c9c9'),
    'berserker': H(skin='#f0c090', cloth='#c0392b', hat='braid', weapon='axe', hairColor='#e3c06b'),
    'bomber': dict(body='skel', weapon='bomb'),
    'boss-bandit': H(skin='#f2c7a5', cloth='#22223a', hat='mask', weapon='blades', cape=True, accent='#ff4d6d', scale=1.15),
    'bowler': dict(body='brute', skin='#7fa0d8', cloth='#3d4f7a', scale=1.15),
    'cannon-cart': dict(body='wagon', cloth='#6b6f7a', accent='#3b3b3b'),
    'dark-prince': dict(body='rider', mount='horse', skin='#d7c8f0', cloth='#2b2b3a', hat='helmet', weapon='mace', shield=True, accent='#8e7bd1'),
    'dart-goblin': dict(body='imp', skin='#7cc36b', cloth='#3a5a40', hat='mask', weapon='sling'),
    'electro-dragon': dict(body='dragon', cloth='#3c6fd8', accent='#7fe9ff'),
    'electro-giant': dict(body='brute', skin='#c7a27a', cloth='#2d4f8a', scale=1.3),
    'electro-spirit': dict(body='spirit', cloth='#7fe9ff', accent='#ffffff'),
    'electro-wizard': H(skin='#f0caa8', cloth='#2d7fd1', hat='spiky', weapon='orb', accent='#7fe9ff', hairColor='#e8f4ff'),
    'elite-barbarians': H(skin='#e8b48c', cloth='#c0392b', hat='horns', weapon='sword', beard='#f0d070', scale=1.05),
    'elixir-golem': dict(body='golem', cloth='#d77fe0', accent='#f06bd6'),
    'executioner': H(skin='#d9a37a', cloth='#3a3a3a', hat='mask', weapon='axe', scale=1.1),
    'fire-spirit': dict(body='spirit', cloth='#ff8a3d', accent='#ffe066'),
    'firecracker': H(skin='#f7cda7', cloth='#d8425a', hat='ponytail', weapon='launcher', hairColor='#3a3a3a'),
    'fisherman': H(skin='#e8b48c', cloth='#2e6f8e', hat='cap', weapon='spear', beard='#e0e0e0'),
    'flying-machine': dict(body='machine', cloth='#a0703a', accent='#d9d9d9'),
    'furnace': dict(body='golem', cloth='#5a4f4a', accent='#ff6a1a', scale=0.9),
    'giant': dict(body='brute', skin='#f0b48c', cloth='#7a5a3a', scale=1.25),
    'giant-skeleton': dict(body='skel', weapon='bomb', scale=1.5),
    'goblin-demolisher': dict(body='imp', skin='#7cc36b', cloth='#6b4f36', hat='bandana', weapon='bomb', scale=1.15),
    'goblin-giant': dict(body='brute', skin='#7cc36b', cloth='#5a4a3a', scale=1.25),
    'goblin-machine': dict(body='bot', cloth='#6f8a4a', accent='#b5ff6b', scale=1.15),
    'goblins': dict(body='imp', skin='#7cc36b', cloth='#7a4a2a', weapon='dagger'),
    'goblinstein': dict(body='imp', skin='#8fd07a', cloth='#e8e8e8', hat='circlet', weapon='wrench', cape=True, accent='#7fe9ff'),
    'golden-knight': H(skin='#f3d2b8', cloth='#e8c547', hat='hair', weapon='sword', cape=True, accent='#fff1a8', hairColor='#f7e08a'),
    'golem': dict(body='golem', cloth='#8d8f94', accent='#6fd36b', scale=1.35),
    'guards': dict(body='skel', hat='helmet', weapon='spear', shield=True),
    'heal-spirit': dict(body='spirit', cloth='#ffe066', accent='#ffffff'),
    'hog-rider': dict(body='rider', mount='boar', skin='#d9a37a', cloth='#6b4f36', hat='bald', weapon='hammer'),
    'hunter': H(skin='#e8b48c', cloth='#4a6b3a', hat='cap', weapon='launcher', beard='#8a5a2a'),
    'ice-golem': dict(body='golem', cloth='#9fdcf5', accent='#e8fbff', scale=0.85),
    'ice-spirit': dict(body='spirit', cloth='#9fe3ff', accent='#ffffff'),
    'ice-wizard': H(skin='#eef4ff', cloth='#7ec8e3', hat='hood', weapon='staff', beard='#ffffff'),
    'inferno-dragon': dict(body='dragon', cloth='#8a2b2b', accent='#ff6a1a'),
    'knight': H(skin='#f2c7a5', cloth='#8f9fb4', hat='helmet', weapon='sword', beard='#b5651d'),
    'lava-hound': dict(body='whale', cloth='#5a2b1a', accent='#ff8a1a', scale=1.2),
    'little-prince': H(skin='#f3d2b8', cloth='#3a7bd5', hat='crown', weapon='lance', cape=True, accent=GOLD, scale=0.85),
    'lumberjack': H(skin='#e8b48c', cloth='#c0392b', hat='cap', weapon='axe', beard='#8a5a2a'),
    'magic-archer': H(skin='#f2c7a5', cloth='#3a8a6a', hat='hood', weapon='bow', accent='#7fe9ff'),
    'mega-knight': H(skin='#c9b8a8', cloth='#4a4f58', hat='helmet', weapon='mace', shield=True, scale=1.35),
    'mega-minion': dict(body='winged', skin='#4a6fd6', accent='#c9d6ff', scale=1.25),
    'mighty-miner': H(skin='#e8b48c', cloth='#d68a2b', hat='miner', weapon='pick', beard='#6b4f36', cape=True, accent='#ff6a1a', scale=1.1),
    'miner': H(skin='#d9a37a', cloth='#6e5a44', hat='miner', weapon='pick', beard='#6b4f36', scale=0.9),
    'mini-pekka': dict(body='bot', cloth='#9aa3ad', accent='#5ecbff', scale=0.85),
    'minion-giant': dict(body='winged', skin='#3a5ab0', accent='#c9d6ff', scale=1.5),
    'minions': dict(body='winged', skin='#5d7fd6', accent='#c9d6ff'),
    'monk': H(skin='#e0b08a', cloth='#c99a3a', hat='monk', weapon='fists', beard='#dddddd', cape=True, accent='#ffe14d'),
    'mother-witch': H(skin='#c9b8e0', cloth='#3a2a5a', hat='witch', weapon='staff', accent='#ff7fd0'),
    'musketeer': H(skin='#f5d0b0', cloth='#5a3a8a', hat='plume', weapon='crossbow', hairColor='#3a2a2a'),
    'night-witch': H(skin='#c9b8e0', cloth='#2a2240', hat='horns', weapon='staff', accent=EVO),
    'pekka': dict(body='bot', cloth='#4a5663', accent='#b98cff', scale=1.3),
    'phoenix': dict(body='dragon', cloth='#ff6a1a', accent='#ffd54a'),
    'prince': dict(body='rider', mount='horse', skin='#f1c6a0', cloth='#d6b440', hat='crown', weapon='lance'),
    'princess': H(skin='#f6d3b3', cloth='#e57fb2', hat='tiara', weapon='bow', hairColor='#f7e08a'),
    'ram-rider': dict(body='rider', mount='ram', skin='#f1c6a0', cloth='#8a5aa8', hat='braid', weapon='sling', hairColor='#e8743b'),
    'ronin': H(skin='#f2c7a5', cloth='#3a3a5a', hat='ponytail', weapon='sword', accent='#ff4d6d', hairColor='#1d1d2a'),
    'royal-ghost': dict(body='ghost', cloth='#e8f0ff', accent=GOLD),
    'royal-giant': dict(body='brute', skin='#f0b48c', cloth='#3a5ab0', scale=1.25),
    'royal-hogs': dict(body='hog', cloth='#f0a0a8', accent=GOLD, scale=0.8),
    'royal-recruits': H(skin='#f2c7a5', cloth='#3a5ab0', hat='helmet', weapon='spear', shield=True),
    'rune-giant': dict(body='brute', skin='#9fa8c8', cloth='#4a3a6a', scale=1.25),
    'skeleton-barrel': dict(body='balloon', cloth='#b0b8c8', accent='#8b5a2b'),
    'skeleton-dragons': dict(body='dragon', cloth='#e8e1d0', accent='#9aa3ad', scale=0.85),
    'skeleton-king': dict(body='skel', hat='crown', weapon='mace', cape=True, accent='#7fe9ff', scale=1.4),
    'skeletons': dict(body='skel', weapon='dagger', scale=0.8),
    'sparky': dict(body='wagon', cloth='#4a4f58', accent='#7fe9ff', scale=1.1),
    'spear-goblins': dict(body='imp', skin='#96d67f', cloth='#3a6ea5', weapon='spear'),
    'suspicious-bush': dict(body='bush', cloth='#4f9a3a', accent='#7fcf5a'),
    'three-musketeers': H(skin='#f5d0b0', cloth='#3a7bd5', hat='plume', weapon='crossbow', hairColor='#3a2a2a'),
    'valkyrie': H(skin='#f3cfae', cloth='#c46a2b', hat='braid', weapon='axe', hairColor='#e8743b'),
    'wall-breakers': dict(body='skel', hat='bandana', weapon='bomb', scale=0.85),
    'witch': H(skin='#d9c2e8', cloth='#5b2d82', hat='witch', weapon='staff'),
    'wizard': H(skin='#f2c7a5', cloth='#c0392b', hat='wizard', weapon='staff'),
    'zappies': dict(body='bot', cloth='#7a8a9a', accent='#7fe9ff', scale=0.75),
    # Gebäude
    'barbarian-hut': dict(body='hut', cloth='#8a5a32', accent='#c0392b'),
    'bomb-tower': dict(body='bombtower', cloth='#7d6e5d', accent='#3b3b3b'),
    'cannon': dict(body='cannon', cloth='#4b4f58', accent='#b07a3e'),
    'elixir-collector': dict(body='pump', cloth='#9b59b6', accent='#f06bd6'),
    'goblin-cage': dict(body='cage', cloth='#8b5a2b', accent='#7cc36b'),
    'goblin-drill': dict(body='drill', cloth='#8a8f99', accent='#7cc36b'),
    'goblin-hut': dict(body='hut', cloth='#7a5a32', accent='#5aa04e'),
    'inferno-tower': dict(body='inferno', cloth='#5b3a3a', accent='#ff6a1a'),
    'mortar': dict(body='mortar', cloth='#7d6e5d', accent='#caa472'),
    'tesla': dict(body='tesla', cloth='#5f6b7a', accent='#7fe9ff'),
    'tombstone': dict(body='grave', cloth='#8e9aa6', accent='#6fd36b'),
    'x-bow': dict(body='ballista', cloth='#7a5634', accent='#d9d9d9'),
}

SPELLS = {
    'arrows': dict(icon='arrows', color='#d4a15a'),
    'barbarian-barrel': dict(icon='barrel', color='#8b5a2b'),
    'clone': dict(icon='clone', color='#5ecbff'),
    'earthquake': dict(icon='quake', color='#a0703a'),
    'fireball': dict(icon='fireball', color='#ff7a2f'),
    'freeze': dict(icon='freeze', color='#aee9ff'),
    'giant-snowball': dict(icon='snowball', color='#e8f4ff'),
    'goblin-barrel': dict(icon='barrel', color='#5a8a3a'),
    'goblin-curse': dict(icon='curse', color='#7cc36b'),
    'graveyard': dict(icon='grave', color='#7d8ca3'),
    'lightning': dict(icon='storm', color='#ffe14d'),
    'mirror': dict(icon='mirror', color='#cfe8ff'),
    'poison': dict(icon='poison', color='#7ccf3a'),
    'rage': dict(icon='rage', color='#c25bd6'),
    'rocket': dict(icon='comet', color='#ff4f4f'),
    'royal-delivery': dict(icon='crate', color='#3a7bd5'),
    'the-log': dict(icon='log', color='#9b6a3a'),
    'tornado': dict(icon='tornado', color='#9fb3c8'),
    'vines': dict(icon='vines', color='#4f9a3a'),
    'void': dict(icon='void', color='#5b2d82'),
    'zap': dict(icon='zap', color='#6fd3ff'),
}

# Evolutionen: sichtbar veränderte Farben/Teile (zusätzlich zum Evo-Leuchten des Clients)
EVOS = {
    'archers': dict(cloth='#4e7fd0', accent='#9fe8ff', hat='hood'),
    'baby-dragon': dict(cloth='#4aa3c8', accent='#b5f0ff'),
    'barbarians': dict(cloth='#5b3a8a', accent='#ff6a3d', beard='#ff9a4d'),
    'bats': dict(cloth='#2a1f4a', accent='#ff7fd0'),
    'battle-ram': dict(cloth='#5b3a8a', accent=EVO),
    'bomber': dict(weapon='launcher', accent='#ffb347'),
    'dart-goblin': dict(cloth='#5b2d82', accent='#b5ff6b'),
    'electro-dragon': dict(cloth='#2a3f9a', accent='#ffffff'),
    'elite-barbarians': dict(cloth='#8a2b5a', accent=GOLD, beard='#ffffff'),
    'executioner': dict(cloth='#5b2d82', accent='#ff5e3a'),
    'firecracker': dict(cloth='#5b2d82', accent='#ffe066'),
    'furnace': dict(cloth='#3a2a4a', accent='#ffd54a'),
    'goblin-giant': dict(cloth='#5b3a8a'),
    'hunter': dict(cloth='#3a2a5a', accent=GOLD),
    'ice-spirit': dict(cloth='#d7b5ff', accent='#ffffff'),
    'inferno-dragon': dict(cloth='#5b2d82', accent='#ffd54a'),
    'knight': dict(cloth='#6a7fa8', accent='#9fe8ff', beard='#7a4a2a'),
    'lumberjack': dict(cloth='#5b2d82', accent='#9fe8ff'),
    'mega-knight': dict(cloth='#3a2a5a', accent=EVO),
    'minion-horde': dict(skin='#7a5cd6', accent='#ffd54a'),
    'musketeer': dict(cloth='#2a2240', accent=GOLD),
    'pekka': dict(cloth='#3a2a4a', accent='#ff5e3a'),
    'princess': dict(cloth='#7a5cd6', accent='#9fe8ff'),
    'royal-ghost': dict(cloth='#d7b5ff', accent=EVO),
    'royal-giant': dict(cloth='#5b3a8a'),
    'royal-hogs': dict(cloth='#d7a0f0', accent=EVO),
    'royal-recruits': dict(cloth='#5b2d82', accent=GOLD),
    'skeleton-army': dict(accent='#7fe9ff'),
    'skeleton-barrel': dict(cloth='#d7b5ff', accent='#5b2d82'),
    'skeletons': dict(accent='#7fe9ff'),
    'valkyrie': dict(cloth='#3a6ab0', accent='#9fe8ff', hairColor='#ffffff'),
    'wall-breakers': dict(accent='#ffd54a', hat='helmet'),
    'witch': dict(cloth='#2a2240', accent='#7fe9ff'),
    'wizard': dict(cloth='#2a3f9a', accent='#7fe9ff'),
    # Gebäude
    'cannon': dict(cloth='#3a2a5a', accent=EVO),
    'goblin-cage': dict(cloth='#5b3a8a', accent=EVO),
    'goblin-drill': dict(cloth='#5b5f6a', accent=EVO),
    'mortar': dict(cloth='#5b4a6a', accent=EVO),
    'tesla': dict(cloth='#3a3a5a', accent='#ffffff'),
}

TOKENS = {
    'cannon-cart-cannon': dict(body='cannon', cloth='#6b6f7a', accent='#8b5a2b'),
    'elixir-golemite': dict(body='golem', cloth='#d77fe0', accent='#f06bd6', scale=0.75),
    'elixir-blob': dict(body='blob', cloth='#e08fe8', accent='#f6c1fa'),
    'goblin-demolisher-kamikaze': dict(body='imp', skin='#7cc36b', cloth='#c0392b', hat='bandana', weapon='bomb', scale=1.15),
    'goblinstein-monster': dict(body='brute', skin='#8fbf7a', cloth='#3a3a4a', scale=1.25),
    'golemite': dict(body='golem', cloth='#8d8f94', accent='#6fd36b', scale=0.75),
    'lava-pup': dict(body='whale', cloth='#7a3a1a', accent='#ff8a1a', scale=0.55),
    'guardienne': H(skin='#f2c7a5', cloth='#3a7bd5', hat='helmet', weapon='sword', shield=True, scale=1.1),
    'lumberjack-ghost': dict(body='ghost', cloth='#cfe8ff', accent='#c0392b'),
    'cursed-hog': dict(body='hog', cloth='#8a6aa8', accent='#5b2d82'),
    'phoenix-egg': dict(body='blob', cloth='#ff8a3d', accent='#ffd54a'),
    'phoenix-reborn': dict(body='dragon', cloth='#ff6a1a', accent='#ffd54a', scale=0.85),
    'rascal-boy': H(skin='#f0c090', cloth='#3a7bd5', hat='cap', weapon='club', scale=1.1),
    'rascal-girl': H(skin='#f5d0b0', cloth='#e57fb2', hat='ponytail', weapon='sling', hairColor='#e8743b'),
    'souldier': dict(body='ghost', cloth='#d7b5ff', accent=EVO, scale=0.8),
    'general-gerry': dict(body='skel', hat='helmet', weapon='sword', shield=True, cape=True, scale=1.2),
    'shadow-skeleton': dict(body='skel', weapon='dagger', scale=0.8, accent='#5b2d82'),
    'spirit-empress-air': dict(body='dragon', cloth='#7a5cd6', accent=GOLD),
    'spirit-empress-ground': H(skin='#e8d8f8', cloth='#7a5cd6', hat='tiara', weapon='orb', cape=True, accent=GOLD),
    'bush-goblin': dict(body='imp', skin='#7cc36b', cloth='#4f9a3a', weapon='dagger'),
    'wall-breaker-runner': dict(body='skel', weapon='fists', scale=0.85),
    'decoy-goblin': dict(body='imp', skin='#a0d68f', cloth='#9a9a9a', weapon='dagger'),
    'goblin-brawler': dict(body='imp', skin='#7cc36b', cloth='#c0392b', weapon='club', scale=1.1),
    'hero-turret': dict(body='turret', cloth='#5a3a8a', accent=GOLD),
    'magic-archer-decoy': H(skin='#f2c7a5', cloth='#8fd0b0', hat='hood', weapon='bow', accent='#ffffff'),
    'skeletrooper': dict(body='skel', hat='helmet', weapon='spear'),
    'rhino': dict(body='hog', cloth='#8a8f99', accent='#d9d9d9', scale=1.2),
    'tomb-queen': dict(body='skel', hat='crown', weapon='staff', cape=True, accent='#6fd36b', scale=1.1),
    'snowman': dict(body='blob', cloth='#f4f8ff', accent='#9fdcf5'),
}


def hero_look(base):
    """Helden: Look der Basiskarte mit goldenem Umhang/Akzent."""
    look = dict(base)
    look['cape'] = True
    look['accent'] = GOLD
    look['hero'] = True
    return look


def apply(c):
    cid = c['id']
    base = c.get('heroOf') or cid
    if c['type'] == 'spell':
        look = SPELLS.get(base)
        if look:
            c['look'] = dict(look, color=GOLD) if c.get('cls') == 'hero' else dict(look)
        return
    look = UNITS.get(base)
    if look and isinstance(c.get('unit'), dict):
        c['unit']['look'] = hero_look(look) if c.get('cls') == 'hero' else dict(look)
    evo = EVOS.get(cid)
    if evo and c.get('evo') and 'spell' not in c['evo']:
        c['evo'].setdefault('unit', {})['look'] = dict(evo)


def apply_token(tid, t):
    look = TOKENS.get(tid)
    if look:
        t['look'] = dict(look)
