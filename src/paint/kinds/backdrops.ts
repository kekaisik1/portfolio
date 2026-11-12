/** Backdrops for the finished paintings you see inside a place: painted small, shown large. */
import { line, poly, smoothPath } from '../svg';
import type { PaintDefs } from './types';

export const BACKDROPS = {
  bgMountains: {
    w: 960,
    h: 600,
    seed: 301,
    paint(P) {
      P.wash(
        [
          poly([
            [-20, -20],
            [980, -20],
            [980, 330],
            [-20, 330],
          ]),
        ].map((d) => ({
          d,
          fill: P.grad([
            [0, '#B9CAD6'],
            [0.7, '#DCE3E2', 0.6],
            [1, '#EEF0EA', 0],
          ]),
        })),
        { op: 0.55, disp: 20, freq: 0.012, gran: 0.2, rim: 0, bloom: 0.5 },
      );
      const g = smoothPath([
        [-20, 330],
        [300, 316],
        [600, 326],
        [980, 312],
        [980, 620],
        [-20, 620],
      ]);
      P.wash(
        [
          {
            d: g,
            fill: P.grad([
              [0, '#B3C08A'],
              [0.5, '#A0B474'],
              [1, '#88A260'],
            ]),
          },
        ],
        { op: 0.62, disp: 22, freq: 0.015, gran: 0.45, rim: 0.4, bloom: 0.5, fleck: 0.3, fleckFreq: '0.006 0.06' },
      );
      const st = [];
      for (let i = 0; i < 30; i++) {
        const y = P.rand(360, 590),
          x = P.rand(-40, 900);
        st.push(P.blob(x + 60, y, P.rand(60, 160), P.rand(4, 12), 0.3, 10));
      }
      P.wash(st, { fill: '#6E8B4E', op: 0.35, disp: 10, gran: 0.5, rim: 0.6, fleck: 0.4, fleckFreq: '0.02 0.2' });
      P.wash([P.blob(240, 520, 260, 50, 0.3), P.blob(760, 470, 200, 36, 0.3)], {
        fill: '#C9B87E',
        op: 0.35,
        disp: 18,
        gran: 0.4,
        rim: 0.4,
      });
      P.soft([P.blob(560, 250, 260, 120)], { fill: '#FBF4E2', op: 0.55, blur: 40, blend: 'normal' });
      P.wash(
        [
          {
            d: smoothPath([
              [-20, 540],
              [300, 528],
              [640, 546],
              [980, 530],
              [980, 620],
              [-20, 620],
            ]),
            fill: P.grad([
              [0, '#6E8B4E'],
              [1, '#4F6E3E'],
            ]),
          },
        ],
        { op: 0.5, disp: 18, freq: 0.02, gran: 0.55, rim: 0.5, bloom: 0.4, fleck: 0.35 },
      );
    },
  },
  bgSteppe: {
    w: 960,
    h: 600,
    seed: 303,
    paint(P) {
      P.wash(
        [
          {
            d: poly([
              [-20, -20],
              [980, -20],
              [980, 330],
              [-20, 330],
            ]),
            fill: P.grad([
              [0, '#C7D2D8'],
              [0.7, '#EDE5D2', 0.6],
              [1, '#F2ECDD', 0],
            ]),
          },
        ],
        { op: 0.5, disp: 20, freq: 0.012, gran: 0.2, rim: 0, bloom: 0.5 },
      );
      const g = smoothPath([
        [-20, 318],
        [400, 310],
        [980, 320],
        [980, 620],
        [-20, 620],
      ]);
      P.wash(
        [
          {
            d: g,
            fill: P.grad([
              [0, '#DEC58C'],
              [0.5, '#D4AE68'],
              [1, '#C29A55'],
            ]),
          },
        ],
        { op: 0.62, disp: 22, freq: 0.015, gran: 0.5, rim: 0.4, bloom: 0.5, fleck: 0.4, fleckFreq: '0.005 0.08' },
      );
      const st = [];
      for (let i = 0; i < 40; i++) {
        const y = P.rand(340, 590),
          x = P.rand(-40, 900);
        st.push({
          d: line([
            [x, y],
            [x + P.rand(60, 200), y + P.rand(-3, 3)],
          ]),
          sw: P.rand(2, 5),
        });
      }
      P.wash(st, { stroke: '#A98A4A', op: 0.4, disp: 6, rim: 0, gran: 0.4, fleck: 0.5, fleckFreq: '0.05 0.4' });
      P.wash([P.blob(700, 520, 260, 40, 0.3), P.blob(200, 430, 200, 30, 0.3)], {
        fill: '#A2A574',
        op: 0.35,
        disp: 18,
        gran: 0.4,
        rim: 0.4,
      });
      P.soft([P.blob(600, 240, 280, 110)], { fill: '#FBF1DA', op: 0.55, blur: 40, blend: 'normal' });
      P.wash(
        [
          {
            d: smoothPath([
              [-20, 548],
              [400, 536],
              [980, 552],
              [980, 620],
              [-20, 620],
            ]),
            fill: P.grad([
              [0, '#B3934E'],
              [1, '#8F7A40'],
            ]),
          },
        ],
        { op: 0.5, disp: 18, freq: 0.02, gran: 0.55, rim: 0.5, bloom: 0.4, fleck: 0.4, fleckFreq: '0.006 0.1' },
      );
    },
  },
  bgSea: {
    w: 960,
    h: 600,
    seed: 305,
    paint(P) {
      P.wash(
        [
          {
            d: poly([
              [-20, -20],
              [980, -20],
              [980, 330],
              [-20, 330],
            ]),
            fill: P.grad([
              [0, '#B6C8D2'],
              [0.7, '#E2E8E4', 0.6],
              [1, '#EEF0EA', 0],
            ]),
          },
        ],
        { op: 0.55, disp: 20, freq: 0.012, gran: 0.2, rim: 0, bloom: 0.5 },
      );
      P.wash(
        [
          {
            d: smoothPath([
              [-20, 330],
              [480, 326],
              [980, 332],
              [980, 470],
              [480, 478],
              [-20, 468],
            ]),
            fill: P.grad([
              [0, '#8DB1AE'],
              [1, '#A9C3BF'],
            ]),
          },
        ],
        { op: 0.62, disp: 16, freq: 0.015, gran: 0.5, rim: 0.4, bloom: 0.5, fleck: 0.55, fleckFreq: '0.004 0.1' },
      );
      P.wash(
        [
          {
            d: smoothPath([
              [-20, 470],
              [480, 462],
              [980, 474],
              [980, 620],
              [-20, 620],
            ]),
            fill: P.grad([
              [0, '#DCC9A0'],
              [1, '#C9B07E'],
            ]),
          },
        ],
        { op: 0.55, disp: 18, freq: 0.015, gran: 0.5, rim: 0.4, bloom: 0.4, fleck: 0.3 },
      );
      P.soft([P.blob(660, 300, 220, 60)], { fill: '#F6D9A6', op: 0.5, blur: 34, blend: 'normal' });
      const gl = [];
      for (let i = 0; i < 26; i++) {
        const y = P.rand(336, 440),
          w = P.rand(14, 60),
          x = 660 + P.rand(-1, 1) * (30 + (y - 330) * 0.9);
        gl.push(P.blob(x, y, w / 2, P.rand(1.4, 3), 0.3, 8));
      }
      P.wash(gl, { fill: '#F2C77E', op: 0.75, disp: 3, rim: 0.4, gran: 0.2, bloom: 0, blend: 'normal' });
      P.wash(
        [
          {
            d: smoothPath([
              [-20, 560],
              [480, 548],
              [980, 562],
              [980, 620],
              [-20, 620],
            ]),
            fill: '#A89060',
          },
        ],
        { op: 0.45, disp: 18, freq: 0.02, gran: 0.55, rim: 0.5, fleck: 0.4 },
      );
    },
  },
  /* a few summer clouds with grey bellies and warm tops: the sky of the finished paintings */
  clouds: {
    w: 1600,
    h: 320,
    seed: 311,
    fade: { x: 0.08, b: 0.15, n: 1 },
    paint(P) {
      const heads: string[] = [],
        bellies: string[] = [];
      for (const [cx, cy, s] of [
        [260, 150, 1],
        [760, 110, 1.25],
        [1270, 170, 0.9],
      ]) {
        for (let i = 0; i < 7; i++)
          heads.push(
            P.blob(
              cx + P.rand(-150, 150) * s,
              cy + P.rand(-40, 20) * s,
              P.rand(50, 100) * s,
              P.rand(34, 60) * s,
              0.35,
              12,
            ),
          );
        bellies.push(P.blob(cx, cy + 46 * s, 210 * s, 26 * s, 0.3, 12));
      }
      P.wash(heads, {
        fill: '#F4EBDA',
        op: 0.7,
        disp: 14,
        freq: 0.02,
        wet: 3,
        gran: 0.25,
        rim: 0.25,
        bloom: 0.5,
        fleck: 0.3,
      });
      P.wash(bellies, {
        fill: '#AFB9C4',
        op: 0.45,
        disp: 16,
        freq: 0.02,
        wet: 2,
        gran: 0.45,
        rim: 0.55,
        bloom: 0.3,
        fleck: 0.4,
        fleckFreq: '0.01 0.08',
      });
      P.wash([P.blob(700, 250, 520, 30, 0.3, 14)], {
        fill: '#C9D2D8',
        op: 0.35,
        disp: 18,
        wet: 4,
        gran: 0.3,
        rim: 0.3,
        fleck: 0,
      });
    },
  },
} satisfies PaintDefs;
