/**
 * The painting reacts: in the three places that are not projects (the summit, the road, the campfire) one object
 * answers a press for a second or two: snow blown off the summit, seeds off the grass, the fire flaring. The project
 * places are toys instead (toys.ts). Unlabelled and quiet: no hover, nothing that follows the cursor, nothing at all
 * with the motion switched off. Each reaction is data built from two plain effects:
 *
 * - flare: a soft round light at a point, coming and going with opacity and scale only;
 * - burst: a handful of the place's own particles from a point (src/ambient/), rising, falling or drifting.
 *
 * Points are in the landscape painting's 0..1 coordinates, sizes in picture heights (picture.ts). The name a screen
 * reader hears is the place's `react` in src/content/places.ts. Pure, so it is unit-tested.
 */
import type { Point as PicturePoint } from '../ambient/spec';
import type { Look } from './looks';
import { fitOf, picturePoint, type Rect } from './picture';

export type BurstStyle = 'rise' | 'fall' | 'drift';

export interface Burst {
  at: PicturePoint;
  style: BurstStyle;
  count: number;
  /** how far from `at` they start, in picture heights */
  spread: number;
  rgb: string;
  /** drift: which way across the picture (1 = to the right) */
  dir?: 1 | -1;
}

export interface Flare {
  at: PicturePoint;
  /** across, in picture heights */
  size: number;
  rgb: string;
}

export interface Reaction {
  /** the object: its middle, and the size of the place to press, in picture heights (never under 44 px) */
  u: number;
  v: number;
  w: number;
  h: number;
  flare?: Flare;
  burst?: Burst;
}

/** the smallest place to press, in CSS pixels */
export const MIN_HIT_PX = 44;
/** never more particles from one press than this */
export const MAX_BURST = 30;

export const REACTIONS: Readonly<Record<string, Reaction>> = {
  /* the summit: snow blown off the top, the way the painted plume goes (to the left) */
  hello: {
    u: 0.695,
    v: 0.34,
    w: 0.1,
    h: 0.08,
    burst: { at: [0.695, 0.325], style: 'drift', count: 26, spread: 0.025, rgb: '255,255,255', dir: -1 },
  },
  /* seeds blown off the grass, the way it leans */
  about: {
    u: 0.8,
    v: 0.72,
    w: 0.2,
    h: 0.12,
    burst: { at: [0.8, 0.68], style: 'drift', count: 22, spread: 0.06, rgb: '255,238,196', dir: 1 },
  },
  /* the campfire flares and throws sparks */
  contact: {
    u: 0.585,
    v: 0.69,
    w: 0.1,
    h: 0.1,
    flare: { at: [0.585, 0.67], size: 0.34, rgb: '255,170,80' },
    burst: { at: [0.585, 0.65], style: 'rise', count: 24, spread: 0.02, rgb: '255,190,110' },
  },
};

/** A world's reaction, or null when it has none. */
export const reactionOf = (id: string): Reaction | null => (Object.hasOwn(REACTIONS, id) ? REACTIONS[id] : null);

/**
 * Where the place to press lands in a box the painting covers: over the object, at least 44 px each way, and cut
 * back to stay `inset` pixels inside the box where the object runs off its edge. Null when the object's middle is
 * cut off, or too little of it is left to press.
 */
export function reactionRect(
  r: Reaction,
  look: Look,
  box: { width: number; height: number },
  upright: boolean,
  inset = 0,
): Rect | null {
  const at = picturePoint(r, look, box, upright);
  if (!at) return null;
  const fit = fitOf(look, box, upright);
  const w = Math.max(MIN_HIT_PX, r.w * fit.height);
  const h = Math.max(MIN_HIT_PX, r.h * fit.height);
  const rect = {
    left: Math.max(inset, at.x - w / 2),
    top: Math.max(inset, at.y - h / 2),
    right: Math.min(box.width - inset, at.x + w / 2),
    bottom: Math.min(box.height - inset, at.y + h / 2),
  };
  return rect.right - rect.left >= MIN_HIT_PX && rect.bottom - rect.top >= MIN_HIT_PX ? rect : null;
}

/** A size in picture heights, in CSS pixels, for this box. */
export const pictureLength = (
  n: number,
  look: Look,
  box: { width: number; height: number },
  upright: boolean,
): number => n * fitOf(look, box, upright).height;
