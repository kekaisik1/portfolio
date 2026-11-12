/**
 * Where a place's label goes: beside its object, on the clearest paper. For a stop at rest, a handful of spots
 * around the object are scored by how much painted surface (of every piece in view) the label and its paper halo
 * would cover, plus how far from the object they are; spots off screen, over the words or in the horizon band are
 * ruled out. The answer is kept relative to the object's box, so the label travels with it. Pure.
 */
import type { Box } from './camera';

/** occupancy grids are OG x OG cells over a painting: 1 where it has paint */
export const OG = 40;

export interface Occupancy {
  grid: Uint8Array;
  /** the painted part of the painting, as shares of its box: [x0, y0, x1, y1] */
  bb: readonly [number, number, number, number];
}

export interface Obstacle {
  box: Box;
  occ: Occupancy;
  /** how much covering this piece costs (its own object most, far layers least) */
  weight: number;
}

export interface LabelSpace {
  W: number;
  H: number;
  /** keep the label below this (the top line) and above this (the horizon band) */
  top: number;
  bottom: number;
  /** keep this far from the sides of the screen */
  edge: number;
  /** the words column on screen: never cover it */
  words: { left: number; top: number; right: number; bottom: number };
}

/** a little room around the label's box (its paper patch is inside the box) */
const HALO = { l: 4, t: 4, r: 4, b: 4 };

/** Painted area (px²) of one obstacle inside a screen rectangle. */
export function coverage(o: Obstacle, r: readonly [number, number, number, number]): number {
  const b = o.box,
    cw = b.w / OG,
    ch = b.h / OG;
  const gx0 = Math.max(0, Math.floor((r[0] - b.left) / cw)),
    gx1 = Math.min(OG - 1, Math.floor((r[2] - b.left) / cw));
  const gy0 = Math.max(0, Math.floor((r[1] - b.top) / ch)),
    gy1 = Math.min(OG - 1, Math.floor((r[3] - b.top) / ch));
  if (gx1 < gx0 || gy1 < gy0) return 0;
  let n = 0;
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) n += o.occ.grid[gy * OG + gx];
  return n * cw * ch;
}

/** Painted area (px²) of a whole obstacle. */
export const paintedArea = (o: Obstacle): number =>
  coverage(o, [o.box.left, o.box.top, o.box.left + o.box.w, o.box.top + o.box.h]);

/**
 * Covering a share of something small (a figure, a horse's head) is as bad as covering a lot of something big:
 * this much score per whole object covered, on top of the area covered.
 */
const SHARE_COST = 60000;

/**
 * The best spot for a label of lw x lh beside `self` (one of the obstacles), as {fx, fy}: the label's top-left
 * corner in shares of self's box. null when nothing fits on screen at all.
 */
export function planLabel(
  self: Obstacle,
  others: readonly Obstacle[],
  lw: number,
  lh: number,
  sp: LabelSpace,
): { fx: number; fy: number } | null {
  const b = self.box,
    ob = self.occ.bb;
  const px0 = b.left + ob[0] * b.w,
    py0 = b.top + ob[1] * b.h,
    px1 = b.left + ob[2] * b.w,
    py1 = b.top + ob[3] * b.h,
    pcx = (px0 + px1) / 2,
    ph = py1 - py0;
  const C: [number, number][] = [];
  for (const f of [0.04, 0.2, 0.38]) {
    C.push([px1 + 6, py0 + ph * f]);
    C.push([px0 - lw - 6, py0 + ph * f]);
  }
  for (const f of [0.15, 0.45, 0.75]) C.push([pcx - lw * f, py0 - lh - 4]);
  /* under it, and centred over and under it (the only room on a narrow phone) */
  for (const f of [0.2, 0.5, 0.55]) C.push([pcx - lw * f, py1 + 2]);
  C.push([pcx - lw * 0.5, py0 - lh - 4]);
  const w = sp.words,
    areas = new Map<Obstacle, number>([self, ...others].map((o) => [o, paintedArea(o)]));
  let best: [number, number] | null = null,
    bs = Infinity;
  for (const [x, y] of C) {
    const r: [number, number, number, number] = [x - HALO.l, y - HALO.t, x + lw + HALO.r, y + lh + HALO.b];
    let sc = 0;
    if (r[0] < sp.edge || r[2] > sp.W - sp.edge || y < sp.top || y + lh > sp.bottom) sc += 1e7;
    if (!(r[2] < w.left - 16 || r[0] > w.right + 16 || r[3] < w.top - 12 || r[1] > w.bottom + 12)) sc += 1e7;
    const cost = (o: Obstacle): number => {
      const c = coverage(o, r);
      if (!c) return 0;
      return c * o.weight + (o.weight > 1 ? (c / Math.max(1, areas.get(o) ?? 1)) * SHARE_COST : 0);
    };
    sc += cost(self);
    for (const o of others) sc += cost(o);
    const dx = Math.max(px0 - (x + lw), 0, x - px1),
      dy = Math.max(py0 - (y + lh), 0, y - py1);
    sc += Math.hypot(dx, dy) * 14;
    if (sc < bs) {
      bs = sc;
      best = [x, y];
    }
  }
  return best && bs < 1e7 ? { fx: (best[0] - b.left) / b.w, fy: (best[1] - b.top) / b.h } : null;
}
