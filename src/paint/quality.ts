/**
 * How finely each painting is painted. Pure, so the baked paintings (npm run paint) and the live fallback agree.
 */
import { clamp } from '../lib/math';
import { CUTS } from '../scene/objects';
import { sizeOf, type Kind } from './kinds';

/** Pieces drawn at a fixed size wherever they appear. */
const FIXED_Q: Partial<Record<Kind, number>> = { dusk: 0.6, lantern: 1.2, smoke: 1 };

/** Paintings are never painted finer than this many device pixels per CSS pixel. */
export const MAX_DPR = 1.5;

/**
 * Enough for the biggest a kind is shown at: rh is the height of the scene box on screen, dpr the device pixel
 * ratio. Pieces only the finished paintings use are painted at about their shown size.
 */
export function qualityFor(k: Kind, rh: number, dpr: number): number {
  const fixed = FIXED_Q[k];
  if (fixed !== undefined) return fixed;
  const d = Math.min(dpr, MAX_DPR),
    c = CUTS.find((x) => x.k === k),
    { h } = sizeOf(k);
  if (!c) return clamp(1.1 * d, 0.5, 1.4);
  return clamp((c.h * Math.max(rh, 560) * d * 1.35) / h, 0.4, 1.5);
}
