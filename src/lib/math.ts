/** Small numeric helpers shared by the whole drawing: clamping, easing and seeded randomness. */

export type Rnd = () => number;
export type Noise = (x: number) => number;

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

/** Smoothstep on 0..1: eases in and out, used for every blend along the journey. */
export const smooth = (x: number): number => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};

/** A seeded random number generator, so every pencil line is the same on every visit. */
export function mulberry32(a: number): Rnd {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1-D value noise with a fixed table, smooth between integer steps. */
export function makeNoise(seed: number): Noise {
  const r = mulberry32(seed),
    N = 4096,
    v = new Float32Array(N);
  for (let i = 0; i < N; i++) v[i] = r();
  return (x) => {
    x = Math.abs(x);
    const i = Math.floor(x),
      f = x - i,
      u = f * f * (3 - 2 * f),
      a = v[i % N];
    return a + (v[(i + 1) % N] - a) * u;
  };
}

/** Fractal noise: a few octaves of `n` added up; rolling ground. */
export function fbm(n: Noise, x: number, o = 4): number {
  let s = 0,
    a = 1,
    fq = 1,
    nm = 0;
  for (let k = 0; k < o; k++) {
    s += n(x * fq + k * 17.3) * a;
    nm += a;
    a *= 0.5;
    fq *= 2.03;
  }
  return s / nm;
}

/** Ridged noise: sharp crests, for mountains. */
export function ridged(n: Noise, x: number): number {
  let s = 0,
    a = 1,
    fq = 1,
    nm = 0;
  for (let k = 0; k < 4; k++) {
    const v = 1 - Math.abs(n(x * fq + k * 31.7) * 2 - 1);
    s += v * v * a;
    nm += a;
    a *= 0.45;
    fq *= 2.1;
  }
  return s / nm;
}

/** A cheap repeatable hash in 0..1 for particle i, channel k, seed sd. */
export const hsh = (i: number, k: number, sd: number): number => {
  const x = Math.sin(i * 127.1 + k * 311.7 + sd) * 43758.5453;
  return x - Math.floor(x);
};
