from defs import *

# ───────────────────────── Truppen G–M ─────────────────────────

card(id='guards', src='Guards', name='Wächter', type='troop', rarity='epic', elixir=3, count=3,
     description='Drei Skelette mit Speer und Schild – erst der Schild, dann sie selbst.',
     unit=U(size='small', hp=81, damage=117, hitSpeed=1.0, firstHit=0.5, speed=FAST, range=1.6, targets='ground', traits=dict(shield=256)))

card(id='heal-spirit', src='Heal Spirit', name='Heilungsgeist', type='troop', rarity='rare', elixir=1,
     description='Springt auf Gegner, macht Flächenschaden und hinterlässt ein Heilfeld für deine Truppen.',
     unit=U(size='tiny', hp=215, damage=110, hitSpeed=1.0, firstHit=0.1, speed=VFAST, range=2.5, targets='both', splash=1.5,
            traits=dict(kamikaze=True, deathSpell=dict(radius=2.5, duration=1, pulse=0.25, heal=100, fx='heal'))))

card(id='hog-rider', src='Hog Rider', name='Schweinereiter', type='troop', rarity='rare', elixir=4,
     description='Schneller Reiter, der nur Gebäude angreift und über den Fluss springt.',
     unit=U(size='large', hp=1697, damage=317, hitSpeed=1.6, firstHit=0.6, speed=VFAST, range=0.8, targets='buildings', traits=dict(riverJump=True)))

card(id='hunter', src='Hunter', name='Jäger', type='troop', rarity='epic', elixir=4,
     description='Seine Schrotflinte feuert 10 Kugeln breit gestreut – aus der Nähe verheerend.',
     unit=U(size='med', hp=885, damage=84, hitSpeed=2.2, firstHit=0.7, speed=MED, range=4, targets='both',
            projectile=P('pellet', 9.17), traits=dict(spread=dict(count=10, angle=30, length=6.5))),
     evo=dict(cycles=2, description='Wirft alle 5 s ein Netz auf die nächste Truppe in 4 Feldern: hält sie 3 s fest und holt Flieger auf den Boden.',
              unit=dict(traits=dict(net=dict(interval=5, range=4, duration=3)))))
note('hunter', 'Streuwinkel 30° geschätzt (Wiki: „wide spread“).')

card(id='ice-golem', src='Ice Golem', name='Eisgolem', type='troop', rarity='rare', elixir=2,
     description='Zäher Gebäude-Angreifer. Explodiert beim Tod und verlangsamt alles in der Nähe.',
     unit=U(size='large', hp=1228, damage=84, hitSpeed=2.5, firstHit=1.0, speed=SLOW, range=0.75, targets='buildings',
            traits=dict(deathDamage=dict(damage=84, radius=2, slow=dict(amount=0.3, duration=2.5), fx='frost'))))
note('ice-golem', 'Leben 1228 aus Übersicht (Balance 08.09.2026: −7 %; Kartenseite noch 1315), Verlangsamung 2,5 s (Balance 08.09.2026).')

card(id='ice-spirit', src='Ice Spirit', name='Eisgeist', type='troop', rarity='common', elixir=1,
     description='Springt auf Gegner und friert sie 1,1 s lang ein.',
     unit=U(size='tiny', hp=215, damage=110, hitSpeed=1.0, firstHit=0.1, speed=VFAST, range=2.5, targets='both', splash=1.5,
            traits=dict(kamikaze=True, onHit=dict(stun=1.1, freeze=True))),
     evo=dict(cycles=2, description='+0,5 Splash-Radius. 3 s nach dem Aufprall folgt ein zweiter Frostschlag (110 Schaden, 1,1 s Einfrieren).',
              unit=dict(splash=2, traits=dict(deathSpell=dict(delay=3, radius=2, damage=110, stun=1.1, freeze=True, towerDamage=0.3, fx='frost')))))
note('ice-spirit', 'Turmschaden des Evo-Frostschlags (0,3×) geschätzt.')

card(id='ice-wizard', src='Ice Wizard', name='Eismagier', type='troop', rarity='legendary', elixir=3,
     description='Seine Eissplitter verlangsamen Gegner um 30 %. Landet mit einem Frostschlag.',
     unit=U(size='med', hp=688, damage=89, hitSpeed=1.7, firstHit=0.5, speed=MED, range=5.5, targets='both', splash=1.5, projectile=P('ice', 11.67),
            traits=dict(onHit=dict(slow=dict(amount=0.3, duration=2.5)), deployBlast=dict(damage=84, radius=3, slow=dict(amount=0.3, duration=1), fx='frost'))))

card(id='inferno-dragon', src='Inferno Dragon', name='Infernodrache', type='troop', rarity='legendary', elixir=4,
     description='Fliegender Drache mit Feuerstrahl, der immer heißer wird, je länger er dasselbe Ziel trifft.',
     unit=U(size='large', hp=1295, damage=35, hitSpeed=0.4, firstHit=0.2, speed=MED, range=3.5, targets='both', flying=True, projectile=P('beam', 0),
            traits=dict(ramp=dict(stages=[35, 120, 422], stageTime=2))),
     evo=dict(cycles=2, description='Behält nach einem Sieg seine Strahlstufe bis zu 9 s. Nach 20 s Dauerfeuer erreicht er eine 4. Stufe (844 Schaden).',
              unit=dict(traits=dict(ramp=dict(stages=[35, 120, 422, 844], stageTime=2, stageAt=[0, 2, 4, 20], keep=9)))))
note('inferno-dragon', 'Erstangriff 0,2 s geschätzt (Wiki ohne Angabe).')

card(id='knight', src='Knight', name='Ritter', type='troop', rarity='common', elixir=3,
     description='Robuster Nahkämpfer – günstig und vielseitig.',
     unit=U(size='med', hp=1766, damage=202, hitSpeed=1.2, firstHit=0.5, speed=MED, range=1.2, targets='ground'),
     evo=dict(cycles=2, description='Erleidet 60 % weniger Schaden, solange er nicht angreift.',
              unit=dict(traits=dict(armor=dict(mult=0.4, unlessAttacking=True)))))

card(id='lava-hound', src='Lava Hound', name='Lavahund', type='troop', rarity='legendary', elixir=7,
     description='Fliegender Koloss für Gebäude. Zerplatzt beim Tod in sechs Lavawelpen.',
     unit=U(size='huge', hp=3581, damage=53, hitSpeed=1.3, firstHit=1.0, speed=SLOW, range=3.5, targets='buildings', flying=True, projectile=P('spit', 6.67),
            traits=dict(deathSpawn=dict(unit='lava-pup', count=6))))
token('lava-pup', name='Lavawelpe', hp=217, damage=81, hitSpeed=1.7, firstHit=1.0, speed=MED, range=1.6, targets='both', flying=True, radius=0.35, mass=1,
      projectile=P('spit', 8.33))

card(id='little-prince', src='Little Prince', name='Little Prince', type='troop', rarity='champion', cls='champion', elixir=3,
     description='Champion. Schießt immer schneller, solange er stehen bleibt. Seine Leibwächterin stürmt auf Befehl herbei.',
     unit=U(size='small', hp=698, damage=104, hitSpeed=1.2, firstHit=0.4, speed=MED, range=5.5, targets='both', projectile=P('bolt', 13.33),
            traits=dict(attackRamp=dict(hitSpeeds=[1.2, 0.6, 0.4], shotsPerStage=3, keepWhileMoving=0.3))),
     ability=dict(name='Königliche Rettung', cost=3, castTime=0.95, description='Guardienne stürmt vor den Prinzen (320 Schaden, Rückstoß bis 2 Felder) und kämpft danach weiter.',
                  summonCharge=dict(unit='guardienne', distance=4, damage=320, radius=1.5, knockback=2)))
token('guardienne', name='Guardienne', hp=1600, damage=217, hitSpeed=1.2, firstHit=0.5, speed=MED, range=1.2, targets='ground', deployTime=0.3, radius=0.5, mass=6)
note('little-prince', 'Sturmschaden 320 (Balance 26.08.2026: +25 % von 256). Stufenwechsel nach je 3 Schüssen geschätzt.')

card(id='lumberjack', src='Lumberjack', name='Holzfäller', type='troop', rarity='legendary', elixir=4,
     description='Sehr schneller Axtkämpfer. Beim Tod verschüttet er einen Wut-Zauber.',
     unit=U(size='med', hp=1282, damage=256, hitSpeed=0.8, firstHit=0.4, speed=VFAST, range=0.7, targets='ground',
            traits=dict(deathSpell=dict(radius=3, duration=5.5, rage=dict(mult=1.3), damage=179, towerDamage=0.3, fx='rage'))),
     evo=dict(cycles=2, description='Nach seinem Tod kämpft sein Geist in der Wut-Pfütze weiter – unverwundbar und nicht anvisierbar.',
              unit=dict(traits=dict(deathSpell=dict(radius=3, duration=5.5, rage=dict(mult=1.3), damage=179, towerDamage=0.3, fx='rage'),
                                    deathSpawn=dict(unit='lumberjack-ghost', count=1)))))
token('lumberjack-ghost', name='Holzfäller-Geist', hp=1, damage=256, hitSpeed=0.8, firstHit=0.4, speed=VFAST, range=0.7, targets='ground', radius=0.5, mass=6,
      lifetime=6, deployTime=0, towerDamage=0.5, traits=dict(untargetable=True, invulnerable=True))
note('lumberjack', 'Evo-Geist: bleibt als Näherung 6 s (Wiki: verschwindet kurz nach Verlassen der Wut-Pfütze).')

card(id='magic-archer', src='Magic Archer', name='Magieschütze', type='troop', rarity='legendary', elixir=4,
     description='Sein magischer Pfeil durchschlägt alles in einer Linie bis 11 Felder weit.',
     unit=U(size='med', hp=529, damage=133, hitSpeed=1.1, firstHit=0.7, speed=MED, range=7, targets='both',
            projectile=P('magic', 16.67), traits=dict(pierce=dict(length=11, width=0.5))))

card(id='mega-knight', src='Mega Knight', name='Megaritter', type='troop', rarity='legendary', elixir=7,
     description='Landet mit einem Flächenschlag und springt auf Gegner in 3,5–5 Feldern (doppelter Schaden).',
     unit=U(size='big', hp=3993, damage=268, hitSpeed=1.7, firstHit=0.5, speed=MED, range=1.2, targets='ground', splash=1.3,
            traits=dict(deployBlast=dict(damage=430, radius=2.2, knockback=1, fx='slam'),
                        leap=dict(min=3.5, max=5, damage=537, radius=2.2, windup=0.9, speed=4.17, knockback=1))),
     evo=dict(cycles=1, description='Jeder zweite Treffer ist ein Aufwärtshaken, der das Ziel 4 Felder Richtung seines Kronenturms schleudert.',
              unit=dict(traits=dict(uppercut=dict(every=2, distance=4)))))
note('mega-knight', 'Radius des Landeschlags (2,2) und Rückstoß 1 Feld geschätzt.')

card(id='mega-minion', src='Mega Minion', name='Megalakai', type='troop', rarity='rare', elixir=3,
     description='Gepanzerter Flieger mit hartem Schlag.',
     unit=U(size='med', hp=837, damage=312, hitSpeed=1.5, firstHit=0.4, speed=MED, range=1.6, targets='both', flying=True, projectile=P('magic', 16.67)))

card(id='mighty-miner', src='Mighty Miner', name='Großer Gräber', type='troop', rarity='champion', cls='champion', elixir=4,
     description='Champion mit Bohrer, dessen Schaden ansteigt. Kann die Seite wechseln und eine Bombe zurücklassen.',
     unit=U(size='large', hp=2250, damage=43, hitSpeed=0.4, firstHit=0.2, speed=MED, range=1.6, targets='ground', projectile=P('beam', 0),
            traits=dict(ramp=dict(stages=[43, 220, 442], stageTime=2))),
     ability=dict(name='Explosive Flucht', cost=1, castTime=1.0, description='Gräbt sich zur gespiegelten Position auf der anderen Seite und lässt eine Bombe zurück (332 Schaden nach 1 s, Rückstoß 1,8).',
                  burrow=dict(mirrorX=True), drop=dict(delay=1, radius=2.5, damage=332, knockback=1.8, towerDamage=0.3, fx='fire')))
note('mighty-miner', 'Stufenschaden +8 % (Balance 04.08.2026): 43/220/442. Bombenradius 2,5 und Turmschaden 0,3× geschätzt.')

card(id='miner', src='Miner', name='Tunnelgräber', type='troop', rarity='legendary', elixir=3,
     description='Gräbt sich überall in der Arena hin. Macht weniger Schaden an Kronentürmen.',
     unit=U(size='med', hp=1210, damage=194, hitSpeed=1.3, firstHit=0.5, speed=FAST, range=1.2, targets='ground', towerDamage=0.247,
            traits=dict(deployAnywhere=True, burrowSpeed=6)))

card(id='mini-pekka', src='Mini P.E.K.K.A.', name='Mini-P.E.K.K.A.', type='troop', rarity='rare', elixir=4,
     description='Kleiner Kampfroboter mit riesigem Schaden.',
     unit=U(size='med', hp=1390, damage=755, hitSpeed=1.6, firstHit=0.5, speed=FAST, range=0.8, targets='ground'))

card(id='minion-giant', src='Minion Giant', name='Minion Giant', type='troop', rarity='rare', elixir=4,
     description='Fliegender Riese aus dem Lakaien-Labor. Greift Gebäude aus der Ferne mit Giftspucke an.',
     unit=U(size='big', hp=1817, damage=150, hitSpeed=1.5, firstHit=0.5, speed=MED, range=4, targets='buildings', flying=True, projectile=P('spit', 8.33)))
note('minion-giant', 'Kartenseite noch leer („Coming soon“). Leben/Schaden/Tempo/Reichweite aus Übersicht, Schaden −11 % (Balance 17.09.2026). Tempo, Erstangriff, Geschosstempo und eine mögliche Giftwirkung sind Platzhalter.')

card(id='minion-horde', src='Minion Horde', name='Lakaienhorde', type='troop', rarity='common', elixir=5, count=6, unit='minions',
     description='Sechs Lakaien auf einmal.',
     evo=dict(cycles=1, description='Der erste Treffer gegen jeden Lakai macht ihn kurz unsichtbar und unverwundbar; unsichtbar greift er langsamer an.',
              unit=dict(traits=dict(veil=dict(duration=2, attackSpeed=0.67)))))
note('minion-horde', 'Evo: Dauer der Unsichtbarkeit (2 s) und Zyklen (1) geschätzt; Wiki-Seite ohne Werte. Angriffstempo 1,1 s laut Kartenseite der Horde, die Lakaien selbst nutzen 1,2 s.')

card(id='minions', src='Minions', name='Lakaien', type='troop', rarity='common', elixir=3, count=3,
     description='Drei schnelle Flieger, die Boden und Luft angreifen.',
     unit=U(size='small', hp=230, damage=107, hitSpeed=1.2, firstHit=0.5, speed=FAST, range=2.5, targets='both', flying=True, projectile=P('magic', 16.67)))

card(id='monk', src='Monk', name='Mönch', type='troop', rarity='champion', cls='champion', elixir=5,
     description='Champion. Jeder dritte Schlag trifft hart und stößt zurück. Seine Fähigkeit wirft Geschosse zurück.',
     unit=U(size='med', hp=2214, damage=140, hitSpeed=0.8, firstHit=0.2, speed=MED, range=1.2, targets='ground',
            traits=dict(combo=dict(every=3, damage=422, knockback=1.5))),
     ability=dict(name='Nachdenklicher Schutz', cost=1, castTime=1.0, description='4 s lang 65 % weniger Schaden; Geschosse prallen zum Absender zurück, Zauber zum nächsten Kronenturm.',
                  guard=dict(duration=4, damageTaken=0.35, reflectProjectiles=True, immovable=True)))
note('monk', 'Rückstoß des Kombo-Schlags (1,5 Felder) geschätzt.')

card(id='mother-witch', src='Mother Witch', name='Hexenmutter', type='troop', rarity='legendary', elixir=4,
     description='Verflucht getroffene Truppen 5 s lang. Stirbt eine verfluchte Truppe, wird sie zu einem Fluch-Schwein für dich.',
     unit=U(size='med', hp=529, damage=133, hitSpeed=1.0, firstHit=0.3, speed=MED, range=5.5, targets='both', projectile=P('magic', 10),
            traits=dict(onHit=dict(curse=dict(duration=5, unit='cursed-hog')))))
token('cursed-hog', name='Fluch-Schwein', hp=629, damage=53, hitSpeed=1.2, firstHit=0.25, speed=VFAST, range=0.75, targets='buildings', deployTime=0.2,
      radius=0.45, mass=4, traits=dict(riverJump=True))

card(id='musketeer', src='Musketeer', name='Musketierin', type='troop', rarity='rare', elixir=4,
     description='Zuverlässige Schützin mit großer Reichweite.',
     unit=U(size='med', hp=721, damage=217, hitSpeed=1.0, firstHit=0.7, speed=MED, range=6, targets='both', projectile=P('bullet', 16.67)),
     evo=dict(cycles=2, description='Hat 3 Scharfschüsse mit unbegrenzter Reichweite nach vorn (390 Schaden, keine Kronentürme).',
              unit=dict(traits=dict(sniper=dict(ammo=3, damage=390, hitSpeed=1, width=2, speed=44, minRange=6)))))

card(id='night-witch', src='Night Witch', name='Nachthexe', type='troop', rarity='legendary', elixir=4,
     description='Ruft alle 5 s zwei Fledermäuse; beim Tod eine weitere.',
     unit=U(size='med', hp=906, damage=314, hitSpeed=1.3, firstHit=0.75, speed=MED, range=1.6, targets='ground',
            traits=dict(spawner=dict(unit='bats', count=2, interval=5, firstDelay=1), deathSpawn=dict(unit='bats', count=1))))

card(id='pekka', src='P.E.K.K.A.', name='P.E.K.K.A.', type='troop', rarity='epic', elixir=7,
     description='Schwer gepanzerter Kampfroboter mit gewaltigem Schwertschlag.',
     unit=U(size='big', hp=3760, damage=842, hitSpeed=1.8, firstHit=0.5, speed=SLOW, range=1.2, targets='ground'),
     evo=dict(cycles=1, description='Heilt sich bei jedem besiegten Gegner (160/305/577 je nach dessen Leben) – auch über ihr Maximum hinaus (bis 5640).',
              unit=dict(traits=dict(killHeal=dict(steps=[[990, 160], [1991, 305], [1e9, 577]], maxHp=5640)))))

card(id='phoenix', src='Phoenix', name='Phönix', type='troop', rarity='legendary', elixir=4,
     description='Fliegender Feuervogel. Stirbt er, explodiert er und wird zum Ei – schlüpft es nach 3,8 s, kehrt er zurück.',
     unit=U(size='med', hp=1052, damage=217, hitSpeed=1.0, firstHit=0.5, speed=MED, range=1.6, targets='both', flying=True,
            traits=dict(deathDamage=dict(damage=163, radius=1.5, knockback=1, fx='fire'), deathSpawn=dict(unit='phoenix-egg', count=1))))
token('phoenix-egg', name='Phönix-Ei', type='building', hp=240, size=1, lifetime=3.8, deployTime=0,
      traits=dict(hatch=dict(unit='phoenix-reborn')))
token('phoenix-reborn', name='Phönix (wiedergeboren)', hp=1052, damage=217, hitSpeed=1.0, firstHit=0.5, speed=MED, range=1.6, targets='both', flying=True,
      radius=0.5, mass=6, deployTime=0.5)

card(id='prince', src='Prince', name='Prinz', type='troop', rarity='epic', elixir=5,
     description='Stürmt nach 2,5 Feldern los und trifft dann doppelt. Springt über den Fluss.',
     unit=U(size='large', hp=1920, damage=391, hitSpeed=1.4, firstHit=0.5, speed=MED, range=1.6, targets='ground',
            traits=dict(charge=dict(distance=2.5, speed=VFAST, damage=783), riverJump=True)))

card(id='princess', src='Princess', name='Prinzessin', type='troop', rarity='legendary', elixir=3,
     description='Schießt brennende Pfeile mit Flächenschaden über eine riesige Distanz (9 Felder).',
     unit=U(size='small', hp=261, damage=168, hitSpeed=3.0, firstHit=0.3, speed=MED, range=9, deployTime=1.2, targets='both', splash=2, projectile=P('arrow', 10)),
     evo=dict(cycles=2, description='Ihr erster und danach jeder zweite Schuss verlangsamt Gegner im Umkreis von 3 Feldern um 30 %. Beim Tod hinterlässt sie ein Frostfeld.',
              unit=dict(traits=dict(slowShot=dict(first=True, every=2, radius=3, amount=0.3, duration=5.5),
                                    deathSpell=dict(radius=3, duration=5.5, slow=dict(amount=0.3), pulse=1, damage=40, towerDamage=0.3, fx='frost')))))
note('princess', 'Evo: Werte aus Fließtext/Balance 04.08.2026; Schaden des Frostfelds (40/s) ist ein Platzhalter.')

card(id='ram-rider', src='Ram Rider', name='Widderreiterin', type='troop', rarity='legendary', elixir=5,
     description='Der Widder stürmt auf Gebäude, die Reiterin fesselt Truppen mit ihrer Bola (70 % langsamer).',
     unit=U(size='large', hp=1766, damage=250, hitSpeed=1.7, firstHit=0.6, speed=MED, range=0.8, targets='buildings',
            traits=dict(charge=dict(distance=2.5, speed=VFAST, damage=501), riverJump=True,
                        secondary=dict(damage=104, hitSpeed=1.1, firstHit=0.4, range=5.5, targets='both', troopsOnly=True, projectile=P('bola', 10),
                                       onHit=dict(slow=dict(amount=0.7, duration=2))))))
note('ram-rider', 'Widder-Angriffstempo 1,7 s (Balance 12.01.2026: +6 %); Kartenseite: 1,8 s.')

card(id='rascals', src='Rascals', name='Rabauken', type='troop', rarity='common', elixir=5,
     description='Ein zäher Rabauke vorn, zwei Rabaukinnen mit Schleudern dahinter.',
     groups=[dict(unit='rascal-boy', count=1), dict(unit='rascal-girl', count=2, behind=1.3)])
token('rascal-boy', name='Rabauke', hp=1868, damage=217, hitSpeed=1.5, firstHit=0.4, speed=MED, range=0.8, targets='ground', radius=0.55, mass=8)
token('rascal-girl', name='Rabaukin', hp=261, damage=125, hitSpeed=1.0, firstHit=0.5, speed=MED, range=5, targets='both', radius=0.4, mass=3,
      projectile=P('pebble', 13.33))
note('rascals', 'Rabauke 1868 Leben laut Kartenseite (Übersicht: 1832).')

card(id='ronin', src='Ronin', name='Ronin', type='troop', rarity='legendary', elixir=5,
     description='Wandernder Schwertkämpfer. Pariert alle 3,5 s einen Nahkampfangriff und schlägt mit doppeltem Schaden zurück.',
     unit=U(size='med', hp=1779, damage=371, hitSpeed=1.3, firstHit=0.4, speed=FAST, range=1.2, targets='ground',
            traits=dict(parry=dict(cooldown=3.5, mult=2))))

card(id='royal-ghost', src='Royal Ghost', name='Königsgeist', type='troop', rarity='legendary', elixir=3,
     description='Unsichtbar, bis er angreift. Nach 2 s ohne Kampf verschwindet er wieder.',
     unit=U(size='med', hp=1210, damage=261, hitSpeed=1.8, firstHit=0.6, speed=FAST, range=1.2, targets='ground', splash=1, hover=True,
            traits=dict(stealth=dict(reveal=2))),
     evo=dict(cycles=2, description='Wird er sichtbar, ruft er zwei Seelensoldaten (Landeschaden), die nach einer Kampfpause wieder verschwinden.',
              unit=dict(traits=dict(stealth=dict(reveal=2, onReveal=dict(unit='souldier', count=2, landing=dict(damage=81, radius=1))))))
     )
token('souldier', name='Seelensoldat', hp=81, damage=81, hitSpeed=1.8, firstHit=0.6, speed=FAST, range=1.2, targets='ground', splash=1, deployTime=0.2,
      radius=0.4, mass=3, traits=dict(stealth=dict(reveal=2, vanish=True)))
note('royal-ghost', 'Flächenradius des Schlags (1 Feld) geschätzt. Evo: Landeschaden-Radius geschätzt.')

card(id='royal-giant', src='Royal Giant', name='Königsriese', type='troop', rarity='common', elixir=6,
     description='Riese mit Kanone: greift Gebäude aus 5 Feldern Entfernung an.',
     unit=U(size='big', hp=3164, damage=307, hitSpeed=1.8, firstHit=0.9, speed=SLOW, range=5, targets='buildings', projectile=P('cannonball', 16.67)),
     evo=dict(cycles=1, description='Jeder Schuss erzeugt einen Rückstoß um ihn herum (Radius 2,5, 81 Schaden, schiebt Bodentruppen 1 Feld weg).',
              unit=dict(traits=dict(recoilBlast=dict(radius=2.5, damage=81, knockback=1)))))

card(id='royal-hogs', src='Royal Hogs', name='Königsschweinchen', type='troop', rarity='rare', elixir=5, count=4, formation='line',
     description='Vier Schweinchen, die Gebäude angreifen und über den Fluss springen.',
     unit=U(size='small', hp=837, damage=74, hitSpeed=1.2, firstHit=0.4, speed=VFAST, range=0.7, targets='buildings', traits=dict(riverJump=True)),
     evo=dict(cycles=2, description='Fliegen zu Beginn. Beim ersten Angriff oder Treffer stürzen sie ab und machen Landeschaden (115).',
              unit=dict(flying=True, traits=dict(glide=dict(landing=dict(damage=115, radius=1.5))))))
note('royal-hogs', 'Evo: Radius des Landeschadens (1,5) geschätzt.')

card(id='royal-recruits', src='Royal Recruits', name='Königsrekruten', type='troop', rarity='common', elixir=7, count=6, formation='split',
     description='Sechs Rekruten mit Schild, verteilt über die ganze Breite.',
     unit=U(size='med', hp=547, damage=133, hitSpeed=1.3, firstHit=0.5, speed=MED, range=1.6, targets='ground', traits=dict(shield=240)),
     evo=dict(cycles=1, description='Ist ihr Schild zerstört, stürmen sie nach 2,5 Feldern los (doppelter Schaden).',
              unit=dict(traits=dict(charge=dict(distance=2.5, speed=VFAST, damage=266, needsNoShield=True)))))

card(id='rune-giant', src='Rune Giant', name='Rune Giant', type='troop', rarity='epic', elixir=4,
     description='Zielt auf Gebäude und verzaubert die zwei nächsten Truppen: jeder dritte Angriff macht 220 Bonusschaden.',
     unit=U(size='big', hp=2816, damage=120, hitSpeed=1.5, firstHit=0.5, speed=MED, range=1.2, targets='buildings',
            traits=dict(enchant=dict(range=8.5, count=2, every=3, bonus=220, linger=5))))
note('rune-giant', 'Leben 2816 aus Übersicht (Balance 04.08.2026: +6 %). Schaden 120 laut Kartenseite (Übersicht: 153).')

card(id='skeleton-army', src='Skeleton Army', name='Skelettarmee', type='troop', rarity='epic', elixir=3, count=15, unit='skeletons',
     description='Fünfzehn Skelette auf einen Schlag.',
     evo=dict(cycles=2, description='16 Skelette und General Gerry. Fallen Skelette, kämpfen ihre Schatten unverwundbar weiter – bis Gerry fällt.',
              count=16, groups=[dict(unit='general-gerry', count=1, behind=1.5)], unit=dict(traits=dict(shadowOnDeath=dict(unit='shadow-skeleton', leader='general-gerry')))))
token('general-gerry', name='General Gerry', hp=81, damage=81, hitSpeed=1.0, firstHit=0.5, speed=FAST, range=1.6, targets='ground', radius=0.4, mass=3,
      traits=dict(shield=81))
token('shadow-skeleton', name='Schattenskelett', hp=1, damage=81, hitSpeed=1.1, firstHit=0.5, speed=MED, range=0.5, targets='ground', radius=0.3, mass=1,
      deployTime=0.2, traits=dict(untargetable=True, invulnerable=True))

card(id='skeleton-barrel', src='Skeleton Barrel', name='Skelettfass', type='troop', rarity='common', elixir=3,
     description='Fliegendes Fass, das auf Gebäude zusteuert. Platzt es, regnet es 7 Skelette.',
     unit=U(size='large', hp=532, damage=0, hitSpeed=1, firstHit=0.1, speed=FAST, range=0.35, targets='buildings', flying=True,
            traits=dict(kamikaze=True, deathDamage=dict(damage=145, radius=2, delay=0.6, knockback=0.6, fx='barrel'),
                        deathSpawn=dict(unit='skeletons', count=7))),
     evo=dict(cycles=2, description='+25 % Leben und zwei Fässer: das erste fällt bei 75 % Leben, das zweite beim Tod (je 192 Schaden + 7 Skelette).',
              unit=dict(hp=665, traits=dict(dropAt=dict(at=0.75, damage=192, radius=2, unit='skeletons', count=7),
                                            deathDamage=dict(damage=192, radius=2, delay=0.6, knockback=0.6, fx='barrel')))))
note('skeleton-barrel', 'Rückstoß 0,6 Felder geschätzt.')

card(id='skeleton-dragons', src='Skeleton Dragons', name='Skelettdrachen', type='troop', rarity='common', elixir=4, count=2, formation='line',
     description='Zwei fliegende Skelettdrachen mit Flächenschaden.',
     unit=U(size='med', hp=560, damage=161, hitSpeed=2.0, firstHit=0.4, speed=FAST, range=3.5, targets='both', flying=True, splash=1.5, projectile=P('fire', 8.33)))
note('skeleton-dragons', 'Schaden 161 laut Kartenseite (Übersicht: 151).')

card(id='skeleton-king', src='Skeleton King', name='Skelettkönig', type='troop', rarity='champion', cls='champion', elixir=4,
     description='Champion mit Flächenschlag. Sammelt die Seelen gefallener Truppen und ruft damit Skelette.',
     unit=U(size='big', hp=2298, damage=204, hitSpeed=1.6, firstHit=0.3, speed=MED, range=1.2, targets='ground', splash=1.3, traits=dict(souls=dict(max=10))),
     ability=dict(name='Seelenruf', cost=2, castTime=1.0, description='Ruft 6 Skelette plus eines je gesammelter Seele (max. 16) im Umkreis von 4 Feldern.',
                  souls=dict(unit='skeletons', base=6, radius=4, interval=0.25, clone=True)))

card(id='skeletons', src='Skeletons', name='Skelette', type='troop', rarity='common', elixir=1, count=3,
     description='Drei winzige, schnelle Skelette.',
     unit=U(size='tiny', hp=81, damage=81, hitSpeed=1.1, firstHit=0.5, speed=FAST, range=0.5, targets='ground'),
     evo=dict(cycles=2, description='Bei jedem Angriff entsteht ein weiteres Evo-Skelett (bis zu 8 insgesamt).',
              unit=dict(traits=dict(onHit=dict(spawn=dict(unit='skeletons', count=1, groupMax=8, evo=True))))))

card(id='sparky', src='Sparky', name='Funki', type='troop', rarity='legendary', elixir=6,
     description='Lädt sich langsam auf und entlädt dann einen gewaltigen Flächenschuss. Betäubung setzt die Ladung zurück.',
     unit=U(size='big', hp=1451, damage=1331, hitSpeed=4.0, firstHit=1.0, speed=SLOW, range=5, targets='ground', splash=1.8,
            projectile=P('spark', 23.33), traits=dict(chargeUp=True)))

card(id='spear-goblins', src='Spear Goblins', name='Speerkobolde', type='troop', rarity='common', elixir=2, count=3,
     description='Drei Kobolde, die Speere auf Boden- und Luftziele werfen.',
     unit=U(size='small', hp=133, damage=81, hitSpeed=1.6, firstHit=0.5, speed=VFAST, range=5, targets='both', projectile=P('spear', 8.33)))

card(id='spirit-empress', src='Spirit Empress', name='Spirit Empress', type='troop', rarity='legendary', elixir=6,
     description='Mit 6 Elixier oder mehr kommt sie auf ihrem fliegenden Drachen (6 Elixier), sonst zu Fuß (3 Elixier).',
     forms=[dict(minElixir=6, elixir=6, unit='spirit-empress-air'), dict(elixir=3, unit='spirit-empress-ground')],
     unit='spirit-empress-air')
token('spirit-empress-air', name='Spirit Empress (Drache)', hp=1121, damage=320, hitSpeed=1.4, firstHit=0.6, speed=MED, range=5, targets='both', flying=True,
      radius=0.75, mass=12, projectile=P('spirit', 10))
token('spirit-empress-ground', name='Spirit Empress (zu Fuß)', hp=1121, damage=320, hitSpeed=1.2, firstHit=0.3, speed=FAST, range=1.2, targets='ground',
      radius=0.5, mass=6)
note('spirit-empress', 'Geschosstempo der Drachenform geschätzt. Schaden 320 laut Kartenseite (Balance 08.09.2026: +4 % – vermutlich schon enthalten).')

card(id='suspicious-bush', src='Suspicious Bush', name='Suspicious Bush', type='troop', rarity='rare', elixir=2,
     description='Unsichtbarer Busch, der zum nächsten Gebäude schleicht. Am Ziel oder beim Zerstören springen zwei Busch-Kobolde heraus.',
     unit=U(size='small', hp=90, damage=0, hitSpeed=1, firstHit=0.1, speed=MED, range=1.6, targets='buildings',
            traits=dict(kamikaze=True, stealth=dict(always=True), deathSpawn=dict(unit='bush-goblin', count=2))))
token('bush-goblin', name='Busch-Kobold', hp=304, damage=256, hitSpeed=1.4, firstHit=0.4, speed=MED, range=0.8, targets='ground', radius=0.4, mass=3)
note('suspicious-bush', 'Busch-Leben 90 (Balance 04.08.2026: +11 % von 81). Erstangriff der Busch-Kobolde geschätzt.')

card(id='three-musketeers', src='Three Musketeers', name='Drei Musketierinnen', type='troop', rarity='rare', elixir=9, count=3,
     description='Drei Musketierinnen. Kommen Gegner nah heran, kämpfen sie mit dem Bajonett.',
     unit=U(size='med', hp=883, damage=204, hitSpeed=1.3, firstHit=0.7, speed=MED, range=6, targets='both', projectile=P('bullet', 16.67),
            traits=dict(melee=dict(range=1.6, damage=314, switch=2.5))))
note('three-musketeers', 'Wechselabstand Nah-/Fernkampf (2,5 Felder) geschätzt.')

card(id='valkyrie', src='Valkyrie', name='Walküre', type='troop', rarity='rare', elixir=4,
     description='Wirbelt mit der Axt und trifft alle Bodentruppen um sich herum.',
     unit=U(size='med', hp=1907, damage=266, hitSpeed=1.5, firstHit=0.1, speed=MED, range=1.2, targets='ground', splash=2, splashSelf=True),
     evo=dict(cycles=2, description='Jeder Schlag erzeugt einen kurzen Wirbelsturm (5,5 Felder), der Gegner zu ihr zieht und 84 Schaden macht.',
              unit=dict(traits=dict(whirl=dict(radius=5.5, duration=0.5, damage=84, towerDamage=0.44, pull=1.2)))))
note('valkyrie', 'Evo-Wirbelschaden 84 laut Kartenseite (nach Balance 04.08.2026 überarbeitet); Zugstärke geschätzt.')

card(id='wall-breakers', src='Wall Breakers', name='Mauerbrecher', type='troop', rarity='epic', elixir=2, count=2, formation='line',
     description='Zwei Skelette mit Sprengfässern, die sich auf Gebäude stürzen.',
     unit=U(size='small', hp=330, damage=391, hitSpeed=1, firstHit=0.1, speed=VFAST, range=0.5, targets='buildings', splash=1.5, traits=dict(kamikaze=True)),
     evo=dict(cycles=2, description='Wird ihr Fass zerstört, explodiert es (291 Schaden) und sie rennen zu Fuß als Läufer weiter.',
              unit=dict(traits=dict(deathDamage=dict(damage=291, radius=1.5, towerDamage=0.66, fx='fire', notOnAttack=True),
                                    deathSpawn=dict(unit='wall-breaker-runner', count=1, notOnAttack=True)))))
token('wall-breaker-runner', name='Läufer', hp=164, damage=196, hitSpeed=1, firstHit=0.1, speed=VFAST, range=0.5, targets='buildings', splash=1.5,
      radius=0.35, mass=2, deployTime=0.2, traits=dict(kamikaze=True))
note('wall-breakers', 'Schaden 391 laut Kartenseite (Übersicht: 281; Balance 04.08.2026: „Todesschaden −20 %“ – Zuordnung unklar).')

card(id='witch', src='Witch', name='Hexe', type='troop', rarity='epic', elixir=5,
     description='Schießt mit Flächenschaden und ruft alle 7 s vier Skelette.',
     unit=U(size='med', hp=839, damage=135, hitSpeed=1.1, firstHit=0.7, speed=MED, range=5.5, targets='both', splash=1.5, projectile=P('magic', 10),
            traits=dict(spawner=dict(unit='skeletons', count=4, interval=7, firstDelay=1))),
     evo=dict(cycles=1, description='Stirbt eines ihrer ersten 4 Skelette einer Welle, heilt sie sich um 76 – bis zu 1039 Leben.',
              unit=dict(traits=dict(minionHeal=dict(heal=76, maxHp=1039, perWave=4)))))

card(id='wizard', src='Wizard', name='Magier', type='troop', rarity='rare', elixir=5,
     description='Schleudert Feuerbälle mit Flächenschaden auf Boden und Luft.',
     unit=U(size='med', hp=832, damage=304, hitSpeed=1.4, firstHit=0.5, speed=MED, range=5.5, targets='both', splash=1.5, projectile=P('fireball', 10)),
     evo=dict(cycles=1, description='Startet mit einem Feuerschild (177). Zerbricht es, explodiert es (281 Schaden, 3 Felder Rückstoß).',
              unit=dict(traits=dict(shield=177, shieldBreak=dict(radius=3, damage=281, knockback=3, fx='fire')))))
note('wizard', 'Schaden 304 (Balance 08.09.2026: +8 %), Erstangriff 0,5 s. Leben 832 laut Kartenseite (Übersicht: 755). Evo-Schild 177 (Balance 08.09.2026: −8 %).')

card(id='zappies', src='Zappies', name='Zappys', type='troop', rarity='rare', elixir=4, count=3,
     description='Drei kleine Zap-Maschinen, deren Treffer betäuben.',
     unit=U(size='small', hp=529, damage=117, hitSpeed=2.3, firstHit=0.8, speed=MED, range=4.5, targets='both', projectile=P('lightning', 0),
            traits=dict(onHit=dict(stun=0.5))))
note('zappies', 'Angriffstempo 2,3 s (Balance 08.09.2026).')
