/** The mountains: far peaks and ridges, spruce, the hut (The Front Desk), the observatory (The Numbers Room), a walker, a meadow, a rock. */
import { spruceGroup } from '../motifs';
import { line, poly, smoothPath } from '../svg';
import type { PaintDefs } from './types';

export const MOUNTAINS = {
  peaks: {
    w: 1400,
    h: 520,
    seed: 11,
    fade: { x: 0.13, b: 0.22 },
    paint(P) {
      const base = 520,
        pk = [
          [0, 360],
          [140, 260],
          [330, 130],
          [520, 230],
          [700, 50],
          [905, 190],
          [1080, 100],
          [1270, 250],
          [1400, 330],
        ];
      const ridge = [
        [0, base],
        [0, 360],
      ];
      for (let i = 1; i < pk.length; i++) {
        const [x0, y0] = pk[i - 1],
          [x1, y1] = pk[i],
          sx = (x0 + x1) / 2 + P.rand(-30, 30),
          sy = Math.max(y0, y1) + P.rand(50, 110);
        for (let k = 1; k <= 3; k++) {
          const t = k / 4;
          ridge.push([x0 + (sx - x0) * t + P.rand(-8, 8), y0 + (sy - y0) * t + P.rand(-10, 10)]);
        }
        ridge.push([sx, sy]);
        for (let k = 1; k <= 3; k++) {
          const t = k / 4;
          ridge.push([sx + (x1 - sx) * t + P.rand(-8, 8), sy + (y1 - sy) * t + P.rand(-10, 10)]);
        }
        ridge.push([x1, y1]);
      }
      ridge.push([1400, base]);
      const ry = (x: number): number => {
        for (let i = 2; i < ridge.length - 1; i++) {
          const a = ridge[i - 1],
            b = ridge[i];
          if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0] || 1));
        }
        return 360;
      };
      P.under([poly(ridge)], { disp: 8, freq: 0.03 });
      // shadow side of every peak (the sun is on the left): pale cobalt
      const shades = [];
      for (let i = 1; i < pk.length - 1; i++) {
        const [px, py] = pk[i],
          nx = (px + pk[i + 1][0]) / 2,
          ny = ry(nx);
        const right = ridge.filter((p) => p[0] > px && p[0] < nx && p[1] > 0);
        const foot = [px + (nx - px) * P.rand(0.25, 0.45), ny + P.rand(40, 90)];
        const left = [];
        for (let k = 1; k <= 4; k++) {
          const t = k / 5;
          left.push([px + (foot[0] - px) * t + P.rand(-10, 10), py + (foot[1] - py) * t]);
        }
        shades.push(poly([[px, py], ...right, [nx, ny], [nx - 6, ny + 30], foot, ...left.reverse()]));
      }
      P.wash(
        shades.map((d) => ({
          d,
          fill: P.grad([
            [0, '#9DB0C4'],
            [0.6, '#A9B9C6'],
            [1, '#B8C4C8', 0.2],
          ]),
        })),
        {
          op: 0.62,
          disp: 10,
          freq: 0.035,
          gran: 0.5,
          rim: 0.55,
          bloom: 0.35,
          fleck: 0.25,
          fleckFreq: '0.06 0.03',
          hue: -14,
        },
      );
      P.wash(
        pk.slice(1, -1).map(([px, py]) => ({
          d: poly([
            [px, py + 6],
            [px - 40, py + 90],
            [px - 10, py + 130],
            [px + 4, py + 60],
          ]),
          fill: '#C9D4DC',
        })),
        { op: 0.35, disp: 12, wet: 2.5, rim: 0.2, gran: 0.2, fleck: 0 },
      );
      // lower slopes below the snowline, with couloirs reaching up
      const body = [[0, base]];
      for (let x = 0; x <= 1400; x += 14) {
        const snow = 330 + Math.sin(x * 0.011) * 26 + Math.sin(x * 0.031) * 14;
        let y = Math.max(ry(x), snow);
        if (P.r() < 0.16) y -= P.rand(30, 95);
        body.push([x, Math.max(ry(x) + 4, y)]);
      }
      body.push([1400, base]);
      P.wash(
        [
          {
            d: poly(body),
            fill: P.grad([
              [0, '#6F8796'],
              [0.45, '#6E8E86'],
              [0.8, '#93A69C', 0.55],
              [1, '#A9B5AC', 0],
            ]),
          },
        ],
        { op: 0.7, disp: 9, freq: 0.035, gran: 0.55, rim: 0.55, bloom: 0.4, fleck: 0.2 },
      );
      const crag = [];
      for (let i = 1; i < pk.length - 1; i++) {
        const [px, py] = pk[i];
        for (let k = 0; k < 3; k++)
          crag.push(P.blob(px + P.rand(5, 45), py + P.rand(50, 150), P.rand(6, 14), P.rand(10, 26), 0.4, 8));
      }
      P.wash(crag, { fill: '#56647C', op: 0.32, disp: 8, freq: 0.05, rim: 0.5, gran: 0.3 });
    },
  },
  range2: {
    w: 1300,
    h: 360,
    seed: 23,
    fade: { x: 0.16, b: 0.3 },
    paint(P) {
      const top = [];
      for (let x = 0; x <= 1300; x += 20)
        top.push([x, 150 + Math.sin(x * 0.006 + 1) * 40 + Math.sin(x * 0.017) * 18 + P.rand(-4, 4)]);
      const hill = poly([[0, 360], ...top, [1300, 360]]);
      P.wash(
        [
          {
            d: hill,
            fill: P.grad([
              [0, '#9DB59A'],
              [0.5, '#B2BE98'],
              [1, '#C9CDB0', 0],
            ]),
          },
        ],
        { op: 0.62, disp: 12, freq: 0.03, gran: 0.45, rim: 0.55, bloom: 0.4, fleck: 0.25 },
      );
      const forest = [];
      for (let i = 0; i < 9; i++) {
        const x = P.rand(40, 1260),
          t = top[Math.round(x / 20)][1];
        forest.push(P.blob(x, t + 40, P.rand(60, 130), P.rand(24, 40), 0.35, 12));
      }
      P.wash(forest, { fill: '#5F8A78', op: 0.5, disp: 12, freq: 0.04, gran: 0.55, rim: 0.7 });
      const tips = [];
      for (let i = 0; i < 90; i++) {
        const x = P.rand(20, 1280),
          t = top[Math.round(x / 20)][1] + P.rand(4, 60),
          h = P.rand(14, 30);
        tips.push(
          poly([
            [x, t - h],
            [x + h * 0.22, t],
            [x - h * 0.22, t],
          ]),
        );
      }
      P.wash(tips, { fill: '#2F4F45', op: 0.55, disp: 3, freq: 0.08, rim: 0.4, gran: 0.4 });
    },
  },
  spruces: {
    w: 560,
    h: 740,
    seed: 31,
    paint(P) {
      P.ground(300, 700, 250, 34, { colors: ['#A9B77E', '#C7B880', '#7C9A60', '#55703F'], shLen: 1.1 });
      spruceGroup(P, [
        [200, 704, 600],
        [330, 708, 450],
        [110, 708, 350],
        [430, 710, 290, 0.3],
      ]);
    },
  },
  spruce1: {
    w: 320,
    h: 760,
    seed: 37,
    paint(P) {
      P.ground(160, 720, 130, 24, { colors: ['#A9B77E', '#C7B880', '#7C9A60'], shLen: 1.3 });
      spruceGroup(P, [
        [160, 724, 690, 0.3],
        [235, 726, 260, 0.32],
      ]);
    },
  },
  hut: {
    w: 610,
    h: 440,
    seed: 41,
    paint(P) {
      const G = 380;
      P.ground(285, G + 4, 230, 30, { colors: ['#A7B67E', '#CDBB82', '#86A066', '#5F7442'] });
      // telephone pole and its wire coming in from the valley
      P.wash(
        [
          {
            d: line([
              [78, G + 2],
              [80, 74],
            ]),
            sw: 7,
          },
          {
            d: line([
              [52, 98],
              [110, 94],
            ]),
            sw: 5,
          },
        ],
        { stroke: '#4A3B30', op: 0.78, disp: 3, freq: 0.07, rim: 0.3 },
      );
      P.wash(
        [
          {
            d: smoothPath(
              [
                [0, 128],
                [40, 112],
                [62, 99],
              ],
              false,
            ),
            sw: 1.6,
          },
          {
            d: smoothPath(
              [
                [100, 96],
                [190, 150],
                [300, 214],
              ],
              false,
            ),
            sw: 1.6,
          },
        ],
        { stroke: '#3C3A38', op: 0.75, disp: 1.2, freq: 0.05, rim: 0, gran: 0, bloom: 0 },
      );
      const front = poly([
        [170, 252],
        [245, 168],
        [320, 252],
        [322, 374],
        [168, 376],
      ]);
      const side = poly([
        [320, 252],
        [432, 238],
        [432, 356],
        [322, 374],
      ]);
      P.under([front, side], { disp: 5, freq: 0.04 });
      P.wash(
        [
          {
            d: front,
            fill: P.grad([
              [0, '#D3A86C'],
              [1, '#B4865A'],
            ]),
          },
        ],
        { op: 0.72, disp: 5, freq: 0.045, gran: 0.55, rim: 0.7, bloom: 0.3, fleck: 0.2, fleckFreq: '0.02 0.2' },
      );
      P.wash(
        [
          {
            d: side,
            fill: P.grad(
              [
                [0, '#9A7454'],
                [1, '#7E5E44'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.75, disp: 5, freq: 0.045, gran: 0.55, rim: 0.6 },
      );
      const planks = [];
      for (let y = 270; y < 372; y += 12) {
        planks.push({
          d: line([
            [172, y + P.rand(-1, 1)],
            [318, y + P.rand(-2, 2)],
          ]),
          sw: 1.8,
        });
        planks.push({
          d: line([
            [324, y - 2],
            [430, y - 16],
          ]),
          sw: 1.6,
        });
      }
      P.wash(planks, {
        stroke: '#6B4E37',
        op: 0.35,
        disp: 2.5,
        freq: 0.06,
        rim: 0,
        gran: 0.3,
        bloom: 0,
        fleck: 0.5,
        fleckFreq: '0.09 0.4',
      });
      const roof = poly([
          [236, 160],
          [356, 146],
          [452, 244],
          [330, 262],
        ]),
        gable = poly([
          [152, 262],
          [243, 156],
          [252, 160],
          [166, 266],
        ]);
      P.wash(
        [
          {
            d: roof,
            fill: P.grad([
              [0, '#566679'],
              [1, '#738494'],
            ]),
          },
          { d: gable, fill: '#465568' },
        ],
        { op: 0.82, disp: 6, freq: 0.045, gran: 0.6, rim: 0.7, fleck: 0.25 },
      );
      P.wash(
        [
          poly([
            [372, 150],
            [392, 148],
            [392, 182],
            [372, 190],
          ]),
        ],
        { fill: '#6B4E37', op: 0.8, disp: 3, freq: 0.06 },
      );
      P.soft([P.blob(222, 302, 30, 28)], { fill: '#F2C36A', op: 0.5, blur: 8, blend: 'normal' });
      P.wash(
        [
          poly([
            [205, 285],
            [240, 284],
            [241, 320],
            [206, 321],
          ]),
        ],
        { fill: '#E7B65C', op: 0.92, disp: 2.5, freq: 0.06, rim: 0.9, gran: 0.3, blend: 'normal' },
      );
      P.wash(
        [
          line([
            [222, 286],
            [223, 320],
          ]),
          line([
            [206, 302],
            [240, 302],
          ]),
        ].map((d) => ({ d, sw: 2.2 })),
        { stroke: '#6B4E37', op: 0.6, disp: 1.5, rim: 0, gran: 0, bloom: 0 },
      );
      P.wash(
        [
          poly([
            [262, 302],
            [298, 300],
            [300, 375],
            [263, 376],
          ]),
        ],
        { fill: '#5B4634', op: 0.85, disp: 3, freq: 0.05, rim: 0.6 },
      );
    },
  },
  observatory: {
    w: 470,
    h: 500,
    seed: 53,
    paint(P) {
      const G = 430;
      P.ground(235, G + 2, 200, 26, { colors: ['#A7B67E', '#CDBB82', '#86A066'] });
      // weather mast with cups: someone is counting the wind
      P.wash(
        [
          {
            d: line([
              [372, G],
              [370, 150],
            ]),
            sw: 3.5,
          },
          {
            d: line([
              [352, 160],
              [390, 158],
            ]),
            sw: 2.5,
          },
        ],
        { stroke: '#4A4A4C', op: 0.75, disp: 2, freq: 0.07, rim: 0.2 },
      );
      P.wash([P.blob(352, 166, 7, 6), P.blob(390, 164, 7, 6)], { fill: '#A4502C', op: 0.85, disp: 2, rim: 0.6 });
      const tower = smoothPath([
        [160, 250],
        [235, 262],
        [310, 250],
        [312, 330],
        [314, 418],
        [235, 432],
        [156, 418],
        [158, 330],
      ]);
      const dome = smoothPath([
        [148, 252],
        [160, 205],
        [200, 176],
        [235, 170],
        [272, 176],
        [310, 205],
        [322, 252],
        [235, 266],
      ]);
      P.under([tower, dome], { disp: 5 });
      P.wash(
        [
          {
            d: tower,
            fill: P.grad(
              [
                [0, '#E9E3D4', 0],
                [0.45, '#D6D0C2', 0.4],
                [0.75, '#9DA9B6'],
                [1, '#7F90A2'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.78, disp: 5, freq: 0.04, gran: 0.6, rim: 0.55, bloom: 0.25 },
      );
      const stones = [];
      for (let i = 0; i < 26; i++)
        stones.push(P.blob(P.rand(168, 305), P.rand(268, 420), P.rand(8, 16), P.rand(4, 7), 0.2, 8));
      P.wash(stones, { fill: '#A39A8C', op: 0.35, disp: 3, freq: 0.06, rim: 0.8, gran: 0.4 });
      P.wash(
        [
          {
            d: dome,
            fill: P.grad(
              [
                [0, '#8FA1B1'],
                [0.5, '#6F8295'],
                [1, '#55667A'],
              ],
              0,
              0,
              1,
              0.3,
            ),
          },
        ],
        { op: 0.85, disp: 5, freq: 0.045, gran: 0.6, rim: 0.7, bloom: 0.35, fleck: 0.2 },
      );
      P.wash(
        [
          poly([
            [226, 172],
            [242, 172],
            [244, 252],
            [224, 252],
          ]),
        ],
        { fill: '#2B3442', op: 0.85, disp: 2, rim: 0.5 },
      );
      P.wash(
        [
          smoothPath([
            [212, 432],
            [212, 372],
            [235, 356],
            [258, 372],
            [258, 432],
          ]),
        ],
        { fill: '#4E3C30', op: 0.88, disp: 3, rim: 0.6 },
      );
      P.soft([P.blob(184, 300, 14, 14)], { fill: '#F2C36A', op: 0.45, blur: 5, blend: 'normal' });
      P.wash(
        [
          poly([
            [176, 290],
            [192, 290],
            [192, 314],
            [176, 314],
          ]),
          poly([
            [278, 296],
            [292, 296],
            [292, 318],
            [278, 318],
          ]),
        ],
        { fill: '#D9A64E', op: 0.9, disp: 2, rim: 0.9, blend: 'normal' },
      );
      P.wash([P.blob(120, G - 4, 34, 18, 0.3), P.blob(360, G + 2, 22, 12, 0.3)], {
        fill: '#8E949A',
        op: 0.7,
        disp: 6,
        gran: 0.6,
        rim: 0.7,
      });
    },
  },
  walker: {
    w: 160,
    h: 290,
    seed: 61,
    paint(P) {
      P.soft(
        [
          poly([
            [60, 262],
            [160, 268],
            [158, 280],
            [58, 276],
          ]),
        ],
        { op: 0.32, blur: 4 },
      );
      P.wash(
        [
          {
            d: smoothPath(
              [
                [68, 150],
                [58, 200],
                [48, 252],
              ],
              false,
            ),
            sw: 12,
          },
          {
            d: smoothPath(
              [
                [86, 150],
                [94, 200],
                [104, 248],
              ],
              false,
            ),
            sw: 12,
          },
        ],
        { stroke: '#2E3440', op: 0.85, disp: 3, freq: 0.06, rim: 0.4 },
      );
      P.wash(
        [
          smoothPath([
            [58, 62],
            [92, 60],
            [100, 106],
            [102, 156],
            [54, 158],
            [52, 104],
          ]),
        ],
        { fill: '#4E6E80', op: 0.85, disp: 4, freq: 0.06, gran: 0.5, rim: 0.7 },
      );
      P.wash(
        [
          smoothPath([
            [38, 66],
            [58, 62],
            [60, 124],
            [40, 124],
          ]),
        ],
        { fill: '#A4502C', op: 0.85, disp: 3, gran: 0.5, rim: 0.6 },
      );
      P.wash(
        [
          {
            d: smoothPath(
              [
                [92, 72],
                [104, 108],
                [100, 140],
              ],
              false,
            ),
            sw: 9,
          },
        ],
        { stroke: '#3F5B6A', op: 0.85, disp: 2, rim: 0.4 },
      );
      P.wash([P.blob(76, 42, 13, 14, 0.08, 10)], { fill: '#C49478', op: 0.9, disp: 2, rim: 0.5 });
      P.wash(
        [
          smoothPath([
            [62, 36],
            [76, 24],
            [92, 34],
            [86, 40],
            [66, 42],
          ]),
        ],
        { fill: '#2E2A28', op: 0.85, disp: 2, rim: 0.3 },
      );
      P.wash([P.blob(50, 252, 9, 5), P.blob(106, 248, 9, 5)], { fill: '#2A2422', op: 0.9, disp: 1.5 });
    },
  },
  meadow: {
    w: 640,
    h: 220,
    seed: 67,
    paint(P) {
      P.ground(320, 150, 290, 44, {
        colors: ['#A3B676', '#C5BA7C', '#7E9C5C', '#5F7A45'],
        tufts: 40,
        tuftH: 1.4,
        shLen: 0.6,
        shadow: 0.6,
      });
      const fl: string[] = [],
        fl2: string[] = [],
        wh = [];
      for (let i = 0; i < 46; i++) {
        const x = P.rand(60, 580),
          y = 150 + P.rand(-28, 20),
          r = P.rand(2.5, 5.5);
        (i % 3 ? fl : fl2).push(P.blob(x, y, r, r * 0.8, 0.2, 7));
      }
      for (let i = 0; i < 18; i++) {
        const x = P.rand(60, 580),
          y = 150 + P.rand(-24, 20);
        wh.push(P.blob(x, y, 3, 2.6, 0.2, 6));
      }
      P.wash(fl, { fill: '#D9A441', op: 0.9, disp: 2, freq: 0.08, rim: 0.8, gran: 0.2, blend: 'normal' });
      P.wash(fl2, { fill: '#B5583A', op: 0.85, disp: 2, freq: 0.08, rim: 0.8, gran: 0.2, blend: 'normal' });
      P.under(wh, { disp: 2, fill: '#F7F5EE' });
    },
  },
  rock: {
    w: 340,
    h: 240,
    seed: 71,
    paint(P) {
      P.ground(170, 200, 150, 22, { colors: ['#A7B67E', '#CDBB82', '#86A066'], tufts: 8 });
      const r = smoothPath([
        [50, 200],
        [70, 120],
        [130, 82],
        [210, 86],
        [270, 130],
        [290, 200],
        [170, 212],
      ]);
      P.under([r], { disp: 8 });
      P.wash(
        [
          {
            d: r,
            fill: P.grad(
              [
                [0, '#B4B7B6'],
                [0.5, '#8E949A'],
                [1, '#6C737B'],
              ],
              0,
              0,
              1,
              0.4,
            ),
          },
        ],
        { op: 0.78, disp: 8, freq: 0.04, gran: 0.7, rim: 0.7, bloom: 0.3, fleck: 0.3 },
      );
      P.wash(
        [
          poly([
            [180, 90],
            [270, 130],
            [290, 200],
            [200, 206],
            [215, 140],
          ]),
        ],
        { fill: '#5A6470', op: 0.45, disp: 7, gran: 0.6, rim: 0.5 },
      );
      P.under(
        [
          smoothPath([
            [78, 118],
            [130, 84],
            [210, 88],
            [250, 112],
            [200, 116],
            [150, 108],
            [100, 122],
          ]),
        ],
        { disp: 6, fill: '#F7F6F1' },
      );
      P.wash(
        [
          smoothPath([
            [190, 110],
            [250, 114],
            [228, 126],
            [196, 122],
          ]),
        ],
        { fill: '#A9BCCB', op: 0.6, disp: 4, rim: 0.5 },
      );
    },
  },
} satisfies PaintDefs;
