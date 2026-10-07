// Parametrische Animation per Skelett (docs/CHAR_SYSTEM.md §9.5). Ein Programm liefert für einen normierten
// Zeitpunkt u (0–1) eine Pose: pro Knochen Drehung r (Grad), Versatz x/y (mu), Skalierung sx/sy, dazu Ausdruck,
// sichtbare Zustandsteile und Transparenz. Figuren verfeinern Programme über Parameter (p) und eigene Keyframes (keys).

const TAU = Math.PI * 2;
export const EASE = {
  lin: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  io: (t) => t * t * (3 - 2 * t),
  snap: (t) => 1 - Math.pow(1 - t, 3),
  back: (t) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Keyframes [[u, wert, easing?], …] (easing gilt für das Segment, das an diesem Key endet). */
export function key(keys, u) {
  if (!keys || !keys.length) return 0;
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (u <= k[0]) {
      const p = keys[i - 1];
      const t = (u - p[0]) / (k[0] - p[0] || 1);
      const e = EASE[k[2] || 'io'] || EASE.io;
      return p[1] + (k[1] - p[1]) * e(clamp01(t));
    }
  }
  return keys[keys.length - 1][1];
}

export class Pose {
  constructor() {
    this.b = {};
    this.expr = 'idle';
    this.show = new Set();
    this.view = null;
    this.alpha = 1;
    this.events = null;
    this.layer = null;
  }
  ch(bone) {
    return this.b[bone] || (this.b[bone] = { r: 0, x: 0, y: 0, sx: 1, sy: 1 });
  }
  r(bone, v) {
    if (v) this.ch(bone).r += v;
    return this;
  }
  x(bone, v) {
    if (v) this.ch(bone).x += v;
    return this;
  }
  y(bone, v) {
    if (v) this.ch(bone).y += v;
    return this;
  }
  s(bone, sx, sy = sx) {
    const c = this.ch(bone);
    c.sx *= sx;
    c.sy *= sy;
    return this;
  }
}

/** Eigene Keyframes einer Figur additiv anwenden: keys = { knochen: { r|x|y: [[u,v]], sx|sy: [[u,faktor]] } }. */
export function applyKeys(pose, keys, u) {
  if (!keys) return;
  for (const [bone, chans] of Object.entries(keys)) {
    if (bone === 'expr' || bone === 'show' || bone === 'view' || bone === 'layer' || bone === 'alpha') continue;
    for (const [c, ks] of Object.entries(chans)) {
      const v = key(ks, u);
      if (c === 'sx' || c === 'sy') pose.ch(bone)[c] *= v;
      else pose.ch(bone)[c] += v;
    }
  }
  if (keys.alpha) pose.alpha *= key(keys.alpha, u);
  if (keys.show) for (const [name, ranges] of Object.entries(keys.show)) if (ranges.some(([a, b]) => u >= a && u < b)) pose.show.add(name);
  if (keys.expr) for (const [a, b, e] of keys.expr) if (u >= a && u < b) pose.expr = e;
  if (keys.view) for (const [a, b, v] of keys.view) if (u >= a && u < b) pose.view = v;
  // Zeichenreihenfolge pro Pose: [[u0, u1, teil, z, zRück?], …]
  if (keys.layer) for (const [a, b, part, z, zb] of keys.layer) if (u >= a && u < b) (pose.layer || (pose.layer = new Map())).set(part, [z, zb ?? z]);
}

// ───────────── Zweibeiner ─────────────
function bipedIdle(u, p, P) {
  const ph = u * TAU;
  const br = p.breathe ?? 0.025;
  P.s('torso', 1 - br * 0.5 * Math.sin(ph), 1 + br * Math.sin(ph));
  P.y('root', -(p.bob ?? 0.6) * (0.5 + 0.5 * Math.sin(ph)));
  P.r('head', (p.tilt ?? 2) * Math.sin(ph + 0.9));
  P.r('armF', (p.armF ?? 0) + (p.sway ?? 3) * Math.sin(ph + 0.4));
  P.r('armB', (p.armB ?? 0) - (p.sway ?? 3) * Math.sin(ph + 0.4));
  P.r('handF', p.handF ?? 0);
  P.r('handB', p.handB ?? 0);
  P.r('prop', (p.prop ?? 0) + (p.propSway ?? 2) * Math.sin(ph + 1.2));
  P.r('cape', (p.cape ?? 2) + (p.capeAmp ?? 3) * Math.sin(ph - 1.2));
  P.r('hat', (p.hat ?? 0) * Math.sin(ph - 0.6));
  P.r('back', (p.backAmp ?? 1) * Math.sin(ph - 0.5));
  P.r('tail', (p.tail ?? 6) * Math.sin(ph - 0.8));
  P.r('legF', p.legF ?? 0);
  P.r('legB', p.legB ?? 0);
  P.r('skirt', (p.skirt ?? 1.5) * Math.sin(ph - 0.7));
}
function bipedWalk(u, p, P) {
  const ph = u * TAU;
  const s = Math.sin(ph);
  const c2 = Math.cos(2 * ph);
  const stride = p.stride ?? 24;
  P.r('legF', -stride * s + (p.legF ?? 0));
  P.r('legB', stride * s + (p.legB ?? 0));
  P.r('footF', stride * 0.6 * s - Math.max(0, Math.cos(ph)) * (p.toe ?? 10));
  P.r('footB', -stride * 0.6 * s - Math.max(0, -Math.cos(ph)) * (p.toe ?? 10));
  P.y('root', -(p.bob ?? 2.4) * (1 + c2) * 0.5);
  const sq = p.squash ?? 0.03;
  P.s('root', 1 + sq * 0.6 * (1 - c2) * 0.5, 1 - sq * (1 - c2) * 0.5);
  P.r('torso', (p.lean ?? 4) + (p.twist ?? 2) * s);
  P.r('head', -(p.twist ?? 2) * 0.6 * s + (p.nod ?? 1.5) * c2);
  P.r('armF', (p.armSwing ?? 22) * s + (p.armF ?? 0));
  P.r('armB', -(p.armSwing ?? 22) * s * (p.armBSwing ?? 1) + (p.armB ?? 0));
  P.r('handF', p.handF ?? 0);
  P.r('handB', p.handB ?? 0);
  P.r('prop', (p.prop ?? 0) + (p.propSwing ?? 6) * s);
  P.r('cape', (p.cape ?? 10) + (p.capeAmp ?? 5) * Math.sin(ph * 2 - 1));
  P.r('hat', (p.hatBob ?? 2) * c2);
  P.r('back', (p.backAmp ?? 2) * Math.sin(ph * 2 - 0.6));
  P.r('tail', (p.tail ?? 10) * Math.sin(ph - 1));
  P.y('skirt', 0);
  P.r('skirt', (p.skirt ?? 3) * s);
}
function bipedRun(u, p, P) {
  bipedWalk(u, { stride: 34, bob: 3.5, lean: 14, armSwing: 34, squash: 0.05, cape: 22, capeAmp: 8, ...p }, P);
}
function bipedHit(u, p, P) {
  const k = key([[0, 0], [0.22, 1, 'out'], [1, 0, 'io']], u);
  P.x('root', -(p.knock ?? 4) * k);
  P.r('torso', -(p.recoil ?? 10) * k);
  P.r('head', -(p.jolt ?? 12) * k);
  P.s('root', 1 + 0.06 * k, 1 - 0.08 * k);
  P.r('armF', 16 * k);
  P.r('armB', -12 * k);
  P.r('cape', -10 * k);
  P.expr = 'hurt';
}
function bipedSpawn(u, p, P) {
  const land = p.land ?? 0.55;
  if (u < land) {
    const k = u / land;
    P.r('armF', -(p.armUp ?? 70) * (1 - k * 0.3));
    P.r('armB', (p.armUpB ?? 60) * (1 - k * 0.3));
    P.r('legF', -16);
    P.r('legB', 14);
    P.s('root', 0.95, 1.07);
    P.r('cape', -25);
  } else {
    const k = (u - land) / (1 - land);
    const sq = key([[0, 0.22], [0.25, 0.26, 'out'], [0.6, -0.06, 'io'], [1, 0, 'io']], k);
    P.s('root', 1 + sq * 0.6, 1 - sq);
    P.r('armF', -20 * (1 - k));
    P.r('armB', 20 * (1 - k));
    P.r('cape', 18 * (1 - k));
  }
}
function bipedDeath(u, p, P) {
  const fall = p.fall ?? 0.45;
  const dir = p.dir ?? -1;
  const ang = p.angle ?? 84;
  const k = u < fall ? EASE.in(u / fall) : 1;
  P.r('root', dir * ang * k);
  const imp = u > fall ? key([[fall, 0], [fall + 0.06, 1, 'out'], [fall + 0.25, 0]], u) : 0;
  P.s('root', 1 + imp * 0.08, 1 - imp * 0.14);
  P.r('armF', -50 * k);
  P.r('armB', 40 * k);
  P.r('legF', -18 * k);
  P.r('legB', 10 * k);
  P.r('head', dir * 14 * k);
  P.r('prop', 40 * k);
  P.r('cape', 30 * k);
  P.r('hat', -dir * 30 * k);
  P.expr = 'death';
  P.alpha = 1 - EASE.io(clamp01((u - 0.68) / 0.32));
}
function bipedStun(u, p, P) {
  const ph = u * TAU;
  P.r('head', 9 * Math.sin(ph * 2));
  P.r('torso', 4 * Math.sin(ph));
  P.s('root', 1 + 0.02 * Math.sin(ph * 2), 1 - 0.02 * Math.sin(ph * 2));
  P.r('armF', 22 + 6 * Math.sin(ph));
  P.r('armB', -18 - 6 * Math.sin(ph));
  P.r('prop', 30);
  P.expr = 'stun';
}
function bipedSleep(u, p, P) {
  const ph = u * TAU;
  P.r('torso', (p.slump ?? 10) + 1.5 * Math.sin(ph));
  P.r('head', (p.nodHead ?? 18) + 3 * Math.sin(ph));
  P.s('torso', 1, 1 + 0.03 * Math.sin(ph));
  P.r('armF', 14);
  P.r('armB', -10);
  P.expr = 'sleep';
}

/** Gemeinsame Phasen eines Angriffs. */
function atkKeys(h, wind, strike, over = 0, rest = 0, wf = 0.8, end = rest) {
  return [
    [0, rest],
    [h * wf, wind, 'out'],
    [h, strike, 'in'],
    [Math.min(0.98, h + 0.13), strike + over, 'out'],
    [1, end, 'io'],
  ];
}
/** Waffenarm wählen: p.arm = 'B' schlägt mit dem hinteren Arm (z. B. Schwert hinter dem Schild). */
function arms(p) {
  return p.arm === 'B' ? { A: 'armB', Hd: 'handB', Pr: 'propB', O: 'armF', a0: p.armB ?? 0, o0: p.armF ?? 0, h0: p.handB ?? 0 } : { A: 'armF', Hd: 'handF', Pr: 'prop', O: 'armB', a0: p.armF ?? 0, o0: p.armB ?? 0, h0: p.handF ?? 0 };
}
function atkSwing(u, p, P) {
  const h = p.hit ?? 0.55;
  const { A, Hd, Pr, O, a0, o0, h0 } = arms(p);
  P.r(A, key(atkKeys(h, p.wind ?? -200, p.strike ?? -45, p.over ?? 18, a0, 0.8, p.end ?? a0), u));
  P.r(Hd, key(atkKeys(h, p.cock ?? -20, p.snap ?? 20, p.snapOver ?? 0, h0, 0.8, p.handEnd ?? h0), u));
  P.r(Pr, key(atkKeys(h, p.propWind ?? 0, p.propStrike ?? 0, 0, p.prop ?? 0), u));
  P.r('torso', key(atkKeys(h, -(p.lean ?? 10), p.lunge ?? 12, -4), u));
  P.r('head', key(atkKeys(h, 6, -6), u));
  P.x('root', key(atkKeys(h, -2, p.step ?? 4, -1), u));
  P.ch('root').sy *= key(atkKeys(h, 0.95, 1.05, -0.1, 1), u);
  P.r(O, key(atkKeys(h, p.windO ?? 18, p.strikeO ?? -16, 0, o0), u));
  P.x(O, key(atkKeys(h, p.pushO ?? 0, p.pushO2 ?? 0, 0), u));
  P.r('legF', key(atkKeys(h, 6, -(p.stepLeg ?? 14)), u));
  P.r('legB', key(atkKeys(h, -4, 10), u));
  P.r('cape', key(atkKeys(h, 14, -12, -6), u));
  P.r('hat', key(atkKeys(h, 8, -10, 4), u));
  P.expr = 'attack';
}
function atkThrust(u, p, P) {
  const h = p.hit ?? 0.55;
  const { A, Hd, O, a0, o0, h0 } = arms(p);
  P.r(A, key(atkKeys(h, p.wind ?? 25, p.strike ?? -75, p.over ?? -6, a0), u));
  P.x(A, key(atkKeys(h, -(p.pull ?? 6), p.reach ?? 8, 0), u));
  P.r(Hd, key(atkKeys(h, p.cock ?? 0, p.snap ?? 0, 0, h0), u));
  P.r('torso', key(atkKeys(h, -(p.lean ?? 8), p.lunge ?? 14, -3), u));
  P.x('root', key(atkKeys(h, -3, p.step ?? 6, -1), u));
  P.r('legF', key(atkKeys(h, 8, -(p.stepLeg ?? 22)), u));
  P.r('legB', key(atkKeys(h, -6, 14), u));
  P.r(O, key(atkKeys(h, p.windO ?? 15, p.strikeO ?? 25, 0, o0), u));
  P.r('cape', key(atkKeys(h, 10, -16), u));
  P.expr = 'attack';
}
function atkShoot(u, p, P) {
  // Bogen/Armbrust/Gewehr: anlegen, zielen, Abschuss bei hit, Rückstoß
  const h = p.hit ?? 0.55;
  const aim = [[0, 0], [h * 0.45, 1, 'out'], [h, 1], [Math.min(0.99, h + 0.3), 1], [1, 0, 'io']];
  const a = key(aim, u);
  P.r('armB', (p.armBAim ?? -80) * a + (p.armB ?? 0) * (1 - a));
  P.r('armF', (p.armFAim ?? -70) * a + (p.armF ?? 0) * (1 - a));
  P.r('handB', (p.handBAim ?? 0) * a);
  P.r('handF', (p.handFAim ?? 0) * a);
  P.x(p.drawHand || 'handB', -(p.draw ?? 0) * key([[0, 0], [h * 0.45, 0.3], [h * 0.95, 1, 'in'], [h, 0, 'snap'], [1, 0]], u));
  const rc = key([[0, 0], [h, 0], [h + 0.04, 1, 'snap'], [Math.min(0.99, h + 0.35), 0, 'io'], [1, 0]], u);
  P.x('root', -(p.recoil ?? 2) * rc);
  P.r('torso', -(p.kick ?? 6) * rc + (p.lean ?? 4) * a);
  P.r('armB', (p.kickArm ?? 10) * rc);
  P.r('head', (p.aimHead ?? 4) * a);
  P.r('prop', (p.propAim ?? 0) * a);
  if (u >= h && u < h + (p.flash ?? 0.12)) P.show.add('muzzle');
  if (u < h) P.show.add('loaded');
  P.expr = 'attack';
}
function atkThrow(u, p, P) {
  const h = p.hit ?? 0.55;
  P.r('armF', key(atkKeys(h, p.wind ?? -170, p.strike ?? -40, p.over ?? 20, p.armF ?? 0, 0.75), u));
  P.r('torso', key(atkKeys(h, -(p.lean ?? 12), p.lunge ?? 14, -4, 0, 0.75), u));
  P.r('armB', key(atkKeys(h, p.windB ?? -40, 25, 0, p.armB ?? 0, 0.75), u));
  P.x('root', key(atkKeys(h, -2, 3), u));
  P.ch('root').sy *= key(atkKeys(h, 0.94, 1.05, -0.1, 1, 0.75), u);
  if (u < h) P.show.add('loaded');
  P.expr = 'attack';
}
function atkSlam(u, p, P) {
  const h = p.hit ?? 0.6;
  const up = p.wind ?? -175;
  P.r('armF', key(atkKeys(h, up, p.strike ?? -30, p.over ?? 12, p.armF ?? 0), u));
  P.r('armB', key(atkKeys(h, p.windB ?? up, p.strikeB ?? -25, p.over ?? 12, p.armB ?? 0), u));
  P.r('torso', key(atkKeys(h, -(p.lean ?? 12), p.lunge ?? 16, -4), u));
  P.r('head', key(atkKeys(h, -6, 8), u));
  P.ch('root').sy *= key(atkKeys(h, 1.07, 0.84, 0.06, 1), u);
  P.ch('root').sx *= key(atkKeys(h, 0.96, 1.12, -0.04, 1), u);
  P.y('root', key(atkKeys(h, -3, 1), u));
  P.expr = 'attack';
}
function atkPunch(u, p, P) {
  const h = p.hit ?? 0.5;
  P.r('armF', key(atkKeys(h, p.wind ?? 30, p.strike ?? -85, -8, p.armF ?? 0), u));
  P.x('armF', key(atkKeys(h, -4, p.reach ?? 10), u));
  P.r('armB', key(atkKeys(h, -20, 20, 0, p.armB ?? 0), u));
  P.r('torso', key(atkKeys(h, -8, p.lunge ?? 14), u));
  P.x('root', key(atkKeys(h, -2, 5), u));
  P.expr = 'attack';
}
function atkCast(u, p, P) {
  const h = p.hit ?? 0.55;
  P.r('armF', key(atkKeys(h, p.wind ?? -150, p.strike ?? -85, -8, p.armF ?? 0), u));
  P.r('armB', key(atkKeys(h, p.windB ?? -40, p.strikeB ?? -70, 0, p.armB ?? 0), u));
  P.r('torso', key(atkKeys(h, -(p.lean ?? 8), p.lunge ?? 10), u));
  P.ch('root').sy *= key(atkKeys(h, 1.05, 0.95, 0.03, 1), u);
  if (u >= h - 0.1 && u < h + 0.15) P.show.add('cast');
  P.expr = 'attack';
}

// ───────────── Flieger ─────────────
function flyerIdle(u, p, P) {
  const n = p.flaps ?? 2;
  const ph = u * TAU * n;
  const f = Math.sin(ph);
  P.r('wingF', (p.flap ?? 28) * f + (p.wingF ?? 0));
  P.r('wingB', -(p.flap ?? 28) * Math.sin(ph - 0.35) * (p.wingBAmp ?? 0.8) + (p.wingB ?? 0));
  P.y('root', (p.lift ?? 2.5) * f);
  P.r('body', (p.roll ?? 2) * Math.sin(u * TAU));
  P.r('head', (p.tilt ?? 4) * Math.sin(u * TAU + 1));
  P.r('tail', (p.tail ?? 10) * Math.sin(u * TAU * n - 1.2));
  P.r('legF', (p.dangle ?? 6) * Math.sin(ph - 1));
  P.r('legB', (p.dangle ?? 6) * Math.sin(ph - 1.4));
  P.r('jaw', p.jaw ?? 0);
}
function flyerWalk(u, p, P) {
  flyerIdle(u, { flaps: 3, flap: 34, lift: 2, roll: 0, ...p }, P);
  P.r('body', p.lean ?? 8);
}
function flyerBite(u, p, P) {
  const h = p.hit ?? 0.55;
  flyerIdle(u, { ...p, flaps: 2 }, P);
  P.r('head', key(atkKeys(h, p.wind ?? -20, p.strike ?? 22, 0), u));
  P.x('head', key(atkKeys(h, -3, p.reach ?? 6), u));
  P.r('jaw', key([[0, 0], [h * 0.8, p.jawOpen ?? 35], [h, 0, 'snap'], [h + 0.2, p.jawAfter ?? 8], [1, 0]], u));
  P.r('body', key(atkKeys(h, -8, 12), u));
  P.x('root', key(atkKeys(h, -3, 6), u));
  P.expr = 'attack';
}
function flyerBreath(u, p, P) {
  const h = p.hit ?? 0.55;
  flyerIdle(u, { ...p, flaps: 2 }, P);
  P.r('head', key(atkKeys(h, p.wind ?? -24, p.strike ?? 14, 0), u));
  P.r('jaw', key([[0, 0], [h * 0.8, 6], [h, p.jawOpen ?? 34, 'snap'], [h + 0.25, p.jawOpen ?? 34], [1, 0]], u));
  P.s('body', key(atkKeys(h, 1.06, 0.96, 0, 1), u), key(atkKeys(h, 1.08, 0.94, 0, 1), u));
  P.x('root', key(atkKeys(h, -2, 3), u));
  if (u >= h && u < h + 0.2) P.show.add('muzzle');
  P.expr = 'attack';
}
function flyerHit(u, p, P) {
  flyerIdle(u, p, P);
  const k = key([[0, 0], [0.22, 1, 'out'], [1, 0]], u);
  P.x('root', -4 * k);
  P.r('body', -12 * k);
  P.r('wingF', -25 * k);
  P.expr = 'hurt';
}
function flyerDeath(u, p, P) {
  const k = EASE.in(clamp01(u / 0.7));
  P.r('root', -60 * k);
  P.y('root', 30 * k);
  P.r('wingF', 40 * k);
  P.r('wingB', -30 * k);
  P.expr = 'death';
  P.alpha = 1 - EASE.io(clamp01((u - 0.6) / 0.4));
}
function flyerSpawn(u, p, P) {
  flyerIdle(u, { ...p, flap: 40 }, P);
  P.s('root', 0.7 + 0.3 * EASE.back(clamp01(u / 0.6)));
}

// ───────────── Vierbeiner und Reiter ─────────────
function quadWalk(u, p, P) {
  const ph = u * TAU;
  const s = Math.sin(ph);
  const A = p.stride ?? 26;
  const gallop = p.gallop ?? true;
  P.r('legFn', -A * s);
  P.r('legFf', -A * Math.sin(ph + (gallop ? 0.6 : Math.PI)));
  P.r('legBn', A * Math.sin(ph + (gallop ? 2.6 : Math.PI)));
  P.r('legBf', A * Math.sin(ph + (gallop ? 3.2 : 0)));
  P.y('root', -(p.bob ?? 3) * (0.5 + 0.5 * Math.cos(ph * (gallop ? 1 : 2))));
  P.r('body', (p.rock ?? 4) * Math.sin(ph + 0.4));
  P.r('head', (p.nod ?? 5) * Math.sin(ph - 0.6) + (p.head ?? 0));
  P.r('tail', 14 * Math.sin(ph - 1.5));
  P.r('ear', 10 * Math.sin(ph - 1));
  P.r('jaw', p.jaw ?? 0);
  // Reiter federt gegen
  P.y('rHip', (p.ride ?? 1.5) * Math.cos(ph));
  P.r('rTorso', (p.riderLean ?? 6) + 3 * Math.sin(ph + 1));
  P.r('rHead', -2 * Math.sin(ph + 1));
  P.r('rArmF', (p.rArmF ?? 0) + 4 * Math.sin(ph));
  P.r('rArmB', (p.rArmB ?? 0) - 4 * Math.sin(ph));
  P.r('cape', 14 + 6 * Math.sin(ph * 2));
  P.r('prop', (p.prop ?? 0) + (p.propSwing ?? 4) * Math.sin(ph));
}
function quadIdle(u, p, P) {
  const ph = u * TAU;
  P.y('body', 0.6 * Math.sin(ph));
  P.r('head', (p.head ?? 0) + (p.nod ?? 3) * Math.sin(ph + 0.5));
  P.r('tail', 10 * Math.sin(ph * 2));
  P.r('ear', 6 * Math.sin(ph * 2 + 1));
  P.r('legFn', p.legFn ?? 0);
  P.r('rTorso', (p.riderLean ?? 0) + 1.5 * Math.sin(ph));
  P.s('rTorso', 1, 1 + 0.02 * Math.sin(ph));
  P.r('rHead', 2 * Math.sin(ph + 1));
  P.r('rArmF', p.rArmF ?? 0);
  P.r('rArmB', p.rArmB ?? 0);
  P.r('prop', (p.prop ?? 0) + 2 * Math.sin(ph + 1));
  P.r('cape', 4 + 3 * Math.sin(ph - 1));
  P.r('jaw', p.jaw ?? 0);
}
function quadHit(u, p, P) {
  quadIdle(u, p, P);
  const k = key([[0, 0], [0.22, 1, 'out'], [1, 0]], u);
  P.x('root', -4 * k);
  P.r('body', -6 * k);
  P.r('head', -14 * k);
  P.r('rTorso', -14 * k);
  P.expr = 'hurt';
}
function quadDeath(u, p, P) {
  const k = EASE.in(clamp01(u / 0.45));
  P.r('root', -(p.angle ?? 20) * k);
  P.y('body', 6 * k);
  P.r('legFn', 40 * k);
  P.r('legFf', 30 * k);
  P.r('legBn', -35 * k);
  P.r('legBf', -25 * k);
  P.r('head', 30 * k);
  P.r('rTorso', -50 * k);
  P.y('rHip', -6 * k);
  P.x('rHip', -10 * k);
  P.expr = 'death';
  P.alpha = 1 - EASE.io(clamp01((u - 0.65) / 0.35));
}
/** Reiter-Schlag: Waffenarm des Reiters (rArmF) holt aus, schlägt durch, Hand/Waffe dreht mit (Polo, Lanze, Keule). */
function riderSwing(u, p, P) {
  quadIdle(u, p, P);
  const h = p.hit ?? 0.55;
  // Ruhewerte (rArmF, riderLean, rArmB) setzt quadIdle schon; hier nur der Schlag relativ dazu
  P.r('rArmF', key(atkKeys(h, p.wind ?? -120, p.strike ?? -20, p.over ?? 0, 0, 0.8, p.end ?? 0), u));
  P.r('rHandF', key(atkKeys(h, p.cock ?? 0, p.snap ?? 0, p.snapOver ?? 0, 0, 0.8, p.handEnd ?? 0), u));
  P.r('rTorso', key(atkKeys(h, -(p.lean ?? 12), p.lunge ?? 14, -4), u));
  P.r('rHead', key(atkKeys(h, 8, -8), u));
  P.r('rArmB', key(atkKeys(h, 10, -10), u));
  P.x('root', key(atkKeys(h, -2, p.step ?? 5, -1), u));
  P.r('body', key(atkKeys(h, -3, 3), u));
  P.r('head', key(atkKeys(h, -6, 6), u) + (p.head ?? 0));
  P.r('cape', key(atkKeys(h, 16, -10, -6), u));
  P.expr = 'attack';
}
/** Sprung (Fluss, Graben): Beine gestreckt, Ohren und Schweif flattern, Reiter duckt sich. Läuft als Schleife. */
function quadJump(u, p, P) {
  const ph = u * TAU;
  const f = Math.sin(ph * (p.flutter ?? 2));
  P.r('legFn', -(p.reach ?? 48) + 4 * f);
  P.r('legFf', -(p.reach ?? 48) * 0.8 + 4 * f);
  P.r('legBn', (p.kick ?? 46) - 4 * f);
  P.r('legBf', (p.kick ?? 46) * 0.8 - 4 * f);
  P.r('body', -(p.pitch ?? 6));
  P.r('head', -(p.headUp ?? 10));
  P.y('root', -(p.lift ?? 4) + 1.5 * f);
  P.r('ear', (p.ear ?? -40) + 14 * f);
  P.r('tail', 20 * f);
  P.r('jaw', p.jaw ?? 16);
  P.r('rTorso', (p.riderLean ?? 14) + 2 * f);
  P.y('rHip', -(p.riderLift ?? 3));
  P.r('rArmF', p.rArmF ?? 0);
  P.r('rArmB', p.rArmB ?? 0);
  P.r('cape', 20 + 8 * f);
  P.expr = 'attack';
}
function quadSpawn(u, p, P) {
  quadIdle(u, p, P);
  const land = 0.55;
  const k = u < land ? 0 : (u - land) / (1 - land);
  if (u < land) {
    P.r('legFn', -30);
    P.r('legFf', -24);
    P.r('legBn', 30);
    P.r('legBf', 24);
  } else {
    const sq = key([[0, 0.18], [0.3, 0.2, 'out'], [0.65, -0.05], [1, 0]], k);
    P.s('root', 1 + sq * 0.5, 1 - sq);
  }
}

// ───────────── Schwebend, Blob, Bauwerk, Fahrzeug ─────────────
function hoverIdle(u, p, P) {
  const ph = u * TAU;
  P.y('root', (p.float ?? 2.5) * Math.sin(ph));
  P.r('body', (p.sway ?? 3) * Math.sin(ph + 0.6));
  P.r('trail', (p.trail ?? 12) * Math.sin(ph - 1));
  P.r('head', (p.tilt ?? 3) * Math.sin(ph + 1.2));
  P.r('armF', (p.armF ?? 0) + 6 * Math.sin(ph + 0.4));
  P.r('armB', (p.armB ?? 0) - 6 * Math.sin(ph + 0.4));
  P.r('hat', (p.hat ?? 4) * Math.sin(ph * (p.hatSpin ?? 1)));
  P.r('prop', p.prop ?? 0);
}
function blobIdle(u, p, P) {
  const ph = u * TAU;
  const a = p.wobble ?? 0.06;
  P.s('body', 1 + a * Math.sin(ph), 1 - a * Math.sin(ph));
  P.y('eyes', 1 * Math.sin(ph + 0.5));
  P.r('hat', 4 * Math.sin(ph - 0.8));
}
function blobWalk(u, p, P) {
  const ph = u * TAU;
  const hop = Math.max(0, Math.sin(ph));
  P.y('root', -(p.hop ?? 6) * hop);
  P.s('body', 1 + 0.12 * (1 - hop) * 0.8, 1 - 0.12 * (1 - hop) + 0.1 * hop);
  P.r('hat', -6 * hop);
  P.r('feet', 10 * Math.sin(ph * 2));
}
function buildingIdle(u, p, P) {
  const ph = u * TAU;
  P.r('flag', (p.flag ?? 8) * Math.sin(ph * 2));
  P.r('door', (p.door ?? 2) * Math.sin(ph));
  P.y('glow', 0);
  P.s('chimney', 1, 1 + 0.02 * Math.sin(ph * 2));
  P.r('crew', (p.crew ?? 3) * Math.sin(ph));
  P.s('base', 1 + 0.005 * Math.sin(ph), 1 - 0.005 * Math.sin(ph));
}
function buildingSpawnUnit(u, p, P) {
  buildingIdle(u, p, P);
  P.r('door', key([[0, 0], [0.25, p.open ?? -70, 'snap'], [0.7, p.open ?? -70], [1, 0]], u));
  P.s('base', key([[0, 1], [0.2, 1.04], [0.4, 1]], u), key([[0, 1], [0.2, 0.96], [0.4, 1]], u));
  P.show.add('open');
}
function buildingDeath(u, p, P) {
  const k = EASE.in(clamp01(u / 0.6));
  P.s('root', 1 + 0.15 * k, 1 - 0.7 * k);
  P.r('roof', -18 * k);
  P.r('flag', 50 * k);
  P.expr = 'death';
  P.alpha = 1 - EASE.io(clamp01((u - 0.6) / 0.4));
}
function buildingSpawn(u, p, P) {
  const k = EASE.back(clamp01(u / 0.8));
  P.s('root', 0.5 + 0.5 * k, k);
}
function vehicleWalk(u, p, P) {
  const ph = u * TAU;
  P.r('wheelF', 360 * u * (p.spins ?? 1));
  P.r('wheelB', 360 * u * (p.spins ?? 1));
  P.y('body', -(p.bump ?? 1.2) * Math.abs(Math.sin(ph * 2)));
  P.r('body', (p.rock ?? 1.5) * Math.sin(ph * 2));
  for (const c of ['c1', 'c2']) {
    P.r(c + 'Torso', (p.push ?? 18) + 3 * Math.sin(ph * 2 + (c === 'c2' ? 1 : 0)));
    P.r(c + 'Legs', 0);
    P.y(c + 'Torso', -1.5 * Math.abs(Math.sin(ph * 2 + (c === 'c2' ? 1 : 0))));
  }
  P.r('flag', 10 * Math.sin(ph * 2));
}
function vehicleIdle(u, p, P) {
  const ph = u * TAU;
  P.y('body', 0.4 * Math.sin(ph));
  for (const c of ['c1', 'c2']) {
    P.r(c + 'Torso', (p.lean ?? 6) + 2 * Math.sin(ph + (c === 'c2' ? 1.5 : 0)));
    P.r(c + 'Head', 4 * Math.sin(ph * 2 + (c === 'c2' ? 1 : 0)));
  }
  P.r('flag', 6 * Math.sin(ph * 2));
}
function genericHit(u, p, P) {
  const k = key([[0, 0], [0.22, 1, 'out'], [1, 0]], u);
  P.x('root', -3 * k);
  P.s('root', 1 + 0.06 * k, 1 - 0.08 * k);
  P.expr = 'hurt';
}
function genericDeath(u, p, P) {
  const k = EASE.in(clamp01(u / 0.5));
  P.s('root', 1 + 0.25 * k, 1 - 0.55 * k);
  P.expr = 'death';
  P.alpha = 1 - EASE.io(clamp01((u - 0.5) / 0.5));
}
function genericSpawn(u, p, P) {
  const k = EASE.back(clamp01(u / 0.7));
  P.s('root', 0.6 + 0.4 * k, 0.4 + 0.6 * k);
}
function still(u, p, P) {}

/** Programm-Register. Fehlende Knochen ignoriert die Pose stillschweigend. */
export const PROGRAMS = {
  'biped.idle': bipedIdle,
  'biped.walk': bipedWalk,
  'biped.run': bipedRun,
  'biped.hit': bipedHit,
  'biped.spawn': bipedSpawn,
  'biped.death': bipedDeath,
  'biped.stun': bipedStun,
  'biped.sleep': bipedSleep,
  'atk.swing': atkSwing,
  'atk.thrust': atkThrust,
  'atk.shoot': atkShoot,
  'atk.throw': atkThrow,
  'atk.slam': atkSlam,
  'atk.punch': atkPunch,
  'atk.cast': atkCast,
  'flyer.idle': flyerIdle,
  'flyer.walk': flyerWalk,
  'flyer.bite': flyerBite,
  'flyer.breath': flyerBreath,
  'flyer.hit': flyerHit,
  'flyer.death': flyerDeath,
  'flyer.spawn': flyerSpawn,
  'quad.idle': quadIdle,
  'quad.walk': quadWalk,
  'quad.hit': quadHit,
  'quad.death': quadDeath,
  'quad.spawn': quadSpawn,
  'quad.jump': quadJump,
  'rider.swing': riderSwing,
  'hover.idle': hoverIdle,
  'blob.idle': blobIdle,
  'blob.walk': blobWalk,
  'building.idle': buildingIdle,
  'building.spawnUnit': buildingSpawnUnit,
  'building.death': buildingDeath,
  'building.spawn': buildingSpawn,
  'vehicle.idle': vehicleIdle,
  'vehicle.walk': vehicleWalk,
  'generic.hit': genericHit,
  'generic.death': genericDeath,
  'generic.spawn': genericSpawn,
  still,
};

/** Pose für einen Animations-Eintrag des Manifests ({ prog, p, keys }) zum normierten Zeitpunkt u. */
export function evalPose(entry, u) {
  const P = new Pose();
  const progs = Array.isArray(entry.prog) ? entry.prog : [entry.prog || 'still'];
  for (const name of progs) (PROGRAMS[name] || still)(u, entry.p || {}, P);
  applyKeys(P, entry.keys, u);
  return P;
}
