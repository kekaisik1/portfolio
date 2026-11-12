/** Which paintings ship baked (public/paint/<kind>.webp), as recorded by `npm run paint`. */
import type { Kind } from './kinds';
import type { Occupancy } from '../journey/labels';
import BAKED from './baked.json';

export interface Baked {
  /** how finely it was painted (times its own size) */
  q: number;
  /** its size in pixels */
  w: number;
  h: number;
  /** fingerprint of the painter that made it (paint/hash.ts) */
  hash: string;
  /** where it has paint: the occupancy grid as hex (4 cells per digit) and its bounding box */
  occ: string;
  bb: readonly number[];
}

export const BAKED_KINDS: Readonly<Partial<Record<Kind, Baked>>> = BAKED;

/** An occupancy grid as hex, 4 cells per digit. Pure, so it round-trips in a test. */
export function gridToHex(grid: Uint8Array): string {
  let s = '';
  for (let i = 0; i < grid.length; i += 4)
    s += ((grid[i] ? 8 : 0) | (grid[i + 1] ? 4 : 0) | (grid[i + 2] ? 2 : 0) | (grid[i + 3] ? 1 : 0)).toString(16);
  return s;
}

export function hexToOccupancy(hex: string, bb: readonly number[], n: number): Occupancy {
  const grid = new Uint8Array(n);
  for (let i = 0; i < n; i++) grid[i] = (parseInt(hex[i >> 2] ?? '0', 16) >> (3 - (i & 3))) & 1;
  return { grid, bb: [bb[0] ?? 0, bb[1] ?? 0, bb[2] ?? 1, bb[3] ?? 1] };
}
