/** The geometry and timing of the cut: a few slats of uneven widths that close one after another. Pure. */

export interface Slat {
  /** left edge and width, in whole pixels: the slats tile the frame with no gap and no overlap */
  x: number;
  w: number;
  /** when it starts to close, in ms after the cut begins */
  delay: number;
}

export const SLAT_COUNT = 6;
/** how long one slat takes to close, in three hard steps */
export const SLAT_MS = 120;
/** the whole cut, first slat starting to last slat closed */
export const CUT_MS = 300;

/** relative widths, so no two neighbours match: a board's panels, not a blind's */
const WEIGHTS = [1.7, 0.7, 1.25, 0.55, 1.45, 0.9, 1.1, 0.65];

/**
 * Slats across a frame `width` pixels wide. The closing sweeps from the left edge (the board's edge) at a steady
 * pace, or from the right when `fromRight`; `turn` shifts the pattern of widths so two cuts in a row differ.
 */
export function slatPlan(width: number, turn = 0, fromRight = false, count = SLAT_COUNT): Slat[] {
  const weights = Array.from({ length: count }, (_, i) => WEIGHTS[(i + turn) % WEIGHTS.length]);
  const total = weights.reduce((a, b) => a + b, 0);
  const slats: Slat[] = [];
  let acc = 0;
  let x = 0;
  for (const weight of weights) {
    acc += weight;
    const end = Math.round((acc / total) * width);
    slats.push({ x, w: end - x, delay: 0 });
    x = end;
  }
  const sweep = CUT_MS - SLAT_MS;
  for (const s of slats) {
    const lead = fromRight ? width - (s.x + s.w) : s.x;
    s.delay = width > 0 ? Math.round((lead / width) * sweep) : 0;
  }
  return slats;
}
