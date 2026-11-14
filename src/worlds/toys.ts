/**
 * A painting you can play with: several things in it answer a press, and some of them really change (the dragon
 * breathes fire, the chest opens, the die is thrown). No labels, no panels: the picture is the toy.
 *
 * A change is a "second state" of the same painting: a feathered piece of another painting of the same scene,
 * laid exactly over this one and faded in (public/states/<world>/, cut by reference/painted-sources/states/
 * make_states.py, whose rectangles are mirrored here). Only opacity and transform ever move.
 *
 * Everything is in the landscape painting's 0..1 coordinates, sizes in picture heights where noted, like spots and
 * reactions. The names a screen reader hears are in src/content/toys.ts. Pure, so it is unit-tested.
 */
import type { Point as PicturePoint } from '../ambient/spec';
import { placeX, placeY, tallU } from './cover';
import type { Look } from './looks';
import type { Burst, Flare } from './reactions';
import { fitOf, type Rect } from './spots';

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
  flare?: Flare;
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

/** where the smoke piece lies in the painting's pixels (printed by make_states.py) */
const SMOKE = [500, 40, 610, 410] as const;

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
        room: px(430, 520, 540, 504),
        at: [700 / 1536, 897 / 1024],
        radius: 0.118,
        lift: 0.17,
        turns: 2.25,
        ms: 1900,
        rest: 3400,
        sides: 20,
        /* a 1: the dragon only snorts. Under 10: the wizard's bolt goes wide. 10 and over: it strikes the dragon.
           A 20: a blast that throws the hoard into the air */
        outcomes: [
          { upTo: 1, toys: ['snort'] },
          { upTo: 9, toys: ['miss'] },
          { upTo: 19, toys: ['hit'] },
          { upTo: 20, toys: ['crit'] },
        ],
      },
    },
    /* only the die sets these off */
    {
      id: 'snort',
      unseen: true,
      u: 0.66,
      v: 0.3,
      w: 0,
      h: 0,
      swap: {
        piece: { file: 'smoke.webp', ...px(SMOKE[0], SMOKE[1], SMOKE[2], SMOKE[3]) },
        rise: 700,
        hold: 1500,
        fall: 1500,
      },
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
