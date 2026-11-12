/** Every painting by name. A name is a "kind": several cut-outs may show the same kind (it is rasterised once). */
import { BACKDROPS } from './backdrops';
import { MOUNTAINS } from './mountains';
import { NIGHT } from './night';
import { SEA } from './sea';
import { STEPPE } from './steppe';
import type { PaintDef } from './types';

export const PAINT = { ...MOUNTAINS, ...STEPPE, ...SEA, ...NIGHT, ...BACKDROPS };

/** Stars are tiny points: cheaper drawn straight onto a canvas than as SVG washes. */
export const STARS = { w: 1400, h: 600 } as const;

export type PaintKind = keyof typeof PAINT;
export type Kind = PaintKind | 'stars';

/** The box a kind is painted in. */
export const sizeOf = (k: Kind): { w: number; h: number } => (k === 'stars' ? STARS : PAINT[k]);
export const defOf = (k: PaintKind): PaintDef => PAINT[k];
export const isKind = (k: string): k is Kind => k === 'stars' || Object.hasOwn(PAINT, k);
export type { EdgeFade, PaintDef } from './types';
