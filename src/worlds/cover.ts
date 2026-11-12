/** Where a photo's pixels land on screen when it covers a box (object-fit: cover). Pure, so it is unit-tested. */

/** width / height of the landscape photographs and of their upright crops (see scripts/make-worlds.ts) */
export const WIDE_SIZE = { w: 1536, h: 1024 } as const;
export const TALL_SIZE = { w: 683, h: 1024 } as const;

export interface Fit {
  /** the drawn photo's rectangle, in the box's pixels: it is at least as big as the box */
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The rectangle a photo of the given aspect (width / height) is drawn in when it covers a box, with
 * object-position `posX` `posY` (0..1 each).
 */
export function coverFit(boxW: number, boxH: number, aspect: number, posX: number, posY = 0.5): Fit {
  let width = boxW;
  let height = boxW / aspect;
  if (height < boxH) {
    height = boxH;
    width = boxH * aspect;
  }
  return { left: (boxW - width) * posX, top: (boxH - height) * posY, width, height };
}

/** Where the upright crop starts in the landscape photo, in landscape pixels, for a subject at `focus` (0..1). */
export function tallCropX(focus: number): number {
  return Math.round(Math.min(WIDE_SIZE.w - TALL_SIZE.w, Math.max(0, focus * WIDE_SIZE.w - TALL_SIZE.w / 2)));
}

/** A point of the landscape photo (u across, 0..1) as a point of its upright crop (may fall outside 0..1). */
export function tallU(u: number, focus: number): number {
  return (u * WIDE_SIZE.w - tallCropX(focus)) / TALL_SIZE.w;
}

/** A photo point (u, v in 0..1) in the box's pixels. */
export const placeX = (fit: Fit, u: number): number => fit.left + u * fit.width;
export const placeY = (fit: Fit, v: number): number => fit.top + v * fit.height;
