/**
 * The room inside "kana-notebook": what the place looks like once you are through the door.
 */
import { box, circ } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'genko',
  wall: 'paper',
  floor: 'gold',
  glow: [[300, -260, 200, 0.22]],
  draw(s) {
    for (let i = 0; i < 4; i++) {
      const x = 130 + i * 86;
      s.rect(x, -400, 82, 326, { w: 1.4 });
      const gl = [];
      for (let c = 1; c < 3; c++) gl.push(x + c * 27.3, -400, x + c * 27.3, -74);
      for (let r = 1; r < 9; r++) gl.push(x, -400 + r * 36.2, x + 82, -400 + r * 36.2);
      s.segs(gl, { w: 0.8, a: 0.45 });
    }
    s.segs([130, -70, 60, 0, 300, -70, 300, 0, 474, -70, 540, 0, 0, -34, 600, -34], { w: 1.2, a: 0.5 });
    s.line([30, -410, 100, -410], { w: 2.4, passes: 1 });
    s.poly(box(36, -408, 58, 250), { fill: 'paper', w: 1.2, r: 1 });
    s.line([30, -156, 100, -156], { w: 2.4, passes: 1 });
    const K = (pts: number[], w: number) =>
      s.line(
        pts.map((v, i) => (i % 2 ? v * 2.6 - 300 : v * 2.6 + 65)),
        { w, passes: 2, jit: 0.3, step: 3, a: 0.95 },
      );
    K([-9, -15, 0, -17, 10, -18], 4);
    K([-1, -25, -3, -8, -1, 6, 1, 13], 4);
    K([7, -9, 3, 0, -4, 8, -10, 10, -12, 3, -8, -4, 0, -7, 8, -5, 13, 2, 11, 10, 4, 15], 3.4);
    s.poly(box(46, -192, 20, 20), { fill: 'red', fa: 0.95, w: 1, r: 2 });
    s.fill(circ(536, -290, 44, 44, 0, 6.283, 0.2), 'sky', 1, 0);
    s.ell(536, -290, 44, 44, { w: 1.8 });
    s.line([500, -276, 520, -300, 540, -282, 572, -300], { w: 1, passes: 1, a: 0.6 });
    s.line([490, -180, 580, -181], { w: 1.6 });
    s.poly([520, -181, 516, -196, 552, -196, 548, -181], { fill: 'blue', w: 1.1 });
    s.line([534, -196, 532, -216, 520, -226], { w: 1.6, passes: 1 });
    s.shrub(520, -224, 11, 'leaf').shrub(544, -212, 9, 'leaf');
    /* the low table: paper, brush, inkstone */
    s.poly([150, -76, 450, -76, 466, -58, 134, -58], { fill: 'wash', w: 1.4, r: 2 });
    s.segs([150, -58, 148, -30, 450, -58, 452, -30], { w: 3, a: 0.8 });
    s.poly([220, -76, 228, -96, 330, -92, 336, -76], { fill: 'paper', w: 1.1, r: 1 });
    s.poly(box(366, -84, 48, 8), { fill: 'deep', fa: 0.95, w: 1.1, r: 2 });
    s.line([344, -80, 400, -100], { w: 2.4, passes: 1 });
    s.poly([338, -78, 346, -84, 350, -78], { fill: 'deep', fa: 1, w: 0.8, passes: 1, r: 0 });
    s.poly([60, -30, 68, -40, 132, -40, 140, -30, 132, -22, 68, -22], { fill: 'blue', w: 1.2, r: 3 });
  },
};
