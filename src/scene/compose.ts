/**
 * The finished paintings you see inside a place: pieces first on the walk, then the whole place in one picture.
 * Each country is composed once on a 1600 x 1000 stage; `layoutPainting` fits that stage to the screen so the
 * place's own object lands in the free part of it (right of the paper on wide screens, the top band on phones),
 * with the sky used and nothing that matters under the paper. Pure: the drawing is in inside/painting.ts.
 */
import type { ZoneId } from '../content/types';
import type { Kind } from '../paint/kinds';

/** [kind, x of its ground point, y of its ground point, height], on the 1600 x 1000 stage */
export type Item = readonly [Kind, number, number, number];

export interface Composition {
  bg: Kind;
  /** the place's own object: ground point and height */
  F: readonly [number, number, number];
  /** the country's other places, smaller and further back (one per other place, in order) */
  alts: readonly (readonly [number, number, number])[];
  /** things behind: far layers (fading at their ends) and the sky */
  far: readonly Item[];
  /** things between the far layers and the object */
  mid: readonly Item[];
  /** near things framing the edge, drawn last */
  near: readonly Item[];
}

export const STAGE = { w: 1600, h: 1000 } as const;

export const COMPOSE: Readonly<Record<Exclude<ZoneId, 'night'>, Composition>> = {
  mountains: {
    bg: 'bgMountains',
    F: [1000, 880, 520],
    alts: [[1330, 700, 250]],
    far: [
      ['clouds', 820, 250, 220],
      ['peaks', 820, 640, 640],
      ['range2', 800, 720, 300],
    ],
    mid: [
      ['meadow', 1180, 975, 170],
      ['rock', 640, 965, 150],
      ['walker', 1360, 905, 130],
    ],
    near: [
      ['spruce1', 1590, 1070, 900],
      ['meadow', 820, 1078, 240],
    ],
  },
  steppe: {
    bg: 'bgSteppe',
    F: [1000, 890, 560],
    alts: [[1330, 712, 280]],
    far: [
      ['clouds', 820, 260, 240],
      ['hills', 900, 470, 300],
      ['hills', 800, 620, 340],
    ],
    mid: [
      ['poles', 560, 720, 300],
      ['elm', 1500, 840, 520],
      ['horses', 1300, 905, 170],
    ],
    near: [
      ['grass', 1570, 1070, 330],
      ['grass', 720, 1082, 240],
    ],
  },
  sea: {
    bg: 'bgSea',
    F: [1000, 870, 440],
    alts: [
      [1330, 700, 300],
      [700, 712, 190],
    ],
    far: [
      ['clouds', 820, 230, 200],
      ['water', 800, 700, 340],
      ['gulls', 1060, 330, 110],
    ],
    mid: [['nets', 1290, 900, 190]],
    near: [
      ['reeds', 1585, 1070, 480],
      ['reeds', 700, 1082, 260],
    ],
  },
};

export interface PaintingFrame {
  /** stage -> canvas: x' = dx + x * s, y' = dy + y * s */
  s: number;
  dx: number;
  dy: number;
  /** the painted area on the canvas (on phones only the top band is painted) */
  w: number;
  h: number;
}

/**
 * Fit the stage to a canvas of w x h. Wide screens: the paper column covers the left `paperW` px, the painting
 * runs full bleed behind it, and the object stands in the middle of what is left. Phones: the painting is the
 * top `band` share of the screen, and the object stands a little right of centre near the bottom of the band.
 */
export function layoutPainting(
  c: Composition,
  w: number,
  h: number,
  phone: boolean,
  paperW: number,
  band: number,
): PaintingFrame {
  const [fx, fy, fh] = c.F;
  if (phone) {
    const bh = h * band,
      s = (bh * 0.6) / fh;
    return { s, dx: w * 0.54 - fx * s, dy: bh * 0.93 - fy * s, w, h: bh };
  }
  const s = (h * 0.55) / fh,
    free = (paperW + w) / 2;
  return { s, dx: free - fx * s, dy: h * 0.93 - fy * s, w, h };
}

/** The box an item covers on the canvas, given its painting's own size (for tests: what is hidden by the paper). */
export function itemBox(
  f: PaintingFrame,
  x: number,
  y: number,
  height: number,
  size: { w: number; h: number },
  anchorY = 0.92,
): { left: number; top: number; w: number; h: number } {
  const ph = height * f.s,
    pw = (ph * size.w) / size.h;
  return { left: f.dx + x * f.s - pw / 2, top: f.dy + y * f.s - ph * anchorY, w: pw, h: ph };
}
