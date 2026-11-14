/**
 * The painting reacts: in every place one object answers a press for a second or two (the booth's light flickers,
 * the brazier flares, the dragon's gold throws sparks). Unlabelled and quiet: no hover, nothing that follows the
 * cursor, nothing at all with the motion switched off. Each reaction is data built from three plain effects:
 *
 * - flare: a soft round light at a point, coming and going with opacity and scale only (a flicker, if asked);
 * - burst: a handful of the place's own particles from a point (src/ambient/), rising, falling, drifting or
 *   sparkling;
 * - streak: one shooting star from a point to a point (the observatory).
 *
 * Points are in the landscape painting's 0..1 coordinates, sizes in picture heights, like spots (spots.ts). The
 * name a screen reader hears is the place's `react` in src/content/places.ts. Pure, so it is unit-tested.
 */
import type { Point as PicturePoint } from '../ambient/spec';
import type { Look } from './looks';
import { fitOf, spotPoint, type Rect } from './spots';

export type BurstStyle = 'rise' | 'fall' | 'drift' | 'sparkle';

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
  /** a light that stutters on and off instead of swelling once */
  flicker?: boolean;
}

export interface Reaction {
  /** the object: its middle, and the size of the place to press, in picture heights (never under 44 px) */
  u: number;
  v: number;
  w: number;
  h: number;
  flare?: Flare;
  burst?: Burst;
  streak?: { from: PicturePoint; to: PicturePoint };
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
  /* the lamp in the booth's roof flickers */
  'front-desk': {
    u: 0.677,
    v: 0.538,
    w: 0.1,
    h: 0.06,
    flare: { at: [0.677, 0.56], size: 0.36, rgb: '255,206,130', flicker: true },
  },
  /* the bright star over the dome, and a shooting star across the sky */
  'numbers-room': {
    u: 0.68,
    v: 0.076,
    w: 0.07,
    h: 0.07,
    flare: { at: [0.68, 0.076], size: 0.08, rgb: '255,255,255' },
    streak: { from: [0.88, 0.04], to: [0.6, 0.2] },
  },
  /* the lamp hanging in the shop warms the doorway */
  lowl: {
    u: 0.615,
    v: 0.56,
    w: 0.14,
    h: 0.1,
    flare: { at: [0.61, 0.6], size: 0.46, rgb: '255,205,130' },
  },
  /* the gold right of the party throws sparks */
  emberquill: {
    u: 0.74,
    v: 0.62,
    w: 0.16,
    h: 0.08,
    flare: { at: [0.74, 0.61], size: 0.24, rgb: '255,214,120' },
    burst: { at: [0.74, 0.6], style: 'rise', count: 24, spread: 0.05, rgb: '255,240,190' },
  },
  /* the bronze brazier flares */
  'history-lens': {
    u: 0.925,
    v: 0.7,
    w: 0.11,
    h: 0.15,
    flare: { at: [0.925, 0.66], size: 0.3, rgb: '255,176,90' },
    burst: { at: [0.925, 0.64], style: 'rise', count: 18, spread: 0.02, rgb: '255,226,160' },
  },
  /* the waterfall off the book sparkles */
  bookforge: {
    u: 0.815,
    v: 0.82,
    w: 0.1,
    h: 0.24,
    burst: { at: [0.815, 0.8], style: 'sparkle', count: 26, spread: 0.08, rgb: '255,255,255' },
  },
  /* the small lantern down the street glows, and petals fall from the tree over it */
  'kana-notebook': {
    u: 0.549,
    v: 0.66,
    w: 0.06,
    h: 0.08,
    flare: { at: [0.549, 0.66], size: 0.2, rgb: '255,190,110' },
    burst: { at: [0.55, 0.5], style: 'fall', count: 18, spread: 0.07, rgb: '255,196,214' },
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
  const at = spotPoint(r, look, box, upright);
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
