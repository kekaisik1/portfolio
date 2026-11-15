/**
 * How each world is shown: where its words stand so they never cover the photo's subject (chosen by looking at each
 * painting), which part of the picture stays in view, and the small things in its air (snow, sparks, petals, dust).
 * What moves inside the photograph itself is src/living/scenes.ts. No text here: that is src/content/.
 */
import type { AmbientSpec } from '../ambient/spec';

export interface Look {
  /** wide screens: the corner of the photo the words stand in */
  at: 'tl' | 'bl';
  /**
   * wide screens: where the words start across the window, in percent of its width (0..100), for a painting whose
   * calm part is not at its left edge; absent = the normal edge margin. No effect in the narrow layout.
   */
  left?: number;
  /**
   * wide screens: the name's size as a fraction of the usual (0.5..1), for a painting whose calm part is too narrow
   * for the name at full size; absent = full size. No effect in the narrow layout.
   */
  name?: number;
  /** wide screens: the widest the words may be, in rem */
  width: number;
  /** how dark the halo and the soft shade behind the words are, 0..1: as light as the painting allows at AA contrast */
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
  /* low left over the sea of clouds, the opening shot; the cat on the cairn, the flags and the pack stay clear */
  hello: { at: 'bl', width: 60, shade: 0.5, x: 70, atTall: 'bottom', focus: 0.72, ambient: null },
  /* low left over the job cards and the corner of the map; the lamp, the vans and the phone stay clear */
  'front-desk': { at: 'bl', width: 30, shade: 0.7, x: 50, atTall: 'top', focus: 0.5, ambient: null },
  /* top left over the dome's dark ribs and the ledgers' shelf, wide enough for the name in two lines so it ends
     above the chart's line; the lamp, the telescope and the open dome stay clear */
  'numbers-room': { at: 'tl', width: 48, shade: 0.7, x: 60, atTall: 'top', focus: 0.7, ambient: null },
  /* low left over the counter's calm wood; the washing machine, its tag and the street stay clear. Dust hangs in
     the sun in the doorway */
  lowl: {
    at: 'bl',
    width: 28,
    shade: 0.6,
    x: 60,
    atTall: 'top',
    focus: 0.68,
    ambient: { kind: 'motes', count: 20, box: [0.28, 0.5, 0.6, 0.92], rgb: '255,236,190' },
  },
  /* top left over the night sky and the dark cliff (the low left is the party on its ledge); the party, the
     dragon's shadow and the gold stay clear. Embers rise off the glowing cave floor */
  emberquill: {
    at: 'tl',
    width: 24,
    shade: 0.5,
    x: 45,
    atTall: 'top',
    focus: 0.5,
    ambient: {
      kind: 'embers',
      count: 18,
      at: [
        [0.63, 0.74],
        [0.7, 0.71],
        [0.77, 0.7],
        [0.84, 0.7],
      ],
      rgb: '255,180,100',
    },
  },
  /* low left over the amphora and the dark red dado; the fresco, the scaffold and the lamp stay clear. Dust hangs
     in the sunbeams over the scaffold */
  'history-lens': {
    at: 'bl',
    width: 26,
    shade: 0.75,
    x: 30,
    atTall: 'bottom',
    focus: 0.4,
    ambient: { kind: 'motes', count: 18, box: [0.04, 0.3, 0.55, 0.72], rgb: '255,236,200' },
  },
  /* top left over the pinned sketches; the young man, the cat and the lamp stay clear */
  bookforge: { at: 'tl', width: 24, shade: 0.7, x: 70, atTall: 'top', focus: 0.6, ambient: null },
  /* low right over the calm tatami, the name smaller to fit it; the kana on the left, the tea, the inkstone and
     the cat stay clear. Phones: the crop keeps the whole な and the tea (kana before the cat, which is cut off) */
  'kana-notebook': {
    at: 'bl',
    left: 70,
    name: 0.68,
    width: 22,
    shade: 0.8,
    x: 40,
    atTall: 'top',
    focus: 0.43,
    ambient: null,
  },
  /* top, in the sky between the young man and the plane; both, the mountains and the cat stay clear */
  about: { at: 'tl', left: 44, width: 20, shade: 0.6, x: 30, atTall: 'bottom', focus: 0.27, ambient: null },
  /* low left over the shallows, where the sun's path on the water reaches the shore (the sun is left in this
     painting); the bottle and the tree stay clear */
  contact: { at: 'bl', width: 34, shade: 0.5, x: 76, atTall: 'top', focus: 0.64, ambient: null },
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
