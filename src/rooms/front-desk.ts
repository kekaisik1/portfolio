/**
 * The room inside "front-desk": what the place looks like once you are through the door.
 */
import { table } from './shell';
import { box, circ, sagLine } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'book',
  win: [36, -392, 120, 150],
  glow: [
    [500, -150, 110, 0.4],
    [96, -320, 120, 0.18],
  ],
  draw(s) {
    const R = s.rnd;
    s.fill(box(330, -400, 230, 176), 'dark', 0.5, 4);
    s.rect(330, -400, 230, 176, { w: 1.4 });
    const jk = [];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 11; c++) jk.push(346 + c * 19.6, -384 + r * 23, 348.5 + c * 19.6, -384 + r * 23);
    s.segs(jk, { w: 3, a: 0.85 });
    for (const [c, r, ex] of [
      [1, 2, 300],
      [3, 1, 340],
      [5, 4, 390],
      [8, 2, 440],
      [10, 5, 520],
      [6, 0, 470],
    ])
      s.line(sagLine(346 + c * 19.6, -384 + r * 23, ex, -106, 30 + R() * 20, 14), {
        w: 1.2,
        passes: 1,
        jit: 0.3,
        a: 0.85,
      });
    s.fill(circ(244, -340, 30, 30), 'paper', 1, 0);
    s.ell(244, -340, 30, 30, { w: 1.5 });
    const tk = [];
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      tk.push(244 + Math.cos(a) * 21, -340 + Math.sin(a) * 21, 244 + Math.cos(a) * 25, -340 + Math.sin(a) * 25);
    }
    s.segs(tk, { w: 1.1, a: 0.8 });
    s.line([244, -340, 244, -358], { w: 1.4, passes: 1 }).line([244, -340, 257, -333], { w: 1.8, passes: 1 });
    s.ell(250, -236, 20, 20, { a0: Math.PI, a1: Math.PI * 2, w: 1.8, passes: 1, jit: 0.2 });
    s.fill(box(225, -240, 10, 20), 'dark', 0.95).fill(box(265, -240, 10, 20), 'dark', 0.95);
    s.line([250, -256, 250, -272], { w: 1.2, passes: 1 });
    table(s);
    /* the telephone, the book, the lamp */
    s.poly([84, -104, 90, -116, 132, -116, 138, -104], { fill: 'dark', fa: 0.9, w: 1.3, r: 2 });
    s.line([111, -116, 111, -176], { w: 3, jit: 0.3 });
    s.poly([98, -176, 124, -176, 128, -196, 94, -196], { fill: 'dark', fa: 0.9, w: 1.2, r: 2 });
    s.line([111, -150, 140, -156, 146, -176], { w: 1.4, passes: 1 });
    s.poly([140, -176, 152, -176, 154, -214, 138, -214], { fill: 'dark', fa: 0.9, w: 1.2, r: 3 });
    s.poly([196, -104, 200, -124, 262, -116, 324, -124, 328, -104], { fill: 'paper', w: 1.2, r: 1.5 });
    s.segs(
      [262, -116, 262, -104, 208, -118, 252, -112, 208, -112, 250, -107, 272, -112, 318, -118, 272, -107, 316, -112],
      { w: 0.8, a: 0.55 },
    );
    s.line([262, -116, 266, -96], { c: 'red', w: 1.4, passes: 1 });
    s.line([500, -104, 500, -166, 478, -186], { w: 1.6 });
    s.poly([452, -196, 494, -196, 484, -170, 462, -170], { fill: 'gold', fa: 0.95, w: 1.2, r: 2 });
    s.poly(box(486, -110, 28, 6), { fill: 'dark', fa: 0.9, w: 1, r: 1.5 });
  },
};
