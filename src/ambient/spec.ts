/** The small things in a world's air, drawn over its photo. Points and boxes are in the landscape photo, 0..1 each way. */

export type Point = readonly [u: number, v: number];
export type Box = readonly [u0: number, v0: number, u1: number, v1: number];

export type AmbientSpec =
  /** snow blown off a ridge: born along the crest (a line of points), carried off downwind, gone in a few seconds */
  | { kind: 'spindrift'; count: number; ridge: readonly Point[] }
  /** rain falling at a slight slant */
  | { kind: 'rain'; count: number }
  /** sparks rising from one or more fires */
  | { kind: 'embers'; count: number; at: readonly Point[]; rgb: string }
  /** dust in light, inside a box of the photo */
  | { kind: 'motes'; count: number; box: Box; rgb: string };

/** never more than this many moving things, whatever a spec asks for */
export const MAX_PARTICLES = 60;
