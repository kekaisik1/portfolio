/**
 * The room inside "history-lens": what the place looks like once you are through the door.
 */
import { spines, table } from './shell';
import { box } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'letter',
  win: [440, -392, 120, 150],
  glow: [[400, -300, 80, 0.4]],
  draw(s) {
    const R = s.rnd;
    s.fill(box(40, -404, 320, 214), 'lensFill', 1, 3);
    s.rect(40, -404, 320, 214, { w: 1.5 });
    s.segs(
      [
        40, -330, 360, -300, 40, -318, 360, -288, 150, -404, 190, -190, 162, -404, 202, -190, 260, -404, 250, -190, 40,
        -230, 360, -250, 300, -330, 360, -390,
      ],
      { w: 1, a: 0.5 },
    );
    const bars = [];
    for (let i = 0; i < 70; i++) {
      const a = R() * 6.283,
        d = 6 + R() * R() * 120,
        x = 196 + Math.cos(a) * d * 1.2,
        y = -300 + Math.sin(a) * d * 0.75;
      if (x > 50 && x < 350 && y > -396 && y < -198) bars.push(x, y, x + 7, y - 1.6);
    }
    s.segs(bars, { c: 'red', w: 2.6, a: 0.9 });
    s.ell(196, -300, 12, 12, { c: 'red', w: 1.8 });
    s.dot(196, -300, 4, 'red', 1);
    s.dot(46, -398, 3, 'dark', 0.9);
    s.dot(354, -398, 3, 'dark', 0.9);
    s.line([400, -250, 400, -290, 386, -300], { w: 1.6 });
    s.poly([374, -330, 398, -330, 394, -300, 378, -300], { fill: 'gold', fa: 0.95, w: 1.2, r: 2 });
    for (const y of [-196, -140]) {
      s.line([430, y, 580, y - 0.5], { w: 1.5 });
      spines(s, 436, 576, y, 46);
    }
    table(s);
    s.poly([90, -104, 96, -112, 150, -112, 156, -104], { fill: 'dark', fa: 0.9, w: 1.2, r: 1.5 });
    s.line([124, -112, 118, -168, 140, -196], { w: 3 });
    s.line([140, -196, 156, -160], { w: 5, jit: 0.3 });
    s.poly(box(104, -132, 44, 5), { fill: 'dark', fa: 0.9, w: 1, r: 1 });
    s.ell(146, -198, 7, 5, { w: 1.4, passes: 1 });
    for (let k = 0; k < 4; k++)
      s.poly(
        [230 + k * 3, -104 - k * 4, 330 + k * 2, -104 - k * 4, 332 + k * 2, -108 - k * 4, 232 + k * 3, -108 - k * 4],
        { fill: 'paper', w: 0.9, passes: 1, r: 0 },
      );
    s.poly([400, -104, 396, -122, 404, -130, 426, -130, 434, -122, 430, -104], { fill: 'deep', fa: 0.9, w: 1.2 });
    s.line([416, -128, 440, -190, 452, -210], { w: 1.2, passes: 1 });
    s.poly([434, -176, 428, -200, 446, -222, 454, -214, 452, -192], { fill: 'paper', w: 1, passes: 1 });
    s.ell(506, -112, 20, 7, { w: 1.6 });
    s.line([526, -110, 560, -106], { w: 3, passes: 1 });
  },
};
