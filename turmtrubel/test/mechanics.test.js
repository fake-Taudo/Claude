// Mechanik-Bausteine der echten Karten, je Gruppe mit einer typischen Karte geprüft.
// Gegner sind meist „Puppen“ (stehen still, greifen nicht an), die Kronentürme werden betäubt,
// damit nur die getestete Mechanik Schaden macht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, newMatch, runSeconds, runUntil, spawn, forceHand } from './helpers.js';

const quiet = (m) => {
  for (const t of m.towers) t.stunT = 1e9;
};
const dummy = (m, ref, side, x, y) => {
  const e = spawn(m, ref, side, x, y);
  e.def = { ...e.def, speed: 0, damage: 0 };
  return e;
};
const lost = (e) => e.maxHp - e.hp;
const near = (a, b, eps = 1) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const unitsOf = (m, side, key) => m.entities.filter((e) => e.owner === side && !e.dead && e.def.key === key);
const play = (m, side, id, x, y, elixir = 10) => {
  forceHand(m, side, 0, id, elixir);
  const r = m.play(side, 0, id, x, y);
  assert.ok(r.ok, `${id}: ${JSON.stringify(r)}`);
  return r;
};

// ───────────── Angriffsarten ─────────────

test('Ansturm: Prinz trifft nach Anlauf mit Ansturmschaden', () => {
  const m = newMatch();
  quiet(m);
  spawn(m, 'prince', 0, 9, 24);
  const g = dummy(m, 'giant', 1, 9, 18);
  assert.ok(runUntil(m, () => lost(g) > 0, 10));
  assert.equal(lost(g), db.unit('prince').traits.charge.damage);
  runUntil(m, () => lost(g) > db.unit('prince').traits.charge.damage, 3);
  assert.equal(lost(g), db.unit('prince').traits.charge.damage + db.unit('prince').damage, 'danach normaler Schlag');
});

test('Kamikaze mit Flächenschaden: Feuergeist', () => {
  const m = newMatch();
  quiet(m);
  const s = spawn(m, 'fire-spirit', 0, 9, 22);
  const a = dummy(m, 'knight', 1, 9, 18.5);
  const b = dummy(m, 'knight', 1, 10.2, 18.5);
  assert.ok(runUntil(m, () => lost(a) > 0, 6));
  runSeconds(m, 0.1);
  assert.ok(s.dead, 'Geist opfert sich');
  assert.equal(lost(a), db.unit('fire-spirit').damage);
  assert.equal(lost(b), db.unit('fire-spirit').damage, 'Nachbar im Radius getroffen');
});

test('Rampe: Inferno-Turm wird mit der Zeit stärker', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'inferno-tower', 9, 22);
  const g = dummy(m, 'golem', 1, 9, 18.5);
  runSeconds(m, 2.5);
  const early = lost(g);
  runSeconds(m, 4);
  const h = lost(g);
  runSeconds(m, 1);
  assert.ok(lost(g) - h > early * 3, `später pro Sekunde ${lost(g) - h} vs. anfangs ${early}`);
});

test('Kettenblitz: Elektrodrache trifft drei Ziele und betäubt', () => {
  const m = newMatch();
  quiet(m);
  spawn(m, 'electro-dragon', 0, 9, 22);
  const t = [dummy(m, 'knight', 1, 9, 19), dummy(m, 'knight', 1, 10.5, 18.5), dummy(m, 'knight', 1, 7.5, 18.5), dummy(m, 'knight', 1, 9, 13)];
  assert.ok(runUntil(m, () => lost(t[0]) > 0, 6));
  runSeconds(m, 0.05);
  const hit = t.filter((x) => lost(x) > 0);
  assert.equal(hit.length, 3, 'genau drei Ziele (das ferne nicht)');
  for (const x of hit) assert.ok(x.stunT > 0, 'betäubt');
});

test('Verlangsamung: Eismagier bremst sein Ziel', () => {
  const m = newMatch();
  quiet(m);
  spawn(m, 'ice-wizard', 0, 9, 22);
  const g = dummy(m, 'giant', 1, 9, 18);
  assert.ok(runUntil(m, () => lost(g) > db.unit('ice-wizard').traits.deployBlast.damage, 6));
  assert.ok(g.slowT > 0 && g.slowAmt > 0.2);
  assert.ok(m.speedMult(g) < 0.8);
});

test('Durchschlag: Bowler trifft alle Gegner auf seiner Linie', () => {
  const m = newMatch();
  quiet(m);
  spawn(m, 'bowler', 0, 9, 24);
  const a = dummy(m, 'knight', 1, 9, 20);
  const b = dummy(m, 'knight', 1, 9, 18.5);
  assert.ok(runUntil(m, () => lost(a) > 0 && lost(b) > 0, 8));
});

test('Schild: Leibgarde verliert erst den Schild', () => {
  const m = newMatch();
  const g = spawn(m, 'guards', 0, 9, 24);
  const shield = db.unit('guards').traits.shield;
  m.damage(g, 100, null, 1);
  assert.equal(g.hp, g.maxHp);
  assert.equal(g.shield, shield - 100);
  m.damage(g, 1000, null, 1);
  assert.equal(g.shield, 0);
  assert.equal(g.hp, g.maxHp, 'Überschuss beim Schildbruch geht nicht aufs Leben');
  m.damage(g, 10, null, 1);
  assert.equal(lost(g), 10);
});

// ───────────── Erzeugen, Tod, Elixier ─────────────

test('Spawner und Todes-Spawn: Grabstein', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'tombstone', 9, 22);
  runSeconds(m, 7);
  const n = unitsOf(m, 0, 'skeletons').length;
  assert.ok(n >= 4, `${n} Skelette nach 7 s`);
  const ts = m.entities.find((e) => e.cardId === 'tombstone');
  m.damage(ts, 1e6, null, 1);
  m.step();
  m.step();
  assert.equal(unitsOf(m, 0, 'skeletons').length, n + db.unit('tombstone').traits.deathSpawn.count);
});

test('Verzögerte Todesbombe: Riesenskelett', () => {
  const m = newMatch();
  quiet(m);
  const gs = spawn(m, 'giant-skeleton', 0, 9, 22);
  const k = dummy(m, 'giant', 1, 10, 22);
  m.damage(gs, 1e6, null, 1);
  runSeconds(m, 1);
  assert.equal(lost(k), 0, 'Bombe tickt noch');
  runSeconds(m, 3);
  assert.equal(lost(k), db.unit('giant-skeleton').traits.deathDamage.damage);
});

test('Elixiergolem gibt dem Gegner beim Tod Elixier', () => {
  const m = newMatch();
  const g = spawn(m, 'elixir-golem', 0, 9, 22);
  m.players[1].elixir = 2;
  m.players[1].elixirRate = 0;
  m.damage(g, 1e6, null, 1);
  m.step();
  assert.ok(m.players[1].elixir >= 3 - 1e-6, `Gegner hat ${m.players[1].elixir}`);
  assert.equal(unitsOf(m, 0, 'elixir-golemite').length, 2);
});

// ───────────── Bewegung ─────────────

test('Flusssprung: Schweinereiter überquert den Fluss abseits der Brücken', () => {
  const m = newMatch();
  const h = spawn(m, 'hog-rider', 0, 9, 19);
  let jumped = false;
  for (let i = 0; i < 80; i++) {
    m.step();
    if (h.y < 15 && Math.abs(h.x - 9) < 2.5) jumped = true;
  }
  assert.ok(jumped, `Position ${h.x.toFixed(1)},${h.y.toFixed(1)}`);
});

test('Sprint: Banditin springt aufs Ziel und ist dabei unverwundbar', () => {
  const m = newMatch();
  quiet(m);
  const b = spawn(m, 'bandit', 0, 9, 23);
  const g = dummy(m, 'giant', 1, 9, 18.5);
  let invul = false;
  for (let i = 0; i < 100 && !lost(g); i++) {
    m.step();
    if (b.dash && m.isInvulnerable(b)) invul = true;
  }
  assert.ok(invul, 'unverwundbar während des Sprints');
  assert.equal(lost(g), db.unit('bandit').traits.dash.damage);
});

test('Sprungangriff: Megaritter landet mit Flächenschaden', () => {
  const m = newMatch();
  quiet(m);
  const mk = spawn(m, 'mega-knight', 0, 9, 23);
  mk.deployT = 0;
  const g = dummy(m, 'giant', 1, 9, 18.6);
  assert.ok(runUntil(m, () => lost(g) > 0, 6));
  assert.equal(lost(g), db.unit('mega-knight').traits.leap.damage);
});

test('Haken: Fischer zieht ein entferntes Ziel heran', () => {
  const m = newMatch();
  quiet(m);
  const f = spawn(m, 'fisherman', 0, 9, 24);
  const k = dummy(m, 'knight', 1, 9, 18.5);
  const d0 = Math.hypot(k.x - f.x, k.y - f.y);
  runSeconds(m, 3);
  assert.ok(Math.hypot(k.x - f.x, k.y - f.y) < d0 - 2, 'Ziel wurde gezogen');
});

test('Überall platzierbar: Mineur und Koboldbohrer', () => {
  const m = newMatch();
  play(m, 0, 'miner', 9, 8);
  const miner = m.entities.find((e) => e.cardId === 'miner');
  assert.ok(miner.underT > 0 || miner.deployT > 0, 'gräbt sich hin');
  play(m, 0, 'goblin-drill', 9, 10);
  forceHand(m, 0, 0, 'knight', 10);
  assert.equal(m.play(0, 0, 'knight', 9, 8).code, 'PLACEMENT', 'normale Truppen nicht');
});

test('Tarnung: Königsgeist ist unsichtbar, bis er zuschlägt', () => {
  const m = newMatch();
  quiet(m);
  const gh = spawn(m, 'royal-ghost', 0, 9, 22);
  runSeconds(m, 0.5);
  assert.ok(m.isHidden(gh));
  const a = spawn(m, 'archers', 1, 9, 17.5);
  a.def = { ...a.def, speed: 0 };
  assert.ok(runUntil(m, () => a.hp < a.maxHp, 5));
  runSeconds(m, 0.1);
  assert.ok(!m.isHidden(gh), 'nach dem Angriff sichtbar');
});

test('Versteckt: Tesla taucht nur bei Gegnern auf', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'tesla', 9, 22);
  runSeconds(m, 2);
  const t = m.entities.find((e) => e.cardId === 'tesla');
  assert.ok(m.isHidden(t), 'unter der Erde');
  const k = dummy(m, 'knight', 1, 9, 18.5);
  assert.ok(runUntil(m, () => lost(k) > 0, 4));
  assert.ok(!m.isHidden(t), 'aufgetaucht');
});

// ───────────── Zielwahl ─────────────

test('Zielwahl: Boden-Nahkämpfer ignorieren Luft, Bogenschützen nicht', () => {
  const m = newMatch();
  const k = spawn(m, 'knight', 0, 9, 22);
  const a = spawn(m, 'archers', 0, 10, 22);
  const air = spawn(m, 'minions', 1, 9, 20);
  const ground = spawn(m, 'knight', 1, 9, 19);
  assert.equal(m.canTarget(k, air), false);
  assert.equal(m.canTarget(k, ground), true);
  assert.equal(m.canTarget(a, air), true);
  const hog = spawn(m, 'hog-rider', 0, 8, 22);
  assert.equal(m.canTarget(hog, ground), false, 'Gebäudejäger');
});

// ───────────── Zauber ─────────────

test('Pfeile: drei Wellen', () => {
  const m = newMatch();
  const g = dummy(m, 'giant', 1, 9, 9);
  play(m, 0, 'arrows', 9, 9);
  runSeconds(m, 3);
  const s = db.spell(db.card('arrows'));
  assert.equal(lost(g), s.damage * s.waves);
});

test('Tornado zieht Gegner zur Mitte', () => {
  const m = newMatch();
  const k = dummy(m, 'knight', 1, 12, 9);
  play(m, 0, 'tornado', 9, 9);
  runSeconds(m, 1.5);
  assert.ok(Math.abs(k.x - 9) < 2.5, `x=${k.x}`);
  assert.ok(lost(k) > 0);
});

test('Baumstamm rollt über Bodentruppen, Luft bleibt unberührt', () => {
  const m = newMatch();
  quiet(m);
  const k = dummy(m, 'knight', 1, 9, 18);
  const air = dummy(m, 'minions', 1, 9.5, 18.5);
  const y0 = k.y;
  play(m, 0, 'the-log', 9, 21);
  runSeconds(m, 2);
  assert.equal(lost(k), db.spell(db.card('the-log')).damage);
  assert.ok(k.y < y0 - 0.5, 'zurückgestoßen');
  assert.equal(lost(air), 0);
});

test('Wut beschleunigt eigene Truppen, Frost friert Gegner ein', () => {
  const m = newMatch();
  const k = spawn(m, 'knight', 0, 9, 22);
  play(m, 0, 'rage', 9, 22);
  runSeconds(m, 0.8);
  assert.ok(m.speedMult(k) > 1.2 && m.attackRate(k) > 1.2);
  const e = dummy(m, 'giant', 1, 9, 9);
  play(m, 0, 'freeze', 9, 9);
  runSeconds(m, 0.1);
  assert.ok(e.frozen && e.stunT > 3);
});

test('Klonzauber verdoppelt eigene Truppen mit 1 Leben', () => {
  const m = newMatch();
  spawn(m, 'knight', 0, 9, 22);
  play(m, 0, 'clone', 9, 22);
  runSeconds(m, 0.5);
  const knights = unitsOf(m, 0, 'knight');
  assert.equal(knights.length, 2);
  const clone = knights.find((e) => e.clone);
  assert.ok(clone && clone.hp === 1);
});

test('Friedhof und Koboldfass erzeugen Truppen am Zielort', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'goblin-barrel', 4, 9);
  runSeconds(m, 3.5);
  assert.equal(unitsOf(m, 0, 'goblins').length, 3);
  play(m, 0, 'graveyard', 14, 8);
  runSeconds(m, 10);
  const skels = m.entities.filter((e) => e.owner === 0 && e.def.key === 'skeletons').length;
  assert.ok(skels >= 10, `${skels}`);
});

test('Erdbeben macht Gebäuden Extraschaden', () => {
  const m = newMatch();
  const b = spawn(m, 'cannon', 1, 9, 9, { kind: 'building' });
  b.def = { ...b.def, lifetime: 0 };
  const k = dummy(m, 'giant', 1, 10, 9);
  play(m, 0, 'earthquake', 9.5, 9);
  runSeconds(m, 4);
  const s = db.spell(db.card('earthquake'));
  assert.ok(lost(b) > lost(k) * 2, `Gebäude ${lost(b)} vs. Truppe ${lost(k)}`);
  near(lost(k), s.damage * 3, 1);
});

test('Spiegel: letzte Karte eine Stufe stärker für +1 Elixier', () => {
  const m = newMatch();
  const p = m.players[0];
  forceHand(m, 0, 0, 'mirror', 10);
  assert.equal(m.play(0, 0, 'mirror', 9, 22).code, 'MIRROR_EMPTY');
  play(m, 0, 'knight', 9, 22);
  forceHand(m, 0, 0, 'mirror', 10);
  assert.equal(m.costOf(0, db.card('mirror')), db.card('knight').elixir + 1);
  assert.ok(m.play(0, 0, 'mirror', 10, 22).ok);
  assert.equal(p.elixir, 10 - db.card('knight').elixir - 1);
  const ks = unitsOf(m, 0, 'knight');
  assert.equal(ks.length, 2);
  near(ks[1].maxHp / ks[0].maxHp, 1.1, 0.01);
});

test('Spirit Empress: Form hängt vom Elixier ab', () => {
  const m = newMatch();
  const c = db.card('spirit-empress');
  m.players[0].elixir = 10;
  assert.equal(m.costOf(0, c), 6);
  m.players[0].elixir = 5;
  assert.equal(m.costOf(0, c), 3);
  play(m, 0, 'spirit-empress', 9, 22, 5);
  const e = m.entities.find((x) => x.cardId === 'spirit-empress');
  assert.equal(e.flying, false, 'Bodenform');
  assert.equal(m.players[0].elixir, 2);
  play(m, 0, 'spirit-empress', 9, 22, 8);
  const air = m.entities.filter((x) => x.cardId === 'spirit-empress').at(-1);
  assert.equal(air.flying, true, 'Luftform');
});

// ───────────── Champions ─────────────

test('Champion Bogenkönigin: Tarnumhang macht unsichtbar', () => {
  const m = newMatch();
  play(m, 0, 'archer-queen', 9, 22);
  runSeconds(m, 1.5);
  const q = m.entities.find((e) => e.cardId === 'archer-queen');
  assert.ok(m.useAbility(0).ok);
  runSeconds(m, db.card('archer-queen').ability.castTime + 0.1);
  assert.ok(m.isHidden(q));
  runSeconds(m, 4);
  assert.ok(!m.isHidden(q));
});

test('Champion Mönch: Schutzhaltung senkt den Schaden', () => {
  const m = newMatch();
  play(m, 0, 'monk', 9, 22);
  runSeconds(m, 1.5);
  const mo = m.entities.find((e) => e.cardId === 'monk');
  assert.ok(m.useAbility(0).ok);
  runSeconds(m, db.card('monk').ability.castTime + 0.1);
  const hp = mo.hp;
  m.damage(mo, 100, null, 1);
  near(hp - mo.hp, 100 * db.card('monk').ability.guard.damageTaken, 0.5);
});

test('Champion stirbt → Fähigkeit weg, Karte zurück im Zyklus', () => {
  const m = newMatch();
  play(m, 0, 'skeleton-king', 9, 22);
  assert.equal(m.players[0].championOut, 'skeleton-king');
  const k = m.entities.find((e) => e.cardId === 'skeleton-king');
  m.damage(k, 1e7, null, 1);
  m.step();
  assert.equal(m.players[0].championOut, null);
  assert.equal(m.useAbility(0).code, 'NO_ABILITY');
});

// ───────────── Helden ─────────────

test('Held Riese: Heldenwurf schleudert und betäubt', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'giant-hero', 9, 22);
  runSeconds(m, 1.5);
  const k = dummy(m, 'knight', 1, 9, 20.5);
  assert.ok(m.useAbility(0).ok);
  let thrown = false;
  for (let i = 0; i < 60; i++) {
    m.step();
    if (k.thrown) thrown = true;
  }
  assert.ok(thrown, 'Gegner fliegt');
  assert.ok(lost(k) >= db.card('giant-hero').ability.hurl.damage);
});

test('Held Musketierin baut einen Geschützturm', () => {
  const m = newMatch();
  play(m, 0, 'musketeer-hero', 9, 24);
  runSeconds(m, 1.5);
  assert.ok(m.useAbility(0).ok);
  runSeconds(m, 1.5);
  assert.equal(unitsOf(m, 0, 'hero-turret').length, 1);
});

test('Held aus Zauber: Barbarenfass-Held bekommt die Fähigkeit am Barbaren', () => {
  const m = newMatch();
  quiet(m);
  play(m, 0, 'barbarian-barrel-hero', 9, 22);
  runSeconds(m, 2.5);
  const b = m.abilityEntity(0);
  assert.ok(b && b.def.key === 'barbarians');
  assert.ok(m.useAbility(0).ok);
});

// ───────────── Evolutionen ─────────────

function evoPlay(m, id, x, y) {
  const p = m.players[0];
  p.evoCards.add(id);
  p.evoCharge[id] = db.card(id).evo.cycles;
  const r = play(m, 0, id, x, y);
  assert.ok(r.evo, 'als Evo gespielt');
  return m.entities.filter((e) => e.cardId === id).at(-1);
}

test('Evo-Ritter: 60 % weniger Schaden, solange er nicht angreift', () => {
  const m = newMatch();
  const k = evoPlay(m, 'knight', 9, 24);
  runSeconds(m, 1.5);
  m.damage(k, 100, null, 1);
  near(lost(k), 40, 0.5);
});

test('Evo-Skelette vermehren sich beim Treffen (max. 8)', () => {
  const m = newMatch();
  quiet(m);
  evoPlay(m, 'skeletons', 9, 20);
  dummy(m, 'golem', 1, 9, 18.5);
  runSeconds(m, 8);
  const n = unitsOf(m, 0, 'skeletons').length;
  assert.ok(n > 3 && n <= 8, `${n} Skelette`);
});

test('Evo-Fledermäuse heilen sich beim Treffen', () => {
  const m = newMatch();
  quiet(m);
  const b = evoPlay(m, 'bats', 9, 20);
  const g = dummy(m, 'golem', 1, 9, 18.5);
  runSeconds(m, 1.2);
  const bats = unitsOf(m, 0, 'bats');
  for (const x of bats) x.hp = 50;
  runUntil(m, () => lost(g) > 0, 4);
  runSeconds(m, 1.2);
  assert.ok(bats.some((x) => x.hp > 50), 'geheilt');
  assert.ok(b.evo);
});

test('Evo-Bogenschützen: Bonus auf große Entfernung', () => {
  const m = newMatch();
  quiet(m);
  evoPlay(m, 'archers', 9, 24);
  const g = dummy(m, 'golem', 1, 9, 18.5);
  runUntil(m, () => lost(g) > 0, 6);
  runSeconds(m, 0.05);
  const bonus = db.unit('archers', true).traits.longRangeBonus.damage;
  assert.ok(lost(g) >= bonus, `${lost(g)} ≥ ${bonus}`);
});

test('Evo-Zyklen: Evo-Ladung wächst pro Ausspielen', () => {
  const m = newMatch();
  const p = m.players[0];
  assert.ok(p.evoCards.has('knight') && p.evoCards.has('archers'), 'Plätze 1–2 sind Evo-Plätze');
  assert.ok(!p.evoCards.has('giant'));
  forceHand(m, 0, 0, 'knight', 10);
  assert.equal(m.play(0, 0, 'knight', 9, 22).evo, false);
  assert.equal(p.evoCharge.knight, 1);
});
