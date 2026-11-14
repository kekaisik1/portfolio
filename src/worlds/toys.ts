/**
 * A painting you can play with: every project's place is one. Several things in it answer a press, and they really
 * change (the dragon breathes fire, the booth's door opens, a fox comes to the roadside, the die is thrown). No
 * labels, no panels: the picture is the toy.
 *
 * A change is a "second state" of the same painting: a feathered piece of another painting of the same scene,
 * laid exactly over this one and faded in (public/states/<world>/, cut by reference/painted-sources/states/
 * make_states.py, whose rectangles are mirrored here). Only opacity and transform ever move.
 *
 * Everything is in the landscape painting's 0..1 coordinates, sizes in picture heights where noted, like the
 * reactions (picture.ts). The names a screen reader hears are in src/content/toys.ts. Pure, so it is unit-tested.
 */
import type { Point as PicturePoint } from '../ambient/spec';
import { placeX, placeY, tallU } from './cover';
import type { Look } from './looks';
import type { Burst } from './reactions';
import { fitOf, type Rect } from './picture';

/** A piece of a second state: its file under public/states/<world>/ and where it lies on the painting. */
export interface Piece {
  file: string;
  u: number;
  v: number;
  w: number;
  h: number;
}

/** How a piece comes and goes, in milliseconds. `stays`: it is left in until the next press takes it away. */
export interface Swap {
  piece: Piece;
  rise: number;
  hold: number;
  fall: number;
  /** the light wavers while it holds (fire) */
  wavers?: boolean;
  stays?: boolean;
}

/** The die: lifted off its ledge, thrown as a real twenty-sided die (d20.ts) and landed where it lay. */
export interface Throw {
  /** the ledge without the painted die, shown while the real one is out */
  ledge: Piece;
  /** the paint the thrown die is made of: a patch of the painted die's own brushwork, under public/states/<world>/ */
  paint: string;
  /** the part of the painting the die may move in: its canvas */
  room: Omit<Piece, 'file'>;
  /** where the painted die's middle is, and its radius in picture heights */
  at: PicturePoint;
  radius: number;
  /** how high it goes, in picture heights */
  lift: number;
  /** full turns before it lies still */
  turns: number;
  /** how long the throw takes, and how long the die then lies showing its number */
  ms: number;
  rest: number;
  sides: number;
  /** what a throw sets off: the first entry whose `upTo` the number does not pass (in rising order) */
  outcomes: readonly { upTo: number; toys: readonly string[] }[];
}

export interface Toy {
  /** its key in src/content/toys.ts, and how other toys name it */
  id: string;
  /** the object: its middle, and the size of the place to press (picture widths across, heights down) */
  u: number;
  v: number;
  w: number;
  h: number;
  swap?: Swap;
  bursts?: readonly Burst[];
  streak?: { from: PicturePoint; to: PicturePoint };
  throw?: Throw;
  /** this toy sets another off, after so many milliseconds */
  then?: { toy: string; after: number };
  /** not a thing to press: only set off by another toy (a throw of the die) */
  unseen?: true;
}

const px = (x: number, y: number, w: number, h: number): Omit<Piece, 'file'> => ({
  u: x / 1536,
  v: y / 1024,
  w: w / 1536,
  h: h / 1024,
});

/** In the order they are laid down: a later toy lies over an earlier one where their places overlap. */
export const TOYS: Readonly<Record<string, readonly Toy[]>> = {
  emberquill: [
    /* the dragon breathes fire across the arches, and embers ride the flame */
    {
      id: 'dragon',
      u: 0.735,
      v: 0.27,
      w: 0.3,
      h: 0.34,
      /* a slow, steady light: a big bright piece that flashes in or wavers hurts the eyes */
      swap: { piece: { file: 'fire.webp', ...px(40, 0, 1496, 500) }, rise: 600, hold: 1500, fall: 1300 },
    },
    /* the gold right of the party throws sparks */
    {
      id: 'gold',
      u: 0.72,
      v: 0.62,
      w: 0.09,
      h: 0.08,
      bursts: [{ at: [0.72, 0.6], style: 'rise', count: 10, spread: 0.05, rgb: '255,240,190' }],
    },
    /* the chest on the hoard opens, and stays open until it is pressed again */
    {
      id: 'chest',
      u: 0.852,
      v: 0.61,
      w: 0.1,
      h: 0.13,
      swap: { piece: { file: 'chest.webp', ...px(1200, 530, 210, 185) }, rise: 450, hold: 0, fall: 450, stays: true },
    },
    /* the archer looses an arrow at the dragon, which answers */
    {
      id: 'archer',
      u: 0.655,
      v: 0.68,
      w: 0.05,
      h: 0.14,
      streak: { from: [0.672, 0.64], to: [0.668, 0.33] },
      then: { toy: 'dragon', after: 700 },
    },
    /* the wizard's staff blazes */
    {
      id: 'staff',
      u: 0.549,
      v: 0.6,
      w: 0.06,
      h: 0.2,
      swap: { piece: { file: 'staff.webp', ...px(713, 437, 260, 260) }, rise: 450, hold: 900, fall: 1000 },
    },
    /* the red die is thrown and lands where it lay; a twenty wakes the dragon */
    {
      id: 'die',
      u: 0.456,
      v: 0.875,
      w: 0.13,
      h: 0.2,
      throw: {
        ledge: { file: 'ledge.webp', ...px(544, 747, 312, 277) },
        paint: 'die-paint.webp',
        room: px(430, 520, 540, 504),
        at: [700 / 1536, 897 / 1024],
        radius: 0.118,
        lift: 0.17,
        turns: 2.25,
        ms: 1900,
        rest: 3400,
        sides: 20,
        /* a 1: the dragon breathes fire over the party. Under 10: the wizard's bolt goes wide. 10 and over: it strikes the dragon.
           A 20: a blast that throws the hoard into the air */
        outcomes: [
          { upTo: 1, toys: ['burn'] },
          { upTo: 9, toys: ['miss'] },
          { upTo: 19, toys: ['hit'] },
          { upTo: 20, toys: ['crit'] },
        ],
      },
    },
    /* only the die sets these off */
    {
      id: 'burn',
      unseen: true,
      u: 0.5,
      v: 0.5,
      w: 0,
      h: 0,
      swap: { piece: { file: 'burn.webp', ...px(330, 150, 930, 680) }, rise: 600, hold: 1700, fall: 1400 },
    },
    {
      id: 'miss',
      unseen: true,
      u: 0.4,
      v: 0.4,
      w: 0,
      h: 0,
      swap: { piece: { file: 'miss.webp', ...px(280, 250, 620, 370) }, rise: 500, hold: 1500, fall: 1300 },
    },
    {
      id: 'hit',
      unseen: true,
      u: 0.7,
      v: 0.4,
      w: 0,
      h: 0,
      swap: { piece: { file: 'hit.webp', ...px(780, 200, 640, 440) }, rise: 500, hold: 1600, fall: 1300 },
    },
    {
      id: 'crit',
      unseen: true,
      u: 0.5,
      v: 0.4,
      w: 0,
      h: 0,
      swap: { piece: { file: 'crit.webp', ...px(0, 0, 1536, 800) }, rise: 700, hold: 1900, fall: 1600 },
    },
  ],
  'front-desk': [
    /* the booth's door opens, the receiver hangs off the hook, and its light falls on the snow */
    {
      id: 'booth',
      u: 0.665,
      v: 0.62,
      w: 0.1,
      h: 0.26,
      swap: { piece: { file: 'booth.webp', ...px(829, 461, 354, 450) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* a fox comes to the roadside and looks at the booth */
    {
      id: 'fox',
      u: 0.815,
      v: 0.71,
      w: 0.1,
      h: 0.13,
      swap: { piece: { file: 'fox.webp', ...px(1160, 635, 199, 179) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* a car's headlights come round the far bend; pressed on the bend just right of it, clear of the words */
    {
      id: 'car',
      u: 0.41,
      v: 0.69,
      w: 0.05,
      h: 0.07,
      swap: { piece: { file: 'car.webp', ...px(538, 660, 122, 103) }, rise: 600, hold: 4000, fall: 1400 },
    },
    /* the northern lights over the peaks, slower than the rest: they fill the sky */
    {
      id: 'aurora',
      u: 0.66,
      v: 0.12,
      w: 0.22,
      h: 0.16,
      swap: { piece: { file: 'aurora.webp', ...px(399, 0, 1076, 307) }, rise: 1200, hold: 5000, fall: 2000 },
    },
  ],
  'numbers-room': [
    /* the telescope's beam goes out and finds a constellation */
    {
      id: 'telescope',
      u: 0.66,
      v: 0.33,
      w: 0.1,
      h: 0.14,
      swap: { piece: { file: 'telescope.webp', ...px(46, 0, 1060, 389) }, rise: 600, hold: 4500, fall: 1400 },
    },
    /* the building's windows light up and its door opens on the steps */
    {
      id: 'building',
      u: 0.83,
      v: 0.55,
      w: 0.22,
      h: 0.1,
      swap: {
        piece: { file: 'building.webp', ...px(1060, 492, 415, 204) },
        rise: 600,
        hold: 0,
        fall: 1400,
        stays: true,
      },
    },
    /* a comet crosses the upper sky */
    {
      id: 'comet',
      u: 0.87,
      v: 0.095,
      w: 0.18,
      h: 0.13,
      swap: { piece: { file: 'comet.webp', ...px(1183, 10, 307, 174) }, rise: 600, hold: 3500, fall: 1400 },
    },
  ],
  lowl: [
    /* the washing machine's door opens and bubbles drift out */
    {
      id: 'washer',
      u: 0.665,
      v: 0.77,
      w: 0.07,
      h: 0.12,
      swap: { piece: { file: 'washer.webp', ...px(799, 512, 292, 410) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* the fridge's upper door opens on its shelves */
    {
      id: 'fridge',
      u: 0.75,
      v: 0.72,
      w: 0.08,
      h: 0.22,
      swap: { piece: { file: 'fridge.webp', ...px(1044, 579, 216, 130) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* the lamp over the door lights the wall */
    {
      id: 'lamp',
      u: 0.76,
      v: 0.43,
      w: 0.07,
      h: 0.08,
      swap: { piece: { file: 'lamp.webp', ...px(1091, 369, 184, 215) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* green parrots fly out of the tall palm; pressed on its right fronds, clear of the name and tag left of them */
    {
      id: 'palm',
      u: 0.43,
      v: 0.14,
      w: 0.1,
      h: 0.12,
      swap: { piece: { file: 'palm.webp', ...px(584, 0, 307, 123) }, rise: 600, hold: 3000, fall: 1400 },
    },
  ],
  'history-lens': [
    /* the brazier's flame rises three times as tall */
    {
      id: 'brazier',
      u: 0.925,
      v: 0.72,
      w: 0.11,
      h: 0.22,
      swap: { piece: { file: 'brazier.webp', ...px(1229, 379, 307, 594) }, rise: 600, hold: 3500, fall: 1400 },
    },
    /* legionaries march along the road through the arch */
    {
      id: 'legion',
      u: 0.36,
      v: 0.66,
      w: 0.14,
      h: 0.14,
      swap: { piece: { file: 'legion.webp', ...px(415, 573, 399, 246) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* the temple's doors open on gold light */
    {
      id: 'temple',
      u: 0.68,
      v: 0.5,
      w: 0.14,
      h: 0.22,
      swap: { piece: { file: 'temple.webp', ...px(968, 420, 184, 246) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* doves fly up over the Colosseum */
    {
      id: 'doves',
      u: 0.47,
      v: 0.36,
      w: 0.2,
      h: 0.12,
      swap: { piece: { file: 'doves.webp', ...px(568, 154, 369, 163) }, rise: 600, hold: 3000, fall: 1400 },
    },
  ],
  bookforge: [
    /* the ink-drawn left page is painted in full colour */
    {
      id: 'page',
      u: 0.4,
      v: 0.58,
      w: 0.28,
      h: 0.2,
      swap: { piece: { file: 'page.webp', ...px(307, 348, 553, 400) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* gold fireworks over the castle */
    {
      id: 'castle',
      u: 0.74,
      v: 0.42,
      w: 0.14,
      h: 0.14,
      swap: { piece: { file: 'castle.webp', ...px(998, 184, 292, 226) }, rise: 600, hold: 3000, fall: 1400 },
    },
    /* the pen's nib glows */
    {
      id: 'pen',
      u: 0.9,
      v: 0.3,
      w: 0.06,
      h: 0.4,
      swap: { piece: { file: 'pen.webp', ...px(1306, 41, 169, 205) }, rise: 600, hold: 2500, fall: 1400 },
    },
    /* a rainbow over the waterfall */
    {
      id: 'waterfall',
      u: 0.82,
      v: 0.8,
      w: 0.08,
      h: 0.26,
      swap: {
        piece: { file: 'waterfall.webp', ...px(1106, 614, 353, 226) },
        rise: 600,
        hold: 0,
        fall: 1400,
        stays: true,
      },
    },
  ],
  'kana-notebook': [
    /* the big paper lantern glows, warming the wood around it */
    {
      id: 'lantern',
      u: 0.875,
      v: 0.42,
      w: 0.08,
      h: 0.14,
      swap: {
        piece: { file: 'lantern.webp', ...px(1183, 195, 353, 409) },
        rise: 600,
        hold: 0,
        fall: 1400,
        stays: true,
      },
    },
    /* the pagoda's windows light up and the moon rises beside its spire */
    {
      id: 'pagoda',
      u: 0.68,
      v: 0.38,
      w: 0.12,
      h: 0.3,
      swap: { piece: { file: 'pagoda.webp', ...px(860, 133, 323, 410) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* a cat sits on the steps and looks down the street */
    {
      id: 'cat',
      u: 0.82,
      v: 0.76,
      w: 0.08,
      h: 0.16,
      swap: { piece: { file: 'cat.webp', ...px(1183, 686, 153, 184) }, rise: 600, hold: 0, fall: 1400, stays: true },
    },
    /* petals fall from the blossom: the one toy that is particles, a few, falling slowly */
    {
      id: 'blossom',
      u: 0.55,
      v: 0.08,
      w: 0.3,
      h: 0.12,
      bursts: [{ at: [0.55, 0.1], style: 'fall', count: 14, spread: 0.07, rgb: '255,196,214' }],
    },
  ],
};

/** A world's toys (none: an empty list). */
export const toysOf = (id: string): readonly Toy[] => (Object.hasOwn(TOYS, id) ? TOYS[id] : []);

/** Address of a piece under whatever base the site is served from. */
export const pieceUrl = (world: string, file: string, base: string = import.meta.env.BASE_URL): string =>
  `${base}states/${world}/${file}`;

/**
 * Where a rectangle of the landscape painting lies in a box the painting covers (it may run past the box: the
 * painting does too). The same maths as the painting itself, so a piece lands on its own pixels.
 */
export function pictureRect(
  r: { u: number; v: number; w: number; h: number },
  look: Look,
  box: { width: number; height: number },
  upright: boolean,
): Rect {
  const fit = fitOf(look, box, upright);
  const across = (u: number): number => placeX(fit, upright ? tallU(u, look.focus) : u);
  return { left: across(r.u), top: placeY(fit, r.v), right: across(r.u + r.w), bottom: placeY(fit, r.v + r.h) };
}

/** The toys a throw of `n` sets off. */
export const outcomeOf = (t: Throw, n: number): readonly string[] => t.outcomes.find((o) => n <= o.upTo)?.toys ?? [];

/**
 * The order a die's outcomes come in: every one once, shuffled, before any comes again, and never the same one
 * twice running across two rounds. A fair die would make you throw for a long time to see a 1 or a 20; this one
 * shows everything it can do within as many throws as it has outcomes.
 */
export function roundOf(count: number, random: () => number, last: number | null = null): number[] {
  const order = Array.from({ length: count }, (_, k) => k);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (count > 1 && order[0] === last) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

/** A number the die can show for its outcome `k`: any in that outcome's range, from a random number in 0..1. */
export function numberFor(t: Throw, k: number, random: number): number {
  const from = k === 0 ? 1 : t.outcomes[k - 1].upTo + 1;
  const to = t.outcomes[k].upTo;
  return from + Math.min(to - from, Math.floor(random * (to - from + 1)));
}

/** A throw of a die with `sides` sides, from a random number in 0..1. */
export const rollOf = (random: number, sides: number): number => Math.min(sides, Math.floor(random * sides) + 1);

/** The opacity a swap goes through, as keyframes with offsets, and how long it all takes. */
export function swapFrames(s: Swap): { frames: { opacity: number; offset: number }[]; ms: number } {
  const ms = s.rise + s.hold + s.fall;
  const up = s.rise / ms;
  const down = (s.rise + s.hold) / ms;
  const frames = [
    { opacity: 0, offset: 0 },
    { opacity: 1, offset: up },
  ];
  if (s.wavers) {
    const dips = [0.84, 1, 0.9, 1, 0.82, 1, 0.92];
    dips.forEach((opacity, k) => frames.push({ opacity, offset: up + ((down - up) * (k + 1)) / (dips.length + 1) }));
  }
  frames.push({ opacity: 1, offset: down }, { opacity: 0, offset: 1 });
  return { frames, ms };
}
