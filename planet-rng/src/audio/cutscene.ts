// Cutscene sound: every sound of a cutscene is an event on the cutscene timeline and is
// scheduled ahead on the AudioContext clock (which is also the cutscene's time base).
// Everything is procedural except the Deep Boom sample. A failure here never stops the
// cutscene: it simply runs silent.

import { CUTSCENE, type Cue, type CutsceneDef, type MusicSpec } from '../config/cutscenes';
import type { AudioEngine } from './engine';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type MusicSfx = 'bass' | 'arp' | 'pad';
type Ev = Omit<Cue, 'sfx'> & { sfx: Cue['sfx'] | MusicSfx };

/** Sounds that may start late with an offset (audio unlocked mid-cutscene, lab seek). */
const SUSTAINED = new Set<string>(['deepBoom', 'wind', 'drone', 'choir', 'swell', 'riser', 'pad']);

const SCALES: Record<NonNullable<MusicSpec['mood']>, { scale: number[]; prog: number[] }> = {
  bright: { scale: [0, 4, 7, 11, 14, 16], prog: [0, 9, 5, 7] },
  dark: { scale: [0, 3, 7, 10, 14, 15], prog: [0, 8, 3, 10] },
  mystic: { scale: [0, 2, 7, 9, 14, 19], prog: [0, 5, 10, 3] },
  drive: { scale: [0, 3, 7, 10, 12, 15], prog: [0, 0, 8, 10] },
};

/** Beat-synchronous music: pulse before the drop, full drums, bass, arpeggio and pad after it. */
export function musicEvents(m: MusicSpec): Ev[] {
  const step = 60 / m.bpm;
  const key = m.key ?? 45;
  const { scale, prog } = SCALES[m.mood ?? 'dark'];
  const drop = m.drop ?? 0;
  const out: Ev[] = [];
  for (let i = 0; i < m.beats; i++) {
    const t = m.t + i * step;
    const bar = Math.floor(i / 4);
    const inBar = i % 4;
    const root = key + prog[bar % prog.length];
    const post = i >= drop;
    if (inBar === 0) out.push({ t, sfx: 'pad', note: root, dur: step * 4.2, gain: post ? 1 : 0.7 });
    if (post) {
      out.push({ t, sfx: 'kick', gain: 1 });
      if (inBar === 1 || inBar === 3) out.push({ t, sfx: 'snare' });
      out.push({ t: t + step / 2, sfx: 'hat' });
      out.push({ t, sfx: 'bass', note: root - 12 + (inBar === 2 ? 7 : 0), dur: step * 0.9 });
      for (let k = 0; k < 2; k++) out.push({ t: t + (k * step) / 2, sfx: 'arp', note: root + 24 + scale[(i * 2 + k) % scale.length], dur: step * 0.45 });
    } else {
      out.push({ t, sfx: 'kick', gain: inBar === 0 ? 0.55 : 0.3 });
    }
  }
  return out;
}

/** All sound events of a cutscene: bed, jingle, wind, sting, music, cues (sorted). */
export function soundEvents(def: CutsceneDef, blockCues: Cue[]): Ev[] {
  const a = def.audio;
  const tail = CUTSCENE.tailSeconds[def.reveal.style];
  const ev: Ev[] = [];
  if ((a.bed ?? 'deepBoom') === 'deepBoom') ev.push({ t: 0, sfx: 'deepBoom' });
  else if (a.bed === 'drone') ev.push({ t: 0, sfx: 'drone', dur: def.duration + tail, note: a.key ?? a.music?.key ?? 38 });
  if (a.jingle !== undefined) ev.push({ t: 0.05, sfx: 'jingle', variant: a.jingle });
  if (a.wind) ev.push({ t: 0, sfx: 'wind', dur: def.duration + tail, gain: a.wind });
  if (a.sting) ev.push({ t: def.signature.at, sfx: a.sting });
  if (a.music) ev.push(...musicEvents(a.music));
  ev.push(...(a.cues ?? []), ...blockCues);
  return ev.sort((x, y) => x.t - y.t);
}

interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  to?: number;
  dur: number;
  gain: number;
  attack?: number;
  filter?: number;
  filterTo?: number;
  q?: number;
  reverb?: number;
  detune?: number;
}

interface NoiseOpts {
  dur: number;
  gain: number;
  type?: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  attack?: number;
}

export class CutsceneSound {
  /** AudioContext time of cutscene time 0, null while nothing is scheduled. */
  zero: number | null = null;
  /** Cutscene volume (settings). */
  volume = 1;
  private events: Ev[] = [];
  private next = 0;
  private def: CutsceneDef | null = null;
  private out: GainNode | null = null;
  private silenceGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private sources = new Set<AudioScheduledSourceNode>();
  private samples = new Set<AudioBufferSourceNode>();
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private engine: AudioEngine | null) {}

  private get ctx(): AudioContext | null {
    const c = this.engine?.ctx;
    return c && c.state === 'running' ? c : null;
  }

  /** True when the cutscene clock can follow the audio clock. */
  get running(): boolean {
    return this.zero !== null && !!this.ctx;
  }

  /** Output latency, so pictures match what is heard. */
  get latency(): number {
    const c = this.ctx;
    if (!c) return 0;
    return Math.min(0.2, (c as AudioContext & { outputLatency?: number }).outputLatency || c.baseLatency || 0);
  }

  /** Cutscene time as heard right now (audio clock), null while not running. */
  time(): number | null {
    const c = this.ctx;
    if (!c || this.zero === null) return null;
    return c.currentTime - this.zero - this.latency;
  }

  load(def: CutsceneDef, blockCues: Cue[]): void {
    this.stop(0);
    this.def = def;
    this.events = soundEvents(def, blockCues);
    this.next = 0;
  }

  /** Schedules everything due before t + lookahead (cutscene time). */
  pump(t: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.def || !this.engine?.cutsceneOut) return;
    try {
      if (this.zero === null) this.begin(ctx, t);
      const until = t + CUTSCENE.lookahead;
      while (this.next < this.events.length && this.events[this.next].t < until) {
        const e = this.events[this.next++];
        this.play(ctx, e, t);
      }
    } catch {
      /* the cutscene goes on without sound */
    }
  }

  private begin(ctx: AudioContext, t: number): void {
    this.zero = ctx.currentTime - t + 0.02;
    const out = ctx.createGain();
    out.gain.value = this.volume;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 0.5;
    const silence = ctx.createGain();
    silence.connect(filter);
    filter.connect(out);
    out.connect(this.engine!.cutsceneOut!);
    this.out = out;
    this.filter = filter;
    this.silenceGain = silence;
    // Silence windows: the floor falls away right before an impact.
    for (const [s0, s1] of this.def!.audio.silence ?? []) {
      if (s1 <= t) continue;
      const a = Math.max(ctx.currentTime, this.zero + s0);
      silence.gain.setValueAtTime(1, a);
      silence.gain.linearRampToValueAtTime(0.03, a + 0.06);
      silence.gain.setValueAtTime(0.03, this.zero + s1 - 0.01);
      silence.gain.linearRampToValueAtTime(1, this.zero + s1 + 0.01);
    }
    // Sustained sounds that already started keep sounding from the right offset.
    this.next = 0;
    while (this.next < this.events.length && this.events[this.next].t < t) {
      const e = this.events[this.next++];
      if (SUSTAINED.has(e.sfx) && e.t + (e.dur ?? 13) > t) this.play(ctx, e, t);
    }
  }

  /** Stop scheduling; ringing sounds fade out on their own (reveal handover). */
  release(): void {
    this.next = this.events.length;
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = setTimeout(() => this.stop(0.5), 6000);
  }

  /** Fades out and stops everything (skip, abort, seek). */
  stop(fade = 0.3): void {
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = null;
    const ctx = this.engine?.ctx;
    const out = this.out;
    const sources = [...this.sources];
    this.sources.clear();
    this.samples.clear();
    this.out = null;
    this.filter = null;
    this.silenceGain = null;
    this.zero = null;
    if (!ctx || !out) return;
    try {
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0.0001, now + Math.max(0.01, fade));
      for (const s of sources) {
        try {
          s.stop(now + fade + 0.05);
        } catch {
          /* already stopped */
        }
      }
      setTimeout(() => out.disconnect(), (fade + 0.2) * 1000);
    } catch {
      /* ignore */
    }
  }

  /** Restart the schedule at cutscene time t (lab scrubbing). */
  seek(t: number): void {
    this.stop(0.03);
    this.next = this.events.findIndex((e) => e.t >= t);
    if (this.next < 0) this.next = this.events.length;
  }

  setVolume(v: number): void {
    this.volume = v;
    const c = this.engine?.ctx;
    if (c && this.out) this.out.gain.setTargetAtTime(v, c.currentTime, 0.05);
  }

  // -------------------------------------------------------------------------

  private track<T extends AudioScheduledSourceNode>(n: T, at: number, end: number): T {
    n.start(at);
    n.stop(end);
    this.sources.add(n);
    n.onended = () => {
      this.sources.delete(n);
      if (n instanceof AudioBufferSourceNode) this.samples.delete(n);
    };
    return n;
  }

  private dest(): AudioNode {
    return this.silenceGain!;
  }

  private tone(ctx: AudioContext, at: number, o: ToneOpts): void {
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, at);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), at + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const a = Math.min(o.attack ?? 0.005, o.dur * 0.95);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + o.dur);
    let node: AudioNode = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.filter, at);
      if (o.filterTo) f.frequency.exponentialRampToValueAtTime(o.filterTo, at + o.dur);
      f.Q.value = o.q ?? 0.7;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.dest());
    if (o.reverb && this.engine?.reverbIn) {
      const s = ctx.createGain();
      s.gain.value = o.reverb;
      g.connect(s);
      s.connect(this.engine.reverbIn);
    }
    this.track(osc, at, at + o.dur + 0.05);
  }

  private noise(ctx: AudioContext, at: number, o: NoiseOpts): void {
    const buf = this.engine?.noiseBuffer();
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq, at);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, at + o.dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), at + Math.min(o.attack ?? 0.01, o.dur * 0.95));
    g.gain.exponentialRampToValueAtTime(0.0001, at + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.dest());
    this.track(src, at, at + o.dur + 0.05);
  }

  private play(ctx: AudioContext, e: Ev, now: number): void {
    const late = Math.max(0, now - e.t);
    if (late > 0.08 && !SUSTAINED.has(e.sfx)) return;
    const at = Math.max(ctx.currentTime, this.zero! + e.t);
    const g = e.gain ?? 1;
    const n = e.note;
    switch (e.sfx) {
      case 'deepBoom': {
        const buf = this.engine?.boomBuffer;
        if (buf) {
          if (late >= buf.duration) return;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const gn = ctx.createGain();
          gn.gain.value = g;
          src.connect(gn);
          gn.connect(this.dest());
          src.start(at, late);
          this.sources.add(src);
          this.samples.add(src);
          src.onended = () => {
            this.sources.delete(src);
            this.samples.delete(src);
          };
        } else if (late < 9) {
          this.tone(ctx, at, { freq: 55, to: 30, dur: 10 - late, gain: 0.5 * g, attack: Math.max(0.01, 3 - late) });
        }
        return;
      }
      case 'wind':
        return this.wind(ctx, at, (e.dur ?? 14) - late, g, late > 0);
      case 'drone': {
        const dur = (e.dur ?? 20) - late;
        if (dur <= 0.2) return;
        const root = midi(n ?? 38);
        for (const [f, det] of [
          [root, -6],
          [root, 6],
          [root * 1.5, 0],
          [root / 2, 0],
        ] as [number, number][]) {
          this.tone(ctx, at, { type: 'sawtooth', freq: f, dur, gain: 0.045 * g, attack: late > 0 ? 0.3 : 2.5, filter: 380, filterTo: 900, detune: det });
        }
        return;
      }
      case 'riser': {
        const dur = (e.dur ?? 2) - late;
        if (dur <= 0.1) return;
        this.noise(ctx, at, { dur, gain: 0.16 * g, freq: 300, to: 5200, q: 3, attack: dur * 0.92 });
        this.tone(ctx, at, { type: 'sawtooth', freq: midi((n ?? 48) - 12), to: midi(n ?? 48), dur, gain: 0.05 * g, attack: dur * 0.9, filter: 600, filterTo: 3500 });
        return;
      }
      case 'jingle':
        return this.jingle(ctx, at, e.variant ?? 0, g);
      case 'pulse':
        this.tone(ctx, at, { freq: 95, to: 52, dur: 0.5, gain: 0.42 * g });
        this.tone(ctx, at, { freq: midi(n ?? 84), dur: 0.5, gain: 0.05 * g, reverb: 0.5 });
        return;
      case 'heartbeat':
        this.tone(ctx, at, { freq: 64, to: 40, dur: 0.18, gain: 0.6 * g, filter: 300 });
        this.tone(ctx, at + 0.2, { freq: 56, to: 36, dur: 0.22, gain: 0.48 * g, filter: 260 });
        return;
      case 'tick':
        this.tone(ctx, at, { type: 'square', freq: 2400, dur: 0.03, gain: 0.05 * g, filter: 5000 });
        this.noise(ctx, at, { dur: 0.02, gain: 0.06 * g, type: 'highpass', freq: 3000 });
        return;
      case 'tock':
        this.tone(ctx, at, { type: 'triangle', freq: 880, to: 700, dur: 0.07, gain: 0.12 * g });
        this.noise(ctx, at, { dur: 0.03, gain: 0.05 * g, freq: 1500, q: 3 });
        return;
      case 'gong': {
        const root = midi(n ?? 41);
        [1, 1.48, 2.02, 2.7, 3.6, 4.4].forEach((r, i) => this.tone(ctx, at, { freq: root * r, dur: 4.2 - i * 0.5, gain: (0.22 / (i + 1)) * g, attack: 0.01, detune: i * 3, reverb: 0.6 }));
        this.noise(ctx, at, { dur: 0.3, gain: 0.08 * g, type: 'lowpass', freq: 900 });
        return;
      }
      case 'chime':
        [0, 7, 12, 19].forEach((k, i) => this.tone(ctx, at + i * 0.06, { freq: midi((n ?? 84) + k), dur: 1.6, gain: 0.07 * g, reverb: 0.7 }));
        return;
      case 'glass':
        for (let i = 0; i < 16; i++) {
          this.tone(ctx, at + Math.random() * 0.09, { freq: 2400 + Math.random() * 6500, dur: 0.18 + Math.random() * 0.8, gain: 0.035 * g, reverb: 0.4 });
        }
        this.noise(ctx, at, { dur: 0.35, gain: 0.3 * g, type: 'highpass', freq: 2800 });
        this.tone(ctx, at, { freq: 140, to: 50, dur: 0.4, gain: 0.35 * g });
        return;
      case 'crack':
        this.noise(ctx, at, { dur: 0.08, gain: 0.4 * g, type: 'highpass', freq: 1200 });
        this.tone(ctx, at, { freq: 130, to: 55, dur: 0.22, gain: 0.4 * g });
        return;
      case 'impact':
        this.tone(ctx, at, { freq: 72, to: 26, dur: 1.9, gain: 0.7 * g });
        this.tone(ctx, at, { freq: 41, dur: 1.4, gain: 0.35 * g, attack: 0.02 });
        this.noise(ctx, at, { dur: 2.4, gain: 0.3 * g, type: 'lowpass', freq: 5200, to: 280, q: 0.5 });
        return;
      case 'thunder': {
        for (let i = 0; i < 5; i++) this.noise(ctx, at + Math.random() * 0.5, { dur: 0.25 + Math.random() * 0.3, gain: 0.18 * g, type: 'lowpass', freq: 2200, to: 400 });
        this.noise(ctx, at, { dur: 2.8, gain: 0.22 * g, type: 'lowpass', freq: 380, to: 90, q: 0.6, attack: 0.15 });
        this.tone(ctx, at, { freq: 48, to: 30, dur: 2, gain: 0.25 * g, attack: 0.1 });
        return;
      }
      case 'whoosh': {
        const d = e.dur ?? 0.8;
        this.noise(ctx, at, { dur: d, gain: 0.2 * g, freq: 350, to: 2600, q: 1.3, attack: d * 0.6 });
        return;
      }
      case 'slash':
        this.noise(ctx, at, { dur: 0.26, gain: 0.32 * g, type: 'highpass', freq: 7500, to: 1400 });
        this.tone(ctx, at, { type: 'sawtooth', freq: 1900, to: 520, dur: 0.24, gain: 0.07 * g, filter: 5000 });
        this.tone(ctx, at + 0.02, { freq: midi(n ?? 91), dur: 1.2, gain: 0.04 * g, reverb: 0.6 });
        return;
      case 'freeze': {
        const hold = e.dur ?? 0.6;
        this.tone(ctx, at, { type: 'sawtooth', freq: 420, to: 52, dur: 0.9, gain: 0.1 * g, filter: 1600, filterTo: 300 });
        if (this.filter) {
          const f = this.filter.frequency;
          f.setValueAtTime(20000, at);
          f.exponentialRampToValueAtTime(320, at + 0.3);
          f.setValueAtTime(320, at + hold);
          f.exponentialRampToValueAtTime(20000, at + hold + 0.35);
        }
        for (const s of this.samples) {
          s.playbackRate.setValueAtTime(1, at);
          s.playbackRate.linearRampToValueAtTime(0.55, at + 0.4);
          s.playbackRate.setValueAtTime(0.55, at + hold);
          s.playbackRate.linearRampToValueAtTime(1, at + hold + 0.3);
        }
        return;
      }
      case 'choir':
      case 'swell': {
        const dur = (e.dur ?? 3) - late;
        if (dur <= 0.2) return;
        const root = n ?? 57;
        const chord = e.sfx === 'choir' ? [0, 7, 12, 16] : [0, 4, 7, 11, 14];
        for (const k of chord) {
          for (const det of [-8, 8]) {
            this.tone(ctx, at, { type: 'sawtooth', freq: midi(root + k), dur, gain: (e.sfx === 'choir' ? 0.022 : 0.018) * g, attack: Math.min(dur * 0.8, e.sfx === 'choir' ? 1.2 : dur * 0.85), filter: e.sfx === 'choir' ? 1100 : 700, filterTo: e.sfx === 'choir' ? 1400 : 3200, q: e.sfx === 'choir' ? 3 : 0.8, detune: det, reverb: 0.5 });
          }
        }
        return;
      }
      case 'suck': {
        const d = e.dur ?? 1.4;
        this.noise(ctx, at, { dur: d, gain: 0.22 * g, type: 'lowpass', freq: 200, to: 4000, attack: d * 0.95 });
        this.tone(ctx, at, { freq: 50, to: 320, dur: d, gain: 0.18 * g, attack: d * 0.9 });
        return;
      }
      case 'bloom': {
        const root = n ?? 60;
        [0, 4, 7, 11, 14, 19].forEach((k, i) => {
          this.tone(ctx, at + i * 0.03, { type: 'triangle', freq: midi(root + k), dur: 3.2, gain: 0.06 * g, reverb: 0.6 });
          this.tone(ctx, at, { type: 'sawtooth', freq: midi(root - 12 + k), dur: 3.6, gain: 0.025 * g, attack: 0.05, filter: 2200, detune: i % 2 ? 7 : -7 });
        });
        for (let i = 0; i < 12; i++) this.tone(ctx, at + 0.1 + i * 0.07, { freq: midi(root + 24 + [0, 4, 7, 11, 14][i % 5] + 12 * (i % 2)), dur: 0.5, gain: 0.03 * g, reverb: 0.8 });
        return;
      }
      case 'kick':
        this.tone(ctx, at, { freq: 150, to: 44, dur: 0.32, gain: 0.55 * g });
        this.noise(ctx, at, { dur: 0.02, gain: 0.08 * g, type: 'highpass', freq: 2000 });
        return;
      case 'snare':
        this.noise(ctx, at, { dur: 0.2, gain: 0.2 * g, type: 'highpass', freq: 1500 });
        this.tone(ctx, at, { type: 'triangle', freq: 200, to: 150, dur: 0.12, gain: 0.12 * g });
        return;
      case 'hat':
        this.noise(ctx, at, { dur: 0.05, gain: 0.07 * g, type: 'highpass', freq: 7500 });
        return;
      case 'bass':
        this.tone(ctx, at, { type: 'sawtooth', freq: midi(n ?? 33), dur: e.dur ?? 0.4, gain: 0.12 * g, attack: 0.01, filter: 520, filterTo: 180 });
        return;
      case 'arp':
        this.tone(ctx, at, { type: 'triangle', freq: midi(n ?? 72), dur: e.dur ?? 0.25, gain: 0.045 * g, reverb: 0.45 });
        return;
      case 'pad': {
        const dur = (e.dur ?? 2) - late;
        if (dur <= 0.2) return;
        for (const k of [0, 7, 12, 15]) this.tone(ctx, at, { type: 'sawtooth', freq: midi((n ?? 45) + k), dur, gain: 0.016 * g, attack: Math.min(0.5, dur * 0.4), filter: 900, detune: k % 2 ? 6 : -6, reverb: 0.3 });
        return;
      }
      case 'laser':
        this.tone(ctx, at, { type: 'sawtooth', freq: 1800, to: 110, dur: 0.38, gain: 0.12 * g, filter: 4200 });
        this.tone(ctx, at, { type: 'square', freq: 900, to: 60, dur: 0.3, gain: 0.05 * g, filter: 2500 });
        return;
      case 'type':
        this.noise(ctx, at, { dur: 0.018, gain: 0.07 * g, type: 'highpass', freq: 3200 });
        return;
      case 'shimmer': {
        const d = e.dur ?? 1.2;
        for (let i = 0; i < 10; i++) this.tone(ctx, at + (i / 10) * d, { freq: midi((n ?? 88) + [0, 3, 7, 10, 12, 15][i % 6]), dur: 0.6, gain: 0.03 * g, reverb: 0.8 });
        return;
      }
      case 'splash':
        this.noise(ctx, at, { dur: 0.45, gain: 0.25 * g, freq: 1400, to: 300, q: 0.8 });
        for (let i = 0; i < 4; i++) this.tone(ctx, at + 0.08 + i * 0.07, { freq: 500 + Math.random() * 400, to: 1300, dur: 0.07, gain: 0.05 * g });
        return;
      case 'zap':
        for (let i = 0; i < 14; i++) this.tone(ctx, at + i * 0.018, { type: 'square', freq: 200 + Math.random() * 2200, dur: 0.03, gain: 0.05 * g, filter: 6000 });
        this.noise(ctx, at, { dur: 0.3, gain: 0.12 * g, type: 'highpass', freq: 2500 });
        return;
      case 'bubble':
        this.tone(ctx, at, { freq: 260 + Math.random() * 120, to: 900, dur: 0.09, gain: 0.07 * g });
        return;
      case 'glitch':
        for (let i = 0; i < 9; i++) this.tone(ctx, at + Math.random() * 0.35, { type: 'square', freq: 120 + Math.random() * 3000, dur: 0.03 + Math.random() * 0.04, gain: 0.05 * g, filter: 7000 });
        this.noise(ctx, at + 0.05, { dur: 0.08, gain: 0.1 * g, type: 'highpass', freq: 1800 });
        return;
      default:
        return;
    }
  }

  /** Continuous hoarse wind: band-passed noise with slowly wandering filters. */
  private wind(ctx: AudioContext, at: number, dur: number, gain: number, late: boolean): void {
    const buf = this.engine?.noiseBuffer();
    if (!buf || dur <= 0.3) return;
    const end = at + dur;
    for (const [freq, q, lfoHz, depth, level] of [
      [480, 0.8, 0.11, 260, 0.11],
      [1350, 1.6, 0.19, 500, 0.045],
    ] as [number, number, number, number, number][]) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = 0.7 + Math.random() * 0.2;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = q;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = lfoHz;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = depth;
      lfo.connect(lfoGain);
      lfoGain.connect(f.frequency);
      const g = ctx.createGain();
      const peak = level * gain;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + (late ? 0.3 : 2.2));
      g.gain.setValueAtTime(peak, Math.max(at + 0.31, end - 1.2));
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      src.connect(f);
      f.connect(g);
      g.connect(this.dest());
      this.track(src, at, end + 0.05);
      this.track(lfo, at, end + 0.05);
    }
  }

  /** The "you got something big" signal at the very start. */
  private jingle(ctx: AudioContext, at: number, variant: number, g: number): void {
    switch (variant) {
      case 1: {
        // Bell: inharmonic partials with long decays.
        const root = midi(79);
        [1, 2, 2.76, 4.07, 5.4].forEach((r, i) => this.tone(ctx, at, { freq: root * r, dur: 2.6 - i * 0.4, gain: (0.09 / (1 + i * 0.7)) * g, reverb: 0.7 }));
        return;
      }
      case 2:
        // Dark: low minor swell and a breath of noise.
        for (const k of [0, 3, 7]) this.tone(ctx, at, { type: 'sawtooth', freq: midi(45 + k), dur: 2.2, gain: 0.04 * g, attack: 0.6, filter: 650 });
        this.noise(ctx, at, { dur: 1.6, gain: 0.08 * g, type: 'lowpass', freq: 400, to: 1800, attack: 0.9 });
        this.tone(ctx, at + 0.5, { freq: midi(81), dur: 1.4, gain: 0.04 * g, reverb: 0.8 });
        return;
      case 3:
        // Spectral: a fast arpeggio over two octaves.
        [0, 4, 7, 11, 14, 19, 23, 26].forEach((k, i) => this.tone(ctx, at + i * 0.045, { freq: midi(72 + k), dur: 0.9, gain: 0.055 * g, reverb: 0.7 }));
        this.noise(ctx, at, { dur: 1, gain: 0.04 * g, type: 'highpass', freq: 6000, to: 9000 });
        return;
      case 4:
        // Glitch: square blips that stumble.
        for (let i = 0; i < 6; i++) this.tone(ctx, at + i * 0.05 + (i % 2) * 0.015, { type: 'square', freq: midi(76 + [0, 12, 7, 19, 3, 24][i]), dur: 0.06, gain: 0.04 * g, filter: 5000 });
        this.tone(ctx, at + 0.34, { type: 'triangle', freq: midi(88), dur: 0.9, gain: 0.05 * g, reverb: 0.7 });
        return;
      case 5:
        // Warm: a soft major seventh pluck.
        [0, 4, 7, 11].forEach((k, i) => this.tone(ctx, at + i * 0.07, { type: 'triangle', freq: midi(67 + k), dur: 1.6, gain: 0.06 * g, reverb: 0.6 }));
        return;
      default:
        // Rising: four quick notes up.
        [0, 7, 12, 19].forEach((k, i) => this.tone(ctx, at + i * 0.07, { type: 'triangle', freq: midi(72 + k), dur: 0.7 + i * 0.2, gain: 0.065 * g, reverb: 0.55 }));
        this.tone(ctx, at, { freq: midi(48), dur: 1.5, gain: 0.08 * g, attack: 0.05 });
    }
  }
}
