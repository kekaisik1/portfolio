/**
 * Spots: one thing to open inside a painting (the lantern in Kyoto, the die in the dragon's hall). A spot is a small
 * dot with a label, standing on an object of the painting; pressing it opens the project's video. Where it stands is
 * data, in the landscape painting's own coordinates; this module says where that lands on screen, for the
 * landscape picture and for the upright crop, with the same cover maths as the paintings (cover.ts). Its words (the
 * label) are the project's `spot` in src/content/projects.ts. Pure, so it is unit-tested.
 */
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE } from './cover';
import type { Look } from './looks';

export interface Spot {
  /** where the object is in the landscape painting, 0..1 across (u) and down (v): read off a 10x10 grid over it */
  u: number;
  v: number;
  /** which side of the dot its label stands: the side where the label covers the least of the object */
  side: 'left' | 'right';
  /** what pressing it opens: the project's video (public/videos/<slug>.mp4) */
  opens: 'video';
}

export const SPOTS: Readonly<Record<string, Spot>> = {
  /* the big paper lantern on the right of the street; the label over the dark wood and curtain left of it */
  'kana-notebook': { u: 0.875, v: 0.42, side: 'left', opens: 'video' },
  /* the red twenty-sided die at the foot of the painting; the label over the grey rock right of it */
  emberquill: { u: 0.455, v: 0.84, side: 'right', opens: 'video' },
};

/** A world's spot, or null when it has none. */
export const spotOf = (id: string): Spot | null => (Object.hasOwn(SPOTS, id) ? SPOTS[id] : null);

export interface Point {
  x: number;
  y: number;
}

/**
 * Where a spot lands in a box the painting covers (the stage, in CSS pixels): the landscape picture at its look's
 * `x`, or the upright crop cut around its look's `focus` and centred. Null when the object is cut off.
 */
export function spotPoint(
  spot: Spot,
  look: Look,
  box: { width: number; height: number },
  upright: boolean,
): Point | null {
  const u = upright ? tallU(spot.u, look.focus) : spot.u;
  if (u < 0 || u > 1) return null;
  const aspect = upright ? TALL_SIZE.w / TALL_SIZE.h : WIDE_SIZE.w / WIDE_SIZE.h;
  const fit = coverFit(box.width, box.height, aspect, upright ? 0.5 : look.x / 100);
  const x = placeX(fit, u);
  const y = placeY(fit, spot.v);
  if (x < 0 || x > box.width || y < 0 || y > box.height) return null;
  return { x, y };
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Do two rectangles come closer than `gap` pixels? */
export const crowds = (a: Rect, b: Rect, gap = 0): boolean =>
  a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom + gap && b.top < a.bottom + gap;

/** Is `inner` wholly inside `outer`, at least `gap` pixels from every edge? */
export const within = (inner: Rect, outer: Rect, gap = 0): boolean =>
  inner.left >= outer.left + gap &&
  inner.top >= outer.top + gap &&
  inner.right <= outer.right - gap &&
  inner.bottom <= outer.bottom - gap;
