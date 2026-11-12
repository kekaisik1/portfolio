/** What the one small living detail of a world is. Points and boxes are in the landscape photo, 0..1 each way. */

export type Point = readonly [u: number, v: number];
export type Box = readonly [u0: number, v0: number, u1: number, v1: number];

export type AmbientSpec =
  /** snow blown sideways off a ridge */
  | { kind: 'drift'; count: number }
  /** rain falling at a slight slant */
  | { kind: 'rain'; count: number }
  /** sparks rising from a fire */
  | { kind: 'embers'; count: number; at: Point; rgb: string }
  /** dust in light, inside a box of the photo */
  | { kind: 'motes'; count: number; box: Box; rgb: string }
  /** a soft light that slowly brightens and dims; radius is a share of the photo's height */
  | { kind: 'glow'; at: Point; rgb: string; radius: number; low: number; high: number; period: number }
  /** a few big soft banks of fog sliding past */
  | { kind: 'fog'; count: number; rgb: string; alpha: number };

/** never more than this many moving things, whatever a spec asks for */
export const MAX_PARTICLES = 60;
