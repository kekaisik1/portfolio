/**
 * The drawing of the place for "emberquill": the scene on its three sheets, and its one small moving part.
 */
import { definePlace } from './define';
import { pennant } from '../world/draw/critters';
import { arc, box, glow } from '../world/draw/pencil';
import { paint, pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* Emberquill: a crooked tavern tower. A chair leaves by the window; the die and the quill are outside */
export const place: PlaceDef = definePlace({
  sy: 0.92,
  hit: [-500, -468, 290, 10],
  ext: [-506, -474, 296, 14],
  size: 0.7,
  capAt: [140, -306],
  capW: 250,
  life: { kind: 'ember', ax: 0.13, ay: 0.5 },
  build(s) {
    const R = s.rnd,
      lean = (x: number, y: number) => [x - y * 0.06, y];
    /* barrel and mug */
    s.poly([-282, 0, -286, -22, -282, -44, -254, -44, -250, -22, -254, 0], { fill: 'wash', w: 1.2 });
    s.segs([-285, -12, -251, -12, -285, -32, -251, -32, -274, -43, -275, -1, -262, -43, -261, -1], { w: 0.9, a: 0.55 });
    s.poly(box(-274, -58, 12, 14), { fill: 'paper', w: 1, passes: 1, jit: 0.3 });
    s.ell(-260, -51, 4, 4.5, { a0: -1.4, a1: 1.4, w: 1, passes: 1, jit: 0.2 });
    /* the tavern */
    s.poly([-250, 0, -252, -108, -64, -112, -64, 0], { fill: 'fill', w: 1.3 });
    s.segs(
      [-250, -56, -66, -58, -206, -108, -206, -57, -140, -110, -140, -58, -206, -57, -250, -100, -140, -58, -100, -110],
      { w: 1.5, a: 0.6 },
    );
    s.hatch(-136, -106, -68, -62, 8, { a: 0.16 });
    s.fill([-250, 0, -250, -18, -64, -18, -64, 0], 'wash', 0.7);
    s.bricks(-248, -18, -66, -1, { rh: 9, bw: 22, d: 0.75, a: 0.4 });
    const dr = [-200, 0, -200, -62].concat(arc(-176, -62, 24, 22, Math.PI, 2 * Math.PI, 8), [-152, 0]);
    s.fill(dr, 'dark', 0.85);
    s.line(dr, { w: 1.3 });
    s.segs([-188, -4, -188, -78, -176, -4, -176, -84, -164, -4, -164, -78], { w: 0.8, a: 0.45 });
    s.ell(-160, -40, 3.5, 3.5, { w: 1.1, passes: 1, jit: 0.2 });
    s.line([-176, -96, -176, -104], { w: 1, passes: 1 });
    s.poly([-182, -96, -170, -96, -172, -84, -180, -84], { fill: 'gold', fa: 0.95, w: 0.9, passes: 1, jit: 0.3 });
    s.fill(box(-126, -52, 44, 36), 'gold', 0.7);
    s.rect(-126, -52, 44, 36, { w: 1.15, jit: 0.3 });
    s.segs(
      [
        -126, -34, -104, -52, -126, -16, -82, -52, -104, -16, -82, -34, -104, -52, -82, -34, -126, -52, -82, -16, -126,
        -34, -104, -16,
      ],
      { w: 0.7, a: 0.55 },
    );
    s.line([-130, -14, -78, -14.5], { w: 1.4, passes: 1 });
    /* thatch, sagging */
    const th = [-270, -102, -222, -158, -180, -198, -150, -202, -100, -176, -58, -150, -58, -106];
    s.poly(th, { fill: 'gold', fa: 0.75, w: 1.35, jit: 0.9 });
    const tt = [];
    for (let i = 0; i < 70; i++) {
      const x = -262 + R() * 200,
        top = x < -180 ? -102 - (x + 270) * 1.07 : -198 + (x + 180) * 0.42,
        y = top + 8 + R() * Math.max(4, -104 - top - 14);
      if (y < -106 && y > top + 3) tt.push(x, y, x + (x < -180 ? -3 : 3), y + 9 + R() * 5);
    }
    s.segs(tt, { w: 0.8, a: 0.45 });
    s.line([-272, -100, -200, -103, -120, -104, -58, -106], { w: 1.3, passes: 1, jit: 0.9 });
    /* chimney */
    s.poly([-236, -138, -236, -214, -208, -214, -208, -170], { fill: 'fill', w: 1.25 });
    s.bricks(-234, -208, -210, -150, { rh: 8, bw: 13, d: 0.6, a: 0.4 });
    s.poly(box(-240, -222, 36, 8), { fill: 'dark', fa: 0.7, w: 1.1, jit: 0.3 });
    /* the tower, leaning */
    s.tf(lean);
    s.poly([-74, 0, -67, -204, 67, -204, 74, 0], { fill: 'fill', w: 1.4 });
    s.bricks(-68, -196, 66, -6, { rh: 12, bw: 24, d: 0.5, a: 0.34 });
    s.hatch(30, -200, 66, -4, 8, { a: 0.2 });
    const cd = [-26, 0, -26, -40].concat(arc(0, -40, 26, 24, Math.PI, 2 * Math.PI, 10), [26, 0]);
    s.fill(cd, 'deep', 0.9);
    s.line(cd, { w: 1.4 });
    const vs = [];
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI + (k * Math.PI) / 6;
      vs.push(Math.cos(a) * 26, -40 + Math.sin(a) * 24, Math.cos(a) * 33, -40 + Math.sin(a) * 31);
    }
    s.segs(vs, { w: 0.9, a: 0.6 });
    s.segs([-20, -8, 20, -8, -15, -17, 15, -17, -10, -26, 10, -26], { c: 'paper', w: 1, a: 0.45 });
    for (const [x, y] of [
      [-34, -128],
      [30, -98],
      [22, -168],
    ]) {
      s.fill(box(x, y, 9, 28), 'gold', 0.95);
      s.rect(x, y, 9, 28, { w: 1.1, jit: 0.25 });
    }
    s.line([-70, -4, -62, -30, -70, -58, -60, -86, -66, -120, -58, -150, -64, -180], {
      w: 1,
      passes: 1,
      jit: 0.8,
      a: 0.7,
    });
    const iv = [];
    for (let y = -10; y > -178; y -= 9) {
      const x = -65 + Math.sin(y * 0.11) * 4;
      iv.push(x, y, x + 6 + R() * 4, y - 4, x, y - 4, x - 5 - R() * 3, y - 8);
    }
    s.segs(iv, { w: 1.1, a: 0.55 });
    /* the room on top */
    const jo = [];
    for (let x = -84; x <= 84; x += 14) jo.push(x - 3, -204, x - 3, -212, x + 3, -204, x + 3, -212);
    s.segs(jo, { w: 1, a: 0.7 });
    s.poly([-94, -210, -98, -294, 98, -294, 94, -210], { fill: 'paper', w: 1.4 });
    s.segs(
      [
        -96, -252, 96, -252, -44, -211, -45, -293, 44, -211, 45, -293, -94, -212, -46, -251, -46, -253, -97, -292, 94,
        -212, 46, -251, 46, -253, 97, -292,
      ],
      { w: 1.5, a: 0.62 },
    );
    s.line([-94, -210, -74, -196], { w: 1.2, passes: 1 }).line([94, -210, 74, -196], { w: 1.2, passes: 1 });
    s.fill(box(-26, -284, 52, 54), 'deep', 0.8);
    s.rect(-26, -284, 52, 54, { w: 1.3, jit: 0.3 });
    s.poly([-44, -286, -27, -284, -27, -230, -44, -226], { fill: 'wash', w: 1, passes: 1 }).poly(
      [27, -284, 44, -288, 44, -224, 27, -230],
      { fill: 'wash', w: 1, passes: 1 },
    );
    s.segs(
      [
        -40, -270, -31, -269, -40, -256, -31, -256, -40, -242, -31, -243, 31, -269, 40, -271, 31, -256, 40, -256, 31,
        -243, 40, -241,
      ],
      { w: 0.8, a: 0.5 },
    );
    s.line([-30, -229, 30, -229.5], { w: 1.6, passes: 1 });
    /* roof, with a kink in it */
    const rf = [-118, -290, -64, -348, -12, -402, 8, -436, 18, -404, 62, -350, 118, -290];
    s.poly(rf, { fill: 'dark', fa: 0.8, w: 1.5, jit: 0.8 });
    const sh = [];
    for (let y = -300, r = 0; y > -396; y -= 14, r++) {
      const w2 = 118 - (-290 - y) * 0.946;
      for (let x = -w2 + 8 + (r % 2 ? 7 : 0); x < w2 - 8; x += 15) sh.push(x, y, x + 6, y + 5);
    }
    s.segs(sh, { c: 'paper', w: 1, a: 0.4 });
    s.line([-124, -288, 124, -289], { w: 1.5, passes: 1, jit: 0.8 });
    s.tf(null);
    /* the sign: a twenty-sided die */
    s.line([81, -150, 152, -153], { w: 1.6 }).line([83, -126, 110, -151], { w: 1, passes: 1 });
    s.ell(152, -157, 4, 4, { a0: 0, a1: 4.6, w: 1, passes: 1, jit: 0.2 });
    s.segs([108, -151, 108, -140, 142, -152, 142, -140], { w: 0.9, a: 0.7 });
    s.part('sign');
    s.poly([100, -140, 150, -140, 150, -98, 125, -84, 100, -98], { fill: 'paper', w: 1.3 });
    const d1 = [];
    for (let i = 0; i < 6; i++)
      d1.push(
        125 + Math.cos((i * Math.PI) / 3 + Math.PI / 6) * 17,
        -114 + Math.sin((i * Math.PI) / 3 + Math.PI / 6) * 17,
      );
    s.poly(d1, { fill: 'red', fa: 0.8, w: 1, jit: 0.25 });
    s.poly([125, -126, 135.5, -108, 114.5, -108], { w: 0.8, passes: 1, jit: 0.2 });
    s.part('base');
    /* the die, the size of a cart */
    const C = [166, -40],
      hx: number[] = [];
    for (let i = 0; i < 6; i++)
      hx.push(
        C[0] + Math.cos((i * Math.PI) / 3 + Math.PI / 6 + 0.12) * 41,
        C[1] + Math.sin((i * Math.PI) / 3 + Math.PI / 6 + 0.12) * 41,
      );
    s.poly(hx, { fill: 'red', fa: 0.86, w: 1.5 });
    const tri = [0, 2, 4].map((i) => [
      C[0] + Math.cos((i * Math.PI) / 3 + Math.PI / 6 + 0.12 + Math.PI / 3) * 23,
      C[1] + Math.sin((i * Math.PI) / 3 + Math.PI / 6 + 0.12 + Math.PI / 3) * 23,
    ]);
    s.poly(tri.flat(), { fill: 'redLit', w: 1.2, jit: 0.3 });
    const ed: number[] = [];
    tri.forEach((p, k) => {
      const i = k * 2 + 1;
      ed.push(
        p[0],
        p[1],
        hx[i * 2],
        hx[i * 2 + 1],
        p[0],
        p[1],
        hx[((i + 1) % 6) * 2],
        hx[((i + 1) % 6) * 2 + 1],
        p[0],
        p[1],
        hx[((i + 2) % 6) * 2],
        hx[((i + 2) % 6) * 2 + 1],
      );
    });
    s.segs(ed, { w: 1, a: 0.7 });
    s.text('20', C[0] + 1, C[1] - 1, 20, { a: 0.9, c: 'paper' });
    s.hatch(140, -30, 200, -2, 5, { a: 0.3, k: 0.5 });
    s.tf((x, y) => [x * 0.94 - y * 0.34 + 232, y * 0.94 + x * 0.34 - 13]);
    s.poly(box(-12, -12, 24, 24), { fill: 'paper', w: 1.3, jit: 0.3 });
    for (const [x, y] of [
      [-6, -6],
      [6, 6],
      [0, 0],
      [-6, 6],
      [6, -6],
    ])
      s.dot(x, y, 2.1, 'ink', 0.9);
    s.tf(null);
    /* inkwell and quill */
    s.poly([212, -1, 208, -22, 214, -30, 240, -30, 246, -22, 242, -1], { fill: 'deep', fa: 0.9, w: 1.2 });
    s.poly([218, -30, 218, -38, 236, -38, 236, -30], { fill: 'dark', fa: 0.8, w: 1, passes: 1 });
    const q = (t: number) => [227 + 26 * t + 26 * t * t, -36 - 240 * t + 34 * t * t];
    const sh2 = [];
    for (let t = 0; t <= 1.001; t += 0.05) sh2.push(...q(t));
    s.line(sh2, { w: 1.5, jit: 0.3 });
    const va = [],
      vb = [];
    for (let t = 0.3; t <= 1.001; t += 0.05) {
      const p = q(t),
        k = Math.sin(((t - 0.3) / 0.7) * Math.PI) ** 0.7;
      va.push(p[0] - 26 * k - 2, p[1] - 5 * k);
      vb.unshift(p[0] + 15 * k + 1, p[1] + 9 * k);
    }
    s.poly(va.concat(vb), { fill: 'paper', w: 1.2, jit: 0.5 });
    const bb = [];
    for (let t = 0.34; t < 0.98; t += 0.028) {
      const p = q(t),
        k = Math.sin(((t - 0.3) / 0.7) * Math.PI) ** 0.7;
      bb.push(p[0], p[1], p[0] - 24 * k, p[1] - 5 * k - 5, p[0], p[1], p[0] + 13 * k, p[1] + 9 * k - 5);
    }
    s.segs(bb, { w: 0.7, a: 0.45 });
    s.tufts(-250, -210, 2, { sp: 14 }).tufts(84, 120, 2, { sp: 12 }).tufts(250, 274, 2, { sp: 9 });
    /* a bench under the tavern window, a path, things growing */
    s.bench(-130, 0, 48);
    s.pathTo(-176, 18, 2);
    s.plants(-250, -204, 0, { fl: 0.4 }).plants(-148, -80, 0, { fl: 0.3 }).plants(80, 124, 1).plants(246, 276, 1);
    /* the chair that goes out of the window */
    s.part('chair');
    s.line([-9, 0, 9, 0], { w: 1.6, jit: 0.3 })
      .line([-9, 0, -10, -17], { w: 1.5, jit: 0.3 })
      .segs([-10, -11, -9, -11, -10, -17, -3, -17], { w: 1.2, a: 0.8 });
    s.line([-9, 0, -10, 12], { w: 1.3, passes: 1, jit: 0.3 })
      .line([9, 0, 10, 12], { w: 1.3, passes: 1, jit: 0.3 })
      .line([-3, 1, -2, 11], { w: 1, passes: 1, a: 0.6, jit: 0.3 });
  },
  live(g, P, st, pal) {
    const t = st.t,
      hc = st.hc;
    if (st.lit > 0.01) {
      glow(g, 15, -257, 46, pal.warm, 0.6 * st.lit);
      glow(g, -104, -34, 40, pal.warm, 0.4 * st.lit);
      glow(g, 2, -30, 34, '236,140,62', 0.5 * st.lit);
    }
    const sw = st.still ? 0.05 : Math.sin(t * 1.6) * 0.07 + hc * Math.sin(t * 5) * 0.08;
    g.save();
    g.translate(125, -152);
    g.rotate(sw);
    g.translate(-125, 152);
    paint(g, P.sign, pal);
    g.restore();
    pennant(g, 34, -434, t, pal, st.still);
    /* the chair: out of the window, over the sign, and gone */
    const p = st.still ? 0.3 : (t * (0.2 + 0.1 * hc)) % 1,
      u = p / 0.72;
    if (u < 1) {
      const x = 18 + u * 232,
        y = -262 - 150 * u + 404 * u * u;
      g.globalAlpha = Math.min(1, u * 8, (1 - u) * 5);
      g.save();
      g.translate(x, y);
      g.rotate(-0.4 + u * 7.5);
      g.scale(1.25, 1.25);
      paint(g, P.chair, pal);
      g.restore();
      if (!st.still && u > 0.08) {
        g.strokeStyle = pal.ink;
        g.lineWidth = 0.9 * pen.lw;
        g.globalAlpha = 0.35 * (1 - u);
        g.beginPath();
        for (let k = 1; k < 4; k++) {
          const v = u - k * 0.035,
            xx = 18 + v * 232,
            yy = -262 - 150 * v + 404 * v * v;
          g.moveTo(xx - 5, yy - 3);
          g.lineTo(xx + 3, yy + 2);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    }
  },
  core: [-346, 294],
  door: [-176, -36],
  pre(s) {
    s.hill(-520, 310, 0, 190, { fa: 0.4 });
    s.tree(-256, 0, 250, 'round').tree(262, 0, 150, 'pine');
  },
  under(s) {
    /* the inn: three crooked storeys, each a little wider than the one below */
    s.tf((x, y) => [x + y * 0.05, y]);
    s.house(-474, 156, 106, { tex: 'stone' });
    s.door(-428, 42, 72, { arch: true });
    s.winS(-368, -80, 30, 38, { sh: false, c: 'gold' });
    const jo = [];
    for (let x = -478; x <= -310; x += 13) jo.push(x, -106, x, -113);
    s.segs(jo, { w: 1.2, a: 0.7 });
    s.house(-484, 176, 96, { tex: 'timber', c: 'paper', y: -112 });
    s.winS(-456, -190, 30, 42, { c: 'gold' }).winS(-378, -190, 30, 42, { c: 'gold' });
    s.house(-478, 164, 72, { tex: 'timber', c: 'paper', y: -210 });
    s.winS(-416, -266, 36, 38, { box: true, sh: false, c: 'gold' });
    s.chim(-356, -296, 24, 76);
    s.roofG(-478, 164, -282, 92);
    s.line([-308, -168, -276, -170], { w: 1.5 });
    s.poly([-300, -164, -280, -164, -280, -140, -290, -132, -300, -140], { fill: 'paper', w: 1.1, r: 1.5 });
    s.dot(-290, -150, 4, 'red', 0.9);
    s.tf(null);
    /* and the bridge across to the tower */
    s.poly([-326, -246, -326, -284, -80, -284, -80, -246], { fill: 'paper', w: 1.4 });
    s.segs(
      [
        -326, -265, -80, -265, -280, -284, -280, -246, -230, -284, -230, -246, -180, -284, -180, -246, -130, -284, -130,
        -246, -326, -246, -280, -284, -80, -246, -130, -284,
      ],
      { w: 1.3, a: 0.6 },
    );
    for (const x of [-262, -212, -162]) s.win(x, -280, 22, 13, { nx: 2, ny: 1, c: 'gold', sill: false });
    s.poly([-334, -284, -326, -300, -80, -300, -72, -284], { fill: 'dark', fa: 0.85, w: 1.3, r: 2 });
    s.line([-320, -246, -330, -214], { w: 1.2, passes: 1 }).line([-90, -246, -74, -214], { w: 1.2, passes: 1 });
  },
  post(s) {
    s.barrel(-292, 0, 0.85);
    s.fence(-500, -480, 0, 24).fence(60, 112, 0, 22);
    s.crate(-322, 0, 22, 18);
    s.plants(-500, -300, 1, { fl: 0.3 });
  },
});
