/** Graphite on paper plus one wash that travels: every colour is a blend along the journey 0 mountains, 1 steppe, 2 sea, 3 night. */
import { clamp } from '../lib/math';
import type { Pal } from './types';

export type RGB = readonly number[];

export const hex = (h: string): RGB => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const css = (c: RGB, al = 1): string => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;

/** The colour at place coordinate P (0..3) from four stops. */
export function stop(arr: readonly RGB[], P: number): RGB {
  P = clamp(P, 0, 3);
  const k = Math.min(2, Math.floor(P));
  return mix(arr[k], arr[k + 1], P - k);
}
/** The same for three stops (the daylight glow has no night stop). */
export const stop3 = (arr: readonly RGB[], P: number): RGB => {
  P = clamp(P, 0, 2);
  const k = Math.min(1, Math.floor(P));
  return mix(arr[k], arr[k + 1], P - k);
};
/** How much of country k there is at P: 1 in its middle, 0 a whole country away. */
export const wt = (P: number, k: number): number => Math.max(0, 1 - Math.abs(P - k));

export const PAPER = ['#F2F1EC', '#F6EEDD', '#F3EEE6', '#1E2148'].map(hex);
export const WASH = ['#8EA7C2', '#D3A650', '#4E9A9A', '#4A5199'].map(hex);
export const NEARWASH = ['#8EA7C2', '#D3A650', '#CFA25A', '#3B4180'].map(hex);
export const INK = ['#2B2D33', '#2B2D33', '#2B2D33', '#E8E6F0'].map(hex);
export const SKYTOP: RGB[] = [
  mix(PAPER[0], WASH[0], 0.32),
  mix(PAPER[1], hex('#B5CAD6'), 0.3),
  mix(PAPER[2], hex('#A9A2C4'), 0.36),
  hex('#14173B'),
];
/* the light low in the sky: a peach morning in the mountains, gold over the steppe, rose at the sea */
export const GLOW: RGB[] = [
  [255, 222, 200],
  [250, 206, 132],
  [246, 172, 146],
];
export const GLOWA = [0.34, 0.52, 0.5];
export const CHALK = hex('#E8E6F0');

/** Every place is inked in the colours of the country it stands in, with a little red and yellow of its own. */
export function palFor(P: number): Pal {
  const paper = stop(PAPER, P),
    nw = stop(NEARWASH, P),
    ink0 = stop(INK, P),
    ink = mix(ink0, [14, 15, 20], 0.45),
    sky = mix(stop(SKYTOP, P), [255, 253, 247], 0.4);
  return {
    ink: css(ink),
    paper: css(mix(paper, [255, 254, 249], 0.55)),
    fill: css(mix(paper, nw, 0.15)),
    wash: css(mix(paper, nw, 0.52)),
    dark: css(mix(nw, ink, 0.5)),
    deep: css(mix(ink, nw, 0.14)),
    blue: css(mix(paper, hex('#8EA7C2'), 0.6)),
    glass: css(mix(paper, hex('#6F8AA6'), 0.42)),
    gold: css(mix(paper, hex('#D9A23F'), 0.62)),
    flag: css(mix(paper, hex('#E3B341'), 0.88)),
    red: '#B8492F',
    redLit: css(mix(hex('#B8492F'), paper, 0.3)),
    lensFill: css(mix(paper, hex('#F2DDA8'), 0.62)),
    paperLit: css(mix(paper, hex('#F7D58A'), 0.62)),
    water: css(mix(hex('#6F8AA6'), ink, 0.25)),
    leaf: css(mix(paper, hex('#7FA98A'), 0.7)),
    sky: css(sky),
    back: css(mix(paper, sky, 0.45), 0.9),
    ground: css(mix(paper, nw, 0.5), 0.96),
    focus: '#1B5A85',
    warm: '255,206,110',
  };
}
