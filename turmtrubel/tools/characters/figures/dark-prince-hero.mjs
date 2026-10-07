// Dunkler Prinz als Held – reitet ein gepanzertes Nashorn und trägt eine Sichelmond-Krone über dem Visier
// (Brief: docs/briefs/dark-prince-hero.md). Form „foot“: nach dem Zerstörerischen Absprung kämpft er zu Fuß weiter.
import { darkRider, darkRiderPivots } from './dark-prince.mjs';
import { rhinoBody, RHINO_PIVOTS } from './rhino.mjs';
import { emblem } from '../kit.mjs';

export default function darkPrinceHero(F) {
  const foot = { hip: 'fHip', torso: 'fTorso', head: 'fHead', armB: 'fArmB', handB: 'fHandB', armF: 'fArmF', handF: 'fHandF', prop: 'fProp', leg: 'fLeg' };
  F.rig(
    'rider',
    {
      ...RHINO_PIVOTS,
      ...darkRiderPivots(-2, -66),
      cape: [-10, -62],
      // zu Fuß: eigener Körper, Hüfte auf Beinlänge über dem Boden
      ...darkRiderPivots(0, -37, foot),
      fLegB: [-4, -37],
      fLegF: [6, -37],
    },
    { fHip: 'root', fTorso: 'fHip', fHead: 'fTorso', fArmB: 'fTorso', fHandB: 'fArmB', fArmF: 'fTorso', fHandF: 'fArmF', fProp: 'fHandF', fLeg: 'fHip', fLegB: 'fHip', fLegF: 'fHip' },
  );
  rhinoBody(F, { form: ['base'] });
  darkRider(F, { x0: -2, y0: -66, hero: true, form: ['base'] });
  darkRider(F, { x0: 0, y0: -37, hero: true, form: ['foot'], names: foot, suffix: 'Foot', standing: true, legs: { legB: 'fLegB', legF: 'fLegF' } });
  emblem(F, 'emblem', 'body', 12.5, -2, -56, 3);
  F.meta.afterAbility = { form: 'foot', delay: 0.9 };

  const swing = { prop: { r: [[0, 0], [0.2, -120], [0.4, -240], [0.6, -400], [0.8, -460], [1, -360]] }, fProp: { r: [[0, 0], [0.2, -120], [0.4, -240], [0.6, -400], [0.8, -460], [1, -360]] }, fArmF: { r: [[0, 0], [0.48, -170], [0.6, -40, 'in'], [0.75, -20], [1, 0]] } };
  F.anim({
    // Absprung-Pose: steht in den Steigbügeln
    idle: { p: { nod: 3 }, keys: { rHip: { y: [[0, 0], [0.4, -3], [0.6, -3], [0.8, 0]] }, fTorso: { y: [[0, 0], [0.5, -0.8], [1, 0]] } } },
    // Nashorn trabt (zu Fuß: Schritt mit den eigenen Beinen)
    walk: { p: { stride: 22, bob: 3.4, rock: 3, nod: 5, gallop: false }, keys: { fLegF: { r: [[0, -22], [0.5, 22], [1, -22]] }, fLegB: { r: [[0, 22], [0.5, -22], [1, 22]] }, fHip: { y: [[0, 0], [0.25, -2], [0.5, 0], [0.75, -2], [1, 0]] } }, ev: { step: [0.25, 0.75] } },
    charge: { prog: 'quad.walk', p: { stride: 32, bob: 4, riderLean: 12 }, keys: { rArmF: { r: [[0, -70], [1, -70]] } } },
    // Morgenstern-Rundumschlag
    attack: { prog: 'rider.swing', hit: 0.6, p: { wind: -200, strike: -40, over: -30, cock: -40, snap: 20, lean: 6, lunge: 10 }, keys: swing },
    // Zerstörerischer Absprung: Sprung aus dem Sattel mit Landung
    ability: { prog: 'quad.idle', keys: { rHip: { y: [[0, 0], [0.2, 6], [0.5, -40, 'out'], [0.9, 24, 'in'], [1, 30]], x: [[0, 0], [0.9, 14]] }, rTorso: { r: [[0, 0], [0.5, 20], [0.9, 0]] } }, ev: { ability: 0.9 } },
    hit: { keys: { jaw: { r: [[0, 0], [0.2, 10], [1, 0]] }, rArmB: { r: [[0, 0], [0.2, -50], [1, 0]] }, fArmB: { r: [[0, 0], [0.2, -50], [1, 0]] } } },
    death: { p: { angle: 12 }, keys: { rHip: { x: [[0, 0], [0.6, -20]], y: [[0, 0], [0.6, 24, 'in']] }, rTorso: { r: [[0, 0], [0.6, -90]] }, fTorso: { r: [[0, 0], [0.6, -80]], y: [[0, 0], [0.6, 20]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
