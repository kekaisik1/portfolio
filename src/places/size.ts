/** How big a place stands on a phone. Pure, so it can be tested without a screen. */
import { clamp } from '../lib/math';

/** the building aims to stand this much of the screen's height */
export const PHONE_HEIGHT_SHARE = 0.5;
/** ...but never so large that less than this share of the scene's middle fits across the screen
 * (0.58 stood taller but cut Kana Notebook's gate and brush off the sides) */
export const PHONE_MIN_CORE_SHARE = 0.72;

/**
 * Scale (CSS px per drawing unit) of a place in the narrow layout.
 * hostW = width available, vh = screen height, coreW = width of the scene's middle, hitH = height of the building.
 * Never smaller than fitting the whole middle to the width (the old behaviour, which left places a third of the screen tall).
 */
export function phoneScale(hostW: number, vh: number, coreW: number, hitH: number): number {
  const fit = hostW / coreW;
  return clamp((vh * PHONE_HEIGHT_SHARE) / hitH, fit, fit / PHONE_MIN_CORE_SHARE);
}
