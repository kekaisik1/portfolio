/**
 * The one mutable state of the journey. Everything that draws reads from here; layout() and the frame loop write it.
 * Kept as a single plain object on purpose: the drawing is one picture, and its parts all need the same few numbers.
 */
import type { Growth, Lantern, Layer, PlaceObj, StrokeOp, WeatherKind } from './types';

/** Width of one cached strip of landscape, in CSS pixels. */
export const TILE = 1024;

export interface Dusk {
  w0: number;
  w1: number;
  i0: number;
  i1: number;
  deep: number;
}
export interface Plat {
  x0: number;
  x1: number;
  y: number;
  m: number;
  sh: number;
}
export interface Sprite {
  c: HTMLCanvasElement;
  w: number;
  h: number;
}

export interface WorldState {
  /** wide = sideways travel driven by vertical scroll; otherwise a vertical journey */
  wide: boolean;
  reduce: boolean;
  vw: number;
  vh: number;
  /** height of the scene canvas in CSS px */
  H: number;
  dpr: number;
  /** pixel scale of cached tiles and sprites */
  ps: number;
  /** furthest the scene travels, in track px */
  sMax: number;
  /** where each country begins, in track px */
  B: number[];
  END: number;
  /** width of the blend between two countries */
  T: number;
  /** narrow: scrollY -> track position, piecewise linear */
  knots: number[][];
  /** scroll position that shows each country */
  targets: number[];
  maxScroll: number;
  moonT: number;
  moonY: number;
  /** where the scene is now, and where the scroll says it should be */
  s: number;
  target: number;
  /** engine seconds: stops while hidden or under reduced motion */
  time: number;
  last: number;
  raf: number;
  visible: boolean;
  onscreen: boolean;
  layers: Layer[];
  nlayers: Layer[];
  clouds: { u: number; y: number; sc: number; spr: number; W: number }[];
  stars: { u: number; y: number; r: number; th: number; ph: number }[];
  waves: { u: number; f: number; y: number; len: number; ph: number; b: number }[];
  mists: { u: number; y: number; sc: number; sp: number; W: number }[];
  birds: { u: number; y: number; sp: number; ph: number; sc: number }[];
  flakes: { x: number; y: number; z: number; ph: number }[];
  flowers: { u: number; d: number; h: number; c: string | null; ph: number; night: boolean }[];
  intro: { t0: number; y0: number; skip: boolean } | null;
  introStrokes: { op: StrokeOp; far: boolean }[];
  /** bumped on every regeneration so stale background work can tell */
  gen: number;
  pumpId: number;
  navW: number;
  navLineY: ((x: number) => number) | null;
  lastDot: string;
  lastPlace: number;
  lastTrack: string;
  sky: string;
  built: boolean;
  cloudSprites: Sprite[];
  moonSprite: { c: HTMLCanvasElement; s: number } | null;
  mistSprite: Sprite | null;
  grain: HTMLCanvasElement | null;
  /** moon radius */
  R: number;
  haze: { x: number; y: number; w: number; h: number; pad: number }[];
  sun: { r: number; op: StrokeOp } | null;
  refl: { segs: Float32Array } | null;
  yurt: { x: number; y: number } | null;
  fire: { x: number; y: number } | null;
  lastMove: number;
  lastY: number;
  nudge: number;
  objs: PlaceObj[];
  /** stretches of ground that are taken, so scenery keeps clear */
  avoid: [number, number][];
  plats: Plat[];
  /** telephone lines: for each, points [u, top, groundY] */
  lines: number[][][];
  /** scroll positions: first screen, each place, the end */
  stops: number[];
  lastStop: number;
  yurtX: number | null;
  treeX: number | null;
  popX: number | null;
  bridgeX: number | null;
  sheepX: number | null;
  dusk: Dusk;
  /** the dusk right now: w = sun going down, ind = night coming down, deep = how far into it */
  D: { w: number; ind: number; deep: number };
  sunU: number;
  fireT: number | null;
  sNight: number;
  lanterns: Lantern[];
  shared: Lantern[];
  hashY: number;
  wx: WeatherKind;
  growth: Record<string, Growth>;
  words: string;
  skyKey: string;
  skyV: number;
  hazeKey: string;
  hazeV: number;
  hazeAny: boolean;
  /** focus is being moved by us: don't travel to it */
  suppress: boolean;
  /** the address is being changed by us: don't follow it */
  skipHash: boolean;
  /** the place you are inside, if any, and how far the going-in has got */
  inObj: PlaceObj | null;
  inSettled: boolean;
  inClosing: boolean;
}

export const S: WorldState = {
  wide: false,
  reduce: false,
  vw: 0,
  vh: 0,
  H: 0,
  dpr: 1,
  ps: 1,
  sMax: 1,
  B: [0, 0, 0, 0],
  END: 1,
  T: 400,
  knots: [
    [0, 0],
    [1, 1],
  ],
  targets: [0, 0, 0, 0],
  maxScroll: 1,
  moonT: 0,
  moonY: 0,
  s: 0,
  target: 0,
  time: 0,
  last: 0,
  raf: 0,
  visible: true,
  onscreen: true,
  layers: [],
  nlayers: [],
  clouds: [],
  stars: [],
  waves: [],
  mists: [],
  birds: [],
  flakes: [],
  flowers: [],
  intro: null,
  introStrokes: [],
  gen: 0,
  pumpId: 0,
  navW: 0,
  navLineY: null,
  lastDot: '',
  lastPlace: -1,
  lastTrack: '',
  sky: '',
  built: false,
  cloudSprites: [],
  moonSprite: null,
  mistSprite: null,
  grain: null,
  R: 44,
  haze: [],
  sun: null,
  refl: null,
  yurt: null,
  fire: null,
  lastMove: 0,
  lastY: 0,
  nudge: 0,
  objs: [],
  avoid: [],
  plats: [],
  lines: [],
  stops: [0, 1],
  lastStop: -1,
  yurtX: null,
  treeX: null,
  popX: null,
  bridgeX: null,
  sheepX: null,
  dusk: { w0: 1e9, w1: 1e9 + 1, i0: 1e9, i1: 1e9 + 1, deep: 1 },
  D: { w: 0, ind: 0, deep: 0 },
  sunU: 0,
  fireT: null,
  sNight: 0,
  lanterns: [],
  shared: [],
  hashY: 0,
  wx: '',
  growth: {},
  words: '',
  skyKey: '',
  skyV: 0,
  hazeKey: '',
  hazeV: 0,
  hazeAny: false,
  suppress: false,
  skipHash: false,
  inObj: null,
  inSettled: false,
  inClosing: false,
};
