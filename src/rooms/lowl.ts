/**
 * The room inside "lowl": what the place looks like once you are through the door.
 */
import { table } from './shell';
import { box } from '../world/draw/pencil';
import type { RoomDef } from '../world/types';

export const room: RoomDef = {
  sheet: 'ticket',
  win: [430, -392, 130, 130],
  glow: [[250, -250, 130, 0.32]],
  draw(s) {
    s.fill(box(36, -400, 300, 200), 'paper', 1, 4);
    s.rect(36, -400, 300, 200, { w: 1.4 });
    const pd = [];
    for (let y = -388; y < -206; y += 18) for (let x = 50; x < 330; x += 18) pd.push(x, y, x + 0.8, y);
    s.segs(pd, { w: 1.4, a: 0.3 });
    s.line([70, -380, 70, -300], { w: 2 }).line([56, -380, 86, -380], { w: 5, jit: 0.3 });
    s.line([110, -384, 110, -310], { w: 2.2 }).ell(110, -300, 9, 10, { a0: 0.7, a1: 5.6, w: 1.8, passes: 1 });
    s.line([150, -384, 150, -340, 140, -300, 150, -340, 160, -300], { w: 2, passes: 1 });
    s.poly([186, -380, 280, -380, 280, -362, 206, -348], { w: 1.6, r: 1 });
    s.line([304, -384, 304, -306], { w: 2 }).segs([298, -306, 310, -306], { w: 3, a: 0.8 });
    s.ell(90, -244, 22, 22, { w: 1.6 }).ell(90, -244, 13, 13, { w: 1.2, passes: 1 });
    s.line([150, -270, 150, -220], { w: 2 })
      .line([190, -270, 190, -220], { w: 1.6 })
      .line([226, -270, 226, -214], { w: 2.4 });
    s.poly(box(256, -262, 56, 34), { fill: 'red', fa: 0.8, w: 1.2 });
    s.line([250, -436, 250, -330], { w: 1.2, passes: 1 });
    s.poly([222, -330, 278, -330, 294, -298, 206, -298], { fill: 'gold', fa: 0.95, w: 1.3, r: 2 });
    s.line([420, -236, 580, -237], { w: 1.6 }).line([420, -172, 580, -173], { w: 1.6 });
    s.crate(430, -237, 40, 30)
      .crate(478, -237, 34, 24, 'blue')
      .crate(520, -237, 44, 36, 'fill')
      .crate(436, -173, 50, 34, 'fill')
      .crate(496, -173, 30, 26)
      .crate(534, -173, 36, 40, 'blue');
    table(s);
    s.poly(box(70, -132, 46, 28), { fill: 'dark', fa: 0.9, w: 1.3 });
    s.poly(box(62, -150, 16, 20), { fill: 'dark', fa: 0.9, w: 1.1 }).poly(box(104, -150, 16, 20), {
      fill: 'dark',
      fa: 0.9,
      w: 1.1,
    });
    s.line([120, -140, 150, -140], { w: 2.4, passes: 1 }).segs([150, -148, 150, -132], { w: 2.4, a: 0.8 });
    s.poly(box(230, -160, 90, 56), { fill: 'blue', w: 1.3 });
    s.ell(258, -132, 17, 17, { w: 1.2 });
    s.segs([288, -146, 310, -146, 288, -134, 310, -134, 288, -122, 310, -122], { w: 1.4, a: 0.6 });
    s.line([320, -150, 352, -176, 380, -150], { w: 0.9, passes: 1 });
    s.line([400, -106, 470, -110], { w: 2.2, passes: 1 }).line([420, -112, 480, -106], { w: 1.6, passes: 1 });
    for (const x of [500, 514, 528]) s.ell(x, -108, 4, 3, { w: 1, passes: 1 });
  },
};
