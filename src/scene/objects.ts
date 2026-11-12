/**
 * The cut-outs of the journey: which painting stands where, how far away, and over which stretch of the walk.
 *
 * x, y: rest position of the piece's ground point inside the scene box (0..1); h: its height as a share of the box.
 * z0: distance from the camera when you stand at its stop; rate: how fast the camera closes in (far layers drift
 * slowly). from/to: the stretch of the walk (in stops) where it is fully painted; it soaks in for about half a stop
 * before and dries away for half a stop after. `m` overrides x/y/h on phones, where the scene sits under the words.
 */
import type { Kind } from '../paint/kinds';

export type Life = 'smoke' | 'bob' | 'glide' | 'flick';

export interface Placement {
  x: number;
  y: number;
  h: number;
}

export interface CutDef extends Placement {
  /** unique; defaults to the kind */
  id?: string;
  k: Kind;
  stop: number;
  z0: number;
  rate?: number;
  from: number;
  to: number;
  /** a far layer: no fog, drawn behind the near ones */
  far?: boolean;
  /** belongs to the night: lives above the night wash */
  night?: boolean;
  /** the place this piece stands for: clicking it goes inside */
  slug?: string;
  /** small life, and where it is anchored (painting units) */
  life?: Life;
  lifeAt?: readonly [number, number];
  m?: Partial<Placement>;
}

export const CUTS: readonly CutDef[] = [
  /* mountains: the greeting, The Front Desk, The Numbers Room */
  { k: 'peaks', stop: 1, z0: 3.4, rate: 0.35, x: 0.56, y: 0.5, h: 0.6, from: -1, to: 2.35, far: true },
  { k: 'range2', stop: 1, z0: 2.4, rate: 0.45, x: 0.5, y: 0.64, h: 0.3, from: -1, to: 2.3, far: true },
  { k: 'meadow', stop: 0, z0: 1.4, x: 0.82, y: 0.93, h: 0.2, from: -1, to: 0.4 },
  { k: 'spruces', stop: 0, z0: 1.1, x: 0.1, y: 1.02, h: 0.78, from: -1, to: 0.35, m: { x: 0.06, h: 0.7 } },
  {
    k: 'hut',
    stop: 1,
    z0: 1.35,
    x: 0.6,
    y: 0.8,
    h: 0.44,
    from: -1,
    to: 1.4,
    slug: 'front-desk',
    life: 'smoke',
    lifeAt: [322, -4],
  },
  { k: 'walker', stop: 1, z0: 1.15, x: 0.88, y: 0.92, h: 0.2, from: 0.6, to: 1.35 },
  { k: 'rock', stop: 1, z0: 0.95, x: 0.1, y: 1, h: 0.22, from: 0.75, to: 1.35 },
  { k: 'observatory', stop: 2, z0: 1.35, x: 0.56, y: 0.8, h: 0.5, from: 1.45, to: 2.4, slug: 'numbers-room' },
  { k: 'spruce1', stop: 2, z0: 1.05, x: 0.93, y: 1.03, h: 0.82, from: 1.25, to: 2.35 },
  { id: 'meadow2', k: 'meadow', stop: 2, z0: 1.2, x: 0.2, y: 0.97, h: 0.18, from: 1.3, to: 2.4 },
  /* steppe: LOWL, Emberquill */
  { k: 'hills', stop: 3.5, z0: 3, rate: 0.3, x: 0.5, y: 0.56, h: 0.3, from: 2.7, to: 4.4, far: true },
  { k: 'poles', stop: 3, z0: 1.6, x: 0.24, y: 0.74, h: 0.46, from: 2.75, to: 3.4, m: { x: 0.04, h: 0.4 } },
  { k: 'shed', stop: 3, z0: 1.35, x: 0.62, y: 0.82, h: 0.42, from: 2.7, to: 3.4, slug: 'lowl' },
  { k: 'grass', stop: 3, z0: 1, x: 0.94, y: 1.02, h: 0.34, from: 2.8, to: 3.35 },
  {
    k: 'yurt',
    stop: 4,
    z0: 1.35,
    x: 0.52,
    y: 0.82,
    h: 0.42,
    from: 3.4,
    to: 4.4,
    slug: 'emberquill',
    life: 'smoke',
    lifeAt: [250, 40],
  },
  { k: 'elm', stop: 4, z0: 1.8, x: 0.86, y: 0.74, h: 0.62, from: 3.3, to: 4.45 },
  { k: 'horses', stop: 4, z0: 1.1, x: 0.2, y: 0.95, h: 0.26, from: 3.4, to: 4.35 },
  /* sea: History Lens, BookForge, Kana Notebook */
  {
    k: 'water',
    stop: 6,
    z0: 3,
    rate: 0.3,
    x: 0.5,
    y: 0.6,
    h: 0.27,
    from: 4.75,
    to: 7.25,
    far: true,
    m: { y: 0.42, h: 0.34 },
  },
  {
    k: 'gulls',
    stop: 6,
    z0: 2.2,
    rate: 0.45,
    x: 0.74,
    y: 0.3,
    h: 0.11,
    from: 4.8,
    to: 7.2,
    far: true,
    life: 'glide',
    m: { y: 0.16 },
  },
  { k: 'lighthouse', stop: 5, z0: 1.4, x: 0.64, y: 0.8, h: 0.7, from: 4.72, to: 5.4, slug: 'history-lens' },
  { k: 'reeds', stop: 5, z0: 0.95, x: 0.1, y: 1.02, h: 0.5, from: 4.8, to: 5.35 },
  { k: 'pier', stop: 6, z0: 1.35, x: 0.55, y: 0.8, h: 0.4, from: 5.45, to: 6.4, slug: 'bookforge', m: { y: 0.72 } },
  { k: 'nets', stop: 6, z0: 1.15, x: 0.2, y: 0.95, h: 0.34, from: 5.3, to: 6.4 },
  { id: 'reeds2', k: 'reeds', stop: 6, z0: 1, x: 0.93, y: 1.02, h: 0.42, from: 5.35, to: 6.35 },
  {
    k: 'boat',
    stop: 7,
    z0: 1.35,
    x: 0.58,
    y: 0.8,
    h: 0.46,
    from: 6.45,
    to: 7.2,
    slug: 'kana-notebook',
    life: 'bob',
    m: { y: 0.72 },
  },
  { k: 'beach', stop: 7, z0: 1.15, x: 0.2, y: 0.96, h: 0.3, from: 6.3, to: 7.2 },
  { id: 'reeds3', k: 'reeds', stop: 7, z0: 1.05, x: 0.94, y: 1.02, h: 0.38, from: 6.35, to: 7.2 },
  /* night: about, contact */
  { k: 'stars', stop: 8.5, z0: 5, rate: 0.1, x: 0.5, y: 0.62, h: 0.78, from: 7.25, to: 99, far: true, night: true },
  {
    k: 'moon',
    stop: 8.5,
    z0: 4,
    rate: 0.12,
    x: 0.8,
    y: 0.34,
    h: 0.3,
    from: 7.3,
    to: 99,
    far: true,
    night: true,
    m: { x: 0.82, y: 0.36, h: 0.16 },
  },
  {
    k: 'nighthills',
    stop: 8.5,
    z0: 2.6,
    rate: 0.3,
    x: 0.5,
    y: 0.78,
    h: 0.36,
    from: 7.35,
    to: 99,
    far: true,
    night: true,
  },
  {
    k: 'nightsteppe',
    stop: 8.5,
    z0: 2,
    rate: 0.35,
    x: 0.5,
    y: 0.86,
    h: 0.36,
    from: 7.35,
    to: 99,
    far: true,
    night: true,
  },
  { k: 'nightyurt', stop: 8, z0: 1.35, x: 0.62, y: 0.84, h: 0.42, from: 7.4, to: 8.3, night: true },
  { k: 'nightgrass', stop: 8, z0: 1, x: 0.08, y: 1.03, h: 0.36, from: 7.45, to: 8.3, night: true },
  { k: 'lanterns', stop: 9, z0: 1.25, x: 0.6, y: 0.84, h: 0.56, from: 8.6, to: 99, night: true, life: 'flick' },
  { id: 'ng2', k: 'nightgrass', stop: 9, z0: 1, x: 0.95, y: 1.03, h: 0.34, from: 8.65, to: 99, night: true },
];

export const cutId = (c: CutDef): string => c.id ?? c.k;
/** the cut-out that stands for a place */
export const cutOfSlug = (slug: string): CutDef | undefined => CUTS.find((c) => c.slug === slug);
