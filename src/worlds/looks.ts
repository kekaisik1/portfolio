/**
 * How each world is shown: where its words stand so they never cover the photo's subject (chosen by looking at each
 * painting), which part of the picture stays in view, and the small things in its air (snow, sparks, petals, dust).
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
  /* the clear sky top left; the summit, its plume of snow and the footprints up the ridge stay untouched */
  hello: {
    at: 'tl',
    width: 40,
    shade: 0.6,
    x: 62,
    atTall: 'bottom',
    focus: 0.66,
    ambient: {
      kind: 'spindrift',
      count: 40,
      /* the wind comes from the sun's side: the painted plume streams off the top to the left */
      wind: -1,
      ridge: [
        [0.648, 0.35],
        [0.672, 0.33],
        [0.695, 0.312],
        [0.712, 0.318],
        [0.728, 0.338],
      ],
    },
  },
  /* the dark blue sky top left; the lit booth, the road and the peak behind it stay clear */
  'front-desk': { at: 'tl', width: 27, shade: 0.45, x: 70, atTall: 'top', focus: 0.68, ambient: null },
  /* the evening sky left of the dome; the dome, the steps and the cloud sea stay clear */
  'numbers-room': { at: 'tl', width: 30, shade: 0.42, x: 60, atTall: 'top', focus: 0.68, ambient: null },
  /* the shaded road bottom left, the shop pushed right of it; the shop, its machines and the mountains stay clear */
  lowl: {
    at: 'bl',
    width: 24,
    shade: 0.62,
    x: 20,
    atTall: 'top',
    focus: 0.7,
    ambient: { kind: 'motes', count: 26, box: [0.42, 0.45, 0.95, 0.86], rgb: '255,236,190' },
  },
  /* the water and rocks at the cave mouth bottom left, short of the die; the dragon's wing, its gold and the party
     fill the rest. Phones: the words over the arches, the party and the die stay clear */
  emberquill: {
    at: 'bl',
    width: 21,
    shade: 0.55,
    x: 0,
    atTall: 'top',
    focus: 0.55,
    ambient: {
      kind: 'embers',
      count: 30,
      at: [
        [0.44, 0.6],
        [0.6, 0.575],
        [0.74, 0.57],
        [0.9, 0.62],
      ],
      rgb: '255,204,120',
    },
  },
  /* the wet cobbles bottom left; the pump and the gas lamp stand right. Phones: over the roofs, the pump stays whole */
  'history-lens': { at: 'bl', width: 31, shade: 0.5, x: 86, atTall: 'top', focus: 0.7, ambient: null },
  /* the open sky top left, short of the pages that turn into birds; the book, its world and the pen stay clear.
     Phones: over the sky and the islands, so the book stays a book */
  bookforge: { at: 'tl', width: 20, shade: 0.5, x: 30, atTall: 'top', focus: 0.6, ambient: null },
  /* the dusk sky top left; the blossom, the pagoda, the lanterns and the wet street are right */
  'kana-notebook': {
    at: 'tl',
    width: 24,
    shade: 0.5,
    x: 50,
    atTall: 'bottom',
    focus: 0.72,
    ambient: { kind: 'petals', count: 28, box: [0.4, 0.02, 1, 0.8], rgb: '255,196,214' },
  },
  /* the open sky; the road, the yurt and the mountains stay whole */
  about: { at: 'tl', width: 33, shade: 0.56, x: 66, atTall: 'top', focus: 0.64, ambient: null },
  /* the dark sky top left; the fire and the chairs are low, the Milky Way right */
  contact: {
    at: 'tl',
    width: 30,
    shade: 0.38,
    x: 76,
    atTall: 'top',
    focus: 0.6,
    ambient: { kind: 'embers', count: 34, at: [[0.59, 0.64]], rgb: '255,190,110' },
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
