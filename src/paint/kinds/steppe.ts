/** The steppe: golden hills, telegraph poles, the repair shop (LOWL), the yurt with its campfire (Emberquill), the lone elm, horses, tall grass. */
import { horse, yurtShape } from '../motifs';
import { line, poly, smoothPath, taper } from '../svg';
import type { PaintDefs } from './types';

export const STEPPE = {
  hills: {
    w: 1500,
    h: 320,
    seed: 81,
    fade: { x: 0.16, b: 0.3 },
    paint(P) {
      const top = [];
      for (let x = 0; x <= 1500; x += 25)
        top.push([x, 150 + Math.sin(x * 0.004 + 2) * 34 + Math.sin(x * 0.011) * 14 + P.rand(-3, 3)]);
      const hill = poly([[0, 320], ...top, [1500, 320]]);
      P.wash(
        [
          {
            d: hill,
            fill: P.grad([
              [0, '#D4AE68'],
              [0.5, '#DDC287'],
              [1, '#E4D2A6', 0],
            ]),
          },
        ],
        { op: 0.66, disp: 12, freq: 0.03, gran: 0.5, rim: 0.5, bloom: 0.45, fleck: 0.45, fleckFreq: '0.008 0.1' },
      );
      const far = [];
      for (let x = 0; x <= 1500; x += 25) far.push([x, 120 + Math.sin(x * 0.003) * 26 + Math.sin(x * 0.02) * 6]);
      P.wash([poly([[0, 200], ...far, [1500, 200]])], {
        fill: '#A7AFA0',
        op: 0.38,
        disp: 10,
        freq: 0.03,
        gran: 0.4,
        rim: 0.5,
      });
      const sage = [];
      for (let i = 0; i < 8; i++)
        sage.push(P.blob(P.rand(60, 1440), P.rand(200, 250), P.rand(80, 180), P.rand(10, 22), 0.3, 12));
      P.wash(sage, { fill: '#A2A574', op: 0.45, disp: 12, gran: 0.5, rim: 0.6, fleck: 0.4, fleckFreq: '0.01 0.12' });
      const st = [];
      for (let i = 0; i < 40; i++) {
        const x = P.rand(0, 1450),
          y = P.rand(180, 290);
        st.push({
          d: line([
            [x, y],
            [x + P.rand(40, 140), y + P.rand(-3, 3)],
          ]),
          sw: P.rand(1.5, 3.5),
        });
      }
      P.wash(st, {
        stroke: '#B8894A',
        op: 0.4,
        disp: 4,
        freq: 0.05,
        rim: 0,
        gran: 0.4,
        bloom: 0,
        fleck: 0.5,
        fleckFreq: '0.1 0.5',
      });
    },
  },
  poles: {
    w: 900,
    h: 400,
    seed: 89,
    paint(P) {
      const ps = [
        [110, 380, 330],
        [370, 344, 250],
        [575, 318, 190],
        [740, 302, 146],
        [860, 292, 112],
      ];
      const shadows = ps.map(([x, b, h]) =>
        poly([
          [x, b],
          [x + h * 0.55, b + 4],
          [x + h * 0.55, b + 7],
          [x, b + 3],
        ]),
      );
      P.soft(shadows, { op: 0.28, blur: 3, disp: 4 });
      P.wash(
        ps.map(([x, b]) => P.blob(x, b, 26, 6, 0.4, 8)),
        { fill: '#B9AE72', op: 0.5, disp: 6, rim: 0.6 },
      );
      P.wash(
        ps.flatMap(([x, b, h]) => [
          {
            d: line([
              [x, b],
              [x + 1, b - h],
            ]),
            sw: Math.max(2.5, h * 0.022),
          },
          {
            d: line([
              [x - h * 0.1, b - h * 0.93],
              [x + h * 0.1, b - h * 0.935],
            ]),
            sw: Math.max(2, h * 0.014),
          },
        ]),
        { stroke: '#4A3B30', op: 0.8, disp: 2.5, freq: 0.07, rim: 0.3 },
      );
      const wires = [];
      for (let k = -1; k <= 1; k += 2) {
        for (let i = 0; i < ps.length; i++) {
          const [x0, b0, h0] = i ? ps[i - 1] : [-80, 430, 420],
            [x1, b1, h1] = ps[i];
          const a = [x0 + k * h0 * 0.09, b0 - h0 * 0.93],
            c = [x1 + k * h1 * 0.09, b1 - h1 * 0.935],
            m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + (c[0] - a[0]) * 0.06];
          wires.push({ d: smoothPath([a, m, c], false), sw: 1.3 });
        }
      }
      P.wash(wires, { stroke: '#3C3A38', op: 0.7, disp: 1, freq: 0.05, rim: 0, gran: 0, bloom: 0 });
    },
  },
  shed: {
    w: 610,
    h: 440,
    seed: 97,
    paint(P) {
      const G = 384;
      P.ground(285, G + 4, 235, 30, { colors: ['#D2B474', '#DCC58E', '#B3A060', '#8F7E45'] });
      const front = poly([
          [150, 236],
          [342, 226],
          [344, 378],
          [148, 382],
        ]),
        side = poly([
          [342, 226],
          [436, 238],
          [436, 360],
          [344, 378],
        ]);
      P.under([front, side], { disp: 5 });
      P.wash(
        [
          {
            d: front,
            fill: P.grad([
              [0, '#E6DCC4'],
              [1, '#CBBFA2'],
            ]),
          },
        ],
        { op: 0.6, disp: 5, freq: 0.045, gran: 0.55, rim: 0.65, bloom: 0.3, fleck: 0.25, fleckFreq: '0.02 0.12' },
      );
      P.wash(
        [
          {
            d: side,
            fill: P.grad(
              [
                [0, '#93A2B0'],
                [1, '#7D8C9B'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.7, disp: 5, freq: 0.045, gran: 0.55, rim: 0.6 },
      );
      const roof = poly([
        [134, 238],
        [346, 222],
        [452, 236],
        [452, 248],
        [346, 236],
        [134, 252],
      ]);
      P.wash([{ d: roof, fill: '#5A6878' }], { op: 0.85, disp: 3, freq: 0.05, gran: 0.5, rim: 0.6 });
      const cor = [];
      for (let x = 140; x < 446; x += 9)
        cor.push({
          d: line([
            [x, x < 346 ? 238 - (x - 134) * 0.075 + 1 : 222 + (x - 346) * 0.13 + 1],
            [x, x < 346 ? 251 - (x - 134) * 0.075 : 236 + (x - 346) * 0.11],
          ]),
          sw: 1.2,
        });
      P.wash(cor, { stroke: '#3A4654', op: 0.5, disp: 1, rim: 0, gran: 0, bloom: 0 });
      P.wash(
        [
          poly([
            [178, 254],
            [312, 250],
            [312, 284],
            [178, 288],
          ]),
        ],
        { fill: '#A4502C', op: 0.9, disp: 3, freq: 0.05, gran: 0.5, rim: 0.7 },
      );
      const lt = [];
      for (let i = 0; i < 7; i++) lt.push(P.blob(194 + i * 17, 269, 5, 8, 0.2, 6));
      P.wash(lt, { fill: '#F0DDB4', op: 0.9, disp: 1.5, rim: 0, gran: 0, bloom: 0, blend: 'normal' });
      P.wash(
        [
          poly([
            [176, 304],
            [230, 302],
            [231, 348],
            [177, 350],
          ]),
        ],
        { fill: '#3E4A55', op: 0.78, disp: 2.5, rim: 0.6, gran: 0.4 },
      );
      P.under(
        [
          poly([
            [184, 308],
            [196, 307],
            [190, 330],
            [180, 331],
          ]),
        ],
        { disp: 1.5, fill: '#C9D3D8' },
      );
      P.wash(
        [
          poly([
            [288, 300],
            [326, 298],
            [328, 380],
            [289, 381],
          ]),
        ],
        { fill: '#5F8A78', op: 0.88, disp: 3, rim: 0.7, gran: 0.5 },
      );
      // a washing machine waiting on the step
      const wm = poly([
        [356, 334],
        [394, 334],
        [394, 382],
        [356, 382],
      ]);
      P.under([wm], { disp: 1.5, fill: '#F6F4EE' });
      P.wash(
        [
          {
            d: wm,
            fill: P.grad(
              [
                [0, '#DCD8CE'],
                [1, '#A9B2BA'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.6, disp: 1.5, rim: 0.9, gran: 0.3 },
      );
      P.wash([P.blob(375, 360, 11, 11, 0.05, 10)], { fill: '#6E8496', op: 0.75, disp: 1, rim: 0.9 });
    },
  },
  yurt: {
    w: 560,
    h: 440,
    seed: 103,
    paint(P) {
      const G = 372,
        Y = yurtShape(290, G, 270);
      P.ground(285, G + 6, 245, 30, { colors: ['#D2B474', '#DCC58E', '#B3A060', '#8F7E45'] });
      P.under([Y.wall, Y.roof], { disp: 6 });
      P.wash(
        [
          {
            d: Y.wall,
            fill: P.grad(
              [
                [0, '#E8DFC9', 0.3],
                [0.55, '#D7CAAE', 0.6],
                [1, '#A7A08E'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.7, disp: 6, freq: 0.04, gran: 0.55, rim: 0.6, bloom: 0.3 },
      );
      P.wash(
        [
          {
            d: Y.roof,
            fill: P.grad(
              [
                [0, '#E4D8BC', 0.2],
                [0.6, '#CDBE9C', 0.6],
                [1, '#9C9584'],
              ],
              0,
              0,
              1,
              0.2,
            ),
          },
        ],
        { op: 0.72, disp: 6, freq: 0.04, gran: 0.55, rim: 0.65, bloom: 0.3, fleck: 0.2 },
      );
      const band = [];
      for (let i = 0; i < 15; i++) {
        const x = Y.l + 6 + i * 17.5,
          y = Y.wt + 8 + Math.sin((i / 14) * Math.PI) * 5;
        band.push(
          poly([
            [x, y],
            [x + 8, y - 7],
            [x + 16, y],
            [x + 8, y + 7],
          ]),
        );
      }
      P.wash(band, { fill: '#A4502C', op: 0.75, disp: 2, freq: 0.06, rim: 0.6, gran: 0.4 });
      P.wash(
        [
          {
            d: smoothPath(
              [
                [Y.l, Y.wt - 2],
                [290, Y.wt - 44],
                [Y.r, Y.wt - 2],
              ],
              false,
            ),
            sw: 3,
          },
          {
            d: smoothPath(
              [
                [Y.l + 36, Y.wt - 36],
                [290, Y.wt - 84],
                [Y.r - 36, Y.wt - 36],
              ],
              false,
            ),
            sw: 3,
          },
        ],
        { stroke: '#7A5A3C', op: 0.55, disp: 2, rim: 0 },
      );
      P.wash([P.blob(290, Y.crown + 4, 26, 7, 0.1, 10)], { fill: '#5B4634', op: 0.8, disp: 2, rim: 0.5 });
      P.wash(
        [
          poly([
            [266, 296],
            [312, 294],
            [314, G + 2],
            [265, G + 3],
          ]),
        ],
        { fill: '#9A3F27', op: 0.9, disp: 2.5, gran: 0.5, rim: 0.8 },
      );
      P.wash(
        [
          {
            d: line([
              [289, 300],
              [290, G],
            ]),
            sw: 2,
          },
        ],
        { stroke: '#D9A441', op: 0.8, disp: 1, rim: 0 },
      );
      // the campfire: where the fights get planned
      P.soft([P.blob(108, G + 6, 70, 18)], { fill: '#F0B860', op: 0.45, blur: 10, blend: 'normal' });
      P.wash(
        [
          {
            d: line([
              [84, G + 8],
              [130, G - 2],
            ]),
            sw: 6,
          },
          {
            d: line([
              [88, G - 2],
              [132, G + 8],
            ]),
            sw: 6,
          },
        ],
        { stroke: '#4E3C30', op: 0.85, disp: 2 },
      );
      P.wash(
        [
          smoothPath([
            [94, G],
            [102, G - 30],
            [108, G - 46],
            [114, G - 26],
            [124, G],
          ]),
          smoothPath([
            [104, G],
            [110, G - 22],
            [118, G - 8],
          ]),
        ],
        { fill: '#E3963E', op: 0.9, disp: 4, freq: 0.07, rim: 0.7, blend: 'normal' },
      );
      P.wash(
        [
          smoothPath([
            [102, G],
            [108, G - 20],
            [114, G],
          ]),
        ],
        { fill: '#F6D27A', op: 0.9, disp: 2, rim: 0.2, blend: 'normal' },
      );
    },
  },
  smoke: {
    w: 120,
    h: 160,
    seed: 107,
    paint(P) {
      P.soft([P.blob(60, 120, 22, 26, 0.3), P.blob(66, 74, 30, 30, 0.3), P.blob(58, 32, 34, 26, 0.3)], {
        fill: '#9AA1A6',
        op: 0.35,
        blur: 9,
        disp: 18,
      });
    },
  },
  elm: {
    w: 560,
    h: 600,
    seed: 113,
    paint(P) {
      const G = 560;
      P.ground(270, G + 2, 230, 28, { colors: ['#C9B878', '#D9C690', '#A39A5C', '#7F7A40'], shLen: 1.5 });
      const cx = 270,
        cy = 250,
        A = [],
        B = [],
        C = [];
      for (let i = 0; i < 16; i++) {
        const a = P.rand(0, 6.28),
          r = P.rand(0, 1);
        A.push(
          P.blob(cx + Math.cos(a) * 170 * r, cy + Math.sin(a) * 130 * r, P.rand(60, 100), P.rand(50, 80), 0.35, 12),
        );
      }
      for (let i = 0; i < 12; i++) {
        const a = P.rand(-0.6, 2.6),
          r = P.rand(0.2, 1);
        B.push(
          P.blob(
            cx + 20 + Math.cos(a) * 150 * r,
            cy + 20 + Math.sin(a) * 110 * r,
            P.rand(40, 75),
            P.rand(35, 60),
            0.4,
            12,
          ),
        );
      }
      for (let i = 0; i < 12; i++) {
        const a = P.rand(0, 2.4),
          r = P.rand(0.3, 1);
        C.push(
          P.blob(
            cx + 40 + Math.cos(a) * 130 * r,
            cy + 50 + Math.sin(a) * 90 * r,
            P.rand(16, 42),
            P.rand(12, 30),
            0.45,
            10,
          ),
        );
      }
      P.wash(A, {
        fill: P.grad([
          [0, '#B8C277'],
          [1, '#93A863'],
        ]),
        op: 0.55,
        disp: 16,
        freq: 0.04,
        gran: 0.5,
        rim: 0.7,
        bloom: 0.4,
        fleck: 0.45,
        fleckFreq: '0.05 0.06',
      });
      P.wash(
        [
          {
            d: taper(
              [
                [266, G + 4],
                [262, 470],
                [268, 380],
                [262, 300],
                [258, 250],
              ],
              34,
              12,
            ),
          },
          {
            d: taper(
              [
                [262, 392],
                [222, 330],
                [180, 262],
              ],
              14,
              4,
            ),
          },
          {
            d: taper(
              [
                [266, 360],
                [318, 296],
                [372, 236],
              ],
              13,
              4,
            ),
          },
          {
            d: taper(
              [
                [262, 300],
                [248, 226],
                [232, 170],
              ],
              10,
              3,
            ),
          },
          {
            d: taper(
              [
                [300, 316],
                [350, 304],
                [410, 272],
              ],
              8,
              3,
            ),
          },
        ],
        {
          fill: P.grad(
            [
              [0, '#6B5340'],
              [1, '#4A3B30'],
            ],
            0,
            0,
            1,
            0,
          ),
          op: 0.85,
          disp: 4,
          freq: 0.05,
          rim: 0.6,
          gran: 0.5,
          fleck: 0.3,
        },
      );
      P.wash(B, {
        fill: '#6E8B4E',
        op: 0.55,
        disp: 14,
        freq: 0.045,
        gran: 0.6,
        rim: 0.75,
        bloom: 0.3,
        fleck: 0.4,
        fleckFreq: '0.06 0.07',
      });
      P.wash(C, { fill: '#3D5A3A', op: 0.55, disp: 9, freq: 0.05, gran: 0.6, rim: 0.6, fleck: 0.3 });
    },
  },
  horses: {
    w: 620,
    h: 330,
    seed: 127,
    paint(P) {
      P.ground(320, 300, 280, 28, { colors: ['#CBB878', '#D9C690', '#A6A060', '#80793F'], shLen: 0.9, tufts: 26 });
      horse(P, 210, 300, 1.15, 1, { col: '#9A5A34', dark: '#3A2A22', graze: true });
      horse(P, 450, 296, 0.95, -1, { col: '#5E4030', dark: '#2A1E19', graze: false });
    },
  },
  grass: {
    w: 440,
    h: 280,
    seed: 131,
    paint(P) {
      P.ground(220, 250, 200, 22, { colors: ['#CBB878', '#D9C690', '#A6A060'], tufts: false, shLen: 0.8 });
      const st = [],
        heads = [];
      for (let i = 0; i < 60; i++) {
        const x = 220 + P.rand(-170, 170),
          h = P.rand(60, 210) * (1 - Math.abs(x - 220) / 260),
          b = 254 + P.rand(-6, 4),
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
          sw: P.rand(1.5, 3),
        });
        if (P.r() < 0.3) heads.push(P.blob(x + lean, b - h, 3, 9, 0.2, 8, 1.2 + lean * 0.01));
      }
      P.wash(st.slice(0, 30), { stroke: '#B89A5A', op: 0.7, disp: 2, freq: 0.06, rim: 0.2, gran: 0.3 });
      P.wash(st.slice(30), { stroke: '#8A8F4A', op: 0.6, disp: 2, freq: 0.06, rim: 0.2, gran: 0.3 });
      P.wash(heads, { fill: '#8C6A3E', op: 0.75, disp: 1.5, rim: 0.5 });
    },
  },
} satisfies PaintDefs;
