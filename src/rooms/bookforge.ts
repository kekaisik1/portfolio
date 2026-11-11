/**
 * The room inside "bookforge": what the place looks like once you are through the door.
 */
import { spines, table } from './shell';
import { arc, box, sagLine } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'card',
  glow: [[300, -260, 120, 0.25]],
  draw(s) {
    for (const [x0, x1] of [
      [20, 200],
      [400, 580],
    ]) {
      for (const y of [-360, -288, -216, -144, -72]) {
        s.line([x0, y, x1, y - 0.5], { w: 1.5 });
        spines(s, x0 + 4, x1 - 4, y, 58);
      }
      s.line([x0, -436, x0, -72], { w: 1.4 }).line([x1, -436, x1, -72], { w: 1.4 });
    }
    const ar = [236, -110, 236, -300].concat(arc(300, -300, 64, 70, Math.PI, 2 * Math.PI, 12), [364, -110]);
    s.fill(ar, 'sky', 1, 0);
    s.line(ar, { w: 1.5 });
    s.segs([300, -370, 300, -110, 236, -240, 364, -240], { w: 1, a: 0.7 });
    s.line([352, -72, 396, -400], { w: 1.8 }).line([376, -72, 420, -400], { w: 1.8 });
    const ld = [];
    for (let k = 1; k < 13; k++) ld.push(352 + k * 3.4, -72 - k * 25, 376 + k * 3.4, -72 - k * 25);
    s.segs(ld, { w: 1.4, a: 0.75 });
    const pins = [
      [60, -396],
      [182, -330],
      [250, -398],
      [420, -350],
      [540, -400],
      [500, -250],
      [120, -230],
    ];
    for (let i = 0; i < pins.length - 1; i++)
      s.line(sagLine(pins[i][0], pins[i][1], pins[i + 1][0], pins[i + 1][1], 14, 10), {
        c: 'red',
        w: 1.4,
        passes: 1,
        jit: 0.3,
        a: 0.95,
      });
    for (const [x, y] of pins) {
      s.dot(x, y, 4, 'red', 1);
      s.ell(x, y, 4, 4, { w: 0.8, passes: 1, jit: 0.2 });
    }
    for (const [x, y] of [
      [120, -352],
      [216, -356],
      [336, -366],
      [480, -366],
      [520, -316],
    ]) {
      s.poly(box(x - 9, y, 18, 23), { fill: 'paper', w: 0.9, passes: 1, r: 1.5 });
      s.segs([x - 5, y + 7, x + 5, y + 7, x - 5, y + 12, x + 3, y + 12], { w: 0.7, a: 0.5 });
    }
    table(s, 80, 520);
    s.poly([190, -104, 196, -126, 270, -116, 344, -126, 350, -104], { fill: 'paper', w: 1.2, r: 1.5 });
    s.segs(
      [270, -116, 270, -104, 206, -120, 258, -113, 206, -113, 256, -107, 282, -113, 338, -120, 282, -107, 336, -113],
      { w: 0.8, a: 0.55 },
    );
    s.line([440, -104, 440, -170, 420, -188], { w: 1.6 });
    s.poly([396, -198, 436, -198, 426, -172, 406, -172], { fill: 'gold', fa: 0.95, w: 1.2, r: 2 });
    for (let k = 0; k < 3; k++)
      s.poly(box(100 + k * 4, -104 - (k + 1) * 11, 60 - k * 6, 11), {
        fill: ['blue', 'wash', 'dark'][k],
        fa: 0.85,
        w: 1.1,
      });
  },
};
