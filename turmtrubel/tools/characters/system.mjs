// Archetypen- und Unterscheidungssystem der Figuren (Phase 2). Menschenlesbar beschrieben in docs/CHAR_SYSTEM.md,
// maschinenlesbar als client/js/characters/system.json (erzeugt von gen-docs.mjs). Build-Skript, Laufzeit und
// Prüfskript lesen ihre Konstanten von hier bzw. aus dem Manifest, in das das Build-Skript sie kopiert.
import { deltaE, hexToRgb, rgbToHex } from './color.mjs';

/**
 * Materialtöne aus einer Grundfarbe (Licht von oben links: warmes Licht, kühler Schatten).
 * Jede Figur nutzt pro Material 3–4 Stufen plus Verlauf: Licht → Basis → Schatten, dazu Tiefe (Ambient Occlusion),
 * Glanz (Spitzlicht) und Linie (Innenlinien). Die Außenkontur ist für alle Figuren OUTLINE.ink.
 */
export const MATERIAL = { lightTint: '#fff3d6', shadeTint: '#1d2450', light: 0.34, gloss: 0.74, shade: 0.32, deep: 0.56, line: 0.6, rim: '#fff6e0' };
const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((x, i) => x + (B[i] - x) * t));
};
export function materialTones(hex, ink = '#1c1830') {
  const M = MATERIAL;
  return { base: hex, light: mix(hex, M.lightTint, M.light), gloss: mix(hex, '#ffffff', M.gloss), shade: mix(hex, M.shadeTint, M.shade), deep: mix(hex, M.shadeTint, M.deep), line: mix(hex, ink, M.line) };
}

/** Modell-Einheiten: 1 Feld = 50 mu. Ankerpunkt (0,0) = Fußmitte, y wächst nach unten (SVG), Figuren schauen nach rechts. */
export const MU_PER_TILE = 50;

/** Silhouetten-Familien: Grundform, Lesart der Rolle und Skelett-Vorlage. */
export const FAMILIES = {
  schlank: { name: 'Schlank', shape: 'schmales Hochrechteck, lange Diagonale durch Waffe oder Werkzeug', role: 'Fernkampf, Präzision', rig: 'biped' },
  breit: { name: 'Breit', shape: 'Quadrat bis Trapez, breite Schultern, breiter Stand', role: 'robuste Nahkämpfer', rig: 'biped' },
  keil: { name: 'Keil', shape: 'umgedrehtes Dreieck: sehr breite Schultern, schmale Hüfte', role: 'schnelle, harte Nahkämpfer', rig: 'biped' },
  dreieckig: { name: 'Dreieckig', shape: 'breiter Saum unten (Robe, Kleid, Mantel), schmaler Kopf oben', role: 'Zauber und Unterstützung', rig: 'robe' },
  hochgewachsen: { name: 'Hochgewachsen', shape: 'hohes Rechteck, lange Beine oder Robe, hohe Kopfbedeckung', role: 'Zauberer, Spezialisten, Champions', rig: 'biped' },
  geduckt: { name: 'Geduckt', shape: 'liegendes Oval, Kopf vorn, tiefer Schwerpunkt', role: 'Sprinter, Gräber, Schleicher', rig: 'biped' },
  kugelig: { name: 'Kugelig', shape: 'Kreis mit Stummelbeinen', role: 'Wurf- und Sprengfiguren, Golemiten', rig: 'biped' },
  massig: { name: 'Massig', shape: 'Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste', role: 'Tanks und Riesen', rig: 'biped' },
  winzig: { name: 'Winzig', shape: 'kleiner Körper mit großem Kopf (Kopf mindestens 40 % der Höhe)', role: 'Schwärme, Kinder, Kleinfiguren', rig: 'biped' },
  schwebend: { name: 'Schwebend', shape: 'Tropfen ohne Füße, unten Schweif, Korb oder Fass', role: 'Geister, Ballone, Geister-Elementare', rig: 'hover' },
  gefluegelt: { name: 'Geflügelt', shape: 'Flügel als breiteste Form, Körper in der Mitte', role: 'Flieger', rig: 'flyer' },
  vierbeinig: { name: 'Vierbeinig', shape: 'liegendes Rechteck auf vier Beinen', role: 'Tiere, Rammer', rig: 'quadruped' },
  reiter: { name: 'Reiter', shape: 'Tierkörper plus aufrechte Figur darüber', role: 'Ansturm, Gebäudejäger', rig: 'rider' },
  mechanisch: { name: 'Mechanisch', shape: 'kantige Maschinenteile: Kessel, Kolben, Rohre, Räder', role: 'Maschinen und Automaten', rig: 'biped' },
  fahrzeug: { name: 'Fahrzeug', shape: 'Rechteck auf Rädern mit Mannschaft', role: 'Rammen und Geschütze', rig: 'vehicle' },
  amorph: { name: 'Amorph', shape: 'weiche Blob-Form ohne Skelett', role: 'Kleckse, Tarnung', rig: 'blob' },
  bauwerk: { name: 'Bauwerk', shape: 'Haus, Turm oder Grabmal mit Öffnung', role: 'Gebäude-Spawner', rig: 'building' },
  schlangenartig: { name: 'Schlangenartig', shape: 'langer S-förmiger Leib', role: 'Drachen-Reittier', rig: 'serpent' },
};

/** Kategorien für Signature-Elemente (für die Matrix-Regel Familie + Farbe + Signature). */
export const SIG_CATEGORIES = {
  kopfbedeckung: 'Helm, Hut, Krone, Kapuze',
  schild: 'Schild oder schildartiges Bauteil',
  waffe: 'Waffe mit eigener Form',
  werkzeug: 'Werkzeug oder Gerät',
  ruecken: 'Rucksack, Köcher, Behälter auf dem Rücken',
  schulter: 'Schulterstück',
  umhang: 'Umhang, Mantel, Kragen',
  begleiter: 'Tier oder Wesen, das mitkommt',
  fluegel: 'Flügel als Merkmal',
  koerper: 'Körpermerkmal (Bauch, Schädel, Ohren, Krater …)',
  kostuem: 'Ganzkörper-Kostüm oder Verkleidung',
  schmuck: 'Schmuck oder Fesseln',
  leuchten: 'Leuchtendes Merkmal',
  fahne: 'Banner oder Fahne',
  reittier: 'besonderes Reittier',
  fahrzeug: 'Fahrzeugteil',
  bauwerk: 'Bauwerk-Merkmal',
};

/** Größenklassen nach sichtbarer Höhe (Felder) mit Konturstufe. */
export const SIZE_CLASSES = [
  { id: 'XS', min: 0.9, max: 1.29, outline: 1 },
  { id: 'S', min: 1.3, max: 1.69, outline: 1 },
  { id: 'M', min: 1.7, max: 2.04, outline: 2 },
  { id: 'L', min: 2.05, max: 2.44, outline: 2 },
  { id: 'XL', min: 2.45, max: 2.94, outline: 3 },
  { id: 'XXL', min: 2.95, max: 3.6, outline: 3 },
];
export const sizeOfHeight = (h) => SIZE_CLASSES.find((c) => h >= c.min && h <= c.max) || (h < 0.9 ? SIZE_CLASSES[0] : SIZE_CLASSES[5]);

/**
 * Konturstufen. px = Außenkontur in CSS-Pixeln bei 26 px Feldgröße (Spielgröße), skaliert mit √(Feldgröße/26),
 * begrenzt auf 0,8–1,8. inner = Stärke der Innenlinien relativ zur Außenkontur (in den SVG-Quellen als mu angelegt).
 */
export const OUTLINE = {
  ink: '#1c1830',
  refTile: 26,
  scale: [0.8, 1.8],
  tiers: { 1: { name: 'dünn', px: 1.5, innerMu: 1.5 }, 2: { name: 'mittel', px: 1.9, innerMu: 1.8 }, 3: { name: 'dick', px: 2.4, innerMu: 2.2 } },
};

/** Teamfarben: nur in Teamzonen. Die SVG-Quellen nutzen Platzhalter, die beim Rastern ersetzt werden. */
export const TEAM = {
  placeholders: { main: '#ff00f1', light: '#ff00f2', shade: '#ff00f3', deep: '#ff00f4', symbol: '#ff00f5' },
  blue: { main: '#3d8bff', light: '#9cc8ff', shade: '#1f5fc9', deep: '#0f3a85', symbol: '#f4f9ff', shape: 'kreis' },
  red: { main: '#ff4d57', light: '#ffb0b5', shade: '#c42233', deep: '#7a1020', symbol: '#fff4f4', shape: 'dreieck' },
  ring: { blue: 'glatter Kreisring', red: 'Ring mit sechs nach außen zeigenden Zacken' },
  maxArea: 0.25,
  colorblind: { emblemScale: 1.5, ringAlpha: 0.95, note: 'Teamsymbol größer, Bodenring kräftiger; die Form trägt die Information' },
};

/** Lesbarkeit: Detailstufen nach gerenderter Figurhöhe in Gerätepixeln. */
export const LOD = { 1: 46, 2: 110 };

/**
 * Animationszustände. frames = gebackene Bilder je Qualitätsstufe [niedrig, mittel, hoch].
 * events = normierte Zeitpunkte, an denen Animations-Ereignisse (EVENTS) ausgelöst werden.
 */
export const STATES = {
  idle: { name: 'Ruhe', dur: 1.6, loop: true, frames: [3, 6, 8] },
  walk: { name: 'Laufen', dur: 0.8, loop: true, frames: [4, 8, 10], note: 'Dauer skaliert mit der Laufgeschwindigkeit' },
  attack: { name: 'Angriff', dur: null, loop: false, frames: [4, 8, 10], events: { windup: 0, strike: 0.55 }, note: 'Dauer aus hitSpeed (höchstens 0,9 s); strike liegt auf dem Server-Ereignis a' },
  hit: { name: 'Treffer', dur: 0.24, loop: false, frames: [2, 3, 3] },
  spawn: { name: 'Erscheinen', dur: 0.5, loop: false, frames: [3, 5, 6], events: { land: 0.55 } },
  death: { name: 'Tod', dur: 0.7, loop: false, frames: [4, 6, 8], events: { fall: 0.45, vanish: 1 } },
  ability: { name: 'Fähigkeit', dur: 0.9, loop: false, frames: [4, 6, 8], events: { ability: 0.6 } },
  stun: { name: 'Betäubt', dur: 0.9, loop: true, frames: [2, 4, 4] },
  sleep: { name: 'Schlaf', dur: 2.0, loop: true, frames: [2, 4, 4] },
  charge: { name: 'Ansturm', dur: 0.5, loop: true, frames: [4, 6, 6] },
};
/** Vorrang bei gleichzeitigen Zuständen (höher gewinnt). Treffer überlagert Ruhe und Laufen, im Angriff nur als Aufblitzen. */
export const STATE_PRIORITY = ['idle', 'walk', 'charge', 'attack', 'sleep', 'stun', 'hit', 'ability', 'spawn', 'death'];

/** Animations-Ereignisse → VFX-Hooks. Preset-Suche: <event>.<figur> → <event>.<familie> → <event>. */
export const EVENTS = {
  'char.step': 'Fußaufsatz (nur XL/XXL und Vierbeiner): Staub, bei XXL leichtes Beben',
  'char.windup': 'Beginn der Ausholbewegung: Glanzblitz an der Waffe',
  'char.strike': 'Treffer-Bild des Nahkampfs, fällt auf das Server-Ereignis a',
  'char.release': 'Abschuss eines Geschosses, fällt auf das Server-Ereignis a',
  'char.land': 'Landung nach dem Erscheinen',
  'char.fall': 'Aufprall beim Tod',
  'char.vanish': 'Ende der Todesanimation (Auflösen in Funken oder Staub)',
  'char.ability': 'Höhepunkt der Fähigkeits-Pose (Champions und Helden)',
  'char.flap': 'Flügel-Abwärtsschlag',
  'char.spawnUnit': 'Tür oder Klappe öffnet sich (Spawner, Ofen, Hexen, Fass)',
  'char.evo': 'Puls der Evo-Partikelhülle',
};

/** Qualitätsstufen der Figuren (folgt der Grafik-Einstellung und der automatischen Qualität). */
export const QUALITY = {
  low: { name: 'Niedrig', frameIndex: 0, maxLod: 1, res: 0.75, atlas: 1024, budgetMB: 12, bakeMs: 3, aura: false },
  medium: { name: 'Mittel', frameIndex: 1, maxLod: 2, res: 1, atlas: 2048, budgetMB: 24, bakeMs: 4, aura: true },
  high: { name: 'Hoch', frameIndex: 2, maxLod: 2, res: 1, atlas: 2048, budgetMB: 48, bakeMs: 5, aura: true },
};

/**
 * Skelett-Vorlagen: Knochennamen, auf die sich die Animationsprogramme beziehen. Fehlende Knochen werden übersprungen,
 * zusätzliche Knochen (Umhang, Schweif, Hut, Begleiter …) animiert die Figur über eigene Parameter.
 */
export const RIGS = {
  biped: ['root', 'hip', 'torso', 'head', 'armB', 'handB', 'armF', 'handF', 'legB', 'footB', 'legF', 'footF', 'prop', 'cape', 'back', 'hat', 'tail'],
  robe: ['root', 'hip', 'skirt', 'torso', 'head', 'armB', 'handB', 'armF', 'handF', 'prop', 'cape', 'back', 'hat', 'buddy'],
  hover: ['root', 'body', 'head', 'armB', 'handB', 'armF', 'handF', 'trail', 'prop', 'hat'],
  flyer: ['root', 'body', 'head', 'jaw', 'wingB', 'wingF', 'tail', 'legB', 'legF', 'crest'],
  quadruped: ['root', 'body', 'head', 'jaw', 'ear', 'tail', 'legFn', 'legFf', 'legBn', 'legBf'],
  rider: ['root', 'body', 'head', 'jaw', 'ear', 'tail', 'legFn', 'legFf', 'legBn', 'legBf', 'rHip', 'rTorso', 'rHead', 'rArmB', 'rHandB', 'rArmF', 'rHandF', 'prop', 'cape'],
  vehicle: ['root', 'body', 'wheelB', 'wheelF', 'barrel', 'c1Torso', 'c1Head', 'c1ArmF', 'c1ArmB', 'c2Torso', 'c2Head', 'c2ArmF', 'c2ArmB', 'flag'],
  blob: ['root', 'body', 'eyes', 'hat', 'feet'],
  building: ['root', 'base', 'roof', 'door', 'chimney', 'flag', 'glow', 'crew'],
  serpent: ['root', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5', 'seg6', 'head', 'jaw', 'rTorso', 'rHead', 'rArmF', 'rHandF', 'rArmB'],
};

/** Farbregeln (CIEDE2000). Verwandte Paare: Held ↔ Basis und Ableitungen (Golem → Golemit …). */
export const COLOR_RULES = {
  teamMain: 15, // Hauptfarbe zu Team-Grundton (blau/rot)
  teamShade: 12, // Hauptfarbe zu Team-Schattenton
  teamLight: 8, // Hauptfarbe zu Team-Lichtton
  teamAccent: 10, // Akzent zu Team-Grundton
  family: { main: 10, mainWithAccent: 6, accent: 25 }, // gleiche Familie: Haupt ≥ 10 oder (Haupt ≥ 6 und Akzent ≥ 25)
  global: { scheme: 8, main: 6, accent: 20 }, // alle Paare: Schema ≥ 8 und nicht (Haupt < 6 und Akzent < 20)
  related: { scheme: 6 },
  accentWeight: 0.6, // Schema = √(ΔE_Haupt² + (0,6 · ΔE_Akzent)²)
};

export const RELATED = [
  ['golem', 'golemite'],
  ['elixir-golem', 'elixir-golemite'],
  ['elixir-golemite', 'elixir-blob'],
  ['lava-hound', 'lava-pup'],
  ['goblinstein', 'goblinstein-monster'],
  ['rascal-boy', 'rascal-girl'],
  ['wall-breakers', 'wall-breaker-runner'],
  ['royal-ghost', 'souldier'],
  ['spirit-empress-ground', 'spirit-empress-air'],
  ['tombstone-hero', 'tomb-queen'],
  ['skeletons', 'shadow-skeleton'],
  ['skeletons', 'general-gerry'],
  ['suspicious-bush', 'bush-goblin'],
];
export const isRelated = (a, b) => a.base === b.id || b.base === a.id || RELATED.some(([x, y]) => (x === a.id && y === b.id) || (x === b.id && y === a.id));

const TEAM_REF = { blue: TEAM.blue, red: TEAM.red };
export const schemeDistance = (a, b) => Math.hypot(deltaE(a.main, b.main), COLOR_RULES.accentWeight * deltaE(a.acc, b.acc));

/** Prüft die Farbregeln. Liefert eine Liste von Verstößen [regel, figuren, detail]. */
export function colorViolations(figs) {
  const R = COLOR_RULES;
  const out = [];
  for (const f of figs) {
    for (const [k, t] of Object.entries(TEAM_REF)) {
      if (deltaE(f.main, t.main) < R.teamMain) out.push(['Team (Haupt)', f.id, `${k} ${deltaE(f.main, t.main).toFixed(1)}`]);
      if (deltaE(f.main, t.shade) < R.teamShade) out.push(['Team (Schatten)', f.id, `${k} ${deltaE(f.main, t.shade).toFixed(1)}`]);
      if (deltaE(f.main, t.light) < R.teamLight) out.push(['Team (Licht)', f.id, `${k} ${deltaE(f.main, t.light).toFixed(1)}`]);
      if (deltaE(f.acc, t.main) < R.teamAccent) out.push(['Team (Akzent)', f.id, `${k} ${deltaE(f.acc, t.main).toFixed(1)}`]);
    }
  }
  for (let i = 0; i < figs.length; i++) {
    for (let j = i + 1; j < figs.length; j++) {
      const a = figs[i];
      const b = figs[j];
      const dm = deltaE(a.main, b.main);
      const da = deltaE(a.acc, b.acc);
      const s = Math.hypot(dm, R.accentWeight * da);
      const rel = isRelated(a, b);
      const pair = `${a.id} ~ ${b.id}`;
      const detail = `Haupt ${dm.toFixed(1)}, Akzent ${da.toFixed(1)}, Schema ${s.toFixed(1)}`;
      if (rel) {
        if (s < R.related.scheme) out.push(['verwandt', pair, detail]);
      } else if (a.fam === b.fam && !(dm >= R.family.main || (dm >= R.family.mainWithAccent && da >= R.family.accent))) out.push(['Familie', pair, detail]);
      else if (s < R.global.scheme || (dm < R.global.main && da < R.global.accent)) out.push(['global', pair, detail]);
    }
  }
  return out;
}

/** Nächste Figur nach Farbschema (für die Matrix). */
export function nearestScheme(f, figs) {
  let best = null;
  for (const o of figs) {
    if (o === f) continue;
    const s = schemeDistance(f, o);
    if (!best || s < best.s) best = { id: o.id, s };
  }
  return best;
}

/**
 * Matrix-Regeln: keine zwei Zeilen mit gleicher Familie + Farbe + Signature-Element. „Gleiche Farbe“ heißt hier
 * ΔE_Haupt < 10; „gleiches Signature-Element“ heißt gleiche Kategorie. Außerdem: Signature-Texte eindeutig,
 * Proportionsformel pro Familie und Größenklasse eindeutig, Idle- und Angriffsbeschreibung eindeutig.
 */
export function matrixViolations(figs) {
  const out = [];
  const seen = (key) => {
    const m = new Map();
    for (const f of figs) {
      const k = key(f);
      if (k == null) continue;
      if (m.has(k)) out.push([key.name || 'eindeutig', `${m.get(k)} ~ ${f.id}`, k]);
      else m.set(k, f.id);
    }
  };
  for (let i = 0; i < figs.length; i++) {
    for (let j = i + 1; j < figs.length; j++) {
      const a = figs[i];
      const b = figs[j];
      if (a.fam === b.fam && a.cat === b.cat && deltaE(a.main, b.main) < 10) out.push(['Familie+Farbe+Signature', `${a.id} ~ ${b.id}`, `${a.fam}, ${a.cat}, ΔE ${deltaE(a.main, b.main).toFixed(1)}`]);
    }
  }
  const sig = (f) => f.sig.toLowerCase();
  Object.defineProperty(sig, 'name', { value: 'Signature-Text' });
  seen(sig);
  const prop = (f) => (f.fam === 'bauwerk' ? null : `${f.fam}|${sizeOfHeight(f.h).id}|${f.prop.head.toFixed(2)}|${f.prop.legs.toFixed(2)}|${f.prop.arms.toFixed(2)}`);
  Object.defineProperty(prop, 'name', { value: 'Proportionsformel' });
  seen(prop);
  const idle = (f) => f.idle.toLowerCase();
  Object.defineProperty(idle, 'name', { value: 'Idle' });
  seen(idle);
  const atk = (f) => f.attack.toLowerCase();
  Object.defineProperty(atk, 'name', { value: 'Angriff' });
  seen(atk);
  for (const f of figs) {
    if (!FAMILIES[f.fam]) out.push(['Familie unbekannt', f.id, f.fam]);
    if (!SIG_CATEGORIES[f.cat]) out.push(['Kategorie unbekannt', f.id, f.cat]);
    if (!f.zones?.length) out.push(['Teamzone fehlt', f.id, '']);
  }
  return out;
}
