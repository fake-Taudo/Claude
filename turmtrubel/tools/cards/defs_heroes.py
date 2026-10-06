from defs import *
import copy

# ───────────────────────── Helden ─────────────────────────
# Heldenvarianten sind eigene Karten (id = <basis>-hero). Werte = Basiskarte + Fähigkeit.
# Seit 04.08.2026 sind alle Fähigkeiten nur einmal pro Einsatz nutzbar (Ausnahme Boss Bandit).

def base_of(id):
    for c in CARDS:
        if c['id'] == id:
            return c
    raise KeyError(id)

def hero(base, name, ability, unit=None, src=None, description=None, extra=None):
    b = base_of(base)
    h = dict(id=base + '-hero', src=src or (b['src'] + '/Hero'), name=name, type=b['type'], rarity=b['rarity'], cls='hero', heroOf=base,
             elixir=b['elixir'], description=description or b['description'])
    for k in ('count', 'formation', 'groups', 'spell'):
        if k in b:
            h[k] = copy.deepcopy(b[k])
    if 'unit' in b:
        h['unit'] = copy.deepcopy(b['unit']) if isinstance(b['unit'], dict) else b['unit']
    if unit:
        if isinstance(h.get('unit'), dict):
            h['unit'].update(unit)
        else:
            h['unit'] = unit
    if extra:
        h.update(extra)
    h['ability'] = ability
    return card(**h)

hero('knight', 'Ritter (Held)',
     dict(name='Triumphaler Spott', cost=2, castTime=0.93, description='Zwingt 5 s lang alle Gegner in 7,5 Feldern, ihn anzugreifen, und erhält einen Schild (512).',
          taunt=dict(radius=7.5, duration=5), shield=512))

hero('giant', 'Riese (Held)',
     dict(name='Heldenwurf', cost=2, castTime=0.93, description='Packt die stärkste gegnerische Truppe in seiner Nähe und schleudert sie 9 Felder quer über die Arena (135 Aufprallschaden, 2 s betäubt).',
          hurl=dict(grab=2.5, distance=9, damage=135, stun=2)))
note('giant-hero', 'Greifradius 2,5 (Wiki: „within 2 tiles around him“, plus Körpergröße).')

hero('mini-pekka', 'Mini-P.E.K.K.A. (Held)',
     dict(name='Pfannkuchen-Power', cost=1, castTime=0.93, description='Isst seine Pfannkuchen: +1 bis +5 Stufen (je nach gefüllten Pfannkuchen-Leisten) und heilt 30 %.',
          pancakes=dict(fillTime=22, perHit=10, bars=3, levels=[1, 2, 3, 5], heal=0.3)),
     unit=dict(hp=1433))
note('mini-pekka-hero', 'Leben 1433 laut Heldenseite (Basis: 1390). „Stufe“ = +10 % Leben und Schaden je Stufe.')

hero('musketeer', 'Musketierin (Held)',
     dict(name='Treuer Geschützturm', cost=3, castTime=1.0, description='Stellt 3 Felder vor ihr einen Geschützturm auf (10 s, schießt schnell auf Boden und Luft, Landeschaden).',
          build=dict(unit='hero-turret', forward=3, landing=dict(damage=204, radius=1.5))),
     unit=dict(firstHit=0.5))
token('hero-turret', name='Geschützturm', type='building', hp=721, damage=140, hitSpeed=0.5, firstHit=0.3, range=4, targets='both', size=1.5, lifetime=10, deployTime=2,
      projectile=P('bullet', 16.67))
note('musketeer-hero', 'Turm-Angriffstempo 0,5 s aus 280 DPS / 140 Schaden abgeleitet; Aufbauzeit 2 s (Balance 12.01.2026); Radius des Landeschadens geschätzt.')

hero('ice-golem', 'Eisgolem (Held)',
     dict(name='Schneesturm', cost=2, castTime=1.0, description='Drei Eisstöße in 4 Feldern Umkreis: je 69 Schaden und 30 % langsamer (2 s); der dritte Stoß ist stärker.',
          pulses=dict(radius=4, count=3, interval=1, damage=[69, 69, 126], slow=dict(amount=0.3, duration=2), towerDamage=0.3, fx='frost')),
     unit=dict(hp=1228, firstHit=1.5, range=1.2))
note('ice-golem-hero', 'Dritter Stoß +82 % (Balance 04.08.2026) → 126. Abstand der Stöße (1 s) und Turmschaden geschätzt.')

hero('wizard', 'Magier (Held)',
     dict(name='Feuriger Flug', cost=1, castTime=1.0, description='Fliegt 3,5 s, ist 50 % schneller und seine Feuerbälle erzeugen Feuerwirbel (4 Felder), die Gegner anziehen.',
          flight=dict(duration=3.5, speedMult=1.5, whirl=dict(radius=4, duration=2, damage=43, towerDamage=0.36, pull=1))))
note('wizard-hero', 'Fähigkeitskosten 1 (Heldenseite/Übersicht; Infobox: 2). Dauer 3,5 s (Balance 08.09.2026). Turmschaden des Wirbels −64 % (Balance 23.02.2026) geschätzt.')

hero('goblins', 'Kobolde (Held)',
     dict(name='Bannerbrigade', cost=1, castTime=0.5, description='Der letzte Kobold lässt ein Banner fallen, das nach 1 s zwei weitere Kobolde ruft (Banner hält 5 s).',
          banner=dict(unit='goblins', count=2, delay=1, lifetime=5)))
note('goblins-hero', 'Brigade: 2 Kobolde (Balance 04.08.2026), Aufbau 1 s; Bannerposition 1 Feld hinter dem letzten Kobold.')

hero('mega-minion', 'Megalakai (Held)',
     dict(name='Verwundender Sprung', cost=2, castTime=0.0, description='Teleportiert zum Gegner mit den wenigsten Lebenspunkten (399 Schaden, Türme ¼) und kehrt nach dem Sieg oder 3,5 s zurück.',
          warp=dict(damage=399, towerDamage=0.25, returnAfter=3.5)))
note('mega-minion-hero', 'Warp-Schaden 399 laut Heldenseite (Balance 08.09.2026: +6 % – vermutlich enthalten).')

hero('barbarian-barrel', 'Barbarenfass (Held)',
     dict(name='Zweite Runde', cost=1, castTime=0.3, description='Der Barbar rollt noch einmal 3 Felder weit (230 Schaden) und heilt sich dabei um 50 %.',
          reroll=dict(length=3, width=2.6, damage=230, heal=0.5)),
     extra=dict(spell=dict(roll=dict(length=4.5, width=2.6, speed=6), damage=230, towerDamage=0.5, knockback=0.6, targets='ground', ownSide=True,
                           spawnAtEnd=dict(unit='barbarians', count=1, hero=True), fx='barrelRoll')))

hero('magic-archer', 'Magieschütze (Held)',
     dict(name='Dreifachgefahr', cost=2, castTime=0.3, description='Springt 3,5 Felder zurück, lässt einen Lockvogel (7 s) stehen und schießt als Nächstes drei weite Pfeile.',
          decoy=dict(unit='magic-archer-decoy', back=3.5), tripleShot=dict(damage=48, count=3, length=13.5, spread=12)))
token('magic-archer-decoy', name='Lockvogel', hp=271, damage=0, speed=0, range=0, targets='ground', radius=0.45, mass=1e6, lifetime=7, deployTime=0)
note('magic-archer-hero', 'Fächerwinkel der Dreifachschüsse (12°) geschätzt.')

hero('balloon', 'Ballon (Held)',
     dict(name='Sargkadetten', cost=2, castTime=0.3, description='Ein Skelett-Fallschirmjäger springt auf die nächste Bodentruppe in 6 Feldern (Landeschaden) und kämpft weiter.',
          paratrooper=dict(unit='skeletrooper', search=6, landing=dict(damage=229, radius=1.5, towerDamage=0.1))))
token('skeletrooper', name='Skelett-Fallschirmjäger', hp=473, damage=204, hitSpeed=1.1, firstHit=0.4, speed=VFAST, range=0.8, targets='ground', towerDamage=0.1,
      radius=0.4, mass=3, deployTime=0.3)
note('balloon-hero', 'Landeschaden 229 (Balance 08.09.2026: −13 % von 263); Radius geschätzt.')

hero('bowler', 'Bowler (Held)',
     dict(name='Steinwurf', cost=2, castTime=2.5, description='Stellt sich auf und wirft 7,3 s lang Felsen wie ein Mörser (11,5 Felder, 508 Schaden).',
          stance=dict(duration=7.3, range=11.5, hitSpeed=1.9, damage=508, towerDamage=0.5, splash=1.5, projectile=P('boulder', 6, arc=True))))
note('bowler-hero', 'Splash-Radius der Mörserwürfe (1,5) geschätzt.')

hero('dark-prince', 'Dunkler Prinz (Held)',
     dict(name='Zerstörerischer Absprung', cost=3, castTime=0.5, description='Springt vom Nashorn (307 Landeschaden). Das Nashorn stürmt auf Gebäude, der Prinz kämpft zu Fuß weiter.',
          dismount=dict(mount='rhino', landing=dict(damage=307, radius=1.5), rider=dict(charge=None, riverJump=False))))
token('rhino', name='Nashorn', hp=1356, damage=179, hitSpeed=1.6, firstHit=0.5, speed=MED, range=0.8, targets='buildings', radius=0.65, mass=12, deployTime=0,
      traits=dict(charge=dict(distance=2.5, speed=VFAST, damage=358)))

hero('tombstone', 'Grabstein (Held)',
     dict(name='Königliche Wiederkehr', cost=5, castTime=1.0, description='Die Grabkönigin steigt aus der Erde und marschiert auf Gebäude.',
          summon=dict(unit='tomb-queen', count=1)))
token('tomb-queen', name='Grabkönigin', hp=4224, damage=422, hitSpeed=1.5, firstHit=0.5, speed=SLOW, range=1.2, sight=7, targets='buildings', radius=0.75, mass=18,
      deployTime=1)
note('tombstone-hero', 'Grabkönigin: Angriffstempo, Tempo und Reichweite sind Platzhalter (Wiki nennt nur Leben/Schaden).')

hero('berserker', 'Berserker (Held)',
     dict(name='Wilde Wut', cost=3, castTime=0.3, description='3,5 s Bärengeist: rasend schnelle Schläge (167), sehr schnell, fällt nicht unter 1 Leben. Weniger Schaden an Kronentürmen.',
          frenzy=dict(duration=3.5, hitSpeed=0.2, damage=167, speed=UFAST, towerDamage=0.25, minHp=1)))
note('berserker-hero', 'Dauer 3,5 s (Balance 26.08.2026).')

hero('valkyrie', 'Walküre (Held)',
     dict(name='Wilder Wirbelwind', cost=3, castTime=0.3, description='Wirbelt 3,5 s lang: alle 0,25 s 97 Schaden im Umkreis von 2,5 Feldern, schneller und 15 % weniger Schaden.',
          spin=dict(duration=3.5, interval=0.25, radius=2.5, damage=97, towerDamage=0.5, damageTaken=0.85, speedMult=1.3)))
note('valkyrie-hero', 'Tempo-Bonus (+30 %) geschätzt; Heldenseite ohne Beschreibung.')

hero('ice-wizard', 'Eismagier (Held)',
     dict(name='Frostkerl', cost=2, castTime=1.0, description='Beschwört einen Schneemann, der beim Erscheinen Schaden macht und Gegner in seiner Nähe einfriert, solange er steht.',
          summon=dict(unit='snowman', count=1, forward=1.5)))
token('snowman', name='Schneemann', hp=425, damage=0, speed=0, range=0, targets='ground', radius=0.6, mass=1e6, lifetime=5, deployTime=0,
      traits=dict(deployBlast=dict(damage=84, radius=2.5, fx='frost'), freezeAura=dict(radius=2.5)))
note('ice-wizard-hero', 'Wiki-Seite noch leer. Kosten 2 (Wiki-Übersicht), Einfrieren 5 s (Balance 17.09.2026). Name/Wirkung laut Fanseite (timesaver.gg); Leben 425 und Radius 2,5 sind vorläufige Community-Werte, Landeschaden 84 Platzhalter.')
