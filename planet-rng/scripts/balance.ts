// Balancing simulation. Uses the real game logic with the seedable RNG.
//
//   npm run balance            -> prints a summary and writes BALANCING.md
//   npm run balance -- --quick -> fewer runs (for iterating on numbers)
//
// Sections: exact distribution + Monte Carlo check, gold per hour, a full player
// simulation (auto roll, selling, brewing, shopping, rebirths) and potion impact.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AURA_BY_ID, GAME, ITEMS, ITEM_BY_ID, POTIONS, POTION_BY_ID, REBIRTHS, TIERS, TIER_BY_ID, type TierId } from '../src/config';
import { activeBiome, biomeWindow } from '../src/core/biomes';
import { beginRoll, brewPotion, buyItem, checkRebirth, completeRoll, drinkPotion, equipItem, performRebirth, sellAura, syncShopRotation, tick, useItem } from '../src/core/engine';
import { formatDuration, formatInt, formatMult, formatShare } from '../src/core/format';
import { computeSpeed, rollDurationMs } from '../src/core/modifiers';
import { distribution, getRollTable, rollAura } from '../src/core/odds';
import { Rng } from '../src/core/rng';
import { currentOffers } from '../src/core/shop';
import { createInitialState, toMilli, type GameState } from '../src/core/state';

const quick = process.argv.includes('--quick');
const out: string[] = [];
const log = (s = '') => {
  out.push(s);
  console.log(s);
};
/** German decimal with one digit. */
const fx1 = (x: number) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '–');
const rankOf = (id: string) => TIER_BY_ID[AURA_BY_ID[id].tier].rank;
const H = 3600_000;

// ---------------------------------------------------------------------------
// 1. Distribution
// ---------------------------------------------------------------------------

function tierShares(luck: number, biome: string | null = null): Map<TierId, number> {
  const d = distribution(getRollTable(biome), luck);
  const m = new Map<TierId, number>();
  for (const [id, p] of d) {
    const t = AURA_BY_ID[id].tier;
    m.set(t, (m.get(t) ?? 0) + p);
  }
  return m;
}

function section1(): void {
  log('## 1. Verteilung und erwartete Rolls');
  log('');
  log('Exakt berechnet (Basis-Pool, ohne Biom). „Rolls bis …“ = erwartete Anzahl Rolls bis zur ersten Aura **dieser Stufe oder seltener**.');
  log('');
  const lucks = [1, 1.5, 2, 3, 10, 100, 500];
  log(`| Stufe | ${lucks.map((l) => `Luck ${formatMult(l)}`).join(' | ')} |`);
  log(`|---|${lucks.map(() => '---:').join('|')}|`);
  const shares = lucks.map((l) => tierShares(l));
  for (const tier of TIERS) {
    const cells = shares.map((m) => {
      let p = 0;
      for (const t of TIERS) if (t.rank >= tier.rank) p += m.get(t.id) ?? 0;
      return p > 0 ? formatInt(Math.max(1, 1 / p)) : '–';
    });
    log(`| ${tier.name} | ${cells.join(' | ')} |`);
  }
  log('');

  // Monte Carlo check against the exact values.
  const n = quick ? 1_000_000 : 5_000_000;
  for (const luck of [1, 3]) {
    const rng = new Rng(20261022 + luck);
    const table = getRollTable(null);
    const counts = new Map<TierId, number>();
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const a = rollAura(table, luck, rng);
      counts.set(a.tier, (counts.get(a.tier) ?? 0) + 1);
    }
    const exact = tierShares(luck);
    let sum = 0;
    for (const v of exact.values()) sum += v;
    log(`Monte Carlo, ${formatInt(n)} Rolls bei Luck ${formatMult(luck)} (${((Date.now() - t0) / 1000).toFixed(1)} s). Summe der exakten Wahrscheinlichkeiten: ${(sum * 100).toFixed(10)} %`);
    log('');
    log('| Stufe | exakt | simuliert | Abweichung (σ) |');
    log('|---|---:|---:|---:|');
    for (const tier of TIERS) {
      const p = exact.get(tier.id) ?? 0;
      if (p * n < 3) continue;
      const obs = (counts.get(tier.id) ?? 0) / n;
      const sigma = Math.sqrt((p * (1 - p)) / n);
      log(`| ${tier.name} | ${formatShare(p)} | ${formatShare(obs)} | ${((obs - p) / sigma).toFixed(2)} |`);
    }
    log('');
  }
}

// ---------------------------------------------------------------------------
// 2. Gold per hour
// ---------------------------------------------------------------------------

/** Time-weighted average of biome luck and speed factors. */
function biomeAverages(): { luck: number; speed: number; share: number } {
  const slots = 200_000;
  let luck = 0;
  let speed = 0;
  let inBiome = 0;
  for (let s = 0; s < slots; s++) {
    const w = biomeWindow(s);
    const f = w.biome ? (w.end - w.start) / (w.slotEnd - w.slotStart) : 0;
    inBiome += f;
    luck += f * ((w.biome?.luck ?? 1) - 1);
    speed += f * ((w.biome?.speed ?? 1) - 1);
  }
  return { luck: 1 + luck / slots, speed: 1 + speed / slots, share: inBiome / slots };
}

function goldPerRoll(luck: number, goldMult: number): number {
  let g = 0;
  for (const [id, p] of distribution(getRollTable(null), luck)) g += p * AURA_BY_ID[id].sell;
  return g * goldMult;
}

function section2(): void {
  const avg = biomeAverages();
  const cadence = 1 + (GAME.roll.luckyMultiplier - 1) / GAME.roll.luckyEvery;
  log('## 2. Gold pro Stunde (alles verkaufen, Auto Roll)');
  log('');
  log(`Biome sind ${formatShare(avg.share)} der Zeit aktiv; zeitlich gemittelt ergibt das ${formatMult(avg.luck)} Glück und ${formatMult(avg.speed)} Tempo. Der Glücks-Roll (jeder ${GAME.roll.luckyEvery}.) wirkt im Mittel wie ${formatMult(cadence)}.`);
  log('');
  log('| Situation | Glück | Rolls/h | Gold/Roll | Gold/h |');
  log('|---|---:|---:|---:|---:|');
  const rows: [string, number, number, number][] = [
    ['Start (kein Bonus)', 1, 1, 1],
    ['Rebirth 1', REBIRTHS[0].luck, REBIRTHS[0].speed, REBIRTHS[0].goldMult],
    ['Rebirth 1 + Kometen-Kompass', REBIRTHS[0].luck * 1.3, REBIRTHS[0].speed * 1.2, REBIRTHS[0].goldMult],
    ['Rebirth 2 + Quantum-Gauntlet', REBIRTHS[1].luck * 1.75, REBIRTHS[1].speed * 1.75, REBIRTHS[1].goldMult],
    ['Rebirth 3 + Quantum-Gauntlet', REBIRTHS[2].luck * 1.75, REBIRTHS[2].speed * 1.75, REBIRTHS[2].goldMult],
  ];
  for (const [label, luck, speed, gold] of rows) {
    const l = luck * avg.luck * cadence;
    const rph = 3_600_000 / rollDurationMs(speed * avg.speed, true);
    const gpr = goldPerRoll(l, gold);
    log(`| ${label} | ${formatMult(l)} | ${formatInt(rph)} | ${gpr.toFixed(4).replace('.', ',')} | ${formatInt(gpr * rph)} |`);
  }
  log('');
  const base = goldPerRoll(avg.luck * cadence, 1) * (3_600_000 / rollDurationMs(avg.speed, true));
  log('Zeit bis zu Shop-Zielen allein aus Verkäufen (Start, ohne Ausgaben):');
  log('');
  log('| Item | Preis | Zeit |');
  log('|---|---:|---:|');
  for (const it of ITEMS) log(`| ${it.name} | ${it.price} | ${formatDuration((it.price / base) * H)} |`);
  log('');
  const div = ITEMS.find((i) => i.id === 'quantum_gauntlet')!;
  const chance = 0.03;
  log(`Der ${div.name} erscheint mit ${formatShare(chance)} pro Rotation, also im Mittel alle ${formatDuration((1 / chance) * GAME_ROTATION_MS())}.`);
  log('');
}

function GAME_ROTATION_MS(): number {
  return 5 * 60_000;
}

// ---------------------------------------------------------------------------
// 3. Player simulation
// ---------------------------------------------------------------------------

interface RunResult {
  rebirth: (number | null)[];
  /** Per rebirth level: hours (since the previous rebirth) until each requirement was first met. */
  reqTimes: Record<string, number>[];
  /** Effective luck (time average) per rebirth stage. */
  luckAvg: number[];
  firstBuy: Record<string, number>;
  rolls: number;
  goldEarned: number;
  potions: number;
  best: string | null;
  hours: number;
}

type Profile = 'active' | 'casual';

/**
 * A sensible auto-roll player. 'active' checks in every minute and keeps potions brewing;
 * 'casual' checks in every 15 minutes, never brews (only drinks reward potions) and only
 * buys equipment.
 */
function simulatePlayer(seed: number, maxHours: number, profile: Profile): RunResult {
  const start = Date.UTC(2026, 0, 5, 8, 0, 0) + seed * 7919 * 1000;
  const state: GameState = createInitialState(seed, start);
  state.tutorial.done = true;
  const rng = new Rng(seed);
  let t = start;
  const end = start + maxHours * H;
  let nextPolicy = t;
  const result: RunResult = { rebirth: [null, null, null], reqTimes: [{}, {}, {}], luckAvg: [0, 0, 0], firstBuy: {}, rolls: 0, goldEarned: 0, potions: 0, best: null, hours: 0 };
  let stageStart = start;
  let luckSum = 0;
  let luckN = 0;
  let prevBiome: string | null = null;

  const keepFor = (s: GameState): Record<string, number> => {
    const keep: Record<string, number> = {};
    const next = REBIRTHS.find((r) => r.level === s.rebirth + 1);
    for (const a of next?.auras ?? []) keep[a.aura] = Math.max(keep[a.aura] ?? 0, a.count);
    // Ingredients for the potions this player brews.
    for (const id of ['luck', 'speed', 'sun']) for (const ing of POTION_BY_ID[id].ingredients) keep[ing.aura] = Math.max(keep[ing.aura] ?? 0, ing.count * (id === 'sun' ? 1 : 2));
    return keep;
  };

  const policy = () => {
    tick(state, t, prevBiome, 60_000);
    prevBiome = activeBiome(t)?.id ?? null;
    // Rebirth first (it resets auras and gold).
    const pre = checkRebirth(state);
    if (pre.level) {
      const rt = result.reqTimes[pre.level - 1];
      const since = (t - stageStart) / H;
      if (pre.gold.have >= pre.gold.need) rt.gold ??= since;
      for (const a of pre.auras) if (a.have >= a.need) rt[a.aura] ??= since;
    }
    if (pre.ready) {
      const lvl = state.rebirth + 1;
      result.luckAvg[lvl - 1] = luckN ? luckSum / luckN : 0;
      luckSum = 0;
      luckN = 0;
      performRebirth(state, t);
      result.rebirth[lvl - 1] = (t - start) / H;
      stageStart = t;
    }
    const need = checkRebirth(state);
    // Brew and drink potions (sun > luck > speed).
    for (const id of profile === 'active' ? ['sun', 'luck', 'speed'] : []) {
      const def = POTION_BY_ID[id];
      const reserve = keepForRebirth(state);
      const ok = def.ingredients.every((i) => (state.auras[i.aura] ?? 0) - (reserve[i.aura] ?? 0) >= i.count);
      if (ok) {
        brewPotion(state, id, 1, t);
        drinkPotion(state, id, 1, t);
        result.potions++;
      }
    }
    // Shopping.
    syncShopRotation(state, t);
    const goldNeed = need.level ? need.gold.need : 0;
    for (const offer of currentOffers(state, t)) {
      if (offer.remaining <= 0) continue;
      const item = ITEM_BY_ID[offer.item];
      const price = toMilli(item.price);
      const equipment = item.kind === 'equipment';
      const better = equipment && (!state.equippedItem || (item.equip?.luckAdd ?? 0) > (ITEM_BY_ID[state.equippedItem].equip?.luckAdd ?? 0));
      // Equipment is an investment; consumables only from gold beyond the rebirth reserve, one per rotation.
      const boughtThisRotation = (state.shop.bought[item.id] ?? 0) > 0;
      const affordable = equipment ? better && state.gold >= price : !boughtThisRotation && state.gold - price >= goldNeed;
      if (!affordable || item.id === 'lost_amulet') continue;
      if (profile === 'casual' && !equipment) continue;
      if (item.kind === 'consumable' && state.buffs.some((b) => b.id === `item:${item.id}` && (b.endsAt ?? 0) > t)) continue;
      const ev = buyItem(state, item.id, t);
      if (ev.some((e) => e.type === 'error')) continue;
      result.firstBuy[item.id] ??= (t - start) / H;
      if (equipment) equipItem(state, item.id);
      if (item.kind === 'consumable') useItem(state, item.id, t);
      if (item.kind === 'bundle' && item.grants) {
        drinkPotion(state, item.grants.potion, 1, t);
        result.potions++;
      }
    }
    // Drink reward potions (keep eclipse/divine for nothing: use them right away).
    for (const id of Object.keys(state.potions)) {
      drinkPotion(state, id, state.potions[id], t);
      result.potions++;
    }
    // Sell everything that is not reserved.
    const keep = keepFor(state);
    for (const [id, n] of Object.entries(state.auras)) {
      const surplus = n - (keep[id] ?? 0);
      if (surplus > 0) sellAura(state, id, surplus, t);
    }
  };

  while (t < end && state.rebirth < REBIRTHS.length) {
    if (t >= nextPolicy) {
      policy();
      nextPolicy = t + (profile === 'active' ? 60_000 : 15 * 60_000);
    }
    const biome = activeBiome(t)?.id ?? null;
    const dur = rollDurationMs(computeSpeed(state, t, biome).total, true);
    t += dur;
    beginRoll(state, { now: t, rng }, true);
    luckSum += state.pendingRoll?.luck ?? 1;
    luckN++;
    completeRoll(state, { now: t, rng });
  }
  policy();
  result.rolls = state.stats.rolls;
  result.goldEarned = state.stats.goldEarned / 1000;
  result.best = state.stats.bestAura;
  result.hours = (t - start) / H;
  return result;
}

function keepForRebirth(s: GameState): Record<string, number> {
  const keep: Record<string, number> = {};
  const next = REBIRTHS.find((r) => r.level === s.rebirth + 1);
  for (const a of next?.auras ?? []) keep[a.aura] = a.count;
  return keep;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
}

function pct(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN;
}

function section3(): void {
  log('## 3. Spieler-Simulation');
  log('');
  log('Läufe mit der echten Spiellogik (eigener Seed pro Lauf), Auto Roll ohne Pause. Biome, Glücks-Rolls, Shop-Rotation, Erfolge und Belohnungen laufen wie im Spiel. Beide Profile verkaufen alles Überzählige (Rebirth-Zutaten bleiben), kaufen Ausrüstung sobald bezahlbar und machen Rebirth sobald möglich.');
  log('');
  log('- **Aktiv:** schaut jede Minute vorbei, braut und trinkt Sonnen-, Glücks- und Geschwindigkeitstränke, sobald möglich, kauft Amulette von Gold über der Rebirth-Rücklage.');
  log('- **Gelegentlich:** schaut alle 15 Minuten vorbei, braut nie (trinkt nur geschenkte Tränke), kauft nur Ausrüstung.');
  log('');
  for (const profile of ['active', 'casual'] as Profile[]) runProfile(profile);
}

const summary: { profile: Profile; rebirth: number[] }[] = [];

function runProfile(profile: Profile): void {
  const runs = quick ? 6 : 14;
  const maxHours = profile === 'active' ? 160 : 260;
  log(`### Profil: ${profile === 'active' ? 'Aktiv' : 'Gelegentlich'} (${runs} Läufe, max. ${maxHours} h)`);
  log('');
  const t0 = Date.now();
  const results: RunResult[] = [];
  for (let s = 1; s <= runs; s++) results.push(simulatePlayer(s, maxHours, profile));
  log(`Rechenzeit: ${((Date.now() - t0) / 1000).toFixed(1)} s, ${formatInt(results.reduce((a, r) => a + r.rolls, 0))} Rolls insgesamt.`);
  log('');
  log('| Ziel | Median | 10 % | 90 % | erreicht |');
  log('|---|---:|---:|---:|---:|');
  summary.push({ profile, rebirth: REBIRTHS.map((_, i) => median(results.map((r) => r.rebirth[i]).filter((x): x is number => x !== null))) });
  for (let i = 0; i < REBIRTHS.length; i++) {
    const xs = results.map((r) => r.rebirth[i]).filter((x): x is number => x !== null);
    log(`| Rebirth ${i + 1} (Stunden Auto Roll, kumuliert) | ${fx1(median(xs))} | ${fx1(pct(xs, 0.1))} | ${fx1(pct(xs, 0.9))} | ${xs.length}/${runs} |`);
  }
  for (const it of ITEMS) {
    const xs = results.map((r) => r.firstBuy[it.id]).filter((x): x is number => x !== undefined);
    if (!xs.length) continue;
    log(`| Erster Kauf: ${it.name} | ${fx1(median(xs))} h | ${fx1(pct(xs, 0.1))} h | ${fx1(pct(xs, 0.9))} h | ${xs.length}/${runs} |`);
  }
  log('');
  log('Engpass-Analyse: Stunden seit dem vorherigen Rebirth, bis jede Anforderung erstmals erfüllt war (Median), und mittleres Glück pro Abschnitt.');
  log('');
  log('| Rebirth | Anforderung | Median h | mittleres Glück |');
  log('|---|---|---:|---:|');
  for (let i = 0; i < REBIRTHS.length; i++) {
    const keys = ['gold', ...REBIRTHS[i].auras.map((a) => a.aura)];
    const luck = median(results.map((r) => r.luckAvg[i]).filter((x) => x > 0));
    for (const k of keys) {
      const xs = results.map((r) => r.reqTimes[i][k]).filter((x): x is number => x !== undefined);
      const label = k === 'gold' ? `${formatInt(REBIRTHS[i].gold)} Gold` : `${REBIRTHS[i].auras.find((a) => a.aura === k)!.count}× ${AURA_BY_ID[k].name}`;
      log(`| ${i + 1} | ${label} | ${xs.length ? fx1(median(xs)) : '–'} | ${k === 'gold' ? formatMult(luck) : ''} |`);
    }
  }
  log('');
  log(`Median Gold verdient bis Ende: ${formatInt(median(results.map((r) => r.goldEarned)))} · getrunkene Tränke: ${formatInt(median(results.map((r) => r.potions)))} · seltenste Aura (häufigster Wert): ${mode(results.map((r) => r.best ?? '–'))}`);
  log('');
}

function mode(xs: string[]): string {
  const c = new Map<string, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  const best = [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '–';
  return AURA_BY_ID[best]?.name ?? best;
}

// ---------------------------------------------------------------------------
// 4. Potions
// ---------------------------------------------------------------------------

function section4(): void {
  log('## 4. Wirkung der Tränke');
  log('');
  log('Materialkosten = erwartete Rolls, um alle Zutaten parallel zu sammeln (bei Luck 1). „Zusatz-Glück“ = Rolls im Effekt × (Multiplikator − 1). Für die Einmal-Tränke: Chance, mit diesem einen Roll mindestens die genannte Stufe zu erhalten.');
  log('');
  log('| Trank | Materialkosten (Rolls) | Effekt | Rolls im Effekt (Auto) | Zusatz-Glück | Mythisch+ im Effekt (erwartet) |');
  log('|---|---:|---|---:|---:|---:|');
  const mythic = (luck: number) => {
    let p = 0;
    for (const [id, q] of distribution(getRollTable(null), luck)) if (rankOf(id) >= 5) p += q;
    return p;
  };
  for (const p of POTIONS) {
    const cost = Math.max(...p.ingredients.map((i) => i.count * (AURA_BY_ID[i.aura].fallback ? 2.6 : AURA_BY_ID[i.aura].odds)));
    const speed = p.effect.speed ?? 1;
    const rolls = p.effect.rolls ?? Math.round(((p.effect.durationSec ?? 0) * 1000) / rollDurationMs(speed, true));
    const luck = p.effect.luck ?? 1;
    const extra = rolls * (luck - 1);
    const expMythic = rolls * mythic(luck);
    const eff = [p.effect.luck ? `${formatMult(p.effect.luck)} Glück` : '', p.effect.speed ? `${formatMult(p.effect.speed)} Tempo` : '', p.effect.durationSec ? `${p.effect.durationSec} s` : `${p.effect.rolls} Rolls`].filter(Boolean).join(', ');
    log(`| ${p.name} | ${formatInt(cost)} | ${eff} | ${formatInt(rolls)} | ${formatInt(extra)} | ${expMythic.toFixed(3).replace('.', ',')} |`);
  }
  log('');
  log('| Einmal-Trank | Legendär+ | Mythisch+ | Göttlich+ | Transzendent+ |');
  log('|---|---:|---:|---:|---:|');
  for (const id of ['eclipse', 'divine']) {
    const luck = POTION_BY_ID[id].effect.luck!;
    const shares = tierShares(luck);
    const at = (rank: number) => {
      let s = 0;
      for (const t of TIERS) if (t.rank >= rank) s += shares.get(t.id) ?? 0;
      return formatShare(s);
    };
    log(`| ${POTION_BY_ID[id].name} (${formatMult(luck)}) | ${at(4)} | ${at(5)} | ${at(6)} | ${at(7)} |`);
  }
  log('');
}

// ---------------------------------------------------------------------------

log('# Balancing – Planet RNG');
log('');
log(`Erzeugt mit \`npm run balance\`${quick ? ' (Schnellmodus)' : ''}. Alle Werte stammen aus der echten Spiellogik (\`src/core\`) und der Konfiguration (\`src/config\`).`);
log('');
section1();
section2();
section3();
section4();
// Summary at the top of the report.
const top: string[] = [
  '## Zusammenfassung',
  '',
  'Ziele aus der Vorgabe: Rebirth 1 nach einigen Stunden aktivem Spiel, Rebirth 3 nach vielen Tagen. Gold ist kostbar: gewöhnliche Auren bringen Bruchteile einer Münze, seltene Drops sind Jackpots.',
  '',
  '| Profil | Rebirth 1 | Rebirth 2 | Rebirth 3 |',
  '|---|---:|---:|---:|',
  ...summary.map((x) => `| ${x.profile === 'active' ? 'Aktiv (braut ständig)' : 'Gelegentlich (braut nie)'} | ${x.rebirth.map((h) => `${fx1(h)} h`).join(' | ')} |`),
  '',
  'Angaben sind Stunden ununterbrochenes Auto Roll (Median). Ein Mensch verteilt das auf Tage: bei 2–3 Stunden am Tag liegt Rebirth 3 je nach Spielweise bei etwa 1–3 Wochen. Offline-Fortschritt (50 % Effizienz, max. 8 h) verkürzt das zusätzlich.',
  '',
  '**Was wurde gegenüber dem Prototyp geändert?**',
  '',
  '- Luck-Modell: `min(1, Luck · c_i)` von selten nach häufig statt `chance^(1/Luck)`. Die Verteilung summiert sich exakt auf 100 % (siehe Abschnitt 1).',
  '- Verkaufspreise ≈ `0,0062 · Odds^0,6` (Staub 0,01 bis Weltenkern 3.000). Etwa 80 Gold pro Stunde am Anfang, über 700 Gold pro Stunde nach Rebirth 3 mit Gauntlet.',
  `- Rebirth-Anforderungen: ${REBIRTHS.map((r) => `R${r.level} = ${formatInt(r.gold)} Gold + ${r.auras.map((a) => `${a.count}× ${AURA_BY_ID[a.aura].name}`).join(' + ')}`).join('; ')}. Der Prototyp verlangte 20 Ewigkeit (1 in 100.000) für Rebirth 1, das wären Millionen Rolls gewesen.`,
  '- Shop-Preise des Prototyps (15/15/100/1.000) bleiben. Neu: Sonnenphiole (40), Chrono-Sanduhr (60), Kometen-Kompass (400) als Zwischenstufe vor dem Gauntlet.',
  '- Tränke: Rezepte und Wirkungen unverändert. Wer aktiv braut, hält Glücks- und Geschwindigkeitstrank praktisch dauerhaft aktiv (die Zutaten fallen beim Rollen schneller an, als sie verbraucht werden). Das ist der Bonus für aktives Spielen.',
  '',
];
out.splice(4, 0, ...top);

if (!quick) {
  writeFileSync(resolve('BALANCING.md'), out.join('\n') + '\n');
  console.log('\nBALANCING.md geschrieben.');
}
