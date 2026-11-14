/**
 * Spots: things to open inside a painting (the lantern in Kyoto, the die in the dragon's hall). A spot is a small
 * dot with a label, standing on an object of the painting; pressing it opens the project's video or its "try it"
 * panel. A world has at most two, so the painting stays calm. Where they stand is data, in the landscape painting's
 * own coordinates; this module says where that lands on screen, for the landscape picture and for the upright crop,
 * with the same cover maths as the paintings (cover.ts). Their words (the labels) are the project's `spot` in
 * src/content/projects.ts (the video) and its try's `spot` in src/content/tries.ts. Pure, so it is unit-tested.
 */
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE } from './cover';
import type { Look } from './looks';

export interface Spot {
  /** where the object is in the landscape painting, 0..1 across (u) and down (v): read off a 10x10 grid over it */
  u: number;
  v: number;
  /** which side of the dot its label stands: the side where the label covers the least of the object */
  side: 'left' | 'right';
  /** what pressing it opens: the project's video (public/videos/<slug>.mp4) or its try (src/content/tries.ts) */
  opens: 'video' | 'try';
}

/** the most spots one painting may have */
export const MAX_SPOTS = 2;

/** Each world's spots, in the order they are placed: where two would crowd each other, the first one stays. */
export const SPOTS: Readonly<Record<string, readonly Spot[]>> = {
  /* the phone on the wall of the lit booth; the label over the dark pines left of it */
  'front-desk': [{ u: 0.677, v: 0.625, side: 'left', opens: 'try' }],
  /* the brass telescope in the open dome; the label over the evening sky left of it */
  'numbers-room': [{ u: 0.655, v: 0.335, side: 'left', opens: 'try' }],
  /* the washing machine out front; the label over the dark workbench inside the door */
  lowl: [{ u: 0.663, v: 0.77, side: 'left', opens: 'try' }],
  emberquill: [
    /* the red twenty-sided die at the foot of the painting; the label over the grey rock right of it */
    { u: 0.455, v: 0.84, side: 'right', opens: 'try' },
    /* the light on the wizard's staff; the label over the gold right of it */
    { u: 0.548, v: 0.562, side: 'right', opens: 'video' },
  ],
  /* the marble balustrade of the terrace; the label over the balusters right of it */
  'history-lens': [{ u: 0.6, v: 0.83, side: 'right', opens: 'try' }],
  /* the fountain pen standing in the book; the label over the clouds and the city left of it */
  bookforge: [{ u: 0.893, v: 0.36, side: 'left', opens: 'try' }],
  'kana-notebook': [
    /* the big paper lantern on the right of the street; the label over the dark wood and curtain left of it */
    { u: 0.875, v: 0.42, side: 'left', opens: 'video' },
    /* the hanging shop sign with the brush character; the label over the houses down the street */
    { u: 0.776, v: 0.55, side: 'left', opens: 'try' },
  ],
};

/** A world's spots (none: an empty list). */
export const spotsOf = (id: string): readonly Spot[] => (Object.hasOwn(SPOTS, id) ? SPOTS[id] : []);

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
