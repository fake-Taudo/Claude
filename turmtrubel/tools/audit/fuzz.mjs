// Fuzz-Prüfung der Simulation: Bot gegen Bot mit Zufallsdecks (jede zweite Partie mit Evo-Plätzen), in jedem Tick
// werden Grundregeln geprüft: keine ungültigen Werte (NaN), niemand außerhalb des Felds, keine Bodentruppe im Fluss
// oder in einem Turm, keine Überheilung über das Doppelte, keine Einheit, die 8 s ohne Ziel-Lock festsitzt,
// keine Ausnahme, jeder Kampf endet. Dazu: wie oft das NaN-Sicherheitsnetz eingreifen musste (sollte nie passieren).
//
//   node tools/audit/fuzz.mjs [Kämpfe=60] [Modus=classic]      z. B. node tools/audit/fuzz.mjs 200 2v2
import { loadAll } from '../modes/bot-eval.mjs';
import { Match } from '../../server/sim/match.js';
import { Bot } from '../../server/bot.js';
import { randomDeck } from '../../shared/cards.js';
import { mulberry32 } from '../../server/sim/rng.js';
import { resolveRules } from '../../shared/modes.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARENA_W, ARENA_H } from '../../shared/arena.js';

/** N Bot-Kämpfe im Modus modeId (Startnummer first); gibt Verstöße (Map Art → {n, ex}) und Kennzahlen zurück. */
export function runFuzz(N = 60, modeId = 'classic', { ctx = loadAll(), first = 0 } = {}) {
const issues = new Map();
const add = (k, s) => { const v = issues.get(k) || { n: 0, ex: [] }; v.n++; if (v.ex.length < 3) v.ex.push(s); issues.set(k, v); };
const used = new Set();
let ticks = 0;
let nanFixesTotal = 0;
for (let g = first; g < first + N; g++) {
  const rng = mulberry32(5000 + g);
  const nP = ctx.modes.get(modeId).players;
  const decks = Array.from({ length: nP }, () => randomDeck(ctx.db, rng));
  decks.flat().forEach((c) => used.add(c));
  const R = resolveRules(ctx.rules, ctx.modes.get(modeId));
  const m = new Match({ db: ctx.db, rules: R, decks, seed: g + 1 });
  m.started = true;
  // jede zweite Partie mit Evo-Slots
  if (g % 2) for (const p of m.players) for (const id of p.hand.concat(p.queue).slice(0, 2)) if (ctx.db.card(id)?.evo) { p.evoCards.add(id); p.evoCharge[id] = 0; }
  const bots = decks.map((_, i) => new Bot(m, i, g * 13 + i, { difficulty: ['easy', 'medium', 'hard'][(g + i) % 3] }));
  const still = new Map();
  try {
    while (!m.result && m.tick < 20 * 330) {
      for (const b of bots) b.update();
      m.step();
      m.flushEvents();
      ticks++;
      for (const e of m.entities) {
        if (e.dead) continue;
        const k = e.def.key;
        if (!Number.isFinite(e.x + e.y + e.hp)) add('NaN', `${k} g${g} t${m.tick}`);
        if (e.x < -0.5 || e.x > ARENA_W + 0.5 || e.y < -0.5 || e.y > ARENA_H + 0.5) add('außerhalb', `${k} ${e.x.toFixed(1)},${e.y.toFixed(1)} g${g}`);
        if (e.hp > e.maxHp * 2.05 + 1 && !e.def.traits?.pancakes) add('hp>max', `${k} ${e.hp}/${e.maxHp} g${g}`);
        if (e.kind !== 'unit') continue;
        const air = e.flying || e.def.hover || e.jumping || e.thrown || e.leap || e.dash || e.hook || e.underT > 0 || e.deployT > 0 || e.glide;
        if (!air && e.y > 15.2 && e.y < 16.8 && !((e.x >= 1.9 && e.x <= 5.1) || (e.x >= 12.9 && e.x <= 16.1))) add('im Fluss', `${k} ${e.x.toFixed(2)},${e.y.toFixed(2)} g${g} t${m.tick}`);
        for (const t of m.towers) if (!t.dead && !e.flying && !air && Math.abs(e.x - t.x) < t.half - 0.3 && Math.abs(e.y - t.y) < t.half - 0.3) add('im Turm', `${k} g${g} t${m.tick}`);
        // festsitzen: lebende Läufer ohne Lock, nicht betäubt, 8 s kaum bewegt
        if (e.def.speed > 0 && !e.locked && e.stunT <= 0 && e.rootT <= 0 && e.deployT <= 0 && !e.cast && !e.def.lifetime) {
          const s = still.get(e.id);
          if (!s || Math.hypot(s.x - e.x, s.y - e.y) > 0.5) still.set(e.id, { x: e.x, y: e.y, t: m.time });
          else if (m.time - s.t > 8 && !s.rep) { s.rep = true; add('festsitzend', `${k} ${e.x.toFixed(1)},${e.y.toFixed(1)} tgt=${m.byId.get(e.targetId)?.def.key} g${g} t${m.time.toFixed(0)}`); }
        } else still.delete(e.id);
      }
      if (m.entities.length > 400) add('zu viele Entitäten', `g${g} ${m.entities.length}`);
    }
    if (!m.result) add('kein Ergebnis', `g${g}`);
    nanFixesTotal += m.nanFixes || 0;
    if (m.nanFixes) add('NaN-Sicherheitsnetz griff', `g${g} ${m.nanFixes}×`);
  } catch (err) {
    add('AUSNAHME', `g${g} t${m.tick}: ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
  }
}
return { issues, ticks, cards: used.size, nanFixes: nanFixesTotal };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const N = +(process.argv[2] || 60);
  const modeId = process.argv[3] || 'classic';
  const r = runFuzz(N, modeId);
  console.log(`${N} Kämpfe (${modeId}), ${r.ticks} Ticks, ${r.cards} verschiedene Karten`);
  for (const [k, v] of r.issues) console.log(`${k}: ${v.n}×  z. B. ${v.ex.join(' ; ')}`);
  if (!r.issues.size) console.log('keine Verstöße');
}
