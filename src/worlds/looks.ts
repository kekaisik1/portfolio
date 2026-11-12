/**
 * How each world is shown: where its words stand so they never cover the photo's subject (chosen by looking at each
 * photograph), which part of the photo stays in view, and its one living detail. No text here: that is src/content/.
 */
import type { AmbientSpec } from '../ambient/spec';

export interface Look {
  /** wide screens: the corner of the photo the words stand in */
  at: 'tl' | 'bl';
  /** wide screens: the widest the words may be, in rem */
  width: number;
  /** wide screens: how dark the local shade behind the words is, 0..1: as light as the photo allows at AA contrast */
  shade: number;
  /** object-position across the landscape photo, 0..100: which side survives when the screen is narrower than 3:2 */
  x: number;
  /** phones: do the words stand above or below the subject */
  atTall: 'top' | 'bottom';
  /** where the subject is across the landscape photo, 0..1: the upright crop is cut around it */
  focus: number;
  /** null = a still place */
  ambient: AmbientSpec | null;
}

export const LOOKS: Readonly<Record<string, Look>> = {
  /* sky top left is clear; the summit, the ridge and its footprints stay untouched */
  hello: {
    at: 'tl',
    width: 40,
    shade: 0.6,
    x: 62,
    atTall: 'bottom',
    focus: 0.62,
    ambient: { kind: 'drift', count: 48 },
  },
  /* the bare wall left of the window; the phone, the notebook and the plant stay clear */
  'front-desk': {
    at: 'tl',
    width: 29,
    shade: 0.66,
    x: 40,
    atTall: 'bottom',
    focus: 0.68,
    ambient: { kind: 'glow', at: [0.705, 0.475], rgb: '170,215,255', radius: 0.11, low: 0.05, high: 0.26, period: 4.2 },
  },
  /* the dark stacks top left; the lamp and the ledger are right */
  'numbers-room': {
    at: 'tl',
    width: 35,
    shade: 0.44,
    x: 14,
    atTall: 'bottom',
    focus: 0.68,
    ambient: { kind: 'motes', count: 18, box: [0.45, 0.28, 0.95, 0.72], rgb: '255,214,150' },
  },
  /* the concrete floor bottom left; the open machine is right, the sunlit door behind */
  lowl: {
    at: 'bl',
    width: 27,
    shade: 0.76,
    x: 84,
    atTall: 'bottom',
    focus: 0.73,
    ambient: { kind: 'motes', count: 34, box: [0.2, 0.15, 0.62, 0.9], rgb: '255,244,214' },
  },
  /* the dark beams top left; fire, miniatures and map fill the rest */
  emberquill: {
    at: 'tl',
    width: 27,
    shade: 0.44,
    x: 74,
    atTall: 'bottom',
    focus: 0.68,
    ambient: { kind: 'embers', count: 26, at: [0.71, 0.27], rgb: '255,176,96' },
  },
  /* the wet cobbles bottom left; the pump and the gas lamp stand right */
  'history-lens': {
    at: 'bl',
    width: 31,
    shade: 0.46,
    x: 86,
    atTall: 'bottom',
    focus: 0.74,
    ambient: { kind: 'fog', count: 3, rgb: '206,210,214', alpha: 0.11 },
  },
  /* the bare stone wall left of the window */
  bookforge: {
    at: 'tl',
    width: 24,
    shade: 0.46,
    x: 12,
    atTall: 'top',
    focus: 0.64,
    ambient: {
      kind: 'glow',
      at: [0.672, 0.435],
      rgb: '255,244,210',
      radius: 0.2,
      low: 0.02,
      high: 0.34,
      period: 7,
    },
  },
  /* the dark fence bottom left; lanterns, noren and the wet street are right */
  'kana-notebook': {
    at: 'bl',
    width: 25,
    shade: 0.48,
    x: 78,
    atTall: 'bottom',
    focus: 0.8,
    ambient: { kind: 'rain', count: 56 },
  },
  /* the open sky; the road, the yurt and the mountains stay whole. A still place. */
  about: { at: 'tl', width: 33, shade: 0.56, x: 66, atTall: 'top', focus: 0.7, ambient: null },
  /* the dark sky top left; the fire and the chairs are low, the Milky Way right */
  contact: {
    at: 'tl',
    width: 30,
    shade: 0.4,
    x: 76,
    atTall: 'top',
    focus: 0.63,
    ambient: { kind: 'embers', count: 34, at: [0.63, 0.6], rgb: '255,190,110' },
  },
};

/** The look of a world; a world without one is a build mistake. */
export function lookOf(id: string): Look {
  if (!Object.hasOwn(LOOKS, id))
    throw new Error(`No look for the world "${id}": add one to LOOKS in src/worlds/looks.ts.`);
  return LOOKS[id];
}

/** Address of a world's photograph under whatever base the site is served from. */
export const photoUrl = (id: string, upright: boolean, base: string = import.meta.env.BASE_URL): string =>
  `${base}worlds/${id}${upright ? '-m' : ''}.webp`;
