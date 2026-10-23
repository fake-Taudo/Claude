import { useEffect, useRef } from 'preact/hooks';
import { AURA_BY_ID } from '../config';
import { game } from '../game/app';
import { AuraPreviewScene } from '../render/preview';

/** Live preview of an aura around a small planet (collection detail view). */
export function AuraPreview({ auraId }: { auraId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const aura = AURA_BY_ID[auraId];
    if (!ref.current || !aura) return;
    const q = game.settings.vfxQuality === 'high' ? 'medium' : 'low';
    const scene = new AuraPreviewScene(ref.current, aura, q, game.settings.reducedEffects, game.state.rebirth);
    return () => scene.destroy();
  }, [auraId]);
  return <canvas ref={ref} aria-label="Vorschau der Aura" />;
}
