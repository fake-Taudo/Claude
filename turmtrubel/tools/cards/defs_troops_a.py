from defs import *

# ───────────────────────── Truppen A–G ─────────────────────────

card(id='archer-queen', src='Archer Queen', name='Bogenschützen-Königin', type='troop', rarity='champion', cls='champion', elixir=5,
     description='Champion mit Armbrust. Ihre Fähigkeit macht sie kurz unsichtbar und lässt sie viel schneller schießen.',
     unit=U(size='med', hp=1000, damage=232, hitSpeed=1.2, firstHit=0.3, speed=MED, range=5, targets='both', projectile=P('bolt', 13.33)),
     ability=dict(name='Tarnumhang', cost=1, castTime=1.0, description='3,5 s unsichtbar, schießt 80 % schneller, bewegt sich aber langsam.',
                  cloak=dict(duration=3.5, attackSpeed=1.8, speed=SLOW)))
note('archer-queen', 'Schaden 232 aus Übersicht (Balance 26.08.2026: +3 %); Kartenseite zeigt noch 225.')

card(id='archers', src='Archers', name='Bogenschützen', type='troop', rarity='common', elixir=3, count=2, formation='line',
     description='Zwei Schützinnen, die Boden- und Luftziele aus mittlerer Entfernung treffen.',
     unit=U(size='small', hp=304, damage=112, hitSpeed=0.9, firstHit=0.5, speed=MED, range=5, targets='both', projectile=P('arrow', 10)),
     evo=dict(cycles=2, description='+1 Reichweite. Ziele in 4–6 Feldern Entfernung treffen sie mit einem Kraftschuss (140 Schaden).',
              unit=dict(range=6, traits=dict(longRangeBonus=dict(minDist=4, maxDist=6, damage=140)))))

card(id='baby-dragon', src='Baby Dragon', name='Drachenbaby', type='troop', rarity='epic', elixir=4,
     description='Fliegender Drache, der Feuerbälle mit Flächenschaden spuckt.',
     unit=U(size='large', hp=1152, damage=168, hitSpeed=1.5, firstHit=0.3, speed=FAST, range=3.5, targets='both', flying=True, splash=1.5, projectile=P('fire', 8.33)),
     evo=dict(cycles=2, description='Erzeugt beim Angreifen einen Windstoß (8×9 Felder): Gegner 30 % langsamer, Verbündete 30 % schneller. Der Wind bleibt nach dem Tod 2 s.',
              unit=dict(traits=dict(aura=dict(halfW=4, halfH=4.5, enemySlow=0.3, allySpeed=1.3, whileAttacking=True, linger=2)))))

card(id='balloon', src='Balloon', name='Ballon', type='troop', rarity='epic', elixir=5,
     description='Fliegt zu Gebäuden und wirft schwere Bomben. Beim Absturz fällt nach 3 s eine Bombe.',
     unit=U(size='large', hp=1679, damage=640, hitSpeed=2.0, firstHit=0.2, speed=MED, range=0.1, targets='buildings', flying=True,
            traits=dict(deathDamage=dict(damage=240, radius=3, delay=3, fx='fire'))))

card(id='bandit', src='Bandit', name='Banditin', type='troop', rarity='legendary', elixir=3,
     description='Springt aus 3,5–6 Feldern auf ihr Ziel und ist während des Sprints unverwundbar (doppelter Schaden).',
     unit=U(size='med', hp=906, damage=194, hitSpeed=1.0, firstHit=0.4, speed=FAST, range=0.75, targets='ground',
            traits=dict(dash=dict(min=3.5, max=6, damage=389, speed=8.33, windup=0.8))))

card(id='barbarians', src='Barbarians', name='Barbaren', type='troop', rarity='common', elixir=5, count=5,
     description='Fünf Nahkämpfer mit Schwertern.',
     unit=U(size='med', hp=716, damage=192, hitSpeed=1.4, firstHit=0.4, speed=MED, range=0.7, targets='ground'),
     evo=dict(cycles=1, description='Jeder Treffer macht sie 5 s lang 30 % schneller (Laufen und Angreifen).',
              unit=dict(traits=dict(rageOnHit=dict(mult=1.3, duration=5)))))

card(id='bats', src='Bats', name='Fledermäuse', type='troop', rarity='common', elixir=2, count=5,
     description='Fünf sehr schnelle, zerbrechliche Flieger.',
     unit=U(size='tiny', hp=81, damage=81, hitSpeed=1.3, firstHit=0.6, speed=VFAST, range=1.2, targets='both', flying=True),
     evo=dict(cycles=2, description='+50 % Leben. Jeder Angriff heilt sie (2× 38) und kann über das Maximum hinaus heilen (bis 244).',
              unit=dict(hp=122, traits=dict(selfHealOnHit=dict(heal=38, pulses=2, interval=0.5, maxHp=244)))))
note('bats', 'Angriffstempo 1,3 s laut Kartenseite (Übersicht: 1,2 s).')

card(id='battle-healer', src='Battle Healer', name='Kampfheilerin', type='troop', rarity='rare', elixir=4,
     description='Heilt beim Erscheinen und bei jedem Angriff verbündete Truppen in der Nähe (nicht sich selbst).',
     unit=U(size='med', hp=1920, damage=268, hitSpeed=2.0, firstHit=0.3, speed=MED, range=1.6, targets='ground',
            traits=dict(deployHeal=dict(radius=3, heal=50, pulses=4, interval=0.25),
                        healOnAttack=dict(radius=2.5, heal=25, pulses=4, interval=0.25, excludeSelf=True, excludeSame=True))))

card(id='battle-ram', src='Battle Ram', name='Rammbock', type='troop', rarity='rare', elixir=4,
     description='Zwei Barbaren rammen das nächste Gebäude (Ansturm nach 3 Feldern) und kämpfen danach weiter.',
     unit=U(size='large', hp=967, damage=286, hitSpeed=1.0, firstHit=0.1, speed=MED, range=0.5, sight=6.5, targets='buildings',
            traits=dict(kamikaze=True, charge=dict(distance=3, speed=VFAST, damage=573), deathSpawn=dict(unit='barbarians', count=2))),
     evo=dict(cycles=2, description='Trifft beim Ansturm alle Truppen auf dem Weg (212 Schaden, Rückstoß). Prallt am Gebäude ab und rammt erneut, bis er zerstört ist. Heraus kommen Evo-Barbaren.',
              unit=dict(traits=dict(kamikaze=False, trample=dict(damage=212, knockback=1), rebound=dict(distance=2),
                                    deathSpawn=dict(unit='barbarians', count=2, evo=True)))))
note('battle-ram', 'Evo: Rückstoß der Truppen beim Ansturm (1 Feld) geschätzt; Abprall 2 Felder laut Balance 08.09.2026.')

card(id='berserker', src='Berserker', name='Berserker', type='troop', rarity='common', elixir=2,
     description='Flinke Nahkämpferin, die sehr schnell zuschlägt.',
     unit=U(size='med', hp=896, damage=102, hitSpeed=0.6, firstHit=0.2, speed=FAST, range=0.8, targets='ground'))

card(id='bomber', src='Bomber', name='Bomber', type='troop', rarity='common', elixir=2,
     description='Wirft Bomben mit Flächenschaden auf Bodentruppen.',
     unit=U(size='small', hp=304, damage=212, hitSpeed=1.8, firstHit=0.2, speed=MED, range=4.5, targets='ground', splash=1.5, projectile=P('bomb', 6.67, arc=True)),
     evo=dict(cycles=2, description='Die Bombe springt nach dem Aufprall noch zweimal je 3 Felder weiter und trifft jedes Mal erneut.',
              unit=dict(traits=dict(bounce=dict(count=2, distance=3)))))

card(id='boss-bandit', src='Boss Bandit', name='Boss Bandit', type='troop', rarity='champion', cls='champion', elixir=6,
     description='Champion. Sprintet wie die Banditin unverwundbar auf Gegner in 3,5–6 Feldern.',
     unit=U(size='med', hp=2624, damage=244, hitSpeed=1.1, firstHit=0.4, speed=FAST, range=0.8, targets='ground',
            traits=dict(dash=dict(min=3.5, max=6, damage=489, speed=8.33, windup=0.8))),
     ability=dict(name='Fluchtgranate', cost=1, uses=2, cooldown=3, castTime=1.0, description='Wird 1 s unsichtbar und springt 6 Felder zurück. Zweimal pro Einsatz.',
                  vanish=dict(duration=1, back=6)))

card(id='bowler', src='Bowler', name='Bowler', type='troop', rarity='epic', elixir=5,
     description='Rollt Felsbrocken, die durch alle Bodenziele in einer Linie gehen und sie zurückstoßen.',
     unit=U(size='big', hp=2081, damage=289, hitSpeed=2.5, firstHit=0.5, speed=SLOW, range=4, targets='ground',
            projectile=P('roll', 2.83), traits=dict(pierce=dict(length=7, width=1.8, knockback=1))))
note('bowler', 'Wurfweite 7 Felder (Balance 04.08.2026). Breite 3,6 laut Wiki als Gesamtbreite gedeutet (±1,8); Rückstoß 1 Feld geschätzt.')

card(id='cannon-cart', src='Cannon Cart', name='Kanonenkarre', type='troop', rarity='epic', elixir=5,
     description='Fahrende Kanone. Unter 50 % Leben wird sie zu einer festen Kanone (15 s Lebensdauer).',
     unit=U(size='large', hp=1809, damage=212, hitSpeed=0.9, firstHit=0.5, speed=MED, range=5.5, targets='ground', projectile=P('cannonball', 16.67),
            traits=dict(transform=dict(at=0.5, into='cannon-cart-cannon'))))
token('cannon-cart-cannon', name='Kanonenkarre (fest)', type='building', hp=1809, damage=212, hitSpeed=0.9, firstHit=0.5, range=5.5, targets='ground',
      size=1.5, lifetime=15, deployTime=0, projectile=P('cannonball', 16.67), lifetimeFromHp=True)

card(id='dark-prince', src='Dark Prince', name='Dunkler Prinz', type='troop', rarity='epic', elixir=4,
     description='Gepanzerter Reiter mit Schild. Trifft rundherum und stürmt nach 3 Feldern mit doppeltem Schaden los.',
     unit=U(size='large', hp=1200, damage=266, hitSpeed=1.4, firstHit=0.6, speed=MED, range=1.2, targets='ground', splash=1.1, splashSelf=True,
            traits=dict(shield=256, charge=dict(distance=3, speed=VFAST, damage=532), riverJump=True)))
note('dark-prince', 'Schild 256 laut Kartenseite (Übersicht: 240).')

card(id='dart-goblin', src='Dart Goblin', name='Blasrohrkobold', type='troop', rarity='rare', elixir=3,
     description='Sehr schneller Kobold mit großer Reichweite.',
     unit=U(size='small', hp=261, damage=156, hitSpeed=0.8, firstHit=0.35, speed=VFAST, range=6.5, targets='both', projectile=P('dart', 13.33)),
     evo=dict(cycles=2, description='Seine Pfeile vergiften das Ziel und die Umgebung (Radius 1,5). Je öfter er dasselbe Ziel trifft, desto stärker das Gift (Stufe 1/2/3 nach 1/4/7 Treffern).',
              unit=dict(traits=dict(poisonDart=dict(radius=1.5, duration=1, towerDamage=0.25, stages=[[1, 51], [4, 115], [7, 307]])))))
note('dart-goblin', 'Schaden 156 laut Kartenseite (Übersicht: 151).')

card(id='electro-dragon', src='Electro Dragon', name='Elektrodrache', type='troop', rarity='epic', elixir=5,
     description='Fliegender Drache, dessen Blitz auf bis zu 3 Ziele überspringt und sie kurz betäubt.',
     unit=U(size='large', hp=1049, damage=192, hitSpeed=2.3, firstHit=0.8, speed=MED, range=3.5, targets='both', flying=True,
            projectile=P('lightning', 0), traits=dict(onHit=dict(stun=0.5, chain=dict(count=3, radius=4)))),
     evo=dict(cycles=1, description='Nach den ersten 3 Zielen springt der Blitz immer weiter zwischen allen Truppen hin und her (33 % weniger Schaden, keine Betäubung), bis nur noch eine übrig ist.',
              unit=dict(traits=dict(onHit=dict(stun=0.5, chain=dict(count=3, radius=4, endless=dict(mult=0.67, interval=0.3, max=20)))))))
note('electro-dragon', 'Angriffstempo 2,3 s laut Kartenseite (Übersicht: 2,1 s). Evo: Sprungintervall 0,3 s und max. 20 Sprünge als Näherung.')

card(id='electro-giant', src='Electro Giant', name='Elektroriese', type='troop', rarity='epic', elixir=7,
     description='Zielt auf Gebäude. Wer ihn aus bis zu 3 Feldern angreift, bekommt einen Gegenschlag mit Betäubung.',
     unit=U(size='big', hp=3952, damage=184, hitSpeed=1.8, firstHit=1.0, speed=SLOW, range=1.2, targets='buildings',
            traits=dict(zapBack=dict(radius=3, damage=192, stun=0.5, towerDamage=0.505))))
note('electro-giant', 'Schaden 184 aus Übersicht (Balance 26.08.2026: +13 %); Kartenseite zeigt noch 163.')

card(id='electro-spirit', src='Electro Spirit', name='Elektrogeist', type='troop', rarity='common', elixir=1,
     description='Springt auf Gegner und lässt einen Blitz auf bis zu 9 Ziele überspringen, die kurz betäubt werden.',
     unit=U(size='tiny', hp=215, damage=99, hitSpeed=1.0, firstHit=0.1, speed=VFAST, range=2.5, targets='both',
            traits=dict(kamikaze=True, onHit=dict(stun=0.5, chain=dict(count=9, radius=3)))))
note('electro-spirit', 'Sprungweite der Kette 3 Felder (Balance 26.08.2026).')

card(id='electro-wizard', src='Electro Wizard', name='Elektromagier', type='troop', rarity='legendary', elixir=4,
     description='Trifft zwei Ziele gleichzeitig und betäubt sie. Landet mit einem Elektroschlag.',
     unit=U(size='med', hp=714, damage=115, hitSpeed=1.8, firstHit=0.6, speed=FAST, range=5, targets='both', projectile=P('lightning', 0),
            traits=dict(multiTarget=2, onHit=dict(stun=0.5), deployBlast=dict(damage=192, radius=3, stun=0.5, fx='shock'))))
note('electro-wizard', 'Schaden 115 laut Kartenseite (Übersicht: 117).')

card(id='elite-barbarians', src='Elite Barbarians', name='Elitebarbaren', type='troop', rarity='common', elixir=6, count=2, formation='line',
     description='Zwei schnelle, starke Barbaren.',
     unit=U(size='med', hp=1341, damage=384, hitSpeed=1.4, firstHit=0.5, speed=FAST, range=1.2, targets='ground'),
     evo=dict(cycles=1, description='Werfen alle 5 s einen Wut-Speer auf Bodentruppen in 3–4,5 Feldern. Der Speer hinterlässt eine Wut-Spur (2 s).',
              unit=dict(traits=dict(secondary=dict(damage=150, hitSpeed=5, firstHit=0.5, range=4.5, minRange=3, targets='ground', projectile=P('spear', 10),
                                                   impactZone=dict(radius=1.5, duration=2, rage=dict(mult=1.3), fx='rage'))))))
note('elite-barbarians', 'Evo: Speer-Schaden im Wiki nicht angegeben → Platzhalter 150. Wut-Spur als Wut-Zone (Radius 1,5) vereinfacht.')

card(id='elixir-golem', src='Elixir Golem', name='Elixiergolem', type='troop', rarity='rare', elixir=3,
     description='Zerfällt in zwei Golemiten und diese in je zwei Kleckse. Jeder Teil gibt dem Gegner beim Tod Elixier.',
     unit=U(size='big', hp=1569, damage=253, hitSpeed=1.1, firstHit=0.8, speed=SLOW, range=0.8, targets='buildings',
            traits=dict(deathSpawn=dict(unit='elixir-golemite', count=2), deathElixir=1)))
token('elixir-golemite', name='Elixiergolemit', hp=762, damage=128, hitSpeed=1.1, firstHit=0.8, speed=MED, range=0.8, targets='buildings', radius=0.55, mass=8,
      traits=dict(deathSpawn=dict(unit='elixir-blob', count=2), deathElixir=0.5))
token('elixir-blob', name='Elixierklecks', hp=360, damage=64, hitSpeed=1.1, firstHit=0.8, speed=FAST, range=0.8, targets='buildings', radius=0.4, mass=3,
      traits=dict(deathElixir=0.5))

card(id='executioner', src='Executioner', name='Scharfrichter', type='troop', rarity='epic', elixir=5,
     description='Wirft seine Axt wie einen Bumerang – sie trifft alles auf dem Hin- und Rückweg.',
     unit=U(size='large', hp=1280, damage=168, hitSpeed=2.4, firstHit=0.5, speed=MED, range=4.5, targets='both',
            projectile=P('axe', 9.17), traits=dict(pierce=dict(length=7, width=1, returns=True))),
     evo=dict(cycles=1, description='Gegner in bis zu 2,5 Feldern trifft die Axt mit 294 statt 168 Schaden und stößt sie zurück.',
              unit=dict(traits=dict(pierce=dict(length=7, width=1, returns=True, close=dict(dist=2.5, damage=294, knockback=1))))))
note('executioner', 'Angriffstempo 2,4 s aus Übersicht (Kartenseite: 0,9 s = Wurfzeit); Axtweg 7 Felder (Balance 04.08.2026). Evo-Rückstoß 1 Feld geschätzt.')

card(id='fire-spirit', src='Fire Spirit', name='Feuergeist', type='troop', rarity='common', elixir=1,
     description='Springt auf Gegner und explodiert mit Flächenschaden.',
     unit=U(size='tiny', hp=215, damage=215, hitSpeed=1.0, firstHit=0.1, speed=VFAST, range=2.5, targets='both', splash=2.3,
            traits=dict(kamikaze=True)))
note('fire-spirit', 'Schaden 215 (Balance 17.09.2026: +4 %); Kartenseite zeigt noch 207.')

card(id='firecracker', src='Firecracker', name='Feuerwerkerin', type='troop', rarity='common', elixir=3,
     description='Ihr Feuerwerk zerplatzt am Ziel in Funken, die dahinter weiterfliegen. Nach jedem Schuss springt sie 1 Feld zurück.',
     unit=U(size='small', hp=304, damage=64, hitSpeed=3.0, firstHit=0.65, speed=FAST, range=6, targets='both',
            projectile=P('firework', 8.33), traits=dict(shrapnel=dict(count=5, angle=40, length=5, width=0.8), recoil=1)),
     evo=dict(cycles=2, description='Die Funken hinterlassen Glut, die Gegner verlangsamt (15 %) und alle 0,25 s Schaden macht.',
              unit=dict(traits=dict(sparkZones=dict(big=dict(radius=2.5, duration=3), small=dict(radius=1.2, duration=2.5),
                                                    damage=48, pulse=0.25, towerDamage=0.31, slow=0.15)))))
note('firecracker', 'Geschosstempo 500 (Balance 07.04.2026). Funkenkegel 40° und 5 Felder Länge geschätzt (Wiki: Reichweite der Splitter 11).')

card(id='fisherman', src='Fisherman', name='Fischer', type='troop', rarity='legendary', elixir=3,
     description='Wirft aus 3,5–7 Feldern seinen Haken: zieht Bodentruppen zu sich oder sich selbst zu Gebäuden.',
     unit=U(size='med', hp=870, damage=194, hitSpeed=1.3, firstHit=0.1, speed=MED, range=1.2, targets='ground',
            traits=dict(hook=dict(min=3.5, max=7, windup=1.3, speed=13.33))))

card(id='flying-machine', src='Flying Machine', name='Flugmaschine', type='troop', rarity='rare', elixir=4,
     description='Fliegender Geschützturm mit großer Reichweite.',
     unit=U(size='med', hp=614, damage=171, hitSpeed=1.1, firstHit=0.5, speed=FAST, range=6, targets='both', flying=True, projectile=P('bolt', 13.33)))

card(id='furnace', src='Furnace', name='Ofen', type='troop', rarity='rare', elixir=4,
     description='Laufender Ofen, der Gegner mit Glut beschießt und alle 5 s einen Feuergeist ausspuckt.',
     unit=U(size='large', hp=727, damage=179, hitSpeed=1.7, firstHit=0.5, speed=MED, range=6, targets='both', projectile=P('fire', 10),
            traits=dict(spawner=dict(unit='fire-spirit', count=1, interval=5, firstDelay=1))),
     evo=dict(cycles=2, description='Während er angreift, kommen alle 2,4 s Feuergeister – seitlich statt nach vorn.',
              unit=dict(traits=dict(spawner=dict(unit='fire-spirit', count=1, interval=5, firstDelay=1, attackingInterval=2.4, side=True)))))
note('furnace', 'Erzeugungstempo 5 s (Balance 04.08.2026), Angriffstempo 1,7 s (Balance 12.01.2026: +6 %); Erstangriff und Geschosstempo geschätzt.')

card(id='giant', src='Giant', name='Riese', type='troop', rarity='rare', elixir=5,
     description='Langsamer, sehr zäher Tank, der nur Gebäude angreift.',
     unit=U(size='big', hp=3968, damage=253, hitSpeed=1.5, firstHit=0.5, speed=SLOW, range=1.2, targets='buildings'))

card(id='giant-skeleton', src='Giant Skeleton', name='Riesenskelett', type='troop', rarity='epic', elixir=6,
     description='Riesiges Skelett. Beim Tod lässt es eine Bombe fallen, die nach 3 s explodiert (doppelt gegen Kronentürme).',
     unit=U(size='big', hp=3361, damage=276, hitSpeed=1.3, firstHit=0.3, speed=MED, range=0.8, targets='ground',
            traits=dict(deathDamage=dict(damage=688, radius=3, delay=3, towerDamage=2, knockback=1.5, fx='fire'))))

card(id='goblin-demolisher', src='Goblin Demolisher', name='Goblin Demolisher', type='troop', rarity='rare', elixir=4,
     description='Wirft Dynamit mit Flächenschaden. Unter 50 % Leben rennt er auf das nächste Gebäude zu und explodiert.',
     unit=U(size='med', hp=1300, damage=186, hitSpeed=1.2, firstHit=0.5, speed=MED, range=5, targets='ground', splash=1.5, projectile=P('dynamite', 6.67, arc=True),
            traits=dict(transform=dict(at=0.5, into='goblin-demolisher-kamikaze'))))
token('goblin-demolisher-kamikaze', name='Goblin Demolisher (Ansturm)', hp=1300, damage=404, hitSpeed=0.5, firstHit=0.1, speed=VFAST, range=0.5, targets='buildings',
      radius=0.5, mass=6, lifetime=10, deployTime=0, traits=dict(kamikaze=True, deathDamage=dict(damage=404, radius=2.5, knockback=1, fx='fire')))
note('goblin-demolisher', 'Angriffstempo 1,2 s laut Kartenseite (Übersicht: 1,1 s). Rückstoß der Todesexplosion 1 Feld geschätzt.')

card(id='goblin-gang', src='Goblin Gang', name='Koboldgang', type='troop', rarity='common', elixir=3,
     description='Drei Kobolde mit Messern und drei Speerkobolde.',
     groups=[dict(unit='goblins', count=3), dict(unit='spear-goblins', count=3, behind=1.2)])

card(id='goblin-giant', src='Goblin Giant', name='Koboldriese', type='troop', rarity='epic', elixir=6,
     description='Zielt auf Gebäude. Zwei Speerkobolde auf seinem Rücken werfen unabhängig – beim Tod springen sie ab.',
     unit=U(size='big', hp=3022, damage=176, hitSpeed=1.5, firstHit=0.8, speed=MED, range=1.2, targets='buildings',
            traits=dict(secondary=dict(damage=81, hitSpeed=1.6, firstHit=0.5, range=5, targets='both', projectile=P('spear', 8.33), shots=2),
                        deathSpawn=dict(unit='spear-goblins', count=2))),
     evo=dict(cycles=1, description='Unter 50 % Leben wirft er alle 2,2 s einen Kobold aus seinem Sack.',
              unit=dict(traits=dict(spawner=dict(unit='goblins', count=1, interval=2.2, firstDelay=0, belowHp=0.5)))))
note('goblin-giant', 'Leben 3022 laut Kartenseite (Übersicht: 3110). Rucksack-Angriffstempo 1,6 s (Balance 04.08.2026).')

card(id='goblin-machine', src='Goblin Machine', name='Goblin Machine', type='troop', rarity='legendary', elixir=5,
     description='Kampfmaschine mit Fäusten. Ihr Raketenwerfer feuert unabhängig auf Ziele in 2,5–5 Feldern.',
     unit=U(size='big', hp=2265, damage=232, hitSpeed=1.2, firstHit=0.5, speed=MED, range=1.2, targets='ground',
            traits=dict(secondary=dict(damage=304, hitSpeed=5, firstHit=1.5, range=5, minRange=2.5, targets='both', splash=1.5, towerDamage=0.64,
                                       projectile=P('rocket', 5.83, arc=True)))))
note('goblin-machine', 'Leben 2265/Schaden 232 aus Übersicht (Balance 04.08.2026); Raketen-Angriffstempo 5 s und Tempo +40 % angewendet; Turmschaden 195 aus Übersicht.')

card(id='goblins', src='Goblins', name='Kobolde', type='troop', rarity='common', elixir=2, count=4,
     description='Vier flinke Kobolde mit Messern.',
     unit=U(size='small', hp=202, damage=125, hitSpeed=1.1, firstHit=0.6, speed=VFAST, range=0.5, targets='ground'))

card(id='goblinstein', src='Goblinstein', name='Goblinstein', type='troop', rarity='champion', cls='champion', elixir=5,
     description='Champion aus zwei Teilen: Der Doktor schießt Blitze, sein Monster stapft zu Gebäuden.',
     groups=[dict(unit='goblinstein', count=1, behind=1.5), dict(unit='goblinstein-monster', count=1)],
     unit=U(size='med', hp=721, damage=135, hitSpeed=1.8, firstHit=0.5, speed=MED, range=5.5, targets='both', projectile=P('lightning', 0),
            traits=dict(onHit=dict(stun=0.5))),
     ability=dict(name='Blitzverbindung', cost=2, castTime=1.0, description='Unter Strom: Die Verbindung zwischen Doktor und Monster trifft 3,5 s lang alle 0,5 s Gegner in 2 Feldern Abstand.',
                  link=dict(partner='goblinstein-monster', radius=2, damage=107, pulse=0.5, duration=3.5, towerDamage=0.215)))
token('goblinstein-monster', name='Monster', hp=2240, damage=128, hitSpeed=1.5, firstHit=0.8, speed=MED, range=1.2, targets='buildings', radius=0.75, mass=18)
note('goblinstein', 'Doktor-Schaden 135 aus Übersicht (Balance 04.08.2026: +47 %); Fähigkeitsdauer 3,5 s (Balance 17.09.2026).')

card(id='golden-knight', src='Golden Knight', name='Goldener Ritter', type='troop', rarity='champion', cls='champion', elixir=4,
     description='Champion. Seine Fähigkeit lässt ihn von Gegner zu Gegner springen.',
     unit=U(size='med', hp=1799, damage=161, hitSpeed=0.9, firstHit=0.2, speed=MED, range=1.2, targets='ground'),
     ability=dict(name='Schnellsprung', cost=1, castTime=0.8, description='Springt bis zu 10-mal unverwundbar von Gegner zu Gegner (je 335 Schaden, 5,5 Felder Sprungweite).',
                  dash=dict(count=10, radius=5.5, damage=335, interval=0.25, seekSpeed=VFAST)))

card(id='golem', src='Golem', name='Golem', type='troop', rarity='epic', elixir=8,
     description='Riesiger Felsgolem für Gebäude. Explodiert beim Tod und zerfällt in zwei Golemiten.',
     unit=U(size='huge', hp=5120, damage=312, hitSpeed=2.5, firstHit=1.0, speed=SLOW, range=0.75, sight=7.5, deployTime=3, targets='buildings',
            traits=dict(deathDamage=dict(damage=225, radius=2, knockback=1, fx='rock'), deathSpawn=dict(unit='golemite', count=2))))
token('golemite', name='Golemit', hp=1039, damage=84, hitSpeed=2.5, firstHit=1.0, speed=SLOW, range=0.25, targets='buildings', radius=0.6, mass=10,
      traits=dict(deathDamage=dict(damage=99, radius=2, knockback=1, fx='rock')))
