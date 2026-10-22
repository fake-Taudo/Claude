import { useEffect, useRef } from 'preact/hooks';
import { AURA_BY_ID } from '../config';
import { game } from '../game/app';
import { AuraPreviewScene } from '../render/preview';
import { QUALITY_FACTOR } from '../render/stage';

/** Live preview of an aura around a small planet (collection detail view). */
export function AuraPreview({ auraId }: { auraId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const aura = AURA_BY_ID[auraId];
    if (!ref.current || !aura) return;
    const scene = new AuraPreviewScene(ref.current, aura, QUALITY_FACTOR[game.settings.vfxQuality] * 0.8, game.settings.reducedEffects, game.state.rebirth);
    return () => scene.destroy();
  }, [auraId]);
  return <canvas ref={ref} aria-label="Vorschau der Aura" />;
}
