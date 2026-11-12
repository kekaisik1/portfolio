/**
 * Tileable noise fields for the paper grain and every dissolve: value noise in octaves, histogram-equalised to 0..1,
 * so that a dissolve threshold moving evenly from 0 to 1 uncovers the same amount of paper at every step. Pure.
 */
import { clamp, mulberry32 } from '../lib/math';

/** Smooth value noise on a size x size tile with `cells` lattice cells per side (wraps at the edges). */
export function valueNoise(size: number, cells: number, rnd: () => number): Float32Array {
  const lat = new Float32Array(cells * cells);
  for (let i = 0; i < lat.length; i++) lat[i] = rnd();
  const out = new Float32Array(size * size),
    k = cells / size;
  for (let y = 0; y < size; y++) {
    const gy = y * k,
      y0 = Math.floor(gy),
      ty = gy - y0,
      sy = ty * ty * (3 - 2 * ty),
      ya = (y0 % cells) * cells,
      yb = ((y0 + 1) % cells) * cells;
    for (let x = 0; x < size; x++) {
      const gx = x * k,
        x0 = Math.floor(gx),
        tx = gx - x0,
        sx = tx * tx * (3 - 2 * tx),
        xa = x0 % cells,
        xb = (x0 + 1) % cells;
      const a = lat[ya + xa] + (lat[ya + xb] - lat[ya + xa]) * sx,
        b = lat[yb + xa] + (lat[yb + xb] - lat[yb + xa]) * sx;
      out[y * size + x] = a + (b - a) * sy;
    }
  }
  return out;
}

/** Octaves of value noise ([cells, weight] each) plus a little white noise, equalised so values spread evenly over 0..1. */
export function field(
  size: number,
  seed: number,
  octaves: readonly (readonly [number, number])[],
  white = 0,
): Float32Array {
  const rnd = mulberry32(seed),
    out = new Float32Array(size * size);
  for (const [cells, w] of octaves) {
    const n = valueNoise(size, cells, rnd);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * w;
  }
  if (white) for (let i = 0; i < out.length; i++) out[i] += rnd() * white;
  let mn = Infinity,
    mx = -Infinity;
  for (const v of out) {
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const B = 1024,
    hist = new Uint32Array(B),
    sc = (B - 1) / (mx - mn || 1);
  for (let i = 0; i < out.length; i++) hist[Math.floor((out[i] - mn) * sc)]++;
  const cdf = new Float32Array(B);
  let acc = 0;
  for (let i = 0; i < B; i++) {
    acc += hist[i];
    cdf[i] = acc / out.length;
  }
  for (let i = 0; i < out.length; i++) out[i] = cdf[Math.floor((out[i] - mn) * sc)];
  return out;
}

/**
 * The alpha (0..255) of a dissolve at threshold t: paper is painted where the field is below t, with a soft edge.
 * `invert` uncovers the complement (where the field is above 1 - t), so two neighbours dissolving at once
 * through the same field fill different blotches instead of printing on top of each other.
 */
export function thresholdAlpha(f: Float32Array, t: number, soft: number, invert = false): Uint8ClampedArray {
  const out = new Uint8ClampedArray(f.length);
  for (let i = 0; i < f.length; i++) {
    const v = invert ? 1 - f[i] : f[i];
    out[i] = clamp((t - v) / soft + 0.5, 0, 1) * 255;
  }
  return out;
}
