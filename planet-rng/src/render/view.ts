// Shared stage geometry: everything around the planet is laid out in "reference pixels"
// where the planet radius is REF_R; the view scales them to device pixels.

export const REF_R = 60;
/** Global rotation of the planet's own ring plane (perspective look). */
export const TILT_ANGLE = -0.28;

export interface View {
  /** Scale from reference pixels to device pixels. */
  s: number;
  /** Planet centre in device pixels. */
  tx: number;
  ty: number;
}
