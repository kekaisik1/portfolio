/** Shared by the place drawings: how a place is declared, and the odd prop more than one of them uses. */
import { box } from '../world/draw/pencil';
import type { Box4, PlaceDef, PlaceSpec, Sketch } from '../world/types';

/** heights of the abacus rods on the Numbers Room roof (the drawing and its moving beads both need them) */
export const RODS = [-256, -278, -300, -322];

/**
 * Finish a place's declaration: apply its vertical squash to the boxes that were written unsquashed,
 * and work out the sheet it is drawn on (everything drawn, and never smaller than what can be pressed).
 */
export function definePlace(spec: PlaceSpec): PlaceDef {
  const sy = spec.sy ?? 1;
  if (sy !== 1) {
    for (const a of [spec.hit, spec.ext]) {
      a[1] *= sy;
      a[3] *= sy;
    }
    spec.capAt[1] *= sy;
    if (spec.wire) spec.wire[1] *= sy;
  }
  const E = spec.ext,
    h = spec.hit;
  const full: Box4 = [
    Math.min(E[0], h[0] - 10),
    Math.min(E[1], h[1] - 10),
    Math.max(E[2], h[2] + 10),
    Math.max(E[3], h[3] + 10),
  ];
  return Object.assign(spec, { full });
}

/** a book lying flat, big enough to build on */
export const bigBook = (s: Sketch, x0: number, x1: number, y: number, th: number, c: string): void => {
  s.poly(box(x0, y - th, x1 - x0, th), { fill: c, fa: 0.95, w: 1.5 });
  s.fill(box(x1 - 20, y - th + 4, 20, th - 8), 'paper');
  const pg: number[] = [];
  for (let yy = y - th + 7; yy < y - 5; yy += 3.2) pg.push(x1 - 19, yy, x1 - 1, yy + (s.rnd() - 0.5));
  s.segs(pg, { w: 0.6, a: 0.5 });
  s.segs(
    [
      x0 + 18,
      y - th + 1,
      x0 + 18,
      y - 1,
      x0 + 25,
      y - th + 1,
      x0 + 25,
      y - 1,
      x1 - 46,
      y - th + 1,
      x1 - 46,
      y - 1,
      x1 - 39,
      y - th + 1,
      x1 - 39,
      y - 1,
    ],
    { w: 1, a: 0.55 },
  );
  s.hatch(x0 + 2, y - 10, x1 - 22, y - 1, 6, { a: 0.22, k: 0.5 }).hatch(
    x0 + (x1 - x0) * 0.7,
    y - th + 3,
    x1 - 22,
    y - 3,
    7,
    { a: 0.16 },
  );
};
