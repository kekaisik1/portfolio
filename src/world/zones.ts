/**
 * Where you are along the journey, and what time of day that makes it.
 * The pure functions take their numbers as arguments (and are unit-tested); the short ones below read the live state.
 */
import { clamp, fbm, ridged, smooth, type Noise } from '../lib/math';
import { wt } from './palette';
import { S, type Dusk } from './state';
import type { LayerName } from './types';

/**
 * Place coordinate at track position t: 0 mountains, 1 steppe, 2 sea, 3 night.
 * B = where each country begins, T = width of the blend from one into the next.
 */
export function placeCoord(t: number, B: readonly number[], T: number): number {
  let P = 0;
  for (let i = 1; i < 4; i++) P += smooth((t - (B[i] - T / 2)) / T);
  return P;
}

/** The country (0..3) a place coordinate belongs to. */
export const zoneIndex = (P: number): number => clamp(Math.round(P), 0, 3);

/** Narrow layout: page scroll -> track position, along a piecewise-linear path of [scrollY, trackX] knots. */
export function trackAtScroll(y: number, k: readonly (readonly number[])[]): number {
  if (y <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (y <= k[i][0]) {
      const a = k[i - 1],
        b = k[i];
      return a[1] + ((b[1] - a[1]) * (y - a[0])) / Math.max(1, b[0] - a[0]);
    }
  }
  return k[k.length - 1][1];
}

export interface DuskNow {
  /** the sun going down (the sky warms) */
  w: number;
  /** the night coming down from the top */
  ind: number;
  /** how far into the night */
  deep: number;
}
/** Time of day at travel position v, written into `out` (no allocation per frame). */
export function duskAt(v: number, D: Dusk, out: DuskNow): DuskNow {
  out.w = smooth((v - D.w0) / (D.w1 - D.w0));
  out.ind = smooth((v - D.i0) / (D.i1 - D.i0));
  out.deep = smooth((v - D.i1) / D.deep);
  return out;
}

/** Index of the stop nearest to scroll position y: 0 is the first screen, then the places, then the end. */
export function nearestStop(stops: readonly number[], y: number): number {
  let b = 0,
    bd = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i] - y);
    if (d < bd) {
      bd = d;
      b = i;
    }
  }
  return b;
}

/** Layer coordinate <-> track coordinate for a layer moving at parallax factor f, in a viewport vw wide. */
export const trackToLayer = (t: number, f: number, vw: number): number => (t - vw / 2) * f + vw / 2;
export const layerToTrack = (u: number, f: number, vw: number): number => (u - vw / 2) / f + vw / 2;

/** Height of the skyline of a layer at layer coordinate u, where the place coordinate is P, on a sheet H tall. */
export function heightFor(name: LayerName, n: Noise, u: number, P: number, H: number): number {
  const w0 = wt(P, 0),
    w1 = wt(P, 1),
    w2 = wt(P, 2),
    w3 = wt(P, 3);
  let y;
  if (name === 'far')
    y = w0 * (0.6 - 0.34 * ridged(n, u / 210)) + w1 * (0.585 - 0.035 * fbm(n, u / 160 + 50)) + (w2 + w3) * 0.605;
  else if (name === 'mid')
    y =
      w0 * (0.71 - 0.37 * Math.pow(ridged(n, u / 270), 1.25)) +
      w1 * (0.64 - 0.045 * fbm(n, u / 220 + 30)) +
      (w2 + w3) * 0.612;
  else if (name === 'near')
    y =
      w0 * (0.8 - 0.1 * fbm(n, u / 170)) +
      w1 * (0.775 - 0.02 * fbm(n, u / 300 + 90)) +
      w2 * 0.955 +
      w3 * (0.85 - 0.035 * fbm(n, u / 240 + 20));
  else y = 0.99;
  return y * H;
}

/* ---- the same, read from the live state ---- */

export const placeAt = (t: number, Tw?: number): number => placeCoord(t, S.B, Tw || S.T);
export const tToU = (t: number, f: number): number => trackToLayer(t, f, S.vw);
export const uToT = (u: number, f: number): number => layerToTrack(u, f, S.vw);
export const sAtY = (y: number): number => trackAtScroll(y, S.knots);
/** Where the scroll position says the scene should be. */
export function readTarget(): number {
  const y = window.scrollY || 0;
  return S.wide ? clamp(y, 0, S.sMax) : sAtY(y);
}
export const placeNow = (): number => placeAt(S.s + S.vw / 2);
export const currentPlace = (): number => zoneIndex(placeNow());
export const nearStop = (y: number): number => nearestStop(S.stops, y);
/** The dusk: updates S.D for where you are now. */
export const duskNow = (): DuskNow => duskAt(S.wide ? S.s : window.scrollY, S.dusk, S.D);
/** Is this stretch of ground taken (by a place or a pole)? */
export function inAvoid(u: number, pad: number): boolean {
  for (const [a, b] of S.avoid) if (u > a - pad && u < b + pad) return true;
  return false;
}
