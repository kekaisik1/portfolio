/**
 * The room inside "numbers-room": what the place looks like once you are through the door.
 */
import { spines, table } from './shell';
import { arc, box, circ } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'ledger',
  glow: [[300, -330, 120, 0.3]],
  draw(s) {
    for (const y of [-330, -252, -174]) {
      s.line([24, y, 340, y - 0.5], { w: 1.6 });
      spines(s, 30, 336, y, 62);
    }
    s.line([24, -400, 24, -170], { w: 1.4 }).line([340, -400, 340, -170], { w: 1.4 });
    s.fill(circ(468, -250, 92, 92, 0, 6.283, 0.15), 'dark', 0.75, 0);
    s.ell(468, -250, 92, 92, { w: 2, da: 0.08 });
    s.ell(468, -250, 74, 74, { w: 1.1, passes: 1, da: 0.08 });
    const sp = [];
    for (let a = 0; a < 6.2; a += 0.785) sp.push(468, -250, 468 + Math.cos(a) * 44, -250 + Math.sin(a) * 44);
    s.segs(sp, { c: 'paper', w: 2.2, a: 0.7 });
    s.ell(468, -250, 44, 44, { c: 'paper', w: 1.6, passes: 1, a: 0.7 });
    s.dot(468, -250, 9, 'gold', 1);
    for (let a = 0.2; a < 6.2; a += 0.52) s.dot(468 + Math.cos(a) * 83, -250 + Math.sin(a) * 83, 2.4, 'paper', 0.7);
    s.line([300, -436, 300, -372], { w: 1.2, passes: 1 });
    s.poly([276, -372, 324, -372, 334, -348, 266, -348], { fill: 'gold', fa: 0.95, w: 1.2, r: 2 });
    table(s);
    s.poly(box(70, -182, 150, 78), { w: 1.6 });
    s.poly(box(74, -178, 142, 70), { w: 0.8, passes: 1 });
    for (const [y, b] of [
      [-164, [80, 96, 190, 206]],
      [-143, [80, 174, 190, 206]],
      [-122, [80, 96, 112, 206]],
    ] as [number, number[]][]) {
      s.line([74, y, 216, y], { w: 1, passes: 1 });
      for (const x of b) {
        s.fill(circ(x + 6, y, 7, 8), y === -143 ? 'red' : 'gold', 1, 0);
        s.ell(x + 6, y, 7, 8, { w: 0.9, passes: 1, jit: 0.2 });
      }
    }
    s.line([330, -104, 330, -190], { w: 1.8 });
    s.line([286, -180, 374, -192], { w: 1.6 });
    s.segs([286, -180, 272, -146, 286, -180, 300, -146, 374, -192, 360, -156, 374, -192, 388, -156], {
      w: 0.8,
      a: 0.6,
    });
    s.poly(arc(286, -146, 18, 8, 0, Math.PI, 8), { fill: 'gold', fa: 0.8, w: 1.1, r: 0 }).poly(
      arc(374, -156, 18, 8, 0, Math.PI, 8),
      { fill: 'gold', fa: 0.8, w: 1.1, r: 0 },
    );
    for (const [x, n] of [
      [440, 4],
      [466, 8],
      [492, 6],
      [518, 3],
    ])
      for (let k = 0; k < n; k++) {
        s.fill(box(x - 11, -104 - (k + 1) * 5, 22, 5), 'gold', 0.95, 1);
        s.line([x - 11, -104 - (k + 1) * 5, x + 11, -104 - (k + 1) * 5], { w: 0.8, passes: 1, jit: 0.2 });
      }
  },
};
