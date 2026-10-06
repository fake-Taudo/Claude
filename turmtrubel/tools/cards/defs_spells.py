from defs import *

# ───────────────────────── Zauber ─────────────────────────
# Zauber fliegen (wo das Wiki ein Geschosstempo nennt) vom Burgturm zum Ziel: delay = Flugzeit wird
# im Spiel aus Entfernung/Tempo berechnet (travel=Felder pro Sekunde).

card(id='arrows', src='Arrows', name='Pfeile', type='spell', rarity='common', elixir=3,
     description='Drei Pfeilsalven auf eine große Fläche. Ideal gegen Schwärme.',
     spell=dict(radius=3.5, damage=122, towerDamage=0.254, waves=3, waveInterval=0.25, travel=18.33, targets='both', fx='arrows'))
note('arrows', 'Abstand der drei Salven (0,25 s) geschätzt. Turmschaden 31 je Salve laut Kartenseite (Übersicht: 25).')

card(id='barbarian-barrel', src='Barbarian Barrel', name='Barbarenfass', type='spell', rarity='epic', elixir=2,
     description='Ein Fass rollt 4,5 Felder nach vorn, trifft Bodentruppen und entlässt am Ende einen Barbaren. Nur auf der eigenen Seite.',
     spell=dict(roll=dict(length=4.5, width=2.6, speed=6), damage=230, towerDamage=0.5, knockback=0.6, targets='ground', ownSide=True,
                spawnAtEnd=dict(unit='barbarians', count=1), fx='barrelRoll'))
note('barbarian-barrel', 'Rollgeschwindigkeit (6 Felder/s) und Rückstoß geschätzt; Turmschaden 0,5× aus Helden-Seite (116/232).')

card(id='clone', src='Clone', name='Klonzauber', type='spell', rarity='epic', elixir=3,
     description='Verdoppelt alle eigenen Truppen im Bereich. Die Klone haben nur 1 Lebenspunkt, treffen aber genauso hart.',
     spell=dict(radius=3, clone=dict(hp=1, shield=1), targets='own', fx='clone'))

card(id='earthquake', src='Earthquake', name='Erdbeben', type='spell', rarity='rare', elixir=3,
     description='Erschüttert 3 s lang den Boden: Schaden an Bodentruppen, sehr viel Schaden an Gebäuden, 50 % langsamer.',
     spell=dict(radius=3.5, duration=3, pulse=1, damage=84, towerDamage=0.63, buildingDamage=287, slow=dict(amount=0.5), targets='ground', fx='quake'))
note('earthquake', 'Kartenseite: 84/53/287 je Sekunde (Übersicht: 81/49/283).')

card(id='fireball', src='Fireball', name='Feuerball', type='spell', rarity='rare', elixir=4,
     description='Feuerball mit hohem Flächenschaden und leichtem Rückstoß.',
     spell=dict(radius=2.5, damage=688, towerDamage=0.231, knockback=1, travel=10, targets='both', fx='fire'))
note('fireball', 'Turmschaden 159 (Balance 08.09.2026: −8 %). Rückstoß 1 Feld geschätzt.')

card(id='freeze', src='Freeze', name='Frost', type='spell', rarity='epic', elixir=4,
     description='Friert alle Gegner im Bereich 3,5 s lang ein.',
     spell=dict(radius=3, damage=115, towerDamage=0.3, stun=3.5, freeze=True, targets='both', fx='frost'))
note('freeze', 'Dauer 3,5 s (Balance 08.09.2026). Schaden 115/35 laut Kartenseite (Übersicht: 148/38).')

card(id='giant-snowball', src='Giant Snowball', name='Schneeball', type='spell', rarity='common', elixir=2,
     description='Riesiger Schneeball: Schaden, Rückstoß und 3 s lang 30 % langsamer.',
     spell=dict(radius=2.5, damage=179, towerDamage=0.3, knockback=1, slow=dict(amount=0.3, duration=3), travel=13.33, targets='both', fx='snow'),
     evo=dict(cycles=2, description='Sammelt getroffene Truppen ein und rollt mit ihnen 4 Felder weit; Verlangsamung 4 s.',
              spell=dict(slow=dict(amount=0.3, duration=4), gather=dict(length=4, speed=5))))
note('giant-snowball', 'Flugtempo und Rückstoß geschätzt. Evo-Rollweite 4 Felder (Balance 04.08.2026).')

card(id='goblin-barrel', src='Goblin Barrel', name='Koboldfass', type='spell', rarity='epic', elixir=3,
     description='Wirft ein Fass mit drei Kobolden irgendwohin in die Arena.',
     spell=dict(radius=1.5, travel=10, spawn=dict(unit='goblins', count=3, deployTime=1.1), fx='barrel'),
     evo=dict(cycles=2, description='Ein zweites Fass mit drei Lockvogel-Kobolden landet gespiegelt auf der anderen Seite.',
              spell=dict(mirrorSpawn=dict(unit='decoy-goblin', count=3, deployTime=1.1))))
token('decoy-goblin', name='Lockvogel-Kobold', hp=81, damage=89, hitSpeed=1.1, firstHit=0.4, speed=VFAST, range=0.5, targets='ground', radius=0.35, mass=2)
note('goblin-barrel', 'Flugtempo des Fasses geschätzt (Wiki ohne Angabe).')

card(id='goblin-curse', src='Goblin Curse', name='Goblin Curse', type='spell', rarity='epic', elixir=2,
     description='Verflucht Gegner 6 s lang: leichter Schaden und Verlangsamung. Wer verflucht stirbt, wird zu einem Kobold für dich.',
     spell=dict(radius=3, duration=6, pulse=1, damage=35, towerDamage=0.286, slow=dict(amount=0.15), curse=dict(unit='goblins'), targets='both', fx='curse'))
note('goblin-curse', 'Stärke der Verlangsamung (seit Balance 04.08.2026) nicht angegeben → Platzhalter 15 %.')

card(id='graveyard', src='Graveyard', name='Friedhof', type='spell', rarity='legendary', elixir=5,
     description='9 s lang steigen am Rand des Bereichs Skelette aus Gräbern.',
     spell=dict(radius=4, duration=9, graveyard=dict(unit='skeletons', count=14, firstDelay=2.2, interval=0.5, ring=True), fx='grave'))
note('graveyard', '14 Skelette (Balance 12.01.2026); Kartenseite nennt 12.')

card(id='lightning', src='Lightning', name='Blitz', type='spell', rarity='epic', elixir=6,
     description='Drei Blitze treffen die drei Ziele mit den meisten Lebenspunkten und betäuben sie.',
     spell=dict(radius=3.5, damage=1057, towerDamage=0.27, strikes=3, stun=0.5, targets='both', fx='storm'))
note('lightning', 'Turmschaden 286 laut Kartenseite (Übersicht: 265).')

card(id='mirror', src='Mirror', name='Spiegel', type='spell', rarity='epic', elixir=1, elixirRule='mirror',
     description='Spielt deine zuletzt gespielte Karte noch einmal – eine Stufe stärker, für 1 Elixier mehr. Nie in der Starthand.',
     spell=dict(mirror=True), notInStartingHand=True)

card(id='poison', src='Poison', name='Gift', type='spell', rarity='epic', elixir=4,
     description='Giftwolke: 8 s lang Schaden jede Sekunde und 15 % langsamer.',
     spell=dict(radius=3.5, duration=8, pulse=1, damage=92, towerDamage=0.24, slow=dict(amount=0.15), targets='both', fx='poison'))

card(id='rage', src='Rage', name='Wut', type='spell', rarity='epic', elixir=2,
     description='Eigene Truppen und Gebäude im Bereich sind 4,5 s lang 30 % schneller. Kleiner Schaden beim Aufprall.',
     spell=dict(radius=3, duration=4.5, damage=179, towerDamage=0.3, rage=dict(mult=1.3), delay=0.5, targets='both', fx='rage'))

card(id='rocket', src='Rocket', name='Rakete', type='spell', rarity='rare', elixir=6,
     description='Langsame Rakete mit enormem Schaden auf kleiner Fläche.',
     spell=dict(radius=2, damage=1484, towerDamage=0.25, knockback=1, travel=5.83, targets='both', fx='comet'))
note('rocket', 'Turmschaden 371 laut Kartenseite (Übersicht: 342). Rückstoß geschätzt.')

card(id='royal-delivery', src='Royal Delivery', name='Königliche Luftpost', type='spell', rarity='common', elixir=3,
     description='Nach 3 s landet eine Kiste mit Flächenschaden und liefert einen Königsrekruten. Nur auf der eigenen Seite.',
     spell=dict(radius=3, delay=3, damage=384, towerDamage=0, ownSide=True, spawn=dict(unit='royal-recruits', count=1, deployTime=0.25), targets='both', fx='crate'))
note('royal-delivery', 'Landeschaden 384 (Balance 04.08.2026: −12 %).')

card(id='the-log', src='The Log', name='Kampfholz', type='spell', rarity='legendary', elixir=2,
     description='Ein Baumstamm rollt 10,1 Felder weit, trifft alle Bodentruppen und stößt sie zurück. Nur auf der eigenen Seite.',
     spell=dict(roll=dict(length=10.1, width=3.9, speed=8), damage=266, towerDamage=0.15, knockback=1.2, targets='ground', ownSide=True, fx='log'))
note('the-log', 'Rollgeschwindigkeit und Rückstoß geschätzt. Turmschaden 40 laut Kartenseite (Übersicht: 35).')

card(id='tornado', src='Tornado', name='Tornado', type='spell', rarity='epic', elixir=3,
     description='Zieht Gegner in der großen Fläche 1 s lang zu seiner Mitte und macht etwas Schaden.',
     spell=dict(radius=5.5, duration=1.05, pulse=0.55, damage=42, towerDamage=0.345, pull=dict(speed=3.5), targets='both', fx='tornado'))
note('tornado', 'Gesamtschaden 84 auf zwei Impulse verteilt; Zugstärke geschätzt.')

card(id='vines', src='Vines', name='Vines', type='spell', rarity='epic', elixir=3,
     description='Ranken packen die drei Ziele mit den meisten Lebenspunkten, halten sie 2 s fest und holen Flieger auf den Boden.',
     spell=dict(radius=2.5, delay=0.9, vines=dict(count=3, duration=2, pulses=2), damage=153, towerDamage=0.255, targets='both', fx='vines'))

card(id='void', src='Void', name='Void', type='spell', rarity='epic', elixir=5,
     description='Dunkles Feld, das dreimal einschlägt. Je weniger Ziele darin stehen, desto mehr Schaden bekommt jedes.',
     spell=dict(radius=2.5, duration=3, pulse=1, voidTiers=[[1, 696, 97], [4, 294, 51], [999, 153, 35]], targets='both', fx='void'))
note('void', 'Impulsabstand 1,0 s (Balance 26.08.2026).')

card(id='zap', src='Zap', name='Knall', type='spell', rarity='common', elixir=2,
     description='Kurzer Stromschlag: Schaden und 0,5 s Betäubung.',
     spell=dict(radius=2.5, damage=192, towerDamage=0.3, stun=0.5, targets='both', fx='shock'),
     evo=dict(cycles=2, description='Schlägt kurz danach ein zweites Mal ein – mit 0,5 Feldern mehr Radius.',
              spell=dict(echo=dict(delay=1, radius=3))))
note('zap', 'Turmschaden 58 laut Kartenseite (Übersicht: 48). Evo: Abstand des zweiten Schlags (1 s) geschätzt.')

# ───────────────────────── Gebäude ─────────────────────────

card(id='barbarian-hut', src='Barbarian Hut', name='Barbarenhütte', type='building', rarity='rare', elixir=6,
     description='Schickt alle 15 s drei Barbaren los, beim Einsturz einen weiteren.',
     unit=dict(hp=1164, size=2, lifetime=30, traits=dict(spawner=dict(unit='barbarians', count=3, interval=15, firstDelay=1, stagger=0.5),
                                                          deathSpawn=dict(unit='barbarians', count=1))))

card(id='bomb-tower', src='Bomb Tower', name='Bombenturm', type='building', rarity='rare', elixir=4,
     description='Verteidigungsturm mit Bombenwerfer gegen Bodentruppen. Beim Einsturz fällt eine Bombe.',
     unit=dict(hp=1356, damage=222, hitSpeed=1.8, firstHit=0.5, range=6, targets='ground', splash=1.5, size=2, lifetime=30,
               projectile=P('bomb', 8.33, arc=True), traits=dict(deathDamage=dict(damage=222, radius=3, delay=3, fx='fire'))))

card(id='cannon', src='Cannon', name='Kanone', type='building', rarity='common', elixir=3,
     description='Günstige Kanone gegen Bodentruppen.',
     unit=dict(hp=824, damage=202, hitSpeed=1.0, firstHit=1.0, range=5.5, targets='ground', size=2, lifetime=30, projectile=P('cannonball', 16.67)),
     evo=dict(cycles=2, description='Beim Aufstellen feuert sie 9 Kanonenkugeln in zwei Reihen über die Arena (304 Schaden, Rückstoß).',
              unit=dict(traits=dict(barrage=dict(rows=[[5, 3], [4, 6]], radius=2, damage=304, towerDamage=0.29, knockback=1)))))
note('cannon', 'Schaden 202 (Balance 07.04.2026: −5 %; Kartenseite noch 212). Evo: Lage der Kugelreihen geschätzt.')

card(id='elixir-collector', src='Elixir Collector', name='Elixiersammler', type='building', rarity='rare', elixir=6,
     description='Erzeugt alle 13 s ein Elixier (93 s lang) und beim Einsturz ein weiteres. Nie in der Starthand.',
     notInStartingHand=True,
     unit=dict(hp=1070, size=2, lifetime=93, traits=dict(elixirGen=dict(amount=1, interval=13), deathElixirSelf=1)))

card(id='goblin-cage', src='Goblin Cage', name='Koboldkäfig', type='building', rarity='rare', elixir=4,
     description='Ein Käfig als Köder. Wird er zerstört, stürmt ein Kobold-Raufbold heraus.',
     unit=dict(hp=780, size=2, lifetime=20, traits=dict(deathSpawn=dict(unit='goblin-brawler', count=1))),
     evo=dict(cycles=2, description='Zieht Bodentruppen in 3 Feldern in den Käfig und schadet ihnen jede Sekunde, bis Ziel oder Käfig fallen.',
              unit=dict(traits=dict(trap=dict(range=3, damage=337, hitSpeed=1)))))
token('goblin-brawler', name='Kobold-Raufbold', hp=1123, damage=337, hitSpeed=1.1, firstHit=0.2, speed=FAST, range=0.8, targets='ground', radius=0.55, mass=8)
note('goblin-cage', 'Raufbold-Leben 1123 (Balance 08.09.2026: +4 % von 1080).')

card(id='goblin-drill', src='Goblin Drill', name='Koboldbohrer', type='building', rarity='epic', elixir=4,
     description='Gräbt sich überall in der Arena hoch und schickt alle 3 s einen Kobold, beim Einsturz zwei weitere.',
     unit=dict(hp=1313, size=2, lifetime=10, traits=dict(deployAnywhere=True, deployBlast=dict(damage=84, radius=2, knockback=1, towerDamage=0, fx='rock'),
                                                         spawner=dict(unit='goblins', count=1, interval=3, firstDelay=0.8),
                                                         deathSpawn=dict(unit='goblins', count=2))),
     evo=dict(cycles=2, description='Bei 66 % und 33 % Leben taucht er ab und an anderer Stelle wieder auf – jedes Mal mit einem Kobold.',
              unit=dict(traits=dict(resurface=dict(at=[0.66, 0.33], radius=3, unit='goblins')))))
note('goblin-drill', 'Kein Schaden an Kronentürmen mehr (Balance 04.08.2026). Radius des Auftauchschlags (2) geschätzt.')

card(id='goblin-hut', src='Goblin Hut', name='Koboldhütte', type='building', rarity='rare', elixir=4,
     description='Schickt alle 2,2 s einen Speerkobold los, sobald Gegner in 6 Feldern sind.',
     unit=dict(hp=1228, size=2, lifetime=30, traits=dict(spawner=dict(unit='spear-goblins', count=1, interval=2.2, firstDelay=0.5, enemyInRange=6),
                                                         deathSpawn=dict(unit='spear-goblins', count=1))))
note('goblin-hut', 'Leben 1228 laut Kartenseite (Übersicht: 1180).')

card(id='inferno-tower', src='Inferno Tower', name='Infernoturm', type='building', rarity='rare', elixir=5,
     description='Verteidigungsturm mit Feuerstrahl, der immer stärker wird.',
     unit=dict(hp=1748, damage=43, hitSpeed=0.4, firstHit=0.2, range=6, targets='both', size=2, lifetime=30, projectile=P('beam', 0),
               traits=dict(ramp=dict(stages=[43, 158, 847], stageTime=2))))

card(id='mortar', src='Mortar', name='Minenwerfer', type='building', rarity='common', elixir=4,
     description='Belagerungsgeschütz mit 11,5 Feldern Reichweite und totem Winkel unter 3,5 Feldern.',
     unit=dict(hp=1369, damage=266, hitSpeed=4.7, firstHit=1.0, range=11.5, minRange=3.5, targets='ground', splash=2, size=2, lifetime=30, deployTime=3.5,
               projectile=P('boulder', 5, arc=True)),
     evo=dict(cycles=2, description='Jeder Schuss bringt zusätzlich einen Kobold an den Einschlagsort.',
              unit=dict(traits=dict(impactSpawn=dict(unit='goblins', count=1)))))
note('mortar', 'Angriffstempo 4,7 s (Balance 04.08.2026; gilt auch für die Evo).')

card(id='tesla', src='Tesla', name='Tesla', type='building', rarity='common', elixir=4,
     description='Versteckt sich im Boden, bis Gegner kommen, und trifft Boden und Luft.',
     unit=dict(hp=1152, damage=220, hitSpeed=1.1, firstHit=0.5, range=5.5, targets='both', size=2, lifetime=25, projectile=P('lightning', 0),
               traits=dict(hidden=True)),
     evo=dict(cycles=2, description='Jedes Mal, wenn sie auftaucht, löst sie einen Elektroimpuls aus (6 Felder, 174 Schaden, 0,5 s Betäubung).',
              unit=dict(traits=dict(hidden=True, surfacePulse=dict(radius=6, damage=174, stun=0.5, towerDamage=0.3, fx='shock')))))
note('tesla', 'Leben 1152 laut Kartenseite (Übersicht: 1182). Turmschaden des Evo-Impulses geschätzt.')

card(id='tombstone', src='Tombstone', name='Grabstein', type='building', rarity='rare', elixir=3,
     description='Ruft alle 4 s zwei Skelette, beim Einsturz vier weitere.',
     unit=dict(hp=529, size=2, lifetime=30, traits=dict(spawner=dict(unit='skeletons', count=2, interval=4, firstDelay=1, stagger=0.5),
                                                        deathSpawn=dict(unit='skeletons', count=4))))

card(id='x-bow', src='X-Bow', name='X-Bogen', type='building', rarity='epic', elixir=6,
     description='Belagerungs-Armbrust mit 11,5 Feldern Reichweite gegen Bodenziele.',
     unit=dict(hp=1600, damage=58, hitSpeed=0.4, firstHit=0.4, range=11.5, targets='ground', size=2.5, lifetime=30, deployTime=3.5,
               projectile=P('bolt', 22)))
note('x-bow', 'Angriffstempo 0,4 s und Schaden 58 (Balance 04.08.2026; Kartenseite noch 0,3 s/43). Geschosstempo geschätzt.')
