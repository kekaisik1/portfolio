/**
 * What moves inside a photograph. Everything is authored by looking at the picture: points are in the landscape
 * photo (u across, v down, 0..1 each), lengths (feather, radius) are in photo heights, so a circle stays round.
 * The upright crop on phones uses the same data: the page maps it across (src/worlds/cover.ts).
 */
import type { Point } from '../ambient/spec';

/** a move in the landscape photo's own coordinates: (0.03, 0) = three percent of its width to the right */
export type Vec = readonly [du: number, dv: number];
export type Rgb = readonly [r: number, g: number, b: number];

export type Shape =
  | { kind: 'poly'; points: readonly Point[] }
  /** radii in photo heights */
  | { kind: 'ellipse'; at: Point; rx: number; ry: number };

/** A linear change of strength across a region: `a` at `from`, `b` at `to` (clouds near the horizon move less). */
export interface Ramp {
  from: Point;
  to: Point;
  a: number;
  b: number;
}

/** A soft-edged part of the photo. It never reaches outside its shape: the edge fades inwards over `feather`. */
export interface Region {
  shape: Shape;
  feather: number;
  /** things inside the shape that must stay still (a rock in the surf): cut out, with the same soft edge */
  minus?: readonly Shape[];
  ramp?: Ramp;
}

/** Pixels carried along `dir` once per cycle (the two-phase flow trick): clouds, water, flame. */
export interface Flow extends Region {
  dir: Vec;
}
/** Pixels rocked back and forth by up to `dir`, as a wave travelling through the region: grass, fronds, a lantern. */
export interface Sway extends Region {
  dir: Vec;
}
/** A region with a strength 0..1: where mist may drift, where reflections shimmer, where stars twinkle. */
export interface Field extends Region {
  amount: number;
}

/** A light whose brightness changes: the photo's own pixels get brighter and darker around `at`. */
export interface Light {
  at: Point;
  radius: number;
  /** the largest change of brightness, as a share: 0.2 = up to 20% brighter or darker at the centre */
  amount: number;
  /** how fast, in radians a second: about 7 for a torch, about 1 for a lamp that breathes */
  speed: number;
  /** lights with the same seed and speed change together (a lamp and its reflection) */
  seed: number;
  kind: 'flicker' | 'breathe';
}

export interface Scene {
  /** seconds a flow takes to carry a pixel along its `dir` */
  cycle: number;
  flow?: readonly Flow[];
  sway?: {
    regions: readonly Sway[];
    /** radians a second */ rate: number;
    /** how tightly the wave is packed */ wave: Vec;
  };
  /** soft fog added over the photo, drifting: `drift` is in photo widths a second, `scale` its grain */
  mist?: { regions: readonly Field[]; rgb: Rgb; drift: Vec; scale: number };
  /** small restless distortion, for wet stone and water: `size` is the largest move, in photo widths */
  shimmer?: { regions: readonly Field[]; size: number; speed: number };
  /** the photo's own stars brighten and dim */
  stars?: readonly Field[];
  lights?: readonly Light[];
}

/** never more lights than the shader has room for */
export const MAX_LIGHTS = 6;
