/** What the journey keeps between frames, besides the state S: the cut-outs and what layout measured. */
import type { Cut } from './cuts';

export const W = {
  cuts: [] as Cut[],
  /** where each place's label sits, relative to its object's box (planned per screen size) */
  spots: new Map<string, { fx: number; fy: number }>(),
  /** label sizes, measured at layout (frames read no layout) */
  labelSize: new Map<string, { w: number; h: number }>(),
  tagSize: { w: 200, h: 80 },
  /** the centre of each country's word on the horizon bar */
  hx: [] as number[],
};

export const cutOfSlug = (slug: string): Cut | undefined => W.cuts.find((c) => c.def.slug === slug);
export const cutById = (id: string): Cut | undefined => W.cuts.find((c) => c.id === id);
