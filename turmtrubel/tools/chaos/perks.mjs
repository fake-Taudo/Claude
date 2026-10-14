// Perk-Interview: Perks einer Karte speichern und den Fortschritt (docs/CHAOS_PERK_PROGRESS.md) neu schreiben.
//   node tools/chaos/perks.mjs save <datei.json>   – { cardId, perks: [common, rare, epic] } übernehmen
//   node tools/chaos/perks.mjs progress            – nur die Fortschrittsdatei neu schreiben
//   node tools/chaos/perks.mjs overview            – docs/CHAOS_PERKS_OVERVIEW.md (alle Perks je Karte) schreiben
import fs from 'node:fs';

const url = (p) => new URL('../../' + p, import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(url(p), 'utf8'));
const TIERS = ['common', 'rare', 'epic'];
const TIER_DE = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch' };
const TYPES = ['statBoost', 'behaviorChange', 'newAbility', 'spawnChange', 'visualOnly'];
const SEL_DE = { interview: 'Vorschlag', custom: 'eigene Idee', auto: 'automatisch gewählt' };

function check(p, cardId) {
  const err = [];
  if (p.cardId !== cardId) err.push('cardId');
  if (!TIERS.includes(p.rarityTier)) err.push('rarityTier');
  if (p.id !== `${cardId}.${p.rarityTier}`) err.push('id');
  for (const k of ['name', 'description', 'balanceNote']) if (typeof p[k] !== 'string' || !p[k].trim()) err.push(k);
  if (!TYPES.includes(p.mechanicType)) err.push('mechanicType');
  if (!p.effectParameters || typeof p.effectParameters !== 'object' || !Object.keys(p.effectParameters).length) err.push('effectParameters');
  if (p.elixirCostUnchanged !== true) err.push('elixirCostUnchanged');
  if (!['interview', 'custom', 'auto'].includes(p.selection)) err.push('selection');
  return err;
}

function writeProgress() {
  const chaos = read('data/chaos.json');
  const cards = new Map(read('data/cards.json').cards.map((c) => [c.id, c]));
  const { perks, approved } = read('data/chaos_perks.json');
  const by = new Map();
  for (const p of perks) {
    if (!by.has(p.cardId)) by.set(p.cardId, {});
    by.get(p.cardId)[p.rarityTier] = p;
  }
  const pool = chaos.cardPool;
  const done = pool.filter((id) => TIERS.every((t) => by.get(id)?.[t]));
  const open = pool.filter((id) => !done.includes(id));
  const L = [];
  L.push('# Fortschritt Perk-Interview (Chaos-Modus)', '');
  L.push(`Stand: ${done.length} von ${pool.length} Karten erledigt. Die Datei wird von \`node tools/chaos/perks.mjs\` nach jeder Antwort neu geschrieben; die vollständigen Perks stehen in \`data/chaos_perks.json\`.`, '');
  L.push('Bei Abbruch oder Neustart geht es mit der ersten offenen Karte weiter (Reihenfolge = `cardPool` in `data/chaos.json`).', '');
  if (approved) L.push(`**Freigegeben am ${approved}** – alle Perks wurden in der Schlussrunde des Interviews bestätigt.`, '');
  L.push('## Erledigt', '');
  if (!done.length) L.push('_noch keine_');
  else {
    L.push('| Nr. | Karte | Gewöhnlich | Selten | Episch | Auswahl |', '|---|---|---|---|---|---|');
    for (const id of done) {
      const e = by.get(id);
      const sel = [...new Set(TIERS.map((t) => SEL_DE[e[t].selection]))].join(', ');
      L.push(`| ${pool.indexOf(id) + 1} | ${cards.get(id).name} | ${e.common.name} | ${e.rare.name} | ${e.epic.name} | ${sel} |`);
    }
  }
  L.push('', '## Offen', '');
  L.push(open.length ? open.map((id) => `${pool.indexOf(id) + 1}. ${cards.get(id).name} (\`${id}\`)`).join('\n') : '_keine – Interview abgeschlossen_');
  fs.writeFileSync(url('docs/CHAOS_PERK_PROGRESS.md'), L.join('\n') + '\n');
  return { done: done.length, total: pool.length, next: open[0] || null };
}

function writeOverview() {
  const chaos = read('data/chaos.json');
  const cards = new Map(read('data/cards.json').cards.map((c) => [c.id, c]));
  const { perks } = read('data/chaos_perks.json');
  const TYPE_DE = { statBoost: 'Werte', behaviorChange: 'Verhalten', newAbility: 'Neue Fähigkeit', spawnChange: 'Spawn', visualOnly: 'Optik' };
  const counts = { interview: 0, custom: 0, auto: 0 };
  for (const p of perks) counts[p.selection]++;
  const L = [];
  L.push('# Chaos-Modus: Perk-Übersicht', '');
  L.push(`${chaos.cardPool.length} Karten × 3 Stufen = ${perks.length} Perks. Vollständige Parameter in \`data/chaos_perks.json\`. Erzeugt mit \`node tools/chaos/perks.mjs overview\`.`, '');
  L.push(`Herkunft: ${counts.interview} aus den Vorschlägen gewählt, ${counts.custom} eigene Ideen aus dem Interview, ${counts.auto} automatisch gewählt.`, '');
  L.push('Seltenheitsfarben im Spiel: Gewöhnlich = Grau, Selten = Bronze, Episch = Lila.', '');
  chaos.cardPool.forEach((id, i) => {
    const c = cards.get(id);
    L.push(`## ${i + 1}. ${c.name} (${c.elixir} Elixier)`, '');
    L.push('| Stufe | Perk | Wirkung | Art | Herkunft |', '|---|---|---|---|---|');
    for (const t of TIERS) {
      const p = perks.find((x) => x.cardId === id && x.rarityTier === t);
      if (!p) { L.push(`| ${TIER_DE[t]} | – | _fehlt_ | | |`); continue; }
      L.push(`| ${TIER_DE[t]} | **${p.name}** | ${p.description.replace(/\|/g, '/')} | ${TYPE_DE[p.mechanicType]} | ${SEL_DE[p.selection]} |`);
    }
    L.push('');
  });
  fs.writeFileSync(url('docs/CHAOS_PERKS_OVERVIEW.md'), L.join('\n'));
  return perks.length;
}

const [cmd, file] = process.argv.slice(2);
if (cmd === 'save') {
  const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { cardId } = entry;
  const chaos = read('data/chaos.json');
  if (!chaos.cardPool.includes(cardId)) throw new Error(`${cardId} ist nicht im Pool`);
  if (!Array.isArray(entry.perks) || entry.perks.length !== 3) throw new Error('genau drei Perks erwartet');
  for (const p of entry.perks) {
    const err = check(p, cardId);
    if (err.length) throw new Error(`${p.id || '?'}: ungültig (${err.join(', ')})`);
  }
  if (new Set(entry.perks.map((p) => p.rarityTier)).size !== 3) throw new Error('je Stufe genau ein Perk');
  const data = read('data/chaos_perks.json');
  data.perks = data.perks.filter((p) => p.cardId !== cardId);
  data.perks.push(...TIERS.map((t) => entry.perks.find((p) => p.rarityTier === t)));
  const order = new Map(chaos.cardPool.map((id, i) => [id, i]));
  data.perks.sort((a, b) => order.get(a.cardId) - order.get(b.cardId) || TIERS.indexOf(a.rarityTier) - TIERS.indexOf(b.rarityTier));
  fs.writeFileSync(url('data/chaos_perks.json'), JSON.stringify(data, null, 2) + '\n');
  const r = writeProgress();
  console.log(`gespeichert: ${cardId} (${TIERS.map((t) => TIER_DE[t] + ' ' + entry.perks.find((p) => p.rarityTier === t).name).join(' · ')}) – ${r.done}/${r.total}, nächste: ${r.next}`);
} else if (cmd === 'overview') {
  console.log('Übersicht geschrieben:', writeOverview(), 'Perks');
} else if (cmd === 'progress') {
  console.log(writeProgress());
} else {
  console.log('Aufruf: node tools/chaos/perks.mjs save <datei.json> | progress | overview');
  process.exit(1);
}
