// CharacterAnimator (docs/CHAR_SYSTEM.md §9.5/§9.7): leitet pro Einheit Zustand und normierte Zeit aus Flags,
// Server-Ereignissen (a = Treffer/Abschuss, h = getroffen, ab = Fähigkeit) und Bewegung ab und meldet
// Animations-Events (char.step, char.strike, …) für das VFX-System.
import { EF } from '/shared/protocol.js';

const SPAWN = 0.5;
const HIT = 0.24;
const DEATH = 0.7;
const ABILITY = 0.9;
const STUN = 0.9;
const IDLE = 1.6;
const CHARGE = 0.5;
const SLEEP = 2;
/** Längste Wartezeit am Treffer-Bild, falls das Ereignis a später als erwartet kommt. */
const HOLD = 0.25;

const evList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export class CharacterAnimator {
  /**
   * @param {string} figure Figuren-ID aus dem Manifest
   * @param {{anim?:object, born:number, hitSpeed?:number, firstHit?:number, speed?:number, seed?:number, onEvent?:Function}} o  anim: Manifest-Eintrag figures[id].anim
   */
  constructor(figure, o = {}) {
    this.figure = figure;
    this.born = o.born ?? 0;
    this.hitSpeed = o.hitSpeed || 1;
    this.firstHit = o.firstHit ?? Math.min(0.5, this.hitSpeed);
    this.speed = o.speed || 1;
    this.seed = o.seed || 0;
    this.onEvent = o.onEvent || null;
    this.lastA = null;
    this.atkOn = null;
    this.hurtT = -9;
    this.abilityT = -9;
    this.prev = null;
    this.frozen = null;
    const anim = o.anim || {};
    this.anim = anim;
    this.hitFrac = anim.attack?.hit ?? 0.55;
    this.atkDur = Math.min(0.9, this.hitSpeed);
    const sp = Math.max(0.3, this.speed);
    this.walkDur = 0.8 * Math.min(1.35, Math.max(0.55, Math.pow(1 / sp, 0.7)));
  }
  /** Server-Ereignis a: Treffer-/Abschuss-Bild jetzt. */
  attack(now) {
    this.lastA = now;
  }
  hurt(now) {
    this.hurtT = now;
  }
  ability(now) {
    this.abilityT = now;
  }

  /**
   * Zustand für diesen Frame.
   * @param {number} now Weltzeit (s)
   * @param {{moving?:boolean, flags?:number, sleep?:boolean}} inp
   * @returns {{state:string, u:number}}
   */
  frame(now, inp = {}) {
    const f = inp.flags || 0;
    if (f & EF.FREEZE) {
      if (!this.frozen) this.frozen = this.prev ? { state: this.prev.state, u: this.prev.u } : { state: 'idle', u: 0 };
      return this.frozen;
    }
    this.frozen = null;
    const r = this.resolve(now, inp, f);
    this.emit(r);
    this.prev = r;
    return r;
  }

  resolve(now, inp, f) {
    const loop = (dur) => (((now + this.seed) / dur) % 1 + 1) % 1;
    const age = now - this.born;
    if (age >= 0 && age < SPAWN) return { state: 'spawn', u: age / SPAWN };
    if (now - this.abilityT < ABILITY) return { state: 'ability', u: (now - this.abilityT) / ABILITY };
    if (inp.sleep) return { state: 'sleep', u: loop(SLEEP) };
    if (f & EF.STUN) return { state: 'stun', u: loop(STUN) };
    // Angriff: Ausholen beginnt vor dem erwarteten Treffer, das Treffer-Bild liegt auf dem Ereignis a
    const attacking = !!(f & EF.ATTACK);
    if (attacking && this.atkOn == null) this.atkOn = now;
    if (!attacking) this.atkOn = null;
    const h = this.hitFrac;
    const D = this.atkDur;
    if (this.lastA != null && now - this.lastA < (1 - h) * D) return { state: 'attack', u: Math.min(0.999, h + (now - this.lastA) / D) };
    if (attacking) {
      const next = this.lastA != null && this.lastA >= this.atkOn - 0.05 ? this.lastA + this.hitSpeed : this.atkOn + this.firstHit;
      const start = next - h * D;
      if (now >= start) {
        if (now < next) return { state: 'attack', u: (now - start) / D };
        if (now < next + HOLD) return { state: 'attack', u: h - 0.001 };
      }
    }
    if (now - this.hurtT < HIT && !inp.moving && !attacking) return { state: 'hit', u: (now - this.hurtT) / HIT };
    if (f & (EF.CHARGE | EF.DASH | EF.JUMP)) return { state: 'charge', u: loop(CHARGE) };
    if (inp.moving) return { state: 'walk', u: loop(this.walkDur) };
    return { state: 'idle', u: loop(IDLE) };
  }

  /** Events des aktuellen Zustands melden, deren Zeitpunkt seit dem letzten Frame überschritten wurde. */
  emit(r) {
    if (!this.onEvent) return;
    const p = this.prev;
    if (!p || p.state !== r.state) {
      if (r.state === 'attack' && r.u < this.hitFrac) this.onEvent('char.windup', r.state);
      return;
    }
    const wrapped = r.u < p.u;
    const crossed = (t) => (wrapped ? t > p.u || t <= r.u : t > p.u && t <= r.u);
    const ev = this.anim[r.state]?.ev || {};
    for (const [name, at] of Object.entries(ev)) for (const t of evList(at)) if (crossed(t)) this.onEvent('char.' + name, r.state);
    if (r.state === 'attack' && crossed(this.hitFrac)) this.onEvent('char.strike', r.state);
    if (r.state === 'spawn' && crossed(0.55)) this.onEvent('char.land', r.state);
  }
}

/** Tod: Leichen-Zeitverlauf (0,7 s), danach verschwindet die Figur. */
export const DEATH_DURATION = DEATH;
