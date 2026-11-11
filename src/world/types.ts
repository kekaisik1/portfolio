/** Shared shapes of the drawing engine. */
import type { Project } from '../content/types';
import type { Rnd } from '../lib/math';

export type { Rnd };
export type G = CanvasRenderingContext2D;
export type Box4 = [number, number, number, number];
export type Pt = [number, number];

/* ---- pencil strokes on the landscape layers ---- */
export interface PencilPass {
  pts: Float32Array;
  a: number;
  w: number;
}
export interface StrokeOpts {
  phase?: number;
  jit?: number;
  passes?: number;
  w?: number;
  color: string;
  alpha?: number;
}
export interface StrokeOp {
  phase: number;
  x0: number;
  x1: number;
  kind: 's';
  passes: PencilPass[];
  w: number;
  color: string;
  alpha: number;
}
export interface DrawOp {
  phase: number;
  x0: number;
  x1: number;
  kind?: undefined;
  draw(g: G, a: number, b: number): void;
}
export type LayerOp = StrokeOp | DrawOp;

export type LayerName = 'far' | 'mid' | 'near' | 'fg';
export interface LayerDef {
  name: LayerName;
  /** parallax factor: 1 moves with the track */
  f: number;
  top: number;
  bot: number;
  wash: number;
  ink: number;
  line: number;
  jit: number;
  washStops: readonly (readonly number[])[];
  seed: number;
  nofill?: boolean;
}
export interface Layer {
  d: LayerDef;
  f: number;
  W: number;
  n: number;
  step: number;
  ys: Float32Array;
  Ps: Float32Array;
  Cs: Float32Array;
  night: boolean;
  /** first tile worth rendering (the night copy starts where the dusk does) */
  from: number;
  top: number;
  bot: number;
  h: number;
  ops: LayerOp[];
  tiles: (HTMLCanvasElement | null)[];
  /** for each strip, its first row with anything on it (device pixels) */
  tileTop: number[];
  yAt(u: number): number;
  PAt(u: number): number;
  CAt(u: number): number;
  inkAt(u: number, a?: number): string;
}

/* ---- the sketch builder the places and rooms are drawn with ---- */
export type SkOp =
  | { k: 's'; passes: PencilPass[]; w: number; a: number; c: string }
  | { k: 'f'; pts: number[]; c: string; a: number }
  | { k: 'g'; arr: number[]; w: number; a: number; c: string }
  | { k: 't'; str: string; x: number; y: number; size: number; rot: number; c: string; a: number };
export type Parts = Record<string, SkOp[]>;
export type Warp = (x: number, y: number) => number[];

/** Options understood by one or another of the sketch tools; each tool reads only what it needs. */
export interface SkOpts {
  step?: number;
  jit?: number;
  passes?: number;
  w?: number;
  a?: number;
  c?: string;
  a0?: number;
  a1?: number;
  da?: number;
  r?: number;
  fill?: string;
  fa?: number;
  rot?: number;
  k?: number;
  rh?: number;
  bw?: number;
  d?: number;
  nx?: number;
  ny?: number;
  sill?: boolean;
  fl?: number;
  y?: number;
  lean?: number;
  tex?: 'brick' | 'stone' | 'plank' | 'timber';
  wall?: string;
  inset?: number;
  sh?: boolean;
  shc?: string;
  box?: boolean;
  arch?: boolean;
  sp?: number;
  h?: number;
}

export interface Sketch {
  rnd: Rnd;
  parts: Parts;
  tf(fn: Warp | null): Sketch;
  lift(fn: Warp | null): Sketch;
  part(n: string): Sketch;
  line(pts: number[], o?: SkOpts): Sketch;
  fill(pts: number[], c?: string, a?: number, r?: number): Sketch;
  segs(arr: number[], o?: SkOpts): Sketch;
  ell(cx: number, cy: number, rx: number, ry: number, o?: SkOpts): Sketch;
  dot(cx: number, cy: number, r: number, c?: string, a?: number): Sketch;
  rect(x: number, y: number, w: number, h: number, o?: SkOpts): Sketch;
  poly(pts: number[], o?: SkOpts): Sketch;
  text(str: string, x: number, y: number, size: number, o?: SkOpts): Sketch;
  hatch(x0: number, y0: number, x1: number, y1: number, sp: number, o?: SkOpts): Sketch;
  bricks(x0: number, y0: number, x1: number, y1: number, o?: SkOpts): Sketch;
  win(x: number, y: number, w: number, h: number, o?: SkOpts): Sketch;
  plants(x0: number, x1: number, y?: number, o?: SkOpts): Sketch;
  shrub(cx: number, y: number, r: number, c?: string): Sketch;
  bench(x: number, y: number, w?: number): Sketch;
  bike(x: number, y: number, k?: number): Sketch;
  pathTo(x: number, w: number, y?: number): Sketch;
  house(x: number, w: number, h: number, o?: SkOpts): Sketch;
  roofG(x: number, w: number, y: number, rise: number, o?: SkOpts): Sketch;
  roofH(x: number, w: number, y: number, rise: number, o?: SkOpts): Sketch;
  chim(x: number, y: number, w: number, h: number): Sketch;
  winS(x: number, y: number, w: number, h: number, o?: SkOpts): Sketch;
  door(x: number, w: number, h: number, o?: SkOpts): Sketch;
  fence(x0: number, x1: number, y: number, h: number, o?: SkOpts): Sketch;
  tree(x: number, y: number, h: number, kind?: 'round' | 'pine' | 'poplar', c?: string): Sketch;
  hill(x0: number, x1: number, y: number, h: number, o?: SkOpts): Sketch;
  lampP(x: number, y: number, h: number): Sketch;
  barrel(x: number, y: number, k?: number): Sketch;
  crate(x: number, y: number, w: number, h: number, c?: string): Sketch;
  stairs(cx: number, hw0: number, y0: number, n: number, rise: number, grow: number): Sketch;
  tufts(x0: number, x1: number, y: number, o?: SkOpts): Sketch;
}

/** The colours a place or room is inked with; `warm` is an "r,g,b" triple for glows. */
export interface Pal {
  ink: string;
  paper: string;
  fill: string;
  wash: string;
  dark: string;
  deep: string;
  blue: string;
  glass: string;
  gold: string;
  flag: string;
  red: string;
  redLit: string;
  lensFill: string;
  paperLit: string;
  water: string;
  leaf: string;
  sky: string;
  back: string;
  ground: string;
  focus: string;
  warm: string;
  [key: string]: string;
}

/* ---- places ---- */
export type LifeKind = 'ember' | 'ticket' | 'digit' | 'petal' | 'page' | 'ring' | 'bubble';
export interface LifeSpec {
  kind: LifeKind;
  /** where it comes from, as a fraction of the place's box (wide) */
  ax: number;
  ay: number;
  /** the same on a phone, if different */
  nax?: number;
  nay?: number;
  /** how many, relative to the others */
  n?: number;
  /** how bright, relative to the others */
  b?: number;
}
/** What the living part of a place is told each frame. */
export interface LiveState {
  /** hover/focus spring, may overshoot */
  h: number;
  /** the same, clamped to 0..1 */
  hc: number;
  /** seconds since the page started moving */
  t: number;
  /** how lit the windows are, 0..1 */
  lit: number;
  /** reduced motion: draw one calm frame */
  still: boolean;
}

/**
 * A place, in local coordinates: (0,0) is where it meets the ground, up is negative.
 * hit = the part you can press, ext = everything that gets drawn, size = how much of the screen's height it takes,
 * capAt = where its name is pencilled (bottom-left corner), wire = where the telephone line meets it.
 */
export interface PlaceSpec {
  hit: Box4;
  ext: Box4;
  size: number;
  /** vertical squash of the whole drawing */
  sy?: number;
  wire?: Pt;
  capAt: Pt;
  capW?: number;
  life?: LifeSpec;
  pins?: number[][];
  /** y of the waterline for a place that is mirrored in the water */
  refl?: number;
  sea?: 'island' | 'stilts';
  /** the middle of the scene: on a phone this fills the width */
  core?: Pt;
  /** where the door is: going in zooms at this point */
  door?: Pt;
  /** the place itself */
  build(s: Sketch): void;
  /** its one small moving part, drawn every frame over the kept drawing */
  live(g: G, parts: Parts, st: LiveState, pal: Pal): void;
  /** what stands behind it */
  pre?(s: Sketch): void;
  /** what it is built on or beside, drawn before and after the place */
  under?(s: Sketch): void;
  after?(s: Sketch): void;
  /** what is in front */
  post?(s: Sketch): void;
}
export interface PlaceDef extends PlaceSpec {
  /** ext and hit together: the sheet the place is drawn on */
  full: Box4;
}

/** Where a place is being drawn: its canvases and what never moves, drawn once and kept. */
export interface View {
  wrap: HTMLElement;
  /** the live sheet: kept drawing + moving part (or the whole thing while it draws itself) */
  cv: HTMLCanvasElement;
  g: G;
  cache: HTMLCanvasElement;
  cg: G;
  /** back and front sheets, which slide a little as you walk past (wide only) */
  bg: HTMLCanvasElement;
  bgg: G;
  fg: HTMLCanvasElement;
  fgg: G;
  ok: boolean;
  live: boolean;
  sc: number;
  pr: number;
  back: boolean;
  fx0: number;
  fw: number;
  /** last sheet offsets applied, so the DOM is only touched when they change */
  offBg: number;
  offFg: number;
  split: boolean;
}

export interface PlaceObj {
  p: Project;
  def: PlaceDef;
  btn: HTMLButtonElement;
  host: HTMLElement;
  cap: HTMLElement;
  parts: Parts;
  seq: SkOp[] | null;
  sc: number;
  x: number;
  base: number;
  bx: number;
  by: number;
  /** narrow: where its button is on the page */
  top: number;
  left: number;
  pal: Pal;
  view: View;
  hot: number;
  v: number;
  target: number;
  ring: number;
  ringT: number;
  drawn: number;
  going: boolean;
  vis: boolean;
  dirty: boolean;
  hover: boolean;
  focus: boolean;
  eve: number;
  cw: number;
  ch: number;
  pw: number;
  ph: number;
}

/* ---- rooms ---- */
export type SheetKind = 'book' | 'ledger' | 'ticket' | 'scroll' | 'letter' | 'card' | 'genko';
export interface RoomDef {
  /** the kind of paper its words are written on */
  sheet: SheetKind;
  wall?: string;
  floor?: string;
  win?: Box4;
  /** warm light: [x, y, radius, strength] */
  glow?: number[][];
  draw(s: Sketch): void;
}

/* ---- lanterns ---- */
export interface Lantern {
  /** where it hangs: fractions of the screen, and of the journey */
  fx: number;
  fy: number;
  fs: number;
  /** when it was let go (engine seconds), or -1 once it has arrived */
  t0: number;
  /** where it was let go from */
  x0: number;
  y0: number;
  s0: number;
  ph: number;
  /** it carries a note: it goes higher and bursts */
  note: boolean;
  burst?: number;
  /** other people's lanterns are smaller and further off (below 1) */
  far: number;
}

export interface Growth {
  total: number;
  week: number;
  day: number;
}
export type WeatherKind = '' | 'snow' | 'rain';
