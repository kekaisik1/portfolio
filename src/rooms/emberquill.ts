/**
 * The room inside "emberquill": what the place looks like once you are through the door.
 */
import { table } from './shell';
import { arc, box } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'scroll',
  wall: 'fill',
  glow: [
    [110, -150, 150, 0.5],
    [330, -150, 60, 0.35],
  ],
  draw(s) {
    s.bricks(6, -430, 594, -76, { rh: 22, bw: 50, d: 0.3, a: 0.25 });
    for (const x of [0, 150, 300, 450]) s.poly(box(x, -440, 150, 18), { fill: 'dark', fa: 0.8, w: 1.2, r: 1.5 });
    /* the fire */
    const ar = [40, -70, 40, -190].concat(arc(110, -190, 70, 56, Math.PI, 2 * Math.PI, 12), [180, -70]);
    s.fill(ar, 'deep', 0.92, 0);
    s.line(ar, { w: 1.8 });
    s.poly(box(22, -262, 176, 16), { fill: 'wash', w: 1.3 });
    s.bricks(24, -246, 196, -72, { rh: 14, bw: 28, d: 0.5, a: 0.35 });
    s.fill(ar, 'deep', 0.92, 0);
    s.poly([78, -72, 92, -130, 104, -104, 112, -160, 124, -110, 134, -136, 146, -72], {
      fill: 'gold',
      fa: 0.95,
      w: 1.2,
      r: 0,
    });
    s.poly([96, -72, 106, -104, 114, -86, 122, -112, 130, -72], { fill: 'red', fa: 0.8, w: 0.9, passes: 1, r: 0 });
    s.segs([70, -74, 150, -78, 76, -80, 146, -72], { w: 3, a: 0.8 });
    /* a shield and what was left on the wall */
    s.poly([420, -390, 500, -390, 500, -330, 460, -290, 420, -330], { fill: 'red', fa: 0.8, w: 1.5 });
    s.segs([460, -390, 460, -294, 420, -350, 500, -350], { c: 'paper', w: 2, a: 0.7 });
    s.line([390, -280, 530, -400], { w: 2, passes: 1 }).line([530, -280, 390, -400], { w: 2, passes: 1 });
    s.poly(box(240, -380, 110, 76), { fill: 'paper', w: 1.2 });
    s.line([252, -330, 276, -352, 300, -336, 330, -360], { w: 1, passes: 1 }).segs(
      [318, -330, 328, -320, 328, -330, 318, -320],
      { c: 'red', w: 1.6, a: 0.9 },
    );
    s.barrel(540, -70, 1.5);
    table(s, 200, 560);
    s.poly([240, -104, 250, -122, 390, -118, 400, -104], { fill: 'paper', w: 1.2, r: 1.5 });
    s.segs([262, -112, 300, -116, 310, -110, 350, -114, 356, -108, 384, -110], { w: 0.8, a: 0.5 });
    s.dot(330, -112, 2.6, 'red', 1);
    const hx = [];
    for (let i = 0; i < 6; i++) hx.push(440 + Math.cos(i * 1.047 + 0.5) * 20, -122 + Math.sin(i * 1.047 + 0.5) * 20);
    s.poly(hx, { fill: 'red', fa: 0.88, w: 1.4, r: 1 });
    s.text('20', 440, -122, 14, { c: 'paper', a: 0.9 });
    s.poly(box(474, -116, 13, 12), { fill: 'paper', w: 1, r: 2 });
    s.poly(box(506, -134, 22, 30), { fill: 'paper', w: 1.2 });
    s.ell(531, -120, 6, 8, { a0: -1.4, a1: 1.4, w: 1.2, passes: 1 });
    s.line([330, -104, 330, -140], { w: 3 });
    s.poly([326, -140, 330, -154, 334, -140], { fill: 'gold', fa: 1, w: 0.9, passes: 1, r: 0 });
  },
};
