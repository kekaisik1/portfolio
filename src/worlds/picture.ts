/**
 * Where a point of a painting lands on screen, and whether something placed there crowds the rest. Points are in
 * the landscape painting's own 0..1 coordinates (u across, v down); this says where they land for the landscape
 * picture and for the upright crop, with the same cover maths as the paintings (cover.ts). Used to put the things
 * that answer a press (reactions.ts, toys.ts) and their effects on their objects. Pure, so it is unit-tested.
 */
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE, type Fit } from './cover';
import type { Look } from './looks';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * How the painting covers a box (the stage, in CSS pixels): the landscape picture at its look's `x`, or the upright
 * crop cut around its look's `focus` and centred.
 */
export const fitOf = (look: Look, box: { width: number; height: number }, upright: boolean): Fit => {
  const aspect = upright ? TALL_SIZE.w / TALL_SIZE.h : WIDE_SIZE.w / WIDE_SIZE.h;
  return coverFit(box.width, box.height, aspect, upright ? 0.5 : look.x / 100);
};

/** Where a point of the landscape painting lands in a box the painting covers. Null when it is cut off. */
export function picturePoint(
  at: { u: number; v: number },
  look: Look,
  box: { width: number; height: number },
  upright: boolean,
): Point | null {
  const u = upright ? tallU(at.u, look.focus) : at.u;
  if (u < 0 || u > 1) return null;
  const fit = fitOf(look, box, upright);
  const x = placeX(fit, u);
  const y = placeY(fit, at.v);
  if (x < 0 || x > box.width || y < 0 || y > box.height) return null;
  return { x, y };
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
