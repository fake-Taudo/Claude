// Shared base for hero layers: parameter access and soft glowing strokes.

import type { Col, HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { mix, rgba } from '../../color';
import { D, Layer } from '../core';

export abstract class Hero extends Layer<HeroSpec> {
  /** Numeric parameter from the spec (p.key), with the documented default. */
  protected num(key: string, def: number): number {
    const v = this.spec.p?.[key];
    return typeof v === 'number' ? v : def;
  }

  /** Colour parameter (palette key or hex) resolved to hex. */
  protected color(key: string, def: Col, clock = 0): string {
    const v = this.spec.p?.[key];
    return this.inst.col(typeof v === 'string' ? v : def, clock);
  }

  protected colorStatic(key: string, def: Col): string {
    const v = this.spec.p?.[key];
    return this.inst.colStatic(typeof v === 'string' ? v : def);
  }

  protected list(key: string): number[] {
    const v = this.spec.p?.[key];
    return Array.isArray(v) ? (v as number[]) : [];
  }

  /** Anchor in reference pixels. */
  protected get ax(): number {
    return (this.spec.at?.[0] ?? 0) * D;
  }

  protected get ay(): number {
    return (this.spec.at?.[1] ?? 0) * D;
  }

  protected override defaultSlot(): Slot {
    return 'heroBack';
  }
}

/**
 * Strokes the current path several times: wide and faint, medium, the colour line and a
 * thin hot core. Gives soft light lines without shadowBlur.
 */
export function glowStroke(ctx: CanvasRenderingContext2D, path: () => void, width: number, color: string, alpha: number, core = 0.6): void {
  const passes: [number, number, string][] = [
    [width * 5, 0.07, color],
    [width * 2.4, 0.2, color],
    [width, 0.75, color],
  ];
  if (core > 0) passes.push([width * 0.4, core, mix(color, '#ffffff', 0.7)]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, a, c] of passes) {
    ctx.lineWidth = w;
    ctx.strokeStyle = rgba(c, Math.min(1, a * alpha));
    ctx.beginPath();
    path();
    ctx.stroke();
  }
}
