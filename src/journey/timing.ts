/**
 * When things are on screen along the walk: the words of each stop, the label of each place, the dissolve levels.
 * The words of the next stop arrive while the last ones are still leaving, through complementary blotches of the
 * same paper-grain field, so a frame is never wordless and two stops are never at full strength in one place.
 * Pure, so the rules are unit-tested.
 */
import { clamp, sstep } from '../lib/math';
import { PROJECTS } from '../content/projects';
import { LAST, STOPS } from '../scene/stops';

/** steps of every dissolve (paper grain uncovered in LV levels) */
export const LV = 20;

/** words start leaving this far (in stops) from their stop, and are gone this far */
const W_IN = 0.2,
  W_OUT = 0.7;

/** A side of a stop's presence: words start to go this far (in stops) from it, and are gone this far. */
type Window = readonly [number, number];
const DAY: Window = [W_IN, W_OUT];

/**
 * The night's two stops hold long words in one column, so they do not cross: the last of the sea leaves before
 * the night is half up, about arrives only once the dark is behind its column, and contact only once about has gone.
 */
const ABOUT = STOPS.findIndex((st) => st.kind === 'about'),
  CONTACT = STOPS.findIndex((st) => st.kind === 'contact');
const WINDOWS: ReadonlyMap<number, { before: Window; after: Window }> = new Map([
  [ABOUT - 1, { before: DAY, after: [0.2, 0.55] }],
  [ABOUT, { before: [0.15, 0.4], after: [0.2, 0.48] }],
  [CONTACT, { before: [0.2, 0.48], after: DAY }],
]);

/** How present a stop's words are at s (1 at the stop, falling to 0 most of a stop away). */
export function wordAlpha(i: number, s: number): number {
  const w = WINDOWS.get(i),
    [a, b] = w ? (s < i ? w.before : w.after) : DAY;
  return 1 - sstep(a, b, Math.abs(s - i));
}

/** Where along the walk a frame may have no words: only while the dusk rises (the painting is the subject then) and between the night's two stops. */
export const WORDLESS_OK: readonly (readonly [number, number])[] = [
  [ABOUT - 0.58, ABOUT - 0.29],
  [ABOUT + 0.36, ABOUT + 0.64],
];

/**
 * Which dissolve pattern a stop's words use: neighbours use opposite halves of the same noise, so while one
 * leaves and the next arrives they fill different blotches (the sum of two neighbours never passes 1).
 */
export const invertedAt = (i: number): boolean => i % 2 === 1;

/** The stops a place's label speaks at: its own, and for the first place also the greeting (it is in view there). */
export function labelSpan(slug: string): readonly [number, number] {
  const i = STOPS.findIndex((st) => st.slug === slug);
  return slug === PROJECTS[0].slug ? [0, i] : [i, i];
}

/** How present a place's label is at s: fully along its span, dissolving like the words beyond it. */
export function labelAlpha(span: readonly [number, number], s: number): number {
  const d = s < span[0] ? span[0] - s : s > span[1] ? s - span[1] : 0;
  return 1 - sstep(W_IN, W_OUT, d);
}

/** The dissolve level for a presence a (0..LV). Reduced motion has no in-between: there or not. */
export const levelOf = (a: number, reduced: boolean): number =>
  reduced ? (a > 0.5 ? LV : 0) : Math.round(clamp(a, 0, 1) * LV);

/** The dissolve threshold of level L, a little past 0..1 at both ends so the first and last steps are clean. */
export const thresholdOf = (L: number, over = 0.06): number => -over + (L / LV) * (1 + 2 * over);

/**
 * Where the dot on the horizon bar is: on a country's word at its first stop, sliding between the words as you
 * walk, and a little past the last word towards the end. hx: the centre of each country's word; starts: first stops.
 */
export function horizonDot(s: number, hx: readonly number[], starts: readonly number[]): number {
  const n = hx.length;
  if (s <= starts[0]) return hx[0];
  if (s >= starts[n - 1])
    return hx[n - 1] + ((Math.min(s, LAST) - starts[n - 1]) / Math.max(1, LAST - starts[n - 1])) * 14;
  let i = 0;
  while (i < n - 2 && s >= starts[i + 1]) i++;
  return hx[i] + (hx[i + 1] - hx[i]) * ((s - starts[i]) / (starts[i + 1] - starts[i]));
}
