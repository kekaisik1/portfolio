/**
 * How each world is shown: where its words stand so they never cover the photo's subject (chosen by looking at each
 * photograph), which part of the photo stays in view, and the small things in its air (snow, rain, sparks, dust).
 * What moves inside the photograph itself is src/living/scenes.ts. No text here: that is src/content/.
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
  /** the particles in the air over the photo; null = none */
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
    ambient: {
      kind: 'spindrift',
      count: 40,
      ridge: [
        [0.58, 0.275],
        [0.66, 0.262],
        [0.7, 0.245],
        [0.79, 0.178],
        [0.87, 0.24],
      ],
    },
  },
  /* the dusk sky top left; the lit booth, the road and the peak behind it stay clear */
  'front-desk': { at: 'tl', width: 29, shade: 0.5, x: 70, atTall: 'top', focus: 0.66, ambient: null },
  /* the starry sky left of the dome; the dome and the cloud sea stay clear */
  'numbers-room': { at: 'tl', width: 30, shade: 0.42, x: 22, atTall: 'top', focus: 0.66, ambient: null },
  /* the shaded road bottom left; the open shop, its machines and the mountains stay clear */
  lowl: {
    at: 'bl',
    width: 27,
    shade: 0.62,
    x: 80,
    atTall: 'top',
    focus: 0.68,
    ambient: { kind: 'motes', count: 26, box: [0.36, 0.44, 0.9, 0.86], rgb: '255,236,190' },
  },
  /* the storm sky top left; the castle, its torches and the path fill the rest */
  emberquill: {
    at: 'tl',
    width: 27,
    shade: 0.4,
    x: 74,
    atTall: 'bottom',
    focus: 0.68,
    ambient: {
      kind: 'embers',
      count: 22,
      at: [
        [0.657, 0.425],
        [0.772, 0.425],
      ],
      rgb: '255,176,96',
    },
  },
  /* the wet cobbles bottom left; the pump and the gas lamp stand right */
  'history-lens': { at: 'bl', width: 31, shade: 0.46, x: 86, atTall: 'bottom', focus: 0.74, ambient: null },
  /* the dusk sky top left, clear of the beam; the lighthouse and the surf stay untouched */
  bookforge: { at: 'tl', width: 24, shade: 0.42, x: 10, atTall: 'bottom', focus: 0.62, ambient: null },
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
  /* the open sky; the road, the yurt and the mountains stay whole */
  about: { at: 'tl', width: 33, shade: 0.56, x: 66, atTall: 'top', focus: 0.7, ambient: null },
  /* the dark sky top left; the fire and the chairs are low, the Milky Way right */
  contact: {
    at: 'tl',
    width: 30,
    shade: 0.4,
    x: 76,
    atTall: 'top',
    focus: 0.63,
    ambient: { kind: 'embers', count: 34, at: [[0.63, 0.6]], rgb: '255,190,110' },
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
