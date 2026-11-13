/**
 * A small tile of soft noise that repeats without a seam, four independent channels (RGBA). The shader slides it
 * across the photo for restless reflections and uneven timing. Made once, on the CPU; pure.
 */
import { seeded } from '../lib/random';

export const NOISE_SIZE = 128;
/** lattice cells across the tile for each layer of detail, coarse to fine, and how much each counts */
const OCTAVES: readonly (readonly [cells: number, weight: number])[] = [
  [4, 0.55],
  [8, 0.3],
  [16, 0.15],
];

const fade = (t: number): number => t * t * (3 - 2 * t);

export function tileNoise(size: number = NOISE_SIZE, seed = 7): Uint8Array {
  const rand = seeded(seed);
  const out = new Uint8Array(size * size * 4);
  for (let ch = 0; ch < 4; ch++) {
    const lattices = OCTAVES.map(([cells]) => Float32Array.from({ length: cells * cells }, rand));
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let value = 0;
        OCTAVES.forEach(([cells, weight], o) => {
          const fx = (x / size) * cells;
          const fy = (y / size) * cells;
          const x0 = Math.floor(fx);
          const y0 = Math.floor(fy);
          const tx = fade(fx - x0);
          const ty = fade(fy - y0);
          const at = (cx: number, cy: number): number => lattices[o][(cy % cells) * cells + (cx % cells)];
          const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
          const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
          value += (top + (bottom - top) * ty) * weight;
        });
        out[(y * size + x) * 4 + ch] = Math.round(value * 255);
      }
  }
  return out;
}
