/** Small numeric helpers shared by the painting and the journey: clamping, easing and seeded randomness. */

export type Rnd = () => number;

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

/** Smoothstep on 0..1: eases in and out. */
export const smooth = (x: number): number => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Smoothstep from a to b: 0 before a, 1 after b, eased between. */
export const sstep = (a: number, b: number, v: number): number => smooth((v - a) / (b - a));

/** Cubic ease-out on 0..1. */
export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/** A seeded random number generator, so every painting is the same on every visit. */
export function mulberry32(a: number): Rnd {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
