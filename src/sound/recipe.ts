/**
 * What each place sounds like, as a recipe the engine (engine.ts) builds from filtered noise and a few oscillators:
 * nothing is recorded, nothing is downloaded. Gains here are relative; MASTER_GAIN keeps the whole thing quiet.
 * Nobody has tuned these by ear yet: the numbers were set so each place measures quiet, unclipped and centred
 * (tests/e2e/sound.spec.ts), and so its ingredients are the right ones.
 */

export type NoiseColour = 'white' | 'pink' | 'brown';

/** A slow rise and fall of loudness: `rate` in Hz, `depth` 0..1 (1 = falls to silence at the bottom). */
export interface Swell {
  rate: number;
  depth: number;
}

/** Filtered noise: wind, water, rain, air. `sweep` lets the filter wander by that many cents, at its own slow rate. */
export interface NoiseLayer {
  kind: 'noise';
  colour: NoiseColour;
  filter: 'lowpass' | 'highpass' | 'bandpass';
  freq: number;
  q: number;
  gain: number;
  swell?: Swell;
  sweep?: { rate: number; cents: number };
}

/** A steady tone: a hum, or (with `trill`, in Hz) an insect's pulsing. */
export interface ToneLayer {
  kind: 'tone';
  wave: 'sine' | 'triangle' | 'sawtooth';
  freq: number;
  gain: number;
  swell?: Swell;
  trill?: number;
}

/** Random small clicks through a band-pass: fire, a torch, drops on stone. `density` = clicks a second. */
export interface CrackleLayer {
  kind: 'crackle';
  density: number;
  freq: number;
  gain: number;
}

export type Voice = 'ring' | 'bell' | 'drip' | 'bird';

/** Something that happens now and then: every `every` seconds, give or take `jitter`, the first after `first`. */
export interface EventLayer {
  kind: 'event';
  voice: Voice;
  every: number;
  jitter: number;
  first: number;
  gain: number;
}

export type Layer = NoiseLayer | ToneLayer | CrackleLayer | EventLayer;
export type Recipe = readonly Layer[];

/** the whole page's loudness: it is ambience, under whatever else the visitor is listening to */
export const MASTER_GAIN = 0.32;
/** seconds one place's sound takes to give way to the next, and to duck under a video */
export const FADE_S = 0.4;

export const RECIPES: Readonly<Record<string, Recipe>> = {
  /* high thin wind over the summit */
  hello: [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 1700,
      q: 0.8,
      gain: 0.5,
      swell: { rate: 0.11, depth: 0.6 },
      sweep: { rate: 0.07, cents: 500 },
    },
    {
      kind: 'noise',
      colour: 'white',
      filter: 'highpass',
      freq: 5200,
      q: 0.5,
      gain: 0.05,
      swell: { rate: 0.07, depth: 0.8 },
    },
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 180, q: 0.5, gain: 0.3 },
  ],
  /* soft wind in the pass, and a phone ringing very far off, about every twenty seconds */
  'front-desk': [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 620,
      q: 0.6,
      gain: 0.5,
      swell: { rate: 0.09, depth: 0.5 },
      sweep: { rate: 0.05, cents: 400 },
    },
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 220, q: 0.5, gain: 0.3 },
    { kind: 'event', voice: 'ring', every: 20, jitter: 3, first: 5, gain: 0.05 },
  ],
  /* quiet wind above the clouds, and the low hum of the dome */
  'numbers-room': [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 900,
      q: 0.5,
      gain: 0.26,
      swell: { rate: 0.08, depth: 0.5 },
    },
    { kind: 'tone', wave: 'sine', freq: 55, gain: 0.16 },
    { kind: 'tone', wave: 'sine', freq: 110.4, gain: 0.05, swell: { rate: 0.13, depth: 0.5 } },
    { kind: 'tone', wave: 'sine', freq: 165, gain: 0.012 },
  ],
  /* warm daytime air, a bird now and then, insects in the hedge */
  lowl: [
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 520, q: 0.5, gain: 0.34 },
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 2400,
      q: 0.5,
      gain: 0.06,
      swell: { rate: 0.1, depth: 0.6 },
    },
    { kind: 'tone', wave: 'sine', freq: 5150, gain: 0.004, trill: 27, swell: { rate: 0.21, depth: 0.8 } },
    { kind: 'event', voice: 'bird', every: 4.6, jitter: 2.4, first: 1.5, gain: 0.045 },
  ],
  /* the still air of a great cavern, the dragon's fire a low rumble under it, embers ticking, water dripping */
  emberquill: [
    {
      kind: 'noise',
      colour: 'brown',
      filter: 'lowpass',
      freq: 140,
      q: 0.6,
      gain: 0.7,
      swell: { rate: 0.05, depth: 0.4 },
    },
    {
      kind: 'noise',
      colour: 'brown',
      filter: 'lowpass',
      freq: 75,
      q: 0.8,
      gain: 0.45,
      swell: { rate: 0.17, depth: 0.6 },
    },
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 420,
      q: 0.5,
      gain: 0.14,
      swell: { rate: 0.04, depth: 0.5 },
      sweep: { rate: 0.03, cents: 300 },
    },
    { kind: 'crackle', density: 5, freq: 2200, gain: 0.09 },
    { kind: 'event', voice: 'drip', every: 5.3, jitter: 2.2, first: 2, gain: 0.05 },
  ],
  /* fog that muffles everything, water dripping, a bell far away */
  'history-lens': [
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 260, q: 0.5, gain: 0.55 },
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'lowpass',
      freq: 700,
      q: 0.5,
      gain: 0.09,
      swell: { rate: 0.06, depth: 0.5 },
    },
    { kind: 'event', voice: 'drip', every: 3.1, jitter: 1.7, first: 1, gain: 0.07 },
    { kind: 'event', voice: 'bell', every: 27, jitter: 4, first: 6, gain: 0.07 },
  ],
  /* open wind on the hilltop, the far waterfall, pages stirring, a bird now and then */
  bookforge: [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 1100,
      q: 0.6,
      gain: 0.42,
      swell: { rate: 0.1, depth: 0.65 },
      sweep: { rate: 0.06, cents: 500 },
    },
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 200, q: 0.5, gain: 0.26 },
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'lowpass',
      freq: 900,
      q: 0.5,
      gain: 0.1,
      swell: { rate: 0.03, depth: 0.3 },
    },
    {
      kind: 'noise',
      colour: 'white',
      filter: 'bandpass',
      freq: 4200,
      q: 0.7,
      gain: 0.03,
      swell: { rate: 0.23, depth: 0.9 },
    },
    { kind: 'crackle', density: 2.5, freq: 5200, gain: 0.05 },
    { kind: 'event', voice: 'bird', every: 9, jitter: 4, first: 3, gain: 0.035 },
  ],
  /* the rain has just stopped: a soft hush over the street, drops from the eaves, a temple bell far off */
  'kana-notebook': [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'highpass',
      freq: 1200,
      q: 0.5,
      gain: 0.08,
      swell: { rate: 0.05, depth: 0.5 },
    },
    { kind: 'noise', colour: 'brown', filter: 'lowpass', freq: 260, q: 0.5, gain: 0.3 },
    { kind: 'event', voice: 'drip', every: 1.9, jitter: 1.1, first: 0.6, gain: 0.06 },
    { kind: 'event', voice: 'bell', every: 31, jitter: 5, first: 8, gain: 0.05 },
  ],
  /* wind through the grass */
  about: [
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 2600,
      q: 0.5,
      gain: 0.5,
      swell: { rate: 0.13, depth: 0.7 },
      sweep: { rate: 0.09, cents: 600 },
    },
    {
      kind: 'noise',
      colour: 'pink',
      filter: 'bandpass',
      freq: 500,
      q: 0.5,
      gain: 0.55,
      swell: { rate: 0.06, depth: 0.5 },
    },
  ],
  /* the fire crackling, and insects in the night grass */
  contact: [
    { kind: 'crackle', density: 14, freq: 1800, gain: 0.3 },
    {
      kind: 'noise',
      colour: 'brown',
      filter: 'lowpass',
      freq: 340,
      q: 0.5,
      gain: 0.5,
      swell: { rate: 0.45, depth: 0.3 },
    },
    { kind: 'tone', wave: 'sine', freq: 4300, gain: 0.006, trill: 17, swell: { rate: 0.15, depth: 0.6 } },
    { kind: 'tone', wave: 'sine', freq: 4720, gain: 0.004, trill: 13, swell: { rate: 0.11, depth: 0.7 } },
  ],
};

/** A place's recipe; a world without one is a build mistake. */
export function recipeOf(id: string): Recipe {
  if (!Object.hasOwn(RECIPES, id))
    throw new Error(`No sound for the world "${id}": add one to RECIPES in src/sound/recipe.ts.`);
  return RECIPES[id];
}

/** A repeatable number 0..1 for the `k`-th happening of something seeded with `seed`. */
export function chance(seed: number, k: number): number {
  let h = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul((k | 0) + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** When the `k`-th event of a layer happens, in seconds after its place began to sound. */
export function eventTime(layer: EventLayer, k: number, seed: number): number {
  return Math.max(0, layer.first + k * layer.every + (chance(seed, k) * 2 - 1) * layer.jitter);
}

/** The events of a layer that fall in [from, to): which one each is (for its small variations), and when. */
export function eventsBetween(layer: EventLayer, from: number, to: number, seed: number): { k: number; at: number }[] {
  const out: { k: number; at: number }[] = [];
  /* jitter can move an event either way, so look a little before and after the window */
  const reach = Math.ceil(layer.jitter / layer.every) + 1;
  const k0 = Math.max(0, Math.floor((from - layer.first) / layer.every) - reach);
  const k1 = Math.floor((to - layer.first) / layer.every) + reach;
  for (let k = k0; k <= k1; k++) {
    const at = eventTime(layer, k, seed);
    if (at >= from && at < to) out.push({ k, at });
  }
  return out;
}

/** The resting gain and the size of the swing that make a layer swell between gain*(1-depth) and gain. */
export function swellGains(gain: number, swell: Swell | undefined): { base: number; swing: number } {
  if (!swell) return { base: gain, swing: 0 };
  const swing = (gain * swell.depth) / 2;
  return { base: gain - swing, swing };
}
