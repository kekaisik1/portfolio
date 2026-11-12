/** Shapes several paintings share: spruce, horse, yurt, a standing figure, a lantern, a wash torn out at its ends. */
import type { Painter, Shape, WashOpts } from './painter';
import { line, poly, smoothPath, taper, type Pts } from './svg';

/** Light pigment on dark paper (the night): normal blending, blooms that darken, no hue drift. */
export const NB: WashOpts = { blend: 'normal', bloomColor: [0.08, 0.1, 0.2], hue: 0 };

interface SpruceParts {
  sil: string;
  shade: string;
  under: Shape[];
  trunk: Shape;
}

/** One spruce: tiers of drooping branches, a shaded right side, dark undersides. Base at (x, base), h tall. */
export function spruce(P: Painter, x: number, base: number, h: number, wr = 0.34): SpruceParts {
  const w = h * wr,
    tiers = Math.round(P.rand(9, 13)),
    top = base - h,
    th = (h * 0.9) / tiers;
  const R: number[][] = [],
    L: number[][] = [],
    under: Shape[] = [];
  const lean = P.rand(-0.04, 0.04) * h;
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers,
      cx = x + lean * (1 - t),
      yb = top + h * 0.9 * t + P.rand(-th * 0.3, th * 0.3);
    const twR = w * (0.1 + 0.9 * Math.pow(t, 0.85)) * P.rand(0.7, 1.15) * 0.5,
      twL = w * (0.1 + 0.9 * Math.pow(t, 0.85)) * P.rand(0.7, 1.15) * 0.5;
    const yi = yb - th * P.rand(0.3, 0.6),
      dR = P.rand(2, 10),
      dL = P.rand(2, 10);
    R.push([cx + twR * P.rand(0.45, 0.7), yi], [cx + twR * 0.92, yb + dR * 0.5], [cx + twR, yb + dR]);
    L.push([cx - twL * P.rand(0.45, 0.7), yi + P.rand(-2, 2)], [cx - twL * 0.92, yb + dL * 0.5], [cx - twL, yb + dL]);
    if (P.r() < 0.6)
      under.push({
        d: line([
          [cx - twL * 0.5, yb + 1],
          [cx + twR * 0.8, yb + dR * 0.6],
        ]),
        sw: Math.max(2, th * 0.22),
      });
  }
  const sil = [
    [x + lean + P.rand(-1.5, 1.5), top - h * 0.03],
    ...R,
    [x + 2, base - h * 0.08],
    [x - 2, base - h * 0.08],
    ...L.slice().reverse(),
  ];
  const shade = [[x + lean + 1, top], ...R, [x + 2, base - h * 0.08], [x + w * 0.06, top + h * 0.6]];
  return {
    sil: smoothPath(sil),
    shade: smoothPath(shade),
    under,
    trunk: {
      d: taper(
        [
          [x, base + 2],
          [x + 0.5, base - h * 0.2],
        ],
        Math.max(4, h * 0.03),
        2,
      ),
    },
  };
}

export interface SpruceColours {
  a?: string;
  b?: string;
  c?: string;
  d?: string;
}

/** A stand of spruces painted together, so their washes merge like one wet passage. [x, base, height, width ratio?] */
export function spruceGroup(P: Painter, list: readonly (readonly number[])[], colors: SpruceColours = {}): void {
  const S = list.map((t) => spruce(P, t[0], t[1], t[2], t[3]));
  P.wash(
    S.map((s) => s.trunk),
    { fill: '#5B4634', op: 0.75, disp: 3, freq: 0.06, rim: 0.4 },
  );
  P.wash(
    S.map((s) => ({
      d: s.sil,
      fill: P.grad([
        [0, colors.a ?? '#7FA492'],
        [0.7, colors.b ?? '#5F8A78'],
        [1, '#6E8E6A'],
      ]),
    })),
    { op: 0.62, disp: 9, freq: 0.045, gran: 0.5, rim: 0.7, bloom: 0.35, fleck: 0.25, fleckFreq: '0.05 0.09' },
  );
  P.wash(
    S.map((s) => ({ d: s.shade, fill: colors.c ?? '#2F4F45' })),
    { op: 0.58, disp: 8, freq: 0.05, gran: 0.55, rim: 0.6, fleck: 0.3 },
  );
  P.wash(
    S.flatMap((s) => s.under),
    { stroke: colors.d ?? '#1F3A32', op: 0.26, disp: 5, freq: 0.07, rim: 0, gran: 0.3, bloom: 0 },
  );
}

/* a horse standing, head up, and one grazing; feet at y = 0, facing +x */
export const HORSE_UP: Pts = [
  [-62, -92],
  [-20, -97],
  [28, -100],
  [50, -116],
  [66, -138],
  [70, -150],
  [75, -141],
  [84, -136],
  [103, -112],
  [100, -103],
  [86, -106],
  [70, -100],
  [60, -80],
  [57, -56],
  [55, -30],
  [57, -2],
  [49, -1],
  [47, -30],
  [44, -55],
  [36, -60],
  [31, -55],
  [29, -28],
  [31, -2],
  [23, -1],
  [21, -30],
  [22, -58],
  [0, -60],
  [-30, -60],
  [-40, -57],
  [-38, -38],
  [-43, -22],
  [-39, -2],
  [-47, -1],
  [-51, -22],
  [-55, -40],
  [-58, -46],
  [-60, -24],
  [-56, -2],
  [-64, -1],
  [-68, -26],
  [-71, -56],
  [-73, -76],
];
export const HORSE_DOWN: Pts = [
  [-62, -92],
  [-20, -97],
  [28, -99],
  [56, -88],
  [80, -52],
  [92, -30],
  [99, -8],
  [93, -3],
  [84, -14],
  [70, -40],
  [58, -66],
  [57, -56],
  [55, -30],
  [57, -2],
  [49, -1],
  [47, -30],
  [44, -55],
  [36, -60],
  [31, -55],
  [29, -28],
  [31, -2],
  [23, -1],
  [21, -30],
  [22, -58],
  [0, -60],
  [-30, -60],
  [-40, -57],
  [-38, -38],
  [-43, -22],
  [-39, -2],
  [-47, -1],
  [-51, -22],
  [-55, -40],
  [-58, -46],
  [-60, -24],
  [-56, -2],
  [-64, -1],
  [-68, -26],
  [-71, -56],
  [-73, -76],
];

export interface HorseOpts {
  /** body colour and the dark of mane, tail and hooves */
  col: string;
  dark: string;
  graze: boolean;
  /** light pigment on dark paper (the night) */
  night?: boolean;
}

/** A painted horse with its feet at (x, gy), s times its drawn size, dir 1 = facing right. */
export function horse(P: Painter, x: number, gy: number, s: number, dir: number, h: HorseOpts): void {
  const T = (pts: Pts): number[][] => pts.map(([px, py]) => [x + px * dir * s, gy + py * s]);
  const o: WashOpts = h.night ? NB : {};
  const sil = poly(T(h.graze ? HORSE_DOWN : HORSE_UP));
  P.soft([P.blob(x + 30 * s, gy + 2, 80 * s, 7 * s, 0.2, 10)], {
    op: 0.3,
    blur: 4,
    ...(h.night ? { fill: '#080C1A', blend: 'normal' } : {}),
  });
  P.wash(
    [
      {
        d: sil,
        fill: P.grad(
          [
            [0, h.col],
            [1, h.dark],
          ],
          0,
          0.2,
          0,
          1,
        ),
      },
    ],
    { op: 0.82, disp: 2.5, freq: 0.06, gran: 0.5, rim: 0.75, bloom: 0.25, fleck: 0.2, ...o },
  );
  P.wash(
    [
      P.blob(x - 6 * dir * s, gy - 66 * s, 46 * s, 9 * s, 0.15, 10),
      P.blob(x - 55 * dir * s, gy - 80 * s, 14 * s, 12 * s, 0.2, 8),
    ],
    { fill: h.dark, op: 0.35, disp: 4, gran: 0.4, rim: 0.2, wet: 1.5, ...o },
  );
  P.wash(
    [
      {
        d: taper(
          T([
            [-68, -88],
            [-80, -66],
            [-80, -40],
            [-76, -24],
          ]),
          9 * s,
          3 * s,
        ),
      },
    ],
    { fill: h.dark, op: 0.85, disp: 2, rim: 0.4, ...o },
  );
  const mane = h.graze
    ? [
        [26, -100],
        [52, -90],
        [74, -60],
      ]
    : [
        [26, -100],
        [48, -116],
        [64, -140],
      ];
  P.wash([{ d: taper(T(mane), 7 * s, 3 * s) }], { fill: h.dark, op: 0.8, disp: 1.5, rim: 0.3, ...o });
  P.wash(
    T([
      [55, -8],
      [27, -8],
      [-43, -8],
      [-60, -8],
    ]).map(([px, py]) => P.blob(px, py + 4 * s, 5 * s, 5 * s, 0.1, 8)),
    { fill: '#2A1E19', op: 0.7, disp: 1, rim: 0.3, ...o },
  );
}

export interface YurtShape {
  wall: string;
  roof: string;
  l: number;
  r: number;
  wt: number;
  crown: number;
}

/** A yurt w wide standing on `base`: felt wall and domed roof. */
export function yurtShape(cx: number, base: number, w: number): YurtShape {
  const l = cx - w / 2,
    r = cx + w / 2,
    wt = base - w * 0.36,
    crown = base - w * 0.7;
  return {
    wall: smoothPath([
      [l, wt],
      [cx, wt + 6],
      [r, wt],
      [r + 2, base - 6],
      [cx, base + 6],
      [l - 2, base - 6],
    ]),
    roof: smoothPath([
      [l - 10, wt + 2],
      [l + w * 0.18, wt - w * 0.17],
      [cx - w * 0.1, crown + 2],
      [cx + w * 0.1, crown + 2],
      [r - w * 0.18, wt - w * 0.17],
      [r + 10, wt + 2],
      [cx, wt + 10],
    ]),
    l,
    r,
    wt,
    crown,
  };
}

/** A band of wash between top(x) and bot(x) that tears out irregularly at both ends instead of stopping in a cut. */
export function ragBand(
  P: Painter,
  x0: number,
  x1: number,
  top: (x: number) => number,
  bot: (x: number) => number,
  taperLen = 160,
): string {
  const T: number[][] = [],
    B: number[][] = [];
  for (let x = x0; x <= x1 + 0.1; x += 18) {
    const e = Math.min(x - x0, x1 - x) / taperLen,
      k = e >= 1 ? 1 : Math.max(0, e) * P.rand(0.45, 1.25);
    const t = top(x),
      b = bot(x),
      m = (t + b) / 2;
    T.push([x, m - (m - t) * Math.min(1, k)]);
    B.push([x + P.rand(-6, 6), m + (b - m) * Math.min(1, k * P.rand(0.6, 1.3))]);
  }
  return poly([...T, ...B.reverse()]);
}

export interface PersonColours {
  coat?: string;
  legs?: string;
  arm?: string;
  scarf?: string;
  skin?: string;
  hair?: string;
  shadow?: number;
  /** extra wash options for every part (the night passes NB and its own texture) */
  o?: WashOpts;
}

/** A standing figure, feet at (x, gy), s times the drawn size. */
export function personAt(P: Painter, x: number, gy: number, s: number, c: PersonColours = {}): void {
  const T = (pts: Pts): number[][] => pts.map(([px, py]) => [x + (px - 76) * s, gy + (py - 252) * s]);
  const o = c.o ?? {};
  P.soft(
    [
      poly(
        T([
          [60, 248],
          [150, 254],
          [148, 264],
          [58, 260],
        ]),
      ),
    ],
    { op: 0.3 * (c.shadow ?? 1), blur: 4 },
  );
  P.wash(
    [
      {
        d: smoothPath(
          T([
            [68, 150],
            [58, 200],
            [50, 250],
          ]),
          false,
        ),
        sw: 12 * s,
      },
      {
        d: smoothPath(
          T([
            [86, 150],
            [92, 200],
            [100, 248],
          ]),
          false,
        ),
        sw: 12 * s,
      },
    ],
    { stroke: c.legs ?? '#2E3440', op: 0.88, disp: 2, freq: 0.06, rim: 0.4, ...o },
  );
  P.wash(
    [
      smoothPath(
        T([
          [58, 62],
          [92, 60],
          [100, 106],
          [102, 160],
          [54, 162],
          [52, 104],
        ]),
      ),
    ],
    { fill: c.coat ?? '#4E6E80', op: 0.88, disp: 3, freq: 0.06, gran: 0.5, rim: 0.7, ...o },
  );
  P.wash(
    [
      {
        d: smoothPath(
          T([
            [90, 72],
            [100, 108],
            [96, 140],
          ]),
          false,
        ),
        sw: 9 * s,
      },
      {
        d: smoothPath(
          T([
            [60, 72],
            [52, 108],
            [56, 140],
          ]),
          false,
        ),
        sw: 9 * s,
      },
    ],
    { stroke: c.arm ?? c.coat ?? '#3F5B6A', op: 0.85, disp: 2, rim: 0.4, ...o },
  );
  if (c.scarf)
    P.wash(
      [
        smoothPath(
          T([
            [60, 60],
            [92, 58],
            [90, 72],
            [62, 74],
          ]),
        ),
      ],
      { fill: c.scarf, op: 0.9, disp: 2, rim: 0.5, ...o },
    );
  const [hx, hy] = T([[76, 42]])[0];
  P.wash([P.blob(hx, hy, 13 * s, 14 * s, 0.08, 10)], { fill: c.skin ?? '#C49478', op: 0.9, disp: 1.5, rim: 0.5, ...o });
  P.wash(
    [
      smoothPath(
        T([
          [62, 36],
          [76, 24],
          [92, 34],
          [86, 40],
          [66, 42],
        ]),
      ),
    ],
    { fill: c.hair ?? '#2E2A28', op: 0.88, disp: 1.5, rim: 0.3, ...o },
  );
}

export interface LanternParts {
  body: string;
  cap: string;
  foot: string;
}

/** A paper lantern centred at (x, y). */
export function lanternShape(P: Painter, x: number, y: number, s: number): LanternParts {
  return {
    body: P.blob(x, y, 15 * s, 21 * s, 0.06, 12),
    cap: line([
      [x - 8 * s, y - 21 * s],
      [x + 8 * s, y - 21 * s],
    ]),
    foot: line([
      [x - 7 * s, y + 21 * s],
      [x + 7 * s, y + 21 * s],
    ]),
  };
}
