/**
 * Turns a scene's regions into two small textures the shader reads (once per world, on the CPU; pure, so it is
 * unit-tested). Texture A: red/green = flow, blue = mist, alpha = shimmer. Texture B: red/green = sway, blue = stars.
 * Both cover the landscape photo; vectors are stored as bytes around 128 (= exactly no movement).
 */
import type { Point } from '../ambient/spec';
import { clamp } from '../lib/math';
import { WIDE_SIZE } from '../worlds/cover';
import type { Field, Flow, Region, Scene, Shape, Sway } from './scene';

export const MASK_W = 192;
export const MASK_H = 128;
/** photo widths per photo height: distances are measured in heights */
const ASPECT = WIDE_SIZE.w / WIDE_SIZE.h;
const ZERO = 128;
const SPAN = 127;

const smooth = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Distance from a point to a shape's edge in photo heights: positive inside, negative outside. */
export function signedDistance(shape: Shape, u: number, v: number): number {
  const x = u * ASPECT;
  if (shape.kind === 'ellipse') {
    const dx = (x - shape.at[0] * ASPECT) / shape.rx;
    const dy = (v - shape.at[1]) / shape.ry;
    return (1 - Math.hypot(dx, dy)) * Math.min(shape.rx, shape.ry);
  }
  const pts = shape.points;
  let inside = false;
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const ax = pts[j][0] * ASPECT;
    const ay = pts[j][1];
    const bx = pts[i][0] * ASPECT;
    const by = pts[i][1];
    if (ay > v !== by > v && x < ((bx - ax) * (v - ay)) / (by - ay) + ax) inside = !inside;
    const ex = bx - ax;
    const ey = by - ay;
    const len2 = ex * ex + ey * ey;
    const t = len2 > 0 ? clamp(((x - ax) * ex + (v - ay) * ey) / len2, 0, 1) : 0;
    best = Math.min(best, Math.hypot(x - ax - t * ex, v - ay - t * ey));
  }
  return inside ? best : -best;
}

/** How strongly a region applies at a point of the landscape photo, 0..1. */
export function coverage(region: Region, u: number, v: number): number {
  const f = Math.max(region.feather, 1e-4);
  let c = smooth(0, f, signedDistance(region.shape, u, v));
  if (c <= 0) return 0;
  for (const cut of region.minus ?? []) c *= 1 - smooth(-f, 0, signedDistance(cut, u, v));
  const ramp = region.ramp;
  if (ramp) {
    const ex = (ramp.to[0] - ramp.from[0]) * ASPECT;
    const ey = ramp.to[1] - ramp.from[1];
    const len2 = ex * ex + ey * ey;
    const t = len2 > 0 ? clamp(((u - ramp.from[0]) * ASPECT * ex + (v - ramp.from[1]) * ey) / len2, 0, 1) : 0;
    c *= ramp.a + (ramp.b - ramp.a) * t;
  }
  return c;
}

export interface Masks {
  a: Uint8Array;
  b: Uint8Array;
  /** the vector a full byte stands for, in photo widths / heights: the shader multiplies by these */
  flowScale: number;
  swayScale: number;
}

const centre = (i: number, n: number): number => (i + 0.5) / n;

/** The texels a region can touch: rows and columns, first to one past the last. Nothing outside its shape moves. */
function span(region: Region): { x0: number; x1: number; y0: number; y1: number } {
  const s = region.shape;
  const us = s.kind === 'ellipse' ? [s.at[0] - s.rx / ASPECT, s.at[0] + s.rx / ASPECT] : s.points.map((p) => p[0]);
  const vs = s.kind === 'ellipse' ? [s.at[1] - s.ry, s.at[1] + s.ry] : s.points.map((p) => p[1]);
  return {
    x0: clamp(Math.floor(Math.min(...us) * MASK_W), 0, MASK_W),
    x1: clamp(Math.ceil(Math.max(...us) * MASK_W), 0, MASK_W),
    y0: clamp(Math.floor(Math.min(...vs) * MASK_H), 0, MASK_H),
    y1: clamp(Math.ceil(Math.max(...vs) * MASK_H), 0, MASK_H),
  };
}

function vectors(regions: readonly (Flow | Sway)[]): { field: Float32Array; scale: number } {
  const field = new Float32Array(MASK_W * MASK_H * 2);
  for (const r of regions) {
    const { x0, x1, y0, y1 } = span(r);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const c = coverage(r, centre(x, MASK_W), centre(y, MASK_H));
        if (c <= 0) continue;
        const k = (y * MASK_W + x) * 2;
        field[k] += r.dir[0] * c;
        field[k + 1] += r.dir[1] * c;
      }
  }
  let scale = 0;
  for (const value of field) scale = Math.max(scale, Math.abs(value));
  return { field, scale };
}

function amounts(regions: readonly Field[]): Float32Array {
  const out = new Float32Array(MASK_W * MASK_H);
  for (const r of regions) {
    const { x0, x1, y0, y1 } = span(r);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const k = y * MASK_W + x;
        out[k] = Math.max(out[k], r.amount * coverage(r, centre(x, MASK_W), centre(y, MASK_H)));
      }
  }
  return out;
}

const vecByte = (value: number, scale: number): number =>
  scale > 0 ? ZERO + Math.round(clamp(value / scale, -1, 1) * SPAN) : ZERO;
const amountByte = (value: number): number => Math.round(clamp(value, 0, 1) * 255);

/** What a stored byte means to the shader: -1..1 for a vector channel. */
export const byteVec = (byte: number): number => (byte - ZERO) / SPAN;

/** Rasterise a scene's regions into the two mask textures (RGBA, MASK_W x MASK_H, top row first). */
export function rasterScene(scene: Scene): Masks {
  const flow = vectors(scene.flow ?? []);
  const sway = vectors(scene.sway?.regions ?? []);
  const mist = amounts(scene.mist?.regions ?? []);
  const shimmer = amounts(scene.shimmer?.regions ?? []);
  const stars = amounts(scene.stars ?? []);
  const a = new Uint8Array(MASK_W * MASK_H * 4);
  const b = new Uint8Array(MASK_W * MASK_H * 4);
  for (let i = 0; i < MASK_W * MASK_H; i++) {
    a[i * 4] = vecByte(flow.field[i * 2], flow.scale);
    a[i * 4 + 1] = vecByte(flow.field[i * 2 + 1], flow.scale);
    a[i * 4 + 2] = amountByte(mist[i]);
    a[i * 4 + 3] = amountByte(shimmer[i]);
    b[i * 4] = vecByte(sway.field[i * 2], sway.scale);
    b[i * 4 + 1] = vecByte(sway.field[i * 2 + 1], sway.scale);
    b[i * 4 + 2] = amountByte(stars[i]);
    b[i * 4 + 3] = 255;
  }
  return { a, b, flowScale: flow.scale, swayScale: sway.scale };
}

/** Every point a scene names, for checking that none is outside the photo. */
export function scenePoints(scene: Scene): Point[] {
  const out: Point[] = [];
  const shape = (s: Shape): void => {
    if (s.kind === 'ellipse') out.push(s.at);
    else out.push(...s.points);
  };
  const region = (r: Region): void => {
    shape(r.shape);
    (r.minus ?? []).forEach(shape);
  };
  (scene.flow ?? []).forEach(region);
  (scene.sway?.regions ?? []).forEach(region);
  (scene.mist?.regions ?? []).forEach(region);
  (scene.shimmer?.regions ?? []).forEach(region);
  (scene.stars ?? []).forEach(region);
  for (const l of scene.lights ?? []) out.push(l.at);
  return out;
}
