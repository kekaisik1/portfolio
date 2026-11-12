/**
 * The night: pigment on dark paper. The dusk that rises over the sea, the moon, the hills and the sleeping steppe,
 * the yurt with its door open, the string of lanterns and their light pooling on the ground.
 * Every wash here goes through the same granulation, pooled rim and dry-brush stack as the day: mid-tone blues
 * (not near-black) so the texture can be seen, and a lighter moonlit edge on the side the moon is on (the right).
 */
import type { GradStop, Painter, ShapeIn, WashOpts } from '../painter';
import { HORSE_DOWN, NB, lanternShape, personAt, ragBand, yurtShape } from '../motifs';
import { line, poly, smoothPath, taper, type Pts } from '../svg';
import type { PaintDefs } from './types';

/** a granulating night wash: visible tooth, pooled rim, dry brush at the edge */
const NT: WashOpts = { ...NB, gran: 0.62, granDark: 0.55, rim: 0.8, bloom: 0.3, fleck: 0.3, granFreq: 0.3 };
const nightWash = (P: Painter, shapes: readonly ShapeIn[], o: WashOpts): void => P.wash(shapes, { ...NT, ...o });

/** shift a point list (for the moonlit copy of a shape, a little up and to the right) */
const shift = (pts: Pts, dx: number, dy: number): number[][] => pts.map(([x, y]) => [x + dx, y + dy]);

const WARM: readonly GradStop[] = [
  [0, '#F6D27A'],
  [1, '#E39A48'],
];

/** where lanterns hang on the string (in the lanterns painting's own units) */
export const STRING = { x0: 62, x1: 678, y: 84, sag: 90 } as const;
export const sagAt = (x: number): number =>
  STRING.y + Math.sin(((x - STRING.x0) / (STRING.x1 - STRING.x0)) * Math.PI) * STRING.sag;
/** the five lanterns painted on the string; visitors' lanterns hang between them */
export const PAINTED_LANTERNS = [150, 260, 370, 480, 590] as const;

/** a light wash of warm lantern-light on the ground: granulated, with a pooled rim, not a blurred bar */
function lightPool(P: Painter, xs: readonly number[], y: number, rx: number, ry: number): void {
  P.soft(
    xs.map((x) => P.blob(x, y, rx * 1.1, ry * 1.4, 0.25, 10)),
    { fill: '#F2B65A', op: 0.28, blur: 12, ...NB },
  );
  nightWash(
    P,
    xs.map((x) => P.blob(x + P.rand(-8, 8), y + P.rand(-2, 2), rx * P.rand(0.8, 1.1), ry * P.rand(0.8, 1.15), 0.3, 12)),
    { fill: '#E7A456', op: 0.46, disp: 9, freq: 0.05, wet: 1.5, gran: 0.5, granDark: 0.7, rim: 0.55, fleck: 0.25 },
  );
  nightWash(
    P,
    xs.map((x) => P.blob(x, y - ry * 0.2, rx * 0.42, ry * 0.42, 0.3, 10)),
    { fill: '#F6D27A', op: 0.5, disp: 6, freq: 0.06, gran: 0.35, granDark: 0.8, rim: 0.4, fleck: 0 },
  );
}

export const NIGHT = {
  /* the dusk: a wash that rises from the horizon over the sea, wet warm edge first, deep blue behind it.
     Its bottom ends in the plain night colour the page continues with (--night-deep in tokens.css). */
  dusk: {
    w: 1600,
    h: 900,
    seed: 401,
    paint(P) {
      const edge = (x: number): number => 70 + Math.sin(x * 0.004 + 1) * 26 + Math.sin(x * 0.013) * 12;
      P.wash(
        [
          {
            d: ragBand(P, -40, 1640, edge, () => 960, 10),
            fill: P.grad([
              [0, '#ECC39C'],
              [0.1, '#DDA796'],
              [0.22, '#A98C9E'],
              [0.36, '#6E6A92'],
              [0.52, '#3C4874'],
              [0.68, '#243058'],
              [0.8, '#1D2747'],
              [1, '#1D2747'],
            ]),
          },
        ],
        {
          op: 1,
          disp: 22,
          freq: 0.012,
          gran: 0.42,
          granDark: 0.8,
          rim: 0.9,
          rimBlur: 7,
          bloom: 0,
          fleck: 0.4,
          fleckFreq: '0.006 0.08',
          hue: 10,
          blend: 'normal',
        },
      );
      /* warm streaks of the last light, lying along the horizon */
      const streaks: string[] = [];
      for (let i = 0; i < 9; i++) {
        const y = 150 + P.rand(0, 170),
          w = P.rand(220, 620),
          x = P.rand(-60, 1600 - w * 0.5);
        streaks.push(P.blob(x + w / 2, y, w / 2, P.rand(8, 20), 0.35, 12));
      }
      P.wash(streaks, {
        fill: '#F0C08E',
        op: 0.32,
        disp: 10,
        freq: 0.02,
        gran: 0.5,
        rim: 0.6,
        fleck: 0.5,
        fleckFreq: '0.008 0.2',
        fleckEdge: false,
        blend: 'normal',
      });
      /* violet cloud bellies, darker, further up the wash */
      const clouds: string[] = [];
      for (let i = 0; i < 7; i++)
        clouds.push(P.blob(P.rand(0, 1600), 330 + P.rand(0, 180), P.rand(160, 360), P.rand(16, 34), 0.4, 12));
      P.wash(clouds, {
        fill: '#55557E',
        op: 0.36,
        disp: 12,
        freq: 0.025,
        gran: 0.6,
        granDark: 0.65,
        rim: 0.7,
        fleck: 0.3,
        blend: 'normal',
      });
      /* the last tenth is the flat night colour, so the page's night continues it without a seam */
      P.under(
        [
          poly([
            [-20, 620],
            [1620, 620],
            [1620, 920],
            [-20, 920],
          ]),
        ],
        {
          disp: 0,
          fill: P.grad([
            [0, '#1D2747', 0],
            [0.55, '#1D2747', 1],
            [1, '#1D2747', 1],
          ]),
        },
      );
    },
  },
  moon: {
    w: 380,
    h: 380,
    seed: 181,
    paint(P) {
      P.soft([P.blob(190, 190, 150, 150, 0.1, 16)], { fill: '#E9E2C8', op: 0.16, blur: 26, ...NB });
      P.wash([P.blob(190, 190, 72, 72, 0.03, 18)], {
        fill: P.rgrad(
          [
            [0, '#F6EFD8'],
            [1, '#E6DAB6'],
          ],
          0.42,
          0.4,
          0.6,
        ),
        op: 0.96,
        disp: 4,
        freq: 0.05,
        gran: 0.35,
        granDark: 0.85,
        rim: 0.3,
        bloom: 0.3,
        ...NB,
      });
      P.wash([P.blob(168, 172, 22, 16, 0.3), P.blob(212, 214, 18, 12, 0.3), P.blob(200, 160, 10, 8, 0.3)], {
        fill: '#CBBF9C',
        op: 0.55,
        disp: 4,
        gran: 0.4,
        rim: 0.4,
      });
    },
  },
  nighthills: {
    w: 1500,
    h: 360,
    seed: 191,
    fade: { x: 0.16, b: 0.25 },
    paint(P) {
      const top: number[][] = [];
      for (let x = 0; x <= 1500; x += 25)
        top.push([x, 160 + Math.sin(x * 0.004 + 1) * 40 + Math.sin(x * 0.013) * 14 + P.rand(-3, 3)]);
      /* far hill: slate violet, granulating */
      nightWash(
        P,
        [
          {
            d: poly([[0, 360], ...top, [1500, 360]]),
            fill: P.grad([
              [0, '#45527F'],
              [1, '#2A3459'],
            ]),
          },
        ],
        {
          op: 0.95,
          disp: 12,
          freq: 0.03,
          bloom: 0.35,
        },
      );
      /* moonlit crest: dry brush along the top edge */
      const lit2 = top
        .slice()
        .reverse()
        .map(([x, y]) => [x, y + 16 + Math.sin(x * 0.03) * 6]);
      nightWash(P, [poly([...shift(top, 0, 2), ...lit2])], {
        fill: '#8494BE',
        op: 0.5,
        disp: 6,
        freq: 0.04,
        gran: 0.5,
        rim: 0.4,
        fleck: 0.55,
        fleckFreq: '0.02 0.3',
      });
      /* a nearer fold, a shade darker, and pools of shadow in its hollows */
      const fold: number[][] = [];
      for (let x = 0; x <= 1500; x += 30) fold.push([x, 236 + Math.sin(x * 0.006 + 3) * 22 + P.rand(-3, 3)]);
      nightWash(P, [{ d: poly([[0, 360], ...fold, [1500, 360]]), fill: '#2B3560' }], {
        op: 0.75,
        disp: 10,
        freq: 0.03,
      });
      nightWash(P, [P.blob(400, 300, 380, 40, 0.3), P.blob(1100, 316, 420, 36, 0.3)], {
        fill: '#1A2142',
        op: 0.5,
        disp: 12,
        rim: 0.4,
      });
    },
  },
  nightsteppe: {
    w: 1500,
    h: 400,
    seed: 193,
    fade: { x: 0.18, b: 0, n: 1 },
    paint(P) {
      const top = (x: number): number => 318 + Math.sin(x * 0.005 + 2) * 14 + Math.sin(x * 0.017) * 5;
      /* the ground: a mid-tone granulating wash, darker pools, moonlit streaks of grass */
      nightWash(
        P,
        [
          {
            d: ragBand(P, 0, 1500, top, () => 400, 120),
            fill: P.grad([
              [0, '#2E3964'],
              [1, '#1C2444'],
            ]),
          },
        ],
        {
          op: 0.96,
          disp: 9,
          freq: 0.03,
        },
      );
      const pools: string[] = [];
      for (let i = 0; i < 7; i++)
        pools.push(P.blob(P.rand(80, 1420), P.rand(352, 388), P.rand(90, 200), P.rand(8, 14), 0.3, 10));
      nightWash(P, pools, { fill: '#151B36', op: 0.5, disp: 10, rim: 0.5 });
      const streaks: { d: string; sw: number }[] = [];
      for (let i = 0; i < 34; i++) {
        const x = P.rand(30, 1440),
          y = top(x) + P.rand(6, 70);
        streaks.push({
          d: line([
            [x, y],
            [x + P.rand(40, 140), y + P.rand(-3, 3)],
          ]),
          sw: P.rand(1.5, 3.2),
        });
      }
      nightWash(P, streaks, {
        stroke: '#6E7EAA',
        op: 0.42,
        disp: 4,
        freq: 0.05,
        rim: 0,
        gran: 0.4,
        bloom: 0,
        fleck: 0.5,
        fleckFreq: '0.1 0.5',
      });
      nightWash(
        P,
        [
          ragBand(
            P,
            40,
            1460,
            (x) => top(x) - 2,
            (x) => top(x) + 7,
            140,
          ),
        ],
        {
          fill: '#6474A0',
          op: 0.55,
          disp: 4,
          rim: 0,
          fleck: 0.45,
        },
      );
      /* telegraph poles, lit on their right edge */
      const ps = [
        [150, 230],
        [330, 170],
        [470, 128],
        [580, 96],
      ];
      const pole = (dx: number, dy: number): { d: string; sw: number }[] =>
        ps.flatMap(([x, h]) => [
          {
            d: line([
              [x + dx, top(x) + 4 + dy],
              [x + 1 + dx, top(x) - h + dy],
            ]),
            sw: Math.max(2.5, h * 0.024),
          },
          {
            d: line([
              [x - h * 0.1 + dx, top(x) - h * 0.93 + dy],
              [x + h * 0.1 + dx, top(x) - h * 0.935 + dy],
            ]),
            sw: 2,
          },
        ]);
      nightWash(P, pole(1.6, -1), { stroke: '#8090BA', op: 0.55, disp: 1.5, rim: 0, gran: 0.3, fleck: 0.3 });
      nightWash(P, pole(0, 0), { stroke: '#121831', op: 0.92, disp: 1.5, rim: 0.3, gran: 0.5 });
      const wires: { d: string; sw: number }[] = [];
      for (let i = 1; i < ps.length; i++) {
        const [x0, h0] = ps[i - 1],
          [x1, h1] = ps[i],
          a = [x0, top(x0) - h0 * 0.93],
          c = [x1, top(x1) - h1 * 0.935];
        wires.push({ d: smoothPath([a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + 10], c], false), sw: 1.2 });
      }
      P.wash(wires, { stroke: '#6474A0', op: 0.6, disp: 0.8, rim: 0, gran: 0, bloom: 0, fleck: 0, ...NB });
      /* the lone elm from the steppe: a lighter moonlit crown under a dark one that lets it show through */
      const ex = 1130,
        ey = top(1130),
        crown: string[] = [];
      for (let i = 0; i < 14; i++) {
        const a = P.rand(0, 6.28),
          r = P.rand(0, 1);
        crown.push(
          P.blob(ex + Math.cos(a) * 110 * r, ey - 190 + Math.sin(a) * 70 * r, P.rand(40, 70), P.rand(30, 50), 0.35, 12),
        );
      }
      nightWash(P, crown, { fill: '#56669A', op: 0.55, disp: 12, freq: 0.04, rim: 0.4, fleck: 0.4 });
      nightWash(
        P,
        [
          {
            d: taper(
              [
                [ex, ey + 4],
                [ex - 4, ey - 80],
                [ex + 2, ey - 150],
              ],
              20,
              8,
            ),
          },
        ],
        {
          fill: '#141A33',
          op: 0.95,
          disp: 3,
          rim: 0.4,
        },
      );
      nightWash(P, crown, {
        fill: '#1A2242',
        op: 0.82,
        disp: 11,
        freq: 0.045,
        rim: 0.5,
        fleck: 0.55,
        fleckFreq: '0.05 0.07',
        fleckEdge: false,
      });
      /* two horses, still grazing: textured bodies, a moonlit line along the back */
      const H = (x: number, s: number, dir: number, dx: number, dy: number): string =>
        poly(HORSE_DOWN.map(([px, py]) => [x + px * dir * s + dx, top(x) + 6 + py * s + dy]));
      nightWash(P, [H(760, 0.62, 1, 2, -2), H(880, 0.54, -1, 2, -2)], {
        fill: '#8494BE',
        op: 0.55,
        disp: 1.5,
        rim: 0,
        gran: 0.4,
        fleck: 0.3,
      });
      nightWash(
        P,
        [
          {
            d: H(760, 0.62, 1, 0, 0),
            fill: P.grad([
              [0, '#2C3660'],
              [1, '#141A33'],
            ]),
          },
          {
            d: H(880, 0.54, -1, 0, 0),
            fill: P.grad([
              [0, '#2A345C'],
              [1, '#121831'],
            ]),
          },
        ],
        {
          op: 0.95,
          disp: 1.8,
          freq: 0.06,
          gran: 0.66,
          granDark: 0.5,
          rim: 0.85,
          fleck: 0.2,
        },
      );
      P.soft([P.blob(790, top(790) + 8, 70, 6, 0.2, 10), P.blob(860, top(860) + 8, 60, 5, 0.2, 10)], {
        fill: '#0B1024',
        op: 0.5,
        blur: 4,
        ...NB,
      });
    },
  },
  nightgrass: {
    w: 440,
    h: 300,
    seed: 199,
    paint(P) {
      nightWash(P, [P.blob(220, 272, 210, 22, 0.3, 12)], { fill: '#1C2444', op: 0.9, disp: 10 });
      const st: { d: string; sw: number }[] = [],
        tip: { d: string; sw: number }[] = [];
      for (let i = 0; i < 60; i++) {
        const x = 220 + P.rand(-180, 180),
          h = P.rand(60, 220) * (1 - Math.abs(x - 220) / 270),
          b = 276 + P.rand(-6, 4),
          lean = P.rand(-30, 40);
        st.push({
          d: smoothPath(
            [
              [x, b],
              [x + lean * 0.4, b - h * 0.6],
              [x + lean, b - h],
            ],
            false,
          ),
          sw: P.rand(1.6, 3.2),
        });
        if (P.r() < 0.4)
          tip.push({
            d: smoothPath(
              [
                [x + lean * 0.7, b - h * 0.82],
                [x + lean, b - h],
              ],
              false,
            ),
            sw: 2,
          });
      }
      nightWash(P, st.slice(0, 30), { stroke: '#1A2140', op: 0.92, disp: 2, freq: 0.06, rim: 0.2, gran: 0.4 });
      nightWash(P, st.slice(30), { stroke: '#28325A', op: 0.88, disp: 2, freq: 0.06, rim: 0.2, gran: 0.4 });
      nightWash(P, tip, { stroke: '#8494BE', op: 0.55, disp: 1.5, rim: 0, gran: 0.2, bloom: 0, fleck: 0.3 });
    },
  },
  nightyurt: {
    w: 560,
    h: 440,
    seed: 197,
    paint(P) {
      const G = 372,
        Y = yurtShape(290, G, 270);
      /* its patch of ground, painted like the day's, in night colours */
      nightWash(P, [P.blob(290, G + 12, 250, 30, 0.3, 14)], {
        fill: '#26305A',
        op: 0.9,
        disp: 14,
        freq: 0.04,
        fleck: 0.4,
        fleckFreq: '0.03 0.2',
      });
      P.soft([P.blob(330, G + 18, 150, 16)], { fill: '#0B1024', op: 0.5, blur: 8, ...NB });
      nightWash(
        P,
        [
          {
            d: Y.wall,
            fill: P.grad(
              [
                [0, '#45527F'],
                [1, '#222B4C'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
          {
            d: Y.roof,
            fill: P.grad(
              [
                [0, '#5A6894'],
                [1, '#2A3358'],
              ],
              0,
              0,
              1,
              0.3,
            ),
          },
        ],
        {
          op: 0.96,
          disp: 6,
          freq: 0.04,
          bloom: 0.25,
        },
      );
      nightWash(
        P,
        [
          {
            d: smoothPath(
              [
                [Y.l - 8, Y.wt],
                [Y.l + 40, Y.wt - 40],
                [290, Y.crown + 2],
              ],
              false,
            ),
            sw: 5,
          },
        ],
        {
          stroke: '#9AA8CC',
          op: 0.45,
          disp: 4,
          rim: 0,
          fleck: 0.4,
        },
      );
      nightWash(
        P,
        [
          {
            d: line([
              [Y.l + 4, Y.wt + 10],
              [Y.r - 4, Y.wt + 10],
            ]),
            sw: 7,
          },
          {
            d: smoothPath(
              [
                [Y.l + 30, Y.wt - 30],
                [290, Y.wt - 76],
                [Y.r - 30, Y.wt - 30],
              ],
              false,
            ),
            sw: 2.5,
          },
          {
            d: smoothPath(
              [
                [Y.l + 4, Y.wt - 6],
                [290, Y.wt - 40],
                [Y.r - 4, Y.wt - 6],
              ],
              false,
            ),
            sw: 2.5,
          },
        ],
        { stroke: '#7585AE', op: 0.55, disp: 2, rim: 0, gran: 0.3, fleck: 0.4 },
      );
      P.soft([P.blob(290, 334, 40, 50)], { fill: '#F2B65A', op: 0.55, blur: 12, ...NB });
      nightWash(
        P,
        [
          poly([
            [268, 298],
            [312, 296],
            [314, G + 2],
            [267, G + 3],
          ]),
        ],
        { fill: P.grad(WARM), op: 0.95, disp: 2.5, rim: 0.6, gran: 0.3, granDark: 0.85, fleck: 0 },
      );
      nightWash(P, [P.blob(290, Y.crown + 4, 24, 6, 0.1)], { fill: '#F2B65A', op: 0.7, disp: 2, gran: 0.2, fleck: 0 });
      /* the door light spills across the ground towards you: a warm wash, not a glow */
      nightWash(
        P,
        [
          poly([
            [270, G],
            [312, G],
            [420, G + 40],
            [180, G + 44],
          ]),
        ],
        { fill: '#E7A456', op: 0.45, disp: 10, wet: 2, gran: 0.5, granDark: 0.75, rim: 0.5, fleck: 0.3 },
      );
      P.soft([P.blob(296, G + 26, 110, 14)], { fill: '#F6D27A', op: 0.25, blur: 10, ...NB });
      /* someone at the door, lit from inside on one side */
      const dark = {
        coat: '#1C2442',
        legs: '#151B34',
        arm: '#1C2442',
        skin: '#262F52',
        hair: '#121831',
        shadow: 0,
        o: NT,
      };
      personAt(P, 352, G + 6, 0.5, {
        coat: '#E7A457',
        legs: '#C98544',
        arm: '#E7A457',
        skin: '#F0BE78',
        hair: '#C98544',
        shadow: 0,
        o: NT,
      });
      personAt(P, 355, G + 6, 0.5, dark);
    },
  },
  lanterns: {
    w: 740,
    h: 500,
    seed: 211,
    paint(P) {
      /* ground under the string of lights */
      nightWash(
        P,
        [
          {
            d: ragBand(
              P,
              0,
              740,
              (x) => 440 + Math.sin(x * 0.02) * 4,
              () => 500,
              130,
            ),
            fill: P.grad([
              [0, '#2E3964'],
              [1, '#1C2444'],
            ]),
          },
        ],
        {
          op: 0.95,
          disp: 9,
          freq: 0.035,
        },
      );
      const tufts: { d: string; sw: number }[] = [];
      for (let i = 0; i < 26; i++) {
        const x = P.rand(30, 710),
          y = 446 + P.rand(0, 40);
        tufts.push({
          d: line([
            [x, y],
            [x + P.rand(-3, 4), y - P.rand(6, 15)],
          ]),
          sw: P.rand(1.4, 2.4),
        });
      }
      nightWash(P, tufts, { stroke: '#6E7EAA', op: 0.5, disp: 2, freq: 0.08, rim: 0, gran: 0.3, bloom: 0, fleck: 0.2 });
      /* the two poles, moonlit on the right */
      const poles = [
        {
          d: line([
            [60, 452],
            [62, 70],
          ]),
          sw: 6,
        },
        {
          d: line([
            [680, 452],
            [678, 70],
          ]),
          sw: 6,
        },
      ];
      nightWash(
        P,
        poles.map((p) => ({ ...p, d: p.d })),
        { stroke: '#4A5884', op: 0.9, disp: 2, rim: 0.4, gran: 0.5, fleck: 0.2 },
      );
      nightWash(
        P,
        [
          {
            d: line([
              [64, 452],
              [66, 72],
            ]),
            sw: 2,
          },
          {
            d: line([
              [682, 452],
              [680, 72],
            ]),
            sw: 2,
          },
        ],
        { stroke: '#9AA8CC', op: 0.45, disp: 1.5, rim: 0, gran: 0.2, fleck: 0.3 },
      );
      P.wash(
        [
          {
            d: smoothPath(
              [
                [STRING.x0, STRING.y],
                [216, sagAt(216)],
                [370, sagAt(370)],
                [524, sagAt(524)],
                [STRING.x1, STRING.y],
              ],
              false,
            ),
            sw: 1.6,
          },
        ],
        {
          stroke: '#9AA8CC',
          op: 0.6,
          disp: 1,
          rim: 0,
          gran: 0,
          bloom: 0,
          fleck: 0,
          ...NB,
        },
      );
      const xs = PAINTED_LANTERNS,
        L = xs.map((x, i) => lanternShape(P, x, sagAt(x) + 36 + (i % 2) * 8, 1.05));
      P.soft(
        L.map((l) => l.body),
        { fill: '#F2B65A', op: 0.5, blur: 16, ...NB },
      );
      P.wash(
        xs.map((x) => ({
          d: line([
            [x, sagAt(x)],
            [x, sagAt(x) + 14],
          ]),
          sw: 1.4,
        })),
        { stroke: '#9AA8CC', op: 0.6, disp: 0.5, rim: 0, gran: 0, bloom: 0, fleck: 0, ...NB },
      );
      nightWash(
        P,
        L.map((l, i) => ({
          d: l.body,
          fill: P.grad([
            [0, i % 2 ? '#F6D27A' : '#F3C26A'],
            [1, i % 2 ? '#E0873A' : '#D46A3A'],
          ]),
        })),
        { op: 0.95, disp: 3, freq: 0.05, gran: 0.35, granDark: 0.8, rim: 0.65, fleck: 0 },
      );
      P.wash(
        L.flatMap((l) => [
          { d: l.cap, sw: 4 },
          { d: l.foot, sw: 4 },
        ]),
        { stroke: '#3A2A22', op: 0.9, disp: 1, rim: 0, fleck: 0, ...NB },
      );
      /* the light pooling on the ground under the string */
      lightPool(P, [...xs, 205, 425, 535], 458, 60, 12);
      /* two people standing in it, lit from the lanterns' side */
      const dark = {
        coat: '#1C2442',
        legs: '#151B34',
        arm: '#1C2442',
        skin: '#262F52',
        hair: '#121831',
        shadow: 0,
        o: NT,
      };
      const lit = {
        coat: '#D99A52',
        legs: '#B97C40',
        arm: '#D99A52',
        skin: '#E9B472',
        hair: '#B97C40',
        shadow: 0,
        o: NT,
      };
      personAt(P, 318, 462, 0.5, lit);
      personAt(P, 318, 464.5, 0.5, dark);
      personAt(P, 432, 462, 0.46, lit);
      personAt(P, 432, 464.5, 0.46, dark);
    },
  },
  /* one lantern on its own, with its glow: the ones visitors light, hung on the string or far up in the sky */
  lantern: {
    w: 80,
    h: 110,
    seed: 223,
    paint(P) {
      const l = lanternShape(P, 40, 58, 1.05);
      P.soft([l.body], { fill: '#F2B65A', op: 0.55, blur: 13, ...NB });
      P.wash(
        [
          {
            d: line([
              [40, 0],
              [40, 36],
            ]),
            sw: 1.4,
          },
        ],
        { stroke: '#9AA8CC', op: 0.6, disp: 0.5, rim: 0, gran: 0, bloom: 0, fleck: 0, ...NB },
      );
      nightWash(P, [{ d: l.body, fill: P.grad(WARM) }], {
        op: 0.95,
        disp: 3,
        freq: 0.05,
        gran: 0.35,
        granDark: 0.8,
        rim: 0.65,
        fleck: 0,
      });
      P.wash(
        [
          { d: l.cap, sw: 4 },
          { d: l.foot, sw: 4 },
        ],
        { stroke: '#3A2A22', op: 0.9, disp: 1, rim: 0, fleck: 0, ...NB },
      );
    },
  },
} satisfies PaintDefs;
