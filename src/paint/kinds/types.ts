import type { Painter } from '../painter';

/** Wide far layers melt into the paper fog at their ends: how far in from each side (x) and from the bottom (b). */
export interface EdgeFade {
  x: number;
  b: number;
  /** how ragged the melt is */
  n?: number;
}

/** One painting: its own coordinate box, a seed (so it is the same on every visit) and how to paint it. */
export interface PaintDef {
  w: number;
  h: number;
  seed: number;
  fade?: EdgeFade;
  paint(P: Painter): void;
}
export type PaintDefs = Record<string, PaintDef>;
