/**
 * The drawing of the place for "numbers-room": the scene on its three sheets, and its one small moving part.
 */
import { smooth } from '../lib/math';
import { RODS, definePlace } from './define';
import { bird, insulators } from '../world/draw/critters';
import { arc, band, box, circ, glow, sagLine } from '../world/draw/pencil';
import { paint, pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* The Numbers Room: a counting house with an abacus on the roof and a receipt running down its steps */
export const place: PlaceDef = definePlace({
  hit: [-330, -428, 392, 12],
  ext: [-336, -434, 398, 22],
  size: 0.7,
  wire: [-222, -368],
  capAt: [176, -330],
  capW: 200,
  life: { kind: 'digit', ax: 0.86, ay: 0.5 },
  build(s) {
    const R = s.rnd;
    s.lift((x, y) => [x, y - 70]);
    /* the telephone line's pole */
    s.fill([-226, 2, -225, -312, -218, -312, -217, 2], 'wash', 0.9);
    s.line([-226, 3, -225, -313], { w: 1.4 }).line([-217, 3, -218, -312], { w: 1.2 });
    s.line([-248, -294, -196, -296], { w: 1.6 }).line([-247, -290, -197, -292], { w: 0.9, passes: 1, a: 0.55 });
    insulators(s, [-241, -203], -295);
    s.line(sagLine(-203, -302, -134, -238, 10), { w: 0.8, passes: 1, a: 0.55, jit: 0.3 });
    /* steps */
    for (const [hw, y] of [
      [192, 0],
      [174, -13],
      [158, -26],
    ]) {
      s.poly([-hw, y, -hw, y - 13, hw, y - 13, hw, y], { fill: 'paper', w: 1.1 });
      s.hatch(-hw + 2, y - 5, hw - 2, y - 1, 6, { a: 0.25, k: 0.5 });
    }
    /* walls, door, barred windows */
    s.poly([-150, -39, -150, -190, 150, -190, 150, -39], { fill: 'fill', w: 1.3 });
    s.bricks(-146, -178, 146, -44, { rh: 14, bw: 38, d: 0.34, a: 0.24 });
    const door = [-30, -39, -30, -128].concat(arc(0, -128, 30, 26, Math.PI, 2 * Math.PI, 10), [30, -39]);
    s.fill(door, 'deep', 0.82);
    s.line(door, { w: 1.35 });
    s.line([-36, -39, -36, -130].concat(arc(0, -130, 36, 31, Math.PI, 2 * Math.PI, 10), [36, -39]), {
      w: 0.8,
      passes: 1,
      a: 0.5,
    });
    s.segs([-25, -116, 25, -116, -27, -96, 27, -96, -27, -76, 27, -76], { c: 'paper', w: 0.9, a: 0.35 });
    const bk = [];
    for (const y of [-116, -96, -76])
      for (let x = -22; x < 22; x += 3.4 + R() * 2)
        if (Math.abs(x) > 11 || y < -100) bk.push(x, y, x + (R() - 0.5), y + 12 + R() * 4);
    s.segs(bk, { c: 'paper', w: 0.9, a: 0.3 });
    for (const x of [-104, 78]) {
      s.win(x, -152, 26, 60, { nx: 4, ny: 1 });
      s.poly([x - 5, -152, x + 31, -152, x + 28, -160, x - 2, -160], { fill: 'paper', w: 0.9, passes: 1, jit: 0.3 });
    }
    for (const cx of [-124, -56, 56, 124]) {
      s.fill(box(cx - 11, -178, 22, 136), 'paper');
      s.line([cx - 10, -44, cx - 9, -176], { w: 1.2 }).line([cx + 10, -44, cx + 9, -176], { w: 1.2 });
      s.segs([cx - 4, -50, cx - 4, -170, cx + 3, -50, cx + 3, -170], { w: 0.7, a: 0.3 });
      s.hatch(cx + 4, -172, cx + 9, -48, 5, { a: 0.25, k: 0.2 });
      s.poly(box(cx - 14, -47, 28, 8), { fill: 'paper', w: 1, passes: 1, jit: 0.3 }).poly(box(cx - 15, -186, 30, 9), {
        fill: 'paper',
        w: 1,
        passes: 1,
        jit: 0.3,
      });
    }
    s.poly(box(-162, -208, 324, 22), { fill: 'wash', w: 1.2 });
    s.text('1  2  3  4  5  6  7  8  9  0', 0, -196, 15, { a: 0.62 });
    s.poly([-172, -208, 172, -208, 177, -218, -177, -218], { fill: 'paper', w: 1.2 });
    /* the abacus */
    for (const x of [-112, 112])
      s.poly(box(x - 10, -234, 20, 16), { fill: 'dark', fa: 0.75, w: 1, passes: 1, jit: 0.3 });
    for (const b of [
      box(-134, -346, 14, 112),
      box(120, -346, 14, 112),
      box(-142, -354, 284, 13),
      box(-142, -246, 284, 12),
    ])
      s.poly(b, { fill: 'wash', w: 1.3, jit: 0.5 });
    const gr = [];
    for (let x = -130; x < 136; x += 22 + R() * 16) {
      gr.push(x, -349, x + 12 + R() * 10, -349.5);
      gr.push(x + 6, -240, x + 20 + R() * 8, -240.5);
    }
    s.segs(gr, { w: 0.7, a: 0.35 });
    for (const y of RODS) s.line([-120, y, 120, y + 0.5], { w: 1.3, jit: 0.3 });
    /* ledgers, with an inkpot and a pen */
    s.poly(box(-212, -26, 74, 26), { fill: 'blue', w: 1.2 })
      .poly(box(-204, -48, 64, 22), { fill: 'wash', w: 1.2 })
      .poly(box(-214, -74, 70, 26), { fill: 'dark', fa: 0.8, w: 1.2 });
    s.segs(
      [-198, -26, -198, -1, -152, -26, -152, -1, -190, -48, -190, -27, -200, -74, -200, -49, -158, -74, -158, -49],
      { w: 1, a: 0.55 },
    );
    s.segs([-206, -4, -144, -4, -200, -30, -146, -30, -208, -53, -150, -53], { c: 'paper', w: 1.6, a: 0.7 });
    s.poly([-192, -74, -194, -86, -176, -86, -178, -74], { fill: 'deep', fa: 0.9, w: 1, passes: 1, jit: 0.3 });
    s.line([-184, -86, -170, -122, -160, -146], { w: 1, passes: 1, jit: 0.3 });
    s.poly([-172, -116, -178, -134, -164, -152, -158, -148, -160, -128], {
      fill: 'paper',
      w: 0.9,
      passes: 1,
      jit: 0.4,
    });
    s.hatch(-176, -150, -160, -120, 3.5, { a: 0.5, k: -0.5 });
    /* a table: scales and coins */
    s.poly([204, -52, 308, -53, 308, -46, 204, -45], { fill: 'wash', w: 1.2 });
    s.line([212, -45, 210, 2], { w: 1.3 })
      .line([300, -46, 302, 2], { w: 1.3 })
      .line([211, -18, 301, -19], { w: 0.9, passes: 1, a: 0.6 });
    s.line([238, -53, 238, -130], { w: 1.5 }).poly([228, -53, 248, -53, 244, -60, 232, -60], {
      fill: 'dark',
      fa: 0.8,
      w: 1,
      passes: 1,
      jit: 0.3,
    });
    s.line([208, -120, 268, -132], { w: 1.4 });
    s.ell(238, -128, 3, 3, { w: 1, passes: 1, jit: 0.2 });
    s.segs([208, -120, 198, -96, 208, -120, 218, -96, 268, -132, 258, -106, 268, -132, 278, -106], { w: 0.7, a: 0.6 });
    s.poly(arc(208, -96, 13, 6, 0, Math.PI, 8), { fill: 'gold', fa: 0.7, w: 1, passes: 1, jit: 0.3 }).poly(
      arc(268, -106, 13, 6, 0, Math.PI, 8),
      { fill: 'gold', fa: 0.7, w: 1, passes: 1, jit: 0.3 },
    );
    s.segs([262, -108, 274, -108, 263, -111, 273, -111], { w: 1.6, a: 0.7 });
    for (const [x, n] of [
      [262, 3],
      [280, 7],
      [297, 5],
    ])
      for (let k = 0; k < n; k++) {
        const y = -53 - k * 3.6;
        s.fill(box(x - 8, y - 3.6, 16, 3.6), 'gold', 0.95);
        s.line([x - 8, y - 3.6, x + 8, y - 3.4], { w: 0.8, passes: 1, jit: 0.2, a: 0.75 });
        s.segs([x - 8, y, x - 8, y - 3.6, x + 8, y, x + 8, y - 3.6], { w: 0.8, a: 0.6 });
      }
    s.lift(null);
    s.part('roll');
    s.fill(circ(0, 0, 11, 11), 'paper');
    const sp = [];
    for (let a = 0; a < 15; a += 0.35) sp.push(Math.cos(a) * (11 - a * 0.62), Math.sin(a) * (11 - a * 0.62));
    s.line(sp, { w: 1, passes: 1, jit: 0.25, step: 3 });
  },
  live(g, P, st, pal) {
    const t = st.still ? 3.3 : st.t,
      hc = st.hc;
    g.save();
    g.translate(0, -70);
    /* the beads count back and forth, one at a time */
    g.strokeStyle = pal.ink;
    RODS.forEach((y, r) => {
      const p = (t * (0.11 + 0.05 * hc) + r * 0.29) % 1,
        m = (p < 0.5 ? p * 2 : 2 - p * 2) * 5.999,
        nR = Math.floor(m),
        fr = smooth((m - nR) * 1.6 - 0.3);
      for (let i = 0; i < 6; i++) {
        const xl = -108 + i * 17.5,
          xr = 108 - (5 - i) * 17.5,
          x = i > 5 - nR ? xr : i === 5 - nR ? xl + (xr - xl) * fr : xl;
        g.globalAlpha = 1;
        g.fillStyle = r % 2 ? pal.red : pal.gold;
        g.beginPath();
        g.ellipse(x, y, 7.6, 9.6, 0, 0, 6.283);
        g.fill();
        g.globalAlpha = 0.85;
        g.lineWidth = 1.15 * pen.lw;
        g.stroke();
        g.globalAlpha = 0.4;
        g.lineWidth = 0.8 * pen.lw;
        g.beginPath();
        g.arc(x - 1, y, 5, 3.4, 5.2);
        g.stroke();
      }
    });
    g.globalAlpha = 1;
    const rk = st.still ? 0 : Math.sin(t * 1.3) * 0.25 + hc * Math.sin(t * 6) * 0.3;
    g.save();
    g.translate(246 + rk * 6, 61);
    g.rotate(rk);
    paint(g, P.roll, pal);
    g.restore();
    bird(g, 64, -354, 0.95, st.t, pal, {
      dir: -1,
      bob: st.still ? 0 : Math.max(0, Math.sin(st.t * 2.2)) * (Math.sin(st.t * 0.4) > 0.3 ? 2.4 : 0),
      c: pal.fill,
    });
    if (st.lit > 0.01) {
      glow(g, 0, -92, 60, pal.warm, 0.5 * st.lit);
      for (const x of [-91, 91]) glow(g, x, -122, 30, pal.warm, 0.45 * st.lit);
    }
    g.restore();
  },
  core: [-272, 334],
  door: [0, -150],
  pre(s) {
    s.hill(-340, 400, -40, 120, { fa: 0.35 });
    s.tree(-298, -60, 330, 'poplar').tree(-322, -60, 250, 'poplar');
  },
  under(s) {
    s.fill([-226, 2, -226, -72, -217, -72, -217, 2], 'wash', 0.9);
    s.line([-226, 3, -226, -72], { w: 1.4 }).line([-217, 3, -217, -72], { w: 1.2 });
    /* the terrace it stands on, with the vault underneath */
    s.house(-322, 706, 70, { tex: 'stone' });
    s.poly(box(-328, -78, 718, 9), { fill: 'paper', w: 1.2, r: 2 });
    s.fill(circ(-276, -34, 25, 25, 0, 6.283, 0.3), 'dark', 0.9, 0);
    s.ell(-276, -34, 25, 25, { w: 1.6, jit: 0.4 });
    s.ell(-276, -34, 18, 18, { w: 1, passes: 1, jit: 0.3 });
    const sp = [];
    for (let a = 0; a < 6.2; a += 1.047) sp.push(-276, -34, -276 + Math.cos(a) * 13, -34 + Math.sin(a) * 13);
    s.segs(sp, { c: 'paper', w: 1.4, a: 0.7 });
    s.dot(-276, -34, 3, 'gold', 1);
    for (const x of [286, 332]) {
      const p = [x, -8, x, -42].concat(arc(x + 14, -42, 14, 12, Math.PI, 2 * Math.PI, 6), [x + 28, -8]);
      s.fill(p, 'deep', 0.8, 0);
      s.line(p, { w: 1.2 });
      s.segs([x + 7, -50, x + 7, -9, x + 14, -54, x + 14, -9, x + 21, -50, x + 21, -9], { c: 'paper', w: 0.9, a: 0.5 });
    }
  },
  after(s) {
    const R = s.rnd;
    s.stairs(0, 200, -70, 6, 11.7, 9);
    /* the receipt: out of the door, back and forth down every step, and off along the ground */
    s.fill([-14, -109, 14, -109, 14, -100, -14, -100], 'paper', 1, 0);
    const cl = [];
    for (let i = 0; i <= 44; i++) {
      const t = i / 44;
      cl.push(Math.sin(t * Math.PI * 3.5) * 92 * (0.25 + 0.75 * t), -106 + t * 111);
    }
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      cl.push(cl[88] + t * (236 - cl[88]), 5 + Math.sin(t * 6) * 2.5 - t * 3);
    }
    s.poly(band(cl, 5.5), { fill: 'paper', w: 1.05, passes: 1, jit: 0.4, r: 0 });
    const ct = [];
    for (let i = 2; i < cl.length - 2; i += 2)
      if (R() < 0.7) ct.push(cl[i] - 1, cl[i + 1] - 3, cl[i] + 1, cl[i + 1] + 3);
    s.segs(ct, { w: 0.7, a: 0.5 });
    for (const x of [-240, 240]) {
      s.crate(x - 12, 0, 24, 18, 'fill');
      s.shrub(x, -18, 13);
    }
  },
  post(s) {
    s.plants(-330, -252, 1, { fl: 0.3 }).plants(262, 392, 1, { fl: 0.3 });
    s.shrub(372, 0, 12).shrub(352, 0, 8, 'blue');
    s.fence(-330, -300, 0, 20);
  },
});
