/**
 * A painting you can play with. Things in it answer a press, and they really change: a piece of a "second state"
 * fades in, a die is thrown, an arrow flies, a few particles fall. No labels, no panels: the picture is the toy.
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

/** A rectangle of the 1536x1024 painting, in pixels (as make_states.py prints them), in the painting's 0..1 terms. */
export const px = (x: number, y: number, w: number, h: number): Omit<Piece, 'file'> => ({
  u: x / 1536,
  v: y / 1024,
  w: w / 1536,
  h: h / 1024,
});

/**
 * Each world's toys, in the order they are laid down: a later toy lies over an earlier one where their places
 * overlap. Empty for now: the paintings were replaced on 2026-11-15 and the toys of the old ones went with them
 * ("paintings first, toys later"). A world without toys renders no buttons and costs nothing.
 */
export const TOYS: Readonly<Record<string, readonly Toy[]>> = {};

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
