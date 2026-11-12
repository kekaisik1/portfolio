/** A painting as SVG, from its painter. Pure: no canvas, so it is unit-tested and fingerprinted. */
import { defOf, type PaintKind } from './kinds';
import { Painter } from './painter';

/** The SVG for a painting at q times its own size. Pure (exported for tests). */
export function svgOf(k: PaintKind, q: number): string {
  const def = defOf(k),
    P = new Painter(def.w, def.h, def.seed);
  def.paint(P);
  return P.svg(q);
}
