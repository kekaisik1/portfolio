/** The sea: the far shore and low sun on the water, gulls, nets, a beach, the lighthouse (History Lens), the pier (BookForge), the boat (Kana Notebook), reeds. */
import { personAt, ragBand } from '../motifs';
import { line, poly, smoothPath } from '../svg';
import type { PaintDefs } from './types';

export const SEA = {
  water: {
    w: 1600,
    h: 340,
    seed: 139,
    fade: { x: 0.2, b: 0.22, n: 1.1 },
    paint(P) {
      const wv = (x: number, a: number, b: number, c: number): number =>
        a + Math.sin(x * b + c) * 10 + Math.sin(x * 0.021 + c) * 4;
      // a low sun behind the far shore: warm light on the paper and on the water
      P.soft([P.blob(1140, 128, 300, 80, 0.2, 14)], { fill: '#F4D3A0', op: 0.5, blur: 34, blend: 'normal' });
      P.wash(
        [
          ragBand(
            P,
            140,
            1480,
            (x) => wv(x, 104, 0.004, 1),
            () => 128,
            220,
          ),
        ],
        { fill: '#AEB8BF', op: 0.42, disp: 9, freq: 0.03, gran: 0.35, rim: 0.5, bloom: 0.3 },
      );
      P.wash(
        [
          ragBand(
            P,
            300,
            1360,
            (x) => wv(x, 118, 0.006, 3) + 4,
            () => 132,
            180,
          ),
        ],
        { fill: '#7F8E9A', op: 0.44, disp: 7, freq: 0.035, gran: 0.45, rim: 0.6 },
      );
      P.wash(
        [
          {
            d: ragBand(
              P,
              40,
              1560,
              (x) => 132 + Math.sin(x * 0.003) * 3,
              (x) => 300 + Math.sin(x * 0.004) * 14,
              260,
            ),
            fill: P.grad([
              [0, '#A3BEBE'],
              [0.45, '#8DB1AE'],
              [1, '#B9CBC4', 0.1],
            ]),
          },
        ],
        {
          op: 0.66,
          disp: 16,
          freq: 0.025,
          gran: 0.45,
          rim: 0.4,
          bloom: 0.5,
          fleck: 0.5,
          fleckFreq: '0.004 0.12',
          fleckEdge: false,
        },
      );
      const streaks = [];
      for (let i = 0; i < 30; i++) {
        const y = P.rand(142, 262),
          w = P.rand(110, 380) * (1 - (y - 140) / 260),
          x = P.rand(220, 1380 - w);
        streaks.push(P.blob(x + w / 2, y, w / 2, P.rand(2.5, 6), 0.3, 10));
      }
      P.wash(streaks, {
        fill: '#5F8A86',
        op: 0.48,
        disp: 6,
        freq: 0.03,
        gran: 0.5,
        rim: 0.6,
        fleck: 0.5,
        fleckFreq: '0.01 0.3',
        fleckEdge: false,
      });
      const glit = [];
      for (let i = 0; i < 22; i++) {
        const y = P.rand(138, 250),
          w = P.rand(20, 90) * (1 - (y - 130) / 200),
          x = 1140 + P.rand(-1, 1) * (40 + (y - 130) * 0.9);
        glit.push(P.blob(x, y, w / 2, P.rand(1.6, 3.4), 0.3, 8));
      }
      P.wash(glit, { fill: '#F2C77E', op: 0.8, disp: 3, freq: 0.05, rim: 0.4, gran: 0.2, bloom: 0, blend: 'normal' });
      P.wash(
        [
          ragBand(
            P,
            90,
            1510,
            () => 130,
            () => 136,
            200,
          ),
        ],
        { fill: '#4E6E7E', op: 0.45, disp: 4, rim: 0.3, fleck: 0.5, fleckFreq: '0.02 0.4' },
      );
    },
  },
  gulls: {
    w: 320,
    h: 140,
    seed: 141,
    paint(P) {
      const g = [
        [60, 70, 1],
        [130, 44, 0.8],
        [210, 86, 1.1],
        [270, 52, 0.7],
      ].flatMap(([x, y, s]) => [
        {
          d: smoothPath(
            [
              [x - 18 * s, y + 2 * s],
              [x - 9 * s, y - 8 * s],
              [x, y],
            ],
            false,
          ),
          sw: 2.6 * s,
        },
        {
          d: smoothPath(
            [
              [x, y],
              [x + 8 * s, y - 9 * s],
              [x + 19 * s, y - 1 * s],
            ],
            false,
          ),
          sw: 2.6 * s,
        },
      ]);
      P.wash(g, { stroke: '#4E5A66', op: 0.82, disp: 1.5, freq: 0.06, rim: 0.2, gran: 0.2, bloom: 0, fleck: 0 });
    },
  },
  nets: {
    w: 600,
    h: 400,
    seed: 143,
    paint(P) {
      const G = 340;
      P.ground(300, G + 4, 260, 30, { colors: ['#D9C9A0', '#E2D3AE', '#BFA878', '#9A8A5E'], tufts: 6 });
      P.wash(
        [
          {
            d: line([
              [110, G + 2],
              [112, 120],
            ]),
            sw: 7,
          },
          {
            d: line([
              [420, G],
              [418, 132],
            ]),
            sw: 7,
          },
        ],
        { stroke: '#4A3B30', op: 0.82, disp: 2.5, freq: 0.07, rim: 0.3 },
      );
      const top = (x: number): number => 140 + Math.sin(((x - 112) / 306) * Math.PI) * 34,
        bot = (x: number): number => 296 + Math.sin(((x - 112) / 306) * Math.PI) * 18;
      const mesh = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8,
          pts = [];
        for (let x = 116; x <= 414; x += 22) pts.push([x, top(x) + (bot(x) - top(x)) * t + P.rand(-1.5, 1.5)]);
        mesh.push({ d: smoothPath(pts, false), sw: 1.2 });
      }
      for (let x = 124; x < 414; x += 15)
        mesh.push({
          d: line([
            [x, top(x)],
            [x + P.rand(-4, 4), bot(x)],
          ]),
          sw: 1,
        });
      P.wash(
        [
          {
            d: smoothPath([
              [116, top(116)],
              ...[160, 220, 280, 340, 400].map((x) => [x, top(x)]),
              [414, top(414)],
              [414, bot(414)],
              ...[400, 340, 280, 220, 160].map((x) => [x, bot(x)]),
              [116, bot(116)],
            ]),
            fill: '#9AA6A0',
          },
        ],
        { op: 0.2, disp: 6, rim: 0.3, gran: 0.4 },
      );
      P.wash(mesh, {
        stroke: '#4F4A44',
        op: 0.5,
        disp: 1.5,
        freq: 0.06,
        rim: 0,
        gran: 0.2,
        bloom: 0,
        fleck: 0.3,
        fleckFreq: '0.1 0.3',
      });
      P.wash(
        [140, 190, 240, 290, 340, 390].map((x) => P.blob(x, top(x) + 2, 7, 6, 0.1, 8)),
        { fill: '#C9683A', op: 0.9, disp: 1.5, rim: 0.6 },
      );
      P.wash(
        [
          {
            d: smoothPath(
              [
                [160, bot(160) + 2],
                [210, G - 10],
                [280, G - 4],
              ],
              false,
            ),
            sw: 6,
          },
        ],
        { stroke: '#8E8470', op: 0.55, disp: 3, rim: 0.3 },
      );
      personAt(P, 488, G, 0.82, { coat: '#6E5B48', scarf: '#5F8A78' });
    },
  },
  beach: {
    w: 660,
    h: 380,
    seed: 147,
    paint(P) {
      const G = 318;
      P.ground(320, G + 4, 290, 30, { colors: ['#D9C9A0', '#E3D5B0', '#BFA878', '#9A8A5E'], tufts: 8, shLen: 1.1 });
      P.under(
        [
          poly([
            [120, 250],
            [430, 234],
            [404, 296],
            [150, 304],
          ]),
        ],
        { disp: 4 },
      );
      P.wash(
        [
          {
            d: poly([
              [120, 250],
              [430, 234],
              [404, 296],
              [150, 304],
            ]),
            fill: P.grad([
              [0, '#6F9A88'],
              [1, '#3F6656'],
            ]),
          },
        ],
        { op: 0.82, disp: 4, freq: 0.045, gran: 0.55, rim: 0.7, bloom: 0.3, fleck: 0.25 },
      );
      P.wash(
        [
          {
            d: line([
              [124, 252],
              [428, 236],
            ]),
            sw: 5,
          },
        ],
        { stroke: '#EDE6D6', op: 0.8, disp: 1.5, rim: 0, blend: 'normal' },
      );
      P.wash(
        [
          poly([
            [132, 256],
            [418, 242],
            [410, 252],
            [140, 266],
          ]),
        ],
        { fill: '#2F4A40', op: 0.6, disp: 2, rim: 0.3 },
      );
      P.wash(
        [
          {
            d: line([
              [440, G],
              [360, 168],
            ]),
            sw: 5,
          },
          {
            d: line([
              [462, G - 2],
              [404, 172],
            ]),
            sw: 5,
          },
        ],
        { stroke: '#7A5A3C', op: 0.85, disp: 2, rim: 0.3 },
      );
      P.wash([P.blob(356, 164, 9, 20, 0.1, 8, -0.5), P.blob(400, 168, 9, 20, 0.1, 8, -0.5)], {
        fill: '#7A5A3C',
        op: 0.85,
        disp: 2,
        rim: 0.4,
      });
      P.wash([P.blob(560, G - 4, 40, 8, 0.4), P.blob(80, G + 2, 30, 6, 0.4)], {
        fill: '#8E8470',
        op: 0.6,
        disp: 4,
        rim: 0.5,
        gran: 0.5,
      });
      personAt(P, 536, G + 2, 0.9, { coat: '#A4502C', scarf: '#3F5B6A' });
    },
  },
  lighthouse: {
    w: 380,
    h: 680,
    seed: 149,
    paint(P) {
      const G = 620;
      P.soft(
        [
          poly([
            [150, G - 10],
            [380, G],
            [380, G + 30],
            [150, G + 22],
          ]),
        ],
        { op: 0.3, blur: 6 },
      );
      P.wash([P.blob(190, G + 6, 170, 26, 0.3, 14)], {
        fill: '#8DB1AE',
        op: 0.5,
        disp: 12,
        gran: 0.5,
        rim: 0.5,
        fleck: 0.5,
        fleckFreq: '0.01 0.2',
      });
      const rocks = [
        P.blob(130, G - 20, 80, 44, 0.3, 12),
        P.blob(240, G - 14, 90, 38, 0.3, 12),
        P.blob(190, G - 46, 70, 34, 0.3, 12),
      ];
      P.under(rocks, { disp: 8 });
      P.wash(rocks, {
        fill: P.grad(
          [
            [0, '#A8A9A4'],
            [1, '#6F7880'],
          ],
          0,
          0,
          1,
          0.5,
        ),
        op: 0.78,
        disp: 9,
        freq: 0.04,
        gran: 0.7,
        rim: 0.7,
        fleck: 0.3,
      });
      P.wash([P.blob(260, G - 20, 60, 22, 0.3)], { fill: '#545C66', op: 0.45, disp: 7, gran: 0.6, rim: 0.5 });
      const tw = (y: number): number[] => {
        const t = (y - 190) / (560 - 190);
        return [165 - t * 22, 215 + t * 22];
      };
      const tower = poly([
        [...[tw(192)[0]], 192],
        [tw(192)[1], 192],
        [tw(562)[1], 562],
        [tw(562)[0], 562],
      ]);
      P.under([tower], { disp: 3, freq: 0.04 });
      P.wash(
        [
          {
            d: tower,
            fill: P.grad(
              [
                [0, '#EFEBE0', 0],
                [0.5, '#D9D3C6', 0.4],
                [0.8, '#A2AEBA'],
                [1, '#8796A6'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.78, disp: 3.5, freq: 0.04, gran: 0.55, rim: 0.6, bloom: 0.2 },
      );
      const bands = [
        [262, 300],
        [400, 440],
      ].map(([a, b]) =>
        poly([
          [tw(a)[0], a],
          [tw(a)[1], a],
          [tw(b)[1], b],
          [tw(b)[0], b],
        ]),
      );
      P.wash(bands, {
        fill: P.grad(
          [
            [0, '#B65E36'],
            [0.7, '#A4502C'],
            [1, '#7E3B22'],
          ],
          0,
          0,
          1,
          0,
        ),
        op: 0.85,
        disp: 3,
        gran: 0.6,
        rim: 0.7,
      });
      P.wash(
        [
          poly([
            [148, 180],
            [232, 180],
            [234, 194],
            [146, 194],
          ]),
        ],
        { fill: '#3A4252', op: 0.85, disp: 2, rim: 0.4 },
      );
      P.soft([P.blob(190, 152, 46, 40)], { fill: '#F4CF7A', op: 0.6, blur: 12, blend: 'normal' });
      P.wash(
        [
          poly([
            [168, 132],
            [212, 132],
            [213, 180],
            [167, 180],
          ]),
        ],
        { fill: '#3A4656', op: 0.8, disp: 2, rim: 0.5 },
      );
      P.wash([P.blob(190, 156, 13, 15, 0.1)], { fill: '#F6D27A', op: 0.95, disp: 2, rim: 0.3, blend: 'normal' });
      P.wash(
        [
          poly([
            [160, 134],
            [190, 98],
            [220, 134],
          ]),
        ],
        { fill: '#7E3B22', op: 0.88, disp: 2, rim: 0.6 },
      );
      P.wash(
        [
          poly([
            [183, 520],
            [198, 520],
            [199, 562],
            [182, 562],
          ]),
          poly([
            [184, 330],
            [195, 330],
            [195, 348],
            [184, 348],
          ]),
        ],
        { fill: '#3A3430', op: 0.8, disp: 1.5, rim: 0.5 },
      );
    },
  },
  pier: {
    w: 740,
    h: 400,
    seed: 157,
    paint(P) {
      P.wash([P.blob(370, 312, 360, 40, 0.25, 16)], {
        fill: P.grad([
          [0, '#A7C0C0'],
          [1, '#7FA7A6'],
        ]),
        op: 0.6,
        disp: 14,
        gran: 0.5,
        rim: 0.5,
        bloom: 0.4,
        fleck: 0.55,
        fleckFreq: '0.006 0.18',
      });
      const posts = [],
        refl = [];
      for (let i = 0; i < 12; i++) {
        const x = 40 + i * 50,
          top = 254 - i * 1.6;
        posts.push({
          d: line([
            [x, top],
            [x + 1, 312 - i * 1.5],
          ]),
          sw: 5,
        });
        refl.push({
          d: line([
            [x, 316 - i * 1.5],
            [x + P.rand(-2, 2), 344 - i * 1.5],
          ]),
          sw: 4,
        });
      }
      P.wash(refl, { stroke: '#4A3B30', op: 0.3, disp: 5, freq: 0.05, rim: 0, fleck: 0.6, fleckFreq: '0.02 0.3' });
      P.wash(posts, { stroke: '#4A3B30', op: 0.85, disp: 2, rim: 0.3 });
      const deck = poly([
        [24, 244],
        [626, 226],
        [628, 240],
        [24, 262],
      ]);
      P.wash(
        [
          {
            d: deck,
            fill: P.grad(
              [
                [0, '#8B6A4B'],
                [1, '#6E5038'],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.86, disp: 2.5, freq: 0.05, gran: 0.55, rim: 0.6 },
      );
      const front = poly([
          [480, 158],
          [600, 152],
          [602, 232],
          [481, 236],
        ]),
        side = poly([
          [600, 152],
          [662, 162],
          [662, 226],
          [602, 232],
        ]);
      P.under([front, side], { disp: 3 });
      P.wash(
        [
          {
            d: front,
            fill: P.grad([
              [0, '#C59A68'],
              [1, '#A97E52'],
            ]),
          },
        ],
        { op: 0.76, disp: 3, gran: 0.55, rim: 0.7 },
      );
      P.wash([{ d: side, fill: '#7E5E44' }], { op: 0.8, disp: 3, gran: 0.5, rim: 0.6 });
      P.wash(
        [
          poly([
            [468, 162],
            [540, 112],
            [612, 150],
            [600, 156],
          ]),
          poly([
            [540, 112],
            [600, 108],
            [672, 160],
            [612, 150],
          ]),
        ],
        { fill: '#8A4A2E', op: 0.85, disp: 3, gran: 0.6, rim: 0.7 },
      );
      P.soft([P.blob(522, 196, 18, 16)], { fill: '#F2C36A', op: 0.55, blur: 6, blend: 'normal' });
      P.wash(
        [
          poly([
            [510, 182],
            [534, 181],
            [535, 206],
            [511, 207],
          ]),
        ],
        { fill: '#E7B65C', op: 0.92, disp: 1.5, rim: 0.9, blend: 'normal' },
      );
      P.wash(
        [
          poly([
            [556, 190],
            [584, 189],
            [585, 234],
            [557, 235],
          ]),
        ],
        { fill: '#4E3C30', op: 0.85, disp: 1.5, rim: 0.5 },
      );
      // a stack of notebooks drying on the boards
      P.wash(
        [
          poly([
            [420, 236],
            [452, 235],
            [452, 228],
            [420, 229],
          ]),
          poly([
            [422, 228],
            [450, 227],
            [450, 221],
            [422, 222],
          ]),
        ],
        { fill: '#A4502C', op: 0.85, disp: 1, rim: 0.6 },
      );
      P.wash(
        [
          poly([
            [424, 221],
            [448, 220],
            [448, 215],
            [424, 216],
          ]),
        ],
        { fill: '#5F8A78', op: 0.85, disp: 1, rim: 0.6 },
      );
    },
  },
  boat: {
    w: 400,
    h: 400,
    seed: 163,
    paint(P) {
      P.wash([P.blob(200, 330, 180, 30, 0.25, 14)], {
        fill: P.grad([
          [0, '#A7C0C0'],
          [1, '#86ACAA'],
        ]),
        op: 0.6,
        disp: 12,
        gran: 0.5,
        rim: 0.5,
        fleck: 0.55,
        fleckFreq: '0.008 0.2',
      });
      P.wash(
        [
          smoothPath([
            [96, 334],
            [300, 334],
            [280, 356],
            [118, 356],
          ]),
        ],
        { fill: '#6B3A26', op: 0.35, disp: 8, freq: 0.05, fleck: 0.6, fleckFreq: '0.01 0.3', rim: 0 },
      );
      const sail = poly([
          [206, 76],
          [206, 294],
          [318, 290],
        ]),
        jib = poly([
          [196, 98],
          [196, 290],
          [110, 290],
        ]);
      P.under([sail, jib], { disp: 4 });
      P.wash(
        [
          {
            d: sail,
            fill: P.grad(
              [
                [0, '#EDE7DA', 0],
                [0.6, '#C9CED2', 0.7],
                [1, '#9FAEBB'],
              ],
              0,
              0,
              1,
              0.2,
            ),
          },
        ],
        { op: 0.7, disp: 4, gran: 0.5, rim: 0.7, bloom: 0.3 },
      );
      P.wash(
        [
          {
            d: jib,
            fill: P.grad(
              [
                [0, '#B4C0C9'],
                [1, '#E8E3D6', 0.2],
              ],
              0,
              0,
              1,
              0,
            ),
          },
        ],
        { op: 0.6, disp: 4, gran: 0.5, rim: 0.7 },
      );
      P.wash(
        [
          {
            d: line([
              [201, 296],
              [201, 62],
            ]),
            sw: 4,
          },
        ],
        { stroke: '#4A3B30', op: 0.85, disp: 1.5 },
      );
      P.wash(
        [
          poly([
            [201, 62],
            [228, 68],
            [201, 76],
          ]),
        ],
        { fill: '#A4502C', op: 0.9, disp: 1.5 },
      );
      P.wash(
        [
          {
            d: poly([
              [70, 294],
              [326, 294],
              [298, 330],
              [104, 330],
            ]),
            fill: P.grad([
              [0, '#B65E36'],
              [1, '#7E3B22'],
            ]),
          },
        ],
        { op: 0.86, disp: 3, gran: 0.6, rim: 0.7 },
      );
      P.wash(
        [
          {
            d: line([
              [72, 296],
              [324, 296],
            ]),
            sw: 3,
          },
        ],
        { stroke: '#F0E6D2', op: 0.7, disp: 1.5, rim: 0, blend: 'normal' },
      );
    },
  },
  reeds: {
    w: 440,
    h: 400,
    seed: 173,
    paint(P) {
      P.wash([P.blob(220, 368, 190, 24, 0.3, 12)], {
        fill: '#9DB9B4',
        op: 0.5,
        disp: 10,
        gran: 0.5,
        rim: 0.5,
        fleck: 0.5,
        fleckFreq: '0.01 0.2',
      });
      const st = [],
        heads = [];
      for (let i = 0; i < 46; i++) {
        const x = 220 + P.rand(-160, 160),
          h = P.rand(110, 330) * (1 - Math.abs(x - 220) / 300),
          b = 372 + P.rand(-6, 4),
          lean = P.rand(-26, 30);
        st.push({
          d: smoothPath(
            [
              [x, b],
              [x + lean * 0.3, b - h * 0.55],
              [x + lean, b - h],
            ],
            false,
          ),
          sw: P.rand(1.6, 3.4),
        });
        if (P.r() < 0.28) heads.push(P.blob(x + lean * 0.96, b - h * 0.94, 4, 13, 0.15, 8));
      }
      P.wash(st.slice(0, 24), { stroke: '#B89A5A', op: 0.72, disp: 2, freq: 0.06, rim: 0.2, gran: 0.3 });
      P.wash(st.slice(24), { stroke: '#7E8A4A', op: 0.62, disp: 2, freq: 0.06, rim: 0.2, gran: 0.3 });
      P.wash(heads, { fill: '#6B4A30', op: 0.82, disp: 1.5, rim: 0.5, gran: 0.4 });
    },
  },
} satisfies PaintDefs;
