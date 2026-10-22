import { AURA_BY_ID } from '../config';
import { AuraOrb } from './common';

/** Live preview of an aura around a small planet (canvas renderer arrives with the VFX phase). */
export function AuraPreview({ auraId }: { auraId: string }) {
  const aura = AURA_BY_ID[auraId];
  return <AuraOrb aura={aura} size={120} />;
}
