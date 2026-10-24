// Seedable pseudo random number generator (sfc32) with a serialisable state.
// next() returns 53-bit precision floats so that odds like 1 in 3.000.000.000
// are represented accurately (a single 32-bit draw would quantise them).

export type RngState = [number, number, number, number];

/** 32-bit integer hash used to derive independent seeds (shop rotations, biomes, quests). */
export function hash32(...values: number[]): number {
  let h = 0x811c9dc5;
  for (const v of values) {
    // Mix the value as two 32-bit halves so large numbers (timestamps) hash well.
    const lo = v >>> 0;
    const hi = Math.floor(v / 4294967296) >>> 0;
    for (const part of [lo, hi]) {
      h ^= part;
      h = Math.imul(h, 0x01000193);
      h ^= h >>> 15;
      h = Math.imul(h, 0x2c1b3c6d);
      h ^= h >>> 12;
    }
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return h >>> 0;
}

function splitmix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number | RngState) {
    if (typeof seed === 'number') {
      const sm = splitmix32(seed);
      this.a = sm();
      this.b = sm();
      this.c = sm();
      this.d = sm();
      for (let i = 0; i < 12; i++) this.nextU32();
    } else {
      [this.a, this.b, this.c, this.d] = seed.map((x) => x >>> 0) as RngState;
      if ((this.a | this.b | this.c | this.d) === 0) this.d = 1;
    }
  }

  nextU32(): number {
    const t0 = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    const t = (t0 + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Uniform float in [0, 1) with 53 bits of precision. */
  next(): number {
    const hi = this.nextU32() >>> 5; // 27 bits
    const lo = this.nextU32() >>> 6; // 26 bits
    return (hi * 67108864 + lo) / 9007199254740992;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)];
  }

  getState(): RngState {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }

  setState(state: RngState): void {
    [this.a, this.b, this.c, this.d] = state.map((x) => x >>> 0) as RngState;
  }
}
