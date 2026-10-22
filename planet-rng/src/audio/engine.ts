// Web Audio engine: embedded samples (Deep Boom, Plop), procedural SFX and an ambient
// music loop. Audio unlocks on the first user interaction; any failure is swallowed so
// sound can never break the game.

import boomUrl from '../assets/audio/deep-boom.mp3?inline';
import plopUrl from '../assets/audio/plop.wav?inline';
import type { Settings } from '../store/settings';

type Wave = OscillatorType;

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function dataUrlToBuffer(url: string): ArrayBuffer {
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private reverb!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private boom: AudioBuffer | null = null;
  private plop: AudioBuffer | null = null;
  private boomSource: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private settings: Settings;
  private music: Music | null = null;
  private lastPlop = 0;
  private duck = 1;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.build();
        void this.loadSamples();
      }
      if (this.ctx.state === 'suspended' && !document.hidden) void this.ctx.resume().catch(() => undefined);
    } catch {
      this.ctx = null;
    }
  }

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  private build(): void {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    // Gentle limiter so stacked stingers never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    comp.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(comp);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(comp);
    // Cheap "reverb": filtered feedback delay used as a send.
    this.reverb = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.21;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    this.reverb.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    lp.connect(wet);
    wet.connect(this.sfxBus);
    this.apply(this.settings);
    this.music = new Music(ctx, this.musicBus);
    if (this.settings.musicVolume > 0 && !this.settings.muted) this.music.start();
  }

  private async decode(data: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.ctx!;
    return new Promise((resolve, reject) => {
      const p = ctx.decodeAudioData(data, resolve, reject);
      if (p && typeof p.then === 'function') p.then(resolve, reject);
    });
  }

  private async loadSamples(): Promise<void> {
    try {
      this.boom = await this.decode(dataUrlToBuffer(boomUrl));
    } catch {
      this.boom = null;
    }
    try {
      const raw = await this.decode(dataUrlToBuffer(plopUrl));
      this.plop = this.trim(raw, 0.24, 0.03);
    } catch {
      this.plop = null;
    }
  }

  /** Copies at most `max` seconds with a short linear fade-out. */
  private trim(buf: AudioBuffer, max: number, fade: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.min(buf.length, Math.floor(max * buf.sampleRate));
    const out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
    const fadeLen = Math.floor(fade * buf.sampleRate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c);
      const dst = out.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const k = i > len - fadeLen ? (len - i) / fadeLen : 1;
        dst[i] = src[i] * k;
      }
    }
    return out;
  }

  apply(s: Settings): void {
    this.settings = s;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const master = s.muted ? 0 : s.masterVolume;
    this.master.gain.setTargetAtTime(master, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
    this.musicBus.gain.setTargetAtTime(s.musicVolume * 0.55 * this.duck, t, 0.3);
    if (this.music) {
      if (s.musicVolume > 0 && !s.muted) this.music.start();
      else this.music.stop();
    }
  }

  suspend(): void {
    void this.ctx?.suspend().catch(() => undefined);
  }

  resume(): void {
    if (this.ctx && !document.hidden) void this.ctx.resume().catch(() => undefined);
  }

  setDuck(on: boolean): void {
    this.duck = on ? 0 : 1;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(this.settings.musicVolume * 0.55 * this.duck, this.ctx.currentTime, on ? 0.2 : 1.2);
  }

  setBiome(root: number, bright: number): void {
    this.music?.setMood(root, bright);
  }

  // -------------------------------------------------------------------------
  // Synthesis helpers
  // -------------------------------------------------------------------------

  private noise(): AudioBuffer {
    if (!this.noiseBuf) {
      const ctx = this.ctx!;
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    }
    return this.noiseBuf;
  }

  private tone(o: { type?: Wave; freq: number; to?: number; at?: number; dur: number; gain: number; attack?: number; detune?: number; reverb?: number; filter?: number }): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let node: AudioNode = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.filter;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.sfxBus);
    if (o.reverb) {
      const s = ctx.createGain();
      s.gain.value = o.reverb;
      g.connect(s);
      s.connect(this.reverb);
    }
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  private hiss(o: { at?: number; dur: number; gain: number; type?: BiquadFilterType; freq: number; to?: number; q?: number; attack?: number }): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + (o.at ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noise();
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + o.dur + 0.05);
  }

  private safe(fn: () => void): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      fn();
    } catch {
      /* never break the game */
    }
  }

  // -------------------------------------------------------------------------
  // Public sounds
  // -------------------------------------------------------------------------

  roll(): void {
    this.safe(() => {
      const ctx = this.ctx!;
      const now = ctx.currentTime;
      if (now - this.lastPlop < 0.05) return;
      this.lastPlop = now;
      if (this.plop) {
        const src = ctx.createBufferSource();
        src.buffer = this.plop;
        const g = ctx.createGain();
        g.gain.value = 0.9;
        src.connect(g);
        g.connect(this.sfxBus);
        src.start();
      } else {
        this.tone({ freq: 520, to: 180, dur: 0.12, gain: 0.35 });
      }
    });
  }

  /** Rising tension during a rare roll's suspense phase. */
  riser(seconds: number, rank: number): void {
    this.safe(() => {
      const d = Math.max(0.3, seconds);
      this.hiss({ dur: d, gain: 0.05 + rank * 0.012, freq: 300, to: 3800, q: 4, attack: d * 0.9 });
      this.tone({ type: 'sawtooth', freq: midi(48 + rank), to: midi(60 + rank), dur: d, gain: 0.03 + rank * 0.006, attack: d * 0.85, filter: 1800 });
    });
  }

  stinger(rank: number, afterCutscene: boolean): void {
    this.safe(() => {
      const root = 72 + Math.min(rank, 15);
      if (rank <= 1) {
        this.tone({ freq: midi(rank ? 88 : 84), dur: 0.28, gain: 0.12, reverb: 0.2 });
        if (rank === 1) this.tone({ freq: midi(91), at: 0.06, dur: 0.3, gain: 0.1, reverb: 0.2 });
        return;
      }
      if (rank === 2) {
        [0, 4, 7].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(84 + n), at: i * 0.06, dur: 0.45, gain: 0.12, reverb: 0.35 }));
        return;
      }
      if (rank === 3) {
        [0, 4, 7, 12].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(76 + n), at: i * 0.07, dur: 0.7, gain: 0.13, reverb: 0.5 }));
        this.tone({ freq: midi(100), at: 0.28, dur: 0.6, gain: 0.04, reverb: 0.6 });
        this.hiss({ dur: 0.5, gain: 0.05, freq: 2000, to: 6000, q: 0.7 });
        return;
      }
      // Legendary and above: impact + chord + sparkle, scaled by rank.
      const big = rank >= 6 || afterCutscene;
      this.tone({ freq: big ? 70 : 90, to: big ? 28 : 45, dur: big ? 1.6 : 0.8, gain: big ? 0.6 : 0.4 });
      this.hiss({ dur: big ? 2.2 : 0.9, gain: big ? 0.28 : 0.16, type: 'lowpass', freq: big ? 5000 : 3000, to: 300, q: 0.5 });
      const chord = rank >= 5 ? [0, 4, 7, 11, 14, 19] : [0, 4, 7, 12];
      const base = root - 24;
      chord.forEach((n, i) => {
        this.tone({ type: 'sawtooth', freq: midi(base + n), dur: big ? 3.2 : 1.6, gain: 0.05, attack: 0.02, filter: 2400, reverb: 0.5, detune: (i % 2 ? 6 : -6) });
        this.tone({ type: 'triangle', freq: midi(base + 12 + n), at: 0.02 * i, dur: big ? 2.6 : 1.3, gain: 0.05, reverb: 0.6 });
      });
      const sparkles = rank >= 5 ? 10 : 5;
      for (let i = 0; i < sparkles; i++) {
        const n = chord[Math.floor(Math.random() * chord.length)] + 24;
        this.tone({ freq: midi(base + n + 12), at: 0.15 + i * 0.07, dur: 0.4, gain: 0.04, reverb: 0.8 });
      }
      if (big) {
        // Choir-like pad swell.
        [0, 7, 12, 16].forEach((n) => this.tone({ type: 'sawtooth', freq: midi(base - 12 + n), dur: 4, gain: 0.035, attack: 0.6, filter: 1200, reverb: 0.5, detune: 8 }));
      }
    });
  }

  cutsceneStart(totalSeconds: number, rank: number): void {
    this.safe(() => {
      const ctx = this.ctx!;
      this.stopBoom(0);
      if (this.boom) {
        const src = ctx.createBufferSource();
        src.buffer = this.boom;
        const g = ctx.createGain();
        g.gain.value = 1;
        src.connect(g);
        g.connect(this.sfxBus);
        src.start();
        this.boomSource = { src, gain: g };
        src.onended = () => {
          if (this.boomSource?.src === src) this.boomSource = null;
        };
      } else {
        this.tone({ freq: 55, to: 30, dur: 10, gain: 0.5, attack: 3 });
      }
      // Longer (rarer) cutscenes get a drone + riser that carries past the sample.
      const extra = totalSeconds - (this.boom?.duration ?? 12.7);
      if (extra > 0.3) {
        const startAt = Math.max(0, totalSeconds - extra - 2);
        this.tone({ type: 'sawtooth', freq: midi(36 + rank), dur: extra + 2.2, gain: 0.08, attack: 1.5, filter: 900, at: startAt });
        this.hiss({ at: startAt, dur: extra + 2.2, gain: 0.08, freq: 200, to: 5000, q: 3, attack: extra + 1.8 });
      }
    });
  }

  stopBoom(fade = 0.4): void {
    if (!this.boomSource || !this.ctx) return;
    const { src, gain } = this.boomSource;
    try {
      const t = this.ctx.currentTime;
      gain.gain.setTargetAtTime(0, t, Math.max(0.01, fade / 3));
      src.stop(t + fade + 0.05);
    } catch {
      /* ignore */
    }
    this.boomSource = null;
  }

  ui(name: string): void {
    this.safe(() => {
      switch (name) {
        case 'click':
          this.tone({ freq: 1500, to: 1100, dur: 0.05, gain: 0.06 });
          break;
        case 'tab':
          this.tone({ type: 'triangle', freq: 900, dur: 0.06, gain: 0.07 });
          break;
        case 'toggle':
          this.tone({ type: 'triangle', freq: 700, to: 1000, dur: 0.08, gain: 0.08 });
          break;
        case 'open':
          this.hiss({ dur: 0.18, gain: 0.05, freq: 600, to: 2400, q: 1.2 });
          this.tone({ type: 'triangle', freq: 600, to: 900, dur: 0.12, gain: 0.05 });
          break;
        case 'close':
          this.hiss({ dur: 0.16, gain: 0.04, freq: 2000, to: 500, q: 1.2 });
          break;
        case 'error':
          this.tone({ type: 'square', freq: 220, dur: 0.1, gain: 0.05, filter: 1200 });
          this.tone({ type: 'square', freq: 165, at: 0.1, dur: 0.14, gain: 0.05, filter: 1200 });
          break;
        case 'coins':
        case 'sell':
          [88, 93, 96].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(n), at: i * 0.05, dur: 0.18, gain: 0.08, reverb: 0.3 }));
          break;
        case 'buy':
          [81, 85, 88, 93].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(n), at: i * 0.06, dur: 0.25, gain: 0.08, reverb: 0.4 }));
          this.hiss({ dur: 0.3, gain: 0.04, freq: 4000, to: 8000 });
          break;
        case 'brew':
          for (let i = 0; i < 7; i++) this.tone({ freq: 300 + Math.random() * 500, to: 600 + Math.random() * 800, at: i * 0.07, dur: 0.09, gain: 0.06 });
          this.tone({ type: 'triangle', freq: midi(79), at: 0.45, dur: 0.5, gain: 0.07, reverb: 0.5 });
          break;
        case 'craft':
          [0, 0.16, 0.32].forEach((at, i) => {
            this.hiss({ at, dur: 0.12, gain: 0.12, freq: 2500 + i * 400, q: 8 });
            this.tone({ type: 'square', freq: 320 + i * 40, at, dur: 0.12, gain: 0.03, filter: 2000 });
          });
          this.tone({ type: 'triangle', freq: midi(84), at: 0.5, dur: 0.6, gain: 0.08, reverb: 0.6 });
          break;
        case 'drink':
          this.tone({ freq: 380, to: 160, dur: 0.18, gain: 0.12, filter: 900 });
          this.tone({ freq: 420, to: 180, at: 0.16, dur: 0.18, gain: 0.1, filter: 900 });
          this.tone({ type: 'triangle', freq: midi(83), at: 0.36, dur: 0.45, gain: 0.06, reverb: 0.5 });
          break;
        case 'equip':
          this.hiss({ dur: 0.25, gain: 0.04, freq: 800, to: 3000 });
          this.tone({ type: 'triangle', freq: midi(79), at: 0.06, dur: 0.3, gain: 0.07, reverb: 0.4 });
          break;
        case 'claim':
        case 'achievement':
          [72, 76, 79, 84].forEach((n, i) => this.tone({ type: 'square', freq: midi(n), at: i * 0.09, dur: 0.22, gain: 0.05, filter: 3000, reverb: 0.4 }));
          this.tone({ type: 'triangle', freq: midi(88), at: 0.4, dur: 0.6, gain: 0.07, reverb: 0.6 });
          break;
        case 'rebirth':
          this.hiss({ dur: 2.2, gain: 0.12, freq: 200, to: 6000, q: 2, attack: 1.8 });
          [48, 55, 60, 64, 67, 72].forEach((n, i) => this.tone({ type: 'sawtooth', freq: midi(n), at: 1.8 + i * 0.03, dur: 3, gain: 0.05, filter: 2400, reverb: 0.6 }));
          this.tone({ freq: 60, to: 30, at: 1.8, dur: 1.5, gain: 0.5 });
          break;
        case 'biome':
          this.tone({ type: 'triangle', freq: midi(67), dur: 0.8, gain: 0.05, attack: 0.2, reverb: 0.7 });
          this.tone({ type: 'triangle', freq: midi(74), at: 0.2, dur: 0.9, gain: 0.05, attack: 0.2, reverb: 0.7 });
          break;
        case 'quest':
          [79, 84].forEach((n, i) => this.tone({ type: 'triangle', freq: midi(n), at: i * 0.08, dur: 0.3, gain: 0.07, reverb: 0.4 }));
          break;
      }
    });
  }
}

/** Slow procedural ambient pad that follows the biome. */
class Music {
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private root = 45;
  private bright = 0.45;
  private readonly progression = [
    [0, 4, 7, 11],
    [9, 12, 16, 19],
    [5, 9, 12, 16],
    [7, 11, 14, 17],
  ];

  constructor(
    private ctx: AudioContext,
    private out: GainNode,
  ) {}

  start(): void {
    if (this.timer) return;
    this.chord();
    this.timer = setInterval(() => this.chord(), 8000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  setMood(root: number, bright: number): void {
    this.root = 45 + root;
    this.bright = bright;
  }

  private chord(): void {
    if (this.ctx.state !== 'running') return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const notes = this.progression[this.step % this.progression.length];
      this.step++;
      const cutoff = 450 + this.bright * 1600;
      for (const [i, n] of notes.entries()) {
        for (const det of [-7, 7]) {
          const osc = ctx.createOscillator();
          osc.type = i === 0 ? 'triangle' : 'sawtooth';
          osc.frequency.value = midi(this.root + n + (i === 0 ? -12 : 0));
          osc.detune.value = det;
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = cutoff;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.022, t + 3);
          g.gain.setValueAtTime(0.022, t + 7);
          g.gain.linearRampToValueAtTime(0.0001, t + 11);
          osc.connect(f);
          f.connect(g);
          g.connect(this.out);
          osc.start(t);
          osc.stop(t + 11.2);
        }
      }
      // A few soft plucks for movement.
      for (let k = 0; k < 4; k++) {
        const n = notes[Math.floor(Math.random() * notes.length)] + 24;
        const at = t + 0.5 + k * 1.8 + Math.random() * 0.4;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = midi(this.root + n);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.03 * (0.5 + this.bright), at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 1.6);
        osc.connect(g);
        g.connect(this.out);
        osc.start(at);
        osc.stop(at + 1.7);
      }
    } catch {
      /* ignore */
    }
  }
}
