/**
 * The drawing of the place for "front-desk": the scene on its three sheets, and its one small moving part.
 */
import { smooth } from '../lib/math';
import { definePlace } from './define';
import { cat, insulators, puffs } from '../world/draw/critters';
import { arc, box, circ, glow, sagLine } from '../world/draw/pencil';
import { paint, pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* The Front Desk: a telephone exchange with a handset for a roof sign and a bell that never stops */
export const place: PlaceDef = definePlace({
  hit: [-410, -398, 424, 10],
  ext: [-416, -404, 430, 14],
  size: 0.66,
  wire: [232, -306],
  capAt: [-410, -330],
  capW: 190,
  life: { kind: 'ring', ax: 0.45, ay: 0.2 },
  build(s) {
    const R = s.rnd,
      roofY = (x: number) => -166 - 96 * (1 - Math.abs(x + 10) / 186);
    /* the mast the line leaves from */
    s.fill([225, 2, 227, -324, 235, -324, 237, 2], 'wash', 0.9);
    s.line([225, 3, 227, -325], { w: 1.4 }).line([237, 3, 235, -324], { w: 1.2 });
    for (const y of [-306, -278]) {
      s.line([196, y, 268, y - 2], { w: 1.6 }).line([197, y + 4, 267, y + 2], { w: 0.9, passes: 1, a: 0.55 });
      insulators(s, [203, 217, 247, 261], y);
    }
    s.line([229, -214, 204, -272], { w: 1, passes: 1, a: 0.65 }).line([233, -214, 258, -274], {
      w: 1,
      passes: 1,
      a: 0.65,
    });
    const rung = [];
    for (let y = -46; y > -200; y -= 24) rung.push(221, y, 241, y - 1.5);
    s.segs(rung, { w: 1.3, a: 0.7 });
    s.line(sagLine(98, -209, 203, -313, 12), { w: 0.8, passes: 1, a: 0.6, jit: 0.3 }).line(
      sagLine(112, -201, 217, -285, 12),
      { w: 0.8, passes: 1, a: 0.6, jit: 0.3 },
    );
    /* a mailbox by the path */
    s.line([-226, 2, -226, -62], { w: 1.5 }).line([-222, 2, -222, -62], { w: 1, passes: 1, a: 0.6 });
    s.poly([-244, -62, -244, -78].concat(arc(-224, -78, 20, 12, Math.PI, 2 * Math.PI, 8), [-204, -62]), {
      fill: 'blue',
      w: 1.15,
    });
    s.segs([-238, -70, -212, -70], { w: 1.4, a: 0.7 });
    s.line([-204, -74, -196, -74, -196, -90], { w: 1.2, passes: 1, jit: 0.2 });
    s.fill(box(-196, -92, 9, 7), 'red', 0.9);
    /* walls */
    s.poly([-170, 0, -170, -170, 150, -170, 150, 0], { fill: 'fill', w: 1.35 });
    const pk = [];
    for (let x = -158; x < 148; x += 14 + R() * 6) pk.push(x, -166, x + (R() - 0.5) * 2, -32);
    s.segs(pk, { w: 0.7, a: 0.2 });
    s.fill([-173, 0, -173, -30, 153, -30, 153, 0], 'wash', 0.8);
    s.line([-173, -30, 153, -31], { w: 1.1 })
      .line([-173, 2, -173, -30], { w: 1.2, passes: 1 })
      .line([153, 2, 153, -31], { w: 1.2, passes: 1 });
    s.bricks(-171, -30, 151, -1, { rh: 10, bw: 27, d: 0.8, a: 0.42 });
    s.hatch(96, -166, 148, -34, 7, { a: 0.2 });
    /* gable, clock */
    s.fill([-186, -168, -10, -258, 166, -168], 'fill');
    const gp = [];
    for (let x = -160; x < 150; x += 15 + R() * 6) gp.push(x, -169, x, roofY(x) + 12);
    s.segs(gp, { w: 0.7, a: 0.2 });
    s.line([-178, -169, 158, -170], { w: 1.1, passes: 1, a: 0.7 });
    s.poly([-202, -163, -10, -272, 182, -163, 171, -155, -10, -255, -191, -155], { fill: 'dark', fa: 0.85, w: 1.25 });
    s.fill(circ(-10, -206, 23, 23), 'paper');
    s.ell(-10, -206, 23, 23, { w: 1.4, jit: 0.4 });
    s.ell(-10, -206, 19.5, 19.5, { w: 0.6, passes: 1, a: 0.5, jit: 0.3 });
    const tk = [];
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      tk.push(-10 + Math.cos(a) * 15, -206 + Math.sin(a) * 15, -10 + Math.cos(a) * 18, -206 + Math.sin(a) * 18);
    }
    s.segs(tk, { w: 1, a: 0.8 });
    /* stovepipe */
    s.poly([-112, roofY(-112) + 2, -112, -246, -98, -246, -98, roofY(-98) + 2], { fill: 'dark', fa: 0.6, w: 1.1 });
    s.line([-116, -246, -94, -247], { w: 1.6 });
    /* door, steps, lamp */
    s.poly([-150, 0, -150, -114, -96, -114, -96, 0], { fill: 'wash', w: 1.25 });
    s.rect(-144, -108, 42, 100, { w: 0.7, passes: 1, a: 0.5 });
    s.win(-138, -102, 30, 36, { sill: false });
    s.ell(-103, -54, 2.6, 2.6, { w: 1.3, passes: 1, jit: 0.2 });
    s.poly([-160, -114, -88, -116, -80, -128, -152, -131], { fill: 'dark', fa: 0.7, w: 1.1 });
    s.poly([-158, 0, -158, -9, -88, -9, -88, 0], { fill: 'paper', w: 1.1 }).poly([-166, 9, -166, 0, -80, 0, -80, 9], {
      fill: 'paper',
      w: 1.1,
    });
    s.line([-90, -98, -78, -100, -78, -92], { w: 1, passes: 1, jit: 0.3 });
    s.poly([-84, -92, -72, -92, -74, -76, -82, -76], { fill: 'gold', fa: 0.9, w: 0.9, passes: 1, jit: 0.3 });
    /* the window: a switchboard, cords, the appointment book */
    s.fill(box(-70, -152, 192, 98), 'paper');
    s.fill(box(-62, -147, 106, 62), 'dark', 0.45);
    s.rect(-62, -147, 106, 62, { w: 1, passes: 1, jit: 0.4 });
    const jk = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 9; c++) {
        const x = -54 + c * 11.3,
          y = -140 + r * 11.6;
        jk.push(x, y, x + 1.6, y);
      }
    s.segs(jk, { w: 2.1, a: 0.85 });
    for (const [c, r, ex] of [
      [1, 1, -44],
      [3, 0, -14],
      [4, 3, 8],
      [6, 2, 30],
      [8, 1, 50],
    ])
      s.line(sagLine(-54 + c * 11.3, -140 + r * 11.6, ex, -71, 14 + R() * 8, 10), {
        w: 0.9,
        passes: 1,
        jit: 0.3,
        a: 0.8,
      });
    s.line([-66, -70, 118, -71], { w: 1.5 });
    s.poly([60, -71, 62, -81, 79, -77, 96, -81, 98, -71], { fill: 'paper', w: 0.9, passes: 1, jit: 0.3 });
    s.segs([79, -77, 79, -71, 65, -76, 75, -75, 83, -75, 93, -76], { w: 0.7, a: 0.6 });
    s.line([110, -71, 110, -94, 100, -102], { w: 1, passes: 1, jit: 0.3 });
    s.poly([91, -106, 104, -106, 101, -98, 94, -98], { fill: 'gold', fa: 0.95, w: 0.8, passes: 1, jit: 0.2 });
    s.ell(74, -126, 11, 11, { a0: Math.PI, a1: Math.PI * 2, w: 1.4, passes: 1, jit: 0.2 });
    s.fill(box(60, -128, 6, 11), 'dark', 0.95).fill(box(82, -128, 6, 11), 'dark', 0.95);
    s.rect(-70, -152, 192, 98, { w: 1.35, jit: 0.4 });
    s.poly([-78, -54, 130, -55, 126, -42, -74, -41], { fill: 'wash', w: 1.1 });
    s.tufts(-70, 124, -54, { sp: 9, h: 5, a: 0.6 });
    for (const x of [-52, -20, 14, 50, 88]) s.dot(x + R() * 8, -60 - R() * 4, 2.2, 'red', 0.8);
    /* the handset, on four posts */
    for (const x of [-166, -128, 106, 144]) s.line([x, roofY(x) + 4, x, -268], { w: 1.5 });
    s.segs([-166, -204, -128, -252, -128, -210, -166, -252, 106, -252, 144, -210, 144, -252, 106, -204], {
      w: 0.8,
      a: 0.5,
    });
    const hs = arc(-10, -300, 172, 94, Math.PI, 2 * Math.PI, 24).concat(
      [168, -268, 86, -268],
      arc(-10, -300, 104, 48, 2 * Math.PI, Math.PI, 18),
      [-106, -268, -188, -268],
    );
    s.poly(hs, { fill: 'dark', fa: 0.92, w: 1.5 });
    s.line([-186, -277, -107, -277], { w: 1, passes: 1, a: 0.7 }).line([87, -277, 166, -277], {
      w: 1,
      passes: 1,
      a: 0.7,
    });
    const hl = [];
    for (let x = -176; x < -112; x += 9) hl.push(x, -272, x + 1.5, -272);
    for (let x = 96; x < 160; x += 9) hl.push(x, -272, x + 1.5, -272);
    s.segs(hl, { w: 1.8, a: 0.8 });
    s.line(arc(-10, -300, 152, 80, Math.PI * 1.12, Math.PI * 1.6, 12), {
      c: 'paper',
      w: 1.3,
      passes: 1,
      a: 0.55,
      jit: 0.4,
    });
    s.hatch(40, -388, 150, -300, 6, { a: 0.25, k: -0.6 });
    s.tufts(-250, -176, 2, { sp: 20 }).tufts(160, 222, 2, { sp: 20 }).tufts(244, 286, 2, { sp: 18 });
    s.line(arc(262, 2, 14, 9, Math.PI, 2 * Math.PI, 6), { w: 1.1, passes: 1 });
    /* a path to the door, a bicycle against the wall, things growing along the foot of it */
    s.pathTo(-123, 22, 9);
    s.shrub(-188, 0, 13).shrub(-176, 0, 8, 'blue');
    s.plants(-250, -200, 1).plants(-84, 150, 0, { fl: 0.22 }).plants(244, 284, 1);
    s.bike(160, 0, 0.92);
    const rt = [];
    for (let x = -180; x < 164; x += 9) {
      const y = -166 - 96 * (1 - Math.abs(x + 10) / 186) * 1.08;
      rt.push(x, y - 3, x + (x < -10 ? -2 : 2), y + 3);
    }
    s.segs(rt, { c: 'paper', w: 0.9, a: 0.4 });
    s.segs([-134, -66, -134, -80, -128, -66, -128, -84, -116, -66, -116, -84, -110, -66, -110, -80], {
      w: 0.6,
      a: 0.3,
    });
    /* the bell under the handle (it swings from its top) */
    s.part('bell');
    s.line([-10, -350, -10, -338], { w: 1.5, passes: 1, jit: 0.2 });
    s.poly([-16, -337, -22, -319, -25, -307, -34, -298, 14, -298, 5, -307, 2, -319, -4, -337], {
      fill: 'gold',
      fa: 0.95,
      w: 1.25,
      jit: 0.3,
    });
    s.line([-34, -298, 14, -298], { w: 1.5, passes: 1, jit: 0.2 });
    s.dot(-10, -293, 3.6, 'dark', 1);
  },
  live(g, P, st, pal) {
    const hc = st.hc,
      sw = st.still ? 0.08 : Math.sin(st.t * 1.9) * 0.1 * (1 - hc) + hc * Math.sin(st.t * 17) * 0.24;
    g.save();
    g.translate(-10, -350);
    g.rotate(sw);
    g.scale(1.1, 1.1);
    g.translate(10, 350);
    paint(g, P.bell, pal);
    g.restore();
    /* the clock keeps the visitor's own time */
    const d = new Date(),
      m = d.getMinutes() + d.getSeconds() / 60,
      h = (d.getHours() % 12) + m / 60;
    g.strokeStyle = pal.ink;
    g.globalAlpha = 0.9;
    for (const [a, len, w] of [
      [(h / 12) * 6.283 - 1.571, 10, 1.9],
      [(m / 60) * 6.283 - 1.571, 15.5, 1.3],
    ]) {
      g.lineWidth = w * pen.lw;
      g.beginPath();
      g.moveTo(-10, -206);
      g.lineTo(-10 + Math.cos(a) * len, -206 + Math.sin(a) * len);
      g.stroke();
    }
    g.globalAlpha = 1;
    if (st.lit > 0.01) {
      glow(g, 26, -104, 100, pal.warm, 0.4 * st.lit);
      glow(g, -123, -84, 34, pal.warm, 0.5 * st.lit);
    }
    puffs(g, -105, -252, st.t, pal, st.still);
    cat(g, 96, -55.5, 1, st.t, pal, st.still ? 0 : smooth((Math.sin(st.t * 0.7) - 0.8) / 0.2));
    if (hc > 0.02 && !st.still) {
      g.strokeStyle = pal.ink;
      g.lineWidth = 1.2 * pen.lw;
      for (const sd of [-1, 1])
        for (let k = 0; k < 3; k++) {
          const pu = Math.max(0, Math.sin(st.t * 11 - k * 0.9)),
            r = 34 + k * 9 + pu * 3;
          g.globalAlpha = hc * (0.25 + 0.6 * pu);
          g.beginPath();
          g.arc(-10, -312, r, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5);
          g.stroke();
        }
      g.globalAlpha = 1;
    }
  },
  core: [-262, 296],
  door: [-123, -50],
  pre(s) {
    s.hill(-430, 440, 0, 150, { fa: 0.4 });
    s.tree(-388, 0, 124, 'pine')
      .tree(-332, 0, 168, 'pine')
      .tree(-292, 0, 108, 'pine')
      .tree(356, 0, 176, 'pine')
      .tree(404, 0, 122, 'pine');
  },
  under(s) {
    /* a second mast, and the shed where the cable is kept */
    s.fill([-356, 2, -355, -306, -348, -306, -347, 2], 'wash', 0.9);
    s.line([-356, 3, -355, -307], { w: 1.4 }).line([-347, 3, -348, -306], { w: 1.2 });
    for (const y of [-290, -264]) {
      s.line([-382, y, -322, y - 2], { w: 1.6 });
      insulators(s, [-376, -362, -342, -328], y);
    }
    s.house(302, 104, 82, { tex: 'plank' });
    s.poly([292, -80, 414, -100, 416, -90, 294, -70], { fill: 'dark', fa: 0.85, w: 1.4, r: 2 });
    s.door(322, 28, 60, { c: 'wash' });
    s.win(368, -62, 26, 26, { nx: 2, ny: 2 });
    /* the wires fan out from the handset to both masts and away */
    for (const [a, b, c, d, sg] of [
      [-186, -284, -328, -271, 16],
      [-186, -290, -342, -297, 14],
      [-170, -300, -362, -297, 22],
      [-376, -297, -430, -262, 6],
      [-376, -271, -430, -240, 6],
      [166, -288, 203, -313, 5],
      [160, -300, 217, -313, 8],
      [261, -313, 440, -280, 10],
      [261, -285, 440, -252, 10],
      [247, -285, 352, -94, 20],
    ])
      s.line(sagLine(a, b, c, d, sg), { w: 0.8, passes: 1, a: 0.6, jit: 0.3 });
  },
  post(s) {
    s.fence(-404, -182, 0, 26).fence(256, 296, 0, 26);
    s.line([-176, 1, -176, -36], { w: 2 }).line([-74, 1, -74, -36], { w: 2 });
    s.fill(circ(-300, -22, 22, 22, 0, 6.283, 0.3), 'wash', 1, 0);
    s.ell(-300, -22, 22, 22, { w: 1.4, jit: 0.4 });
    s.ell(-300, -22, 8, 8, { w: 1, passes: 1, jit: 0.3 });
    s.ell(-300, -22, 15, 15, { w: 0.6, passes: 1, a: 0.4, jit: 0.3 });
    s.plants(-410, -330, 1, { fl: 0.3 }).plants(300, 424, 1, { fl: 0.3 });
  },
});
