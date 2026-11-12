/**
 * The camera: where a cut-out stands on screen for a position s along the walk. You walk forward into depth,
 * so a piece's distance shrinks as you pass its stop, it grows and slides out from the vanishing point, and near
 * pieces leave the frame fast while far ones barely move; the camera also drifts a little sideways.
 * Pure, allocation-free (results are written into a box you pass in), so it runs every frame and is unit-tested.
 */
import { sstep } from '../lib/math';
import type { CutDef, Placement } from '../scene/objects';

/**
 * Narrow screens (phones, and tablets held upright): the scene sits under the words instead of beside them.
 * Keep in step with the media queries in narrow.css: (max-width: 759px), (max-width: 1099px) and (max-aspect-ratio: 5/6).
 */
export const PHONE_MAX = 759;
export const PORTRAIT_MAX = 1099;
export const isNarrow = (W: number, H: number): boolean => W <= PHONE_MAX || (W <= PORTRAIT_MAX && W / H <= 5 / 6);

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface View {
  W: number;
  H: number;
  phone: boolean;
  /** the box the scene is composed in */
  R: Rect;
  /** the vanishing point */
  VP: { x: number; y: number };
}

/** The scene box for a screen of W x H: right two thirds on wide screens, the lower part on phones. */
export function viewOf(W: number, H: number): View {
  const phone = isNarrow(W, H);
  const R = phone ? { x: 0, y: H * 0.24, w: W, h: H * 0.66 } : { x: W * 0.34, y: H * 0.07, w: W * 0.66, h: H * 0.8 };
  const VP = phone ? { x: W * 0.55, y: R.y + R.h * 0.32 } : { x: R.x + R.w * 0.55, y: R.y + R.h * 0.42 };
  return { W, H, phone, R, VP };
}

/** the camera's sideways drift, as a share of the scene box */
export const camX = (s: number): number => Math.sin(s * 0.85) * 0.045;

/** How far the night has come (0 day .. 1 night). */
export const nightAt = (s: number): number => sstep(7.3, 7.9, s);

/** the horizon bar's band of paper at the bottom of the screen (px) */
export const BAND = 76;

/**
 * Near pieces dry away as their ground slides down into the horizon bar's band, so nothing big passes under the
 * bar. A piece that rests lower than the band's top (framing foreground) only fades once it moves past its rest.
 */
export function bandFade(sy: number, restSy: number, H: number): number {
  const start = Math.max(H - BAND - 30, restSy + 10);
  return 1 - sstep(start, start + 80, sy);
}

/** Where a piece rests on this screen: its phone placement, if it has one. */
export function placementOf(c: CutDef, phone: boolean, out: Placement): Placement {
  out.x = phone && c.m?.x !== undefined ? c.m.x : c.x;
  out.y = phone && c.m?.y !== undefined ? c.m.y : c.y;
  out.h = phone && c.m?.h !== undefined ? c.m.h : c.h;
  return out;
}

export interface Box {
  left: number;
  top: number;
  w: number;
  h: number;
  /** the ground point on screen */
  sx: number;
  sy: number;
  /** scale from the painting's own units to screen px */
  k: number;
  /** distance from the camera */
  z: number;
}
export const newBox = (): Box => ({ left: 0, top: 0, w: 0, h: 0, sx: 0, sy: 0, k: 0, z: 0 });

/** sky pieces hang from their middle; everything else stands on its ground point (92% down its painting) */
export const anchorY = (k: string): number => (k === 'stars' || k === 'moon' ? 0.5 : 0.92);

/**
 * Project a piece for camera position s. `open` (0..1) is how far a place is opening: everything outside
 * drifts outward a little. Returns false when the piece is behind the camera.
 */
export function project(
  c: CutDef,
  p: Placement,
  size: { w: number; h: number },
  s: number,
  open: number,
  v: View,
  out: Box,
): boolean {
  const z = c.z0 - (s - c.stop) * (c.rate ?? 1);
  if (z < 0.2) return false;
  const sc = (c.z0 / z) * (1 + open * 0.3);
  const ax = v.R.x + p.x * v.R.w - (camX(s) - camX(c.stop)) * v.R.w * (1 / z) * 1.4,
    ay = v.R.y + p.y * v.R.h;
  const sx = v.VP.x + (ax - v.VP.x) * sc,
    sy = v.VP.y + (ay - v.VP.y) * sc,
    k = (p.h * v.R.h * sc) / size.h;
  out.sx = sx;
  out.sy = sy;
  out.k = k;
  out.z = z;
  out.w = size.w * k;
  out.h = size.h * k;
  out.left = sx - 0.5 * out.w;
  out.top = sy - anchorY(c.k) * out.h;
  return true;
}

/** How much of a piece is painted at s: soaking in over half a stop before `from`, drying away after `to`. */
export function presence(c: CutDef, s: number): number {
  let a = sstep(c.from - 0.55, c.from, s) * (1 - sstep(c.to, c.to + 0.55, s));
  if (c.night) a *= sstep(0.4, 0.8, nightAt(s));
  return a;
}

/** Near pieces fade a little into the paper fog with distance; far layers are already pale. */
export const fogOf = (c: CutDef, z: number): number =>
  c.far ? 1 : Math.min(1, Math.max(0.45, 1.15 - (z - 1.6) * 0.32));
