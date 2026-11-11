/**
 * The drawing of the place for "kana-notebook": the scene on its three sheets, and its one small moving part.
 */
import { definePlace } from './define';
import { koi, pennant } from '../world/draw/critters';
import { arc, box, circ, glow, sagLine } from '../world/draw/pencil';
import { paint, pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* Kana Notebook: a paper house over the water, a brush as tall as the roof, one red seal */
export const place: PlaceDef = definePlace({
  refl: 5,
  hit: [-500, -330, 450, 44],
  ext: [-506, -336, 456, 150],
  size: 0.62,
  sea: 'stilts',
  capAt: [-500, -250],
  capW: 230,
  life: { kind: 'petal', ax: 0.45, ay: 0.2 },
  build(s) {
    const R = s.rnd;
    /* water under it */
    const ws = [];
    for (let y = 8; y < 46; y += 7)
      for (let x = -250 + R() * 30; x < 260; x += 34 + R() * 50) ws.push(x, y, x + 12 + R() * 22, y + (R() - 0.5));
    s.segs(ws, { w: 0.9, a: 0.4 });
    const rf2 = [];
    for (let y = 10; y < 44; y += 5) {
      for (const x of [-178, -90, 0, 90, 178, 252]) rf2.push(x - 4 - (y % 3), y, x + 5 + (y % 2), y);
    }
    s.segs(rf2, { w: 1.5, a: 0.3 });
    /* stilts and deck */
    for (const x of [-178, -90, 0, 90, 178, 252]) {
      s.fill(box(x - 4.5, -34, 9, 40), 'dark', 0.8);
      s.line([x - 4.5, -34, x - 4, 7], { w: 1.2 }).line([x + 4.5, -34, x + 4, 6], { w: 1.2 });
    }
    s.segs([-178, -6, -90, -30, -90, -6, -178, -30, 90, -6, 178, -30, 178, -6, 90, -30], { w: 0.9, a: 0.45 });
    s.poly([-206, -46, 274, -46, 274, -34, -206, -34], { fill: 'wash', w: 1.35 });
    const dk = [];
    for (let x = -196; x < 272; x += 17) dk.push(x, -45, x, -35);
    s.segs(dk, { w: 0.8, a: 0.45 });
    s.line([-206, -40, 274, -40.5], { w: 0.7, passes: 1, a: 0.4 });
    /* steps down to the water, a little boat */
    s.poly([-236, -22, -206, -22, -206, -34, -236, -34], { fill: 'wash', w: 1.1 }).poly(
      [-256, -8, -226, -8, -226, -22, -256, -22],
      { fill: 'wash', w: 1.1 },
    );
    s.line([-246, -8, -246, 8], { w: 1.2, passes: 1 }).line([-232, -8, -232, 6], { w: 1.2, passes: 1 });
    /* walls: paper screens */
    s.poly([-170, -46, -170, -190, 170, -190, 170, -46], { fill: 'paper', w: 1.35 });
    s.fill(box(-170, -190, 64, 144), 'fill');
    for (let i = 0; i < 4; i++) {
      const x = -98 + i * 66;
      if (i === 2) {
        s.fill(box(x, -182, 62, 136), 'deep', 0.5);
        s.segs([x + 6, -76, x + 56, -76, x + 14, -76, x + 14, -48, x + 48, -76, x + 48, -48], {
          c: 'paper',
          w: 1.3,
          a: 0.7,
        });
        s.poly([x + 20, -76, x + 22, -84, x + 31, -80, x + 40, -84, x + 42, -76], {
          fill: 'paper',
          w: 0.9,
          passes: 1,
          jit: 0.25,
        });
        s.line([x + 44, -100, x + 46, -78], { c: 'paper', w: 1.6, passes: 1, a: 0.8, jit: 0.2 });
      }
      s.rect(x, -182, 62, 136, { w: 1.25, jit: 0.4 });
      if (i !== 2) {
        const gl = [];
        for (let c = 1; c < 3; c++) gl.push(x + c * 20.6, -182, x + c * 20.6, -46);
        for (let r = 1; r < 6; r++) gl.push(x, -182 + r * 22.6, x + 62, -182 + r * 22.6);
        s.segs(gl, { w: 0.8, a: 0.5 });
        s.fill(box(x + 1, -64, 60, 18), 'wash', 0.8);
        s.line([x, -64, x + 62, -64.5], { w: 0.9, passes: 1 });
      }
    }
    s.poly([-176, -190, 176, -190, 176, -198, -176, -198], { fill: 'dark', fa: 0.8, w: 1.1 });
    for (const x of [-170, -104, 168]) s.line([x, -46, x, -190], { w: 1.8, passes: 2, jit: 0.4 });
    /* a hanging scroll: one letter, and the seal */
    s.line([-158, -176, -118, -176], { w: 1.8, passes: 1 });
    s.poly([-154, -174, -122, -174, -122, -64, -154, -64], { fill: 'paper', w: 1.1, jit: 0.3 });
    s.line([-158, -62, -118, -62], { w: 1.8, passes: 1 });
    const K = (pts: number[], w: number) =>
      s.line(
        pts.map((v, i) => (i % 2 ? v * 1.35 - 136 : v * 1.35 - 138)),
        { w, passes: 2, jit: 0.25, step: 3, a: 0.95 },
      );
    K([-9, -15, 0, -17, 10, -18], 2.6);
    K([-1, -25, -3, -8, -1, 6, 1, 13], 2.6);
    K([7, -9, 3, 0, -4, 8, -10, 10, -12, 3, -8, -4, 0, -7, 8, -5, 13, 2, 11, 10, 4, 15], 2.2);
    s.poly(box(-148, -86, 13, 13), { fill: 'red', fa: 0.95, w: 0.9, passes: 1, jit: 0.3 });
    s.segs([-145, -80, -138, -80, -141.5, -83, -141.5, -76], { c: 'paper', w: 1.1, a: 0.9 });
    /* the roof: wide eaves, turned up at the corners */
    const ev = [-246, -206, -200, -196, -100, -192, 0, -191, 100, -192, 200, -196, 246, -206];
    s.poly(
      [
        -246, -206, -226, -212, -150, -250, -104, -276, 104, -276, 150, -250, 226, -212, 246, -206, 200, -196, 100,
        -192, 0, -191, -100, -192, -200, -196,
      ],
      { fill: 'dark', fa: 0.82, w: 1.5, jit: 0.7 },
    );
    const rt = [];
    for (let x = -196; x <= 196; x += 14) {
      const top = Math.abs(x) < 104 ? -274 : -274 + (Math.abs(x) - 104) * 0.56;
      rt.push(x * 0.96, top + 5, x, -196);
    }
    s.segs(rt, { c: 'paper', w: 0.9, a: 0.34 });
    s.poly([-112, -276, 112, -276, 108, -286, -108, -286], { fill: 'dark', fa: 0.95, w: 1.3 });
    s.segs([-108, -286, -116, -292, 108, -286, 116, -292], { w: 2, a: 0.85 });
    s.line(ev, { w: 1.3, passes: 1, jit: 0.6 });
    s.poly([-60, -198, 60, -198, 0, -238], { fill: 'paper', w: 1.1 });
    s.segs([0, -238, 0, -198, -30, -218, 30, -218, -20, -198, -20, -224, 20, -198, 20, -224], { w: 0.8, a: 0.5 });
    /* inkstone on the deck, and the brush standing in it */
    s.poly([196, -46, 198, -58, 262, -58, 264, -46], { fill: 'deep', fa: 0.92, w: 1.3 });
    s.line([204, -54, 256, -54.5], { c: 'paper', w: 0.9, passes: 1, a: 0.4 });
    s.tufts(-262, -248, 6, { sp: 8, h: 9 });
    for (const [x, y, r] of [
      [-176, 28, 13],
      [-150, 38, 9],
      [128, 34, 11],
    ]) {
      s.fill(arc(x, y, r, r * 0.3, 0.4, 5.9, 12).concat([x, y]), 'leaf', 0.9, 0);
      s.line(arc(x, y, r, r * 0.3, 0.4, 5.9, 12).concat([x, y]), { w: 0.8, passes: 1, jit: 0.3, a: 0.7, step: 3 });
    }
    s.dot(-146, 35, 2.2, 'paper', 1);
    s.dot(-146, 35, 1, 'gold', 1);
    s.poly([-198, -46, -200, -56, -182, -56, -184, -46], { fill: 'blue', w: 1, passes: 1 });
    s.line([-191, -56, -190, -66, -196, -72], { w: 1.2, passes: 1, jit: 0.3 }).line([-190, -64, -184, -70], {
      w: 1,
      passes: 1,
      jit: 0.3,
    });
    s.shrub(-198, -66, 7).shrub(-183, -64, 6);
    s.part('brush');
    s.poly([222, -58, 219, -86, 222, -104, 238, -104, 241, -86, 238, -58, 230, -52], {
      fill: 'deep',
      fa: 0.95,
      w: 1.3,
      jit: 0.3,
    });
    s.segs([225, -100, 224, -66, 230, -100, 230, -58, 235, -100, 236, -66], { c: 'paper', w: 0.7, a: 0.35 });
    s.poly(box(221, -116, 18, 12), { fill: 'gold', fa: 0.95, w: 1.1, jit: 0.3 });
    s.poly([222, -116, 224, -292, 236, -292, 238, -116], { fill: 'wash', w: 1.35 });
    s.line([228, -122, 229, -286], { c: 'paper', w: 1.3, passes: 1, a: 0.55 });
    s.segs([223.5, -160, 236.5, -160, 224, -164, 236, -164], { w: 1, a: 0.6 });
    s.ell(230, -300, 6, 8, { w: 1.2, jit: 0.3 });
    s.part('lantern');
    s.line([0, 0, 0, 10], { w: 1, passes: 1, jit: 0.2 });
    s.poly([-9, 10, -12, 18, -12, 30, -9, 38, 9, 38, 12, 30, 12, 18, 9, 10], { fill: 'paperLit', w: 1.15, jit: 0.3 });
    s.segs([-11, 17, 11, 17, -12, 24, 12, 24, -11, 31, 11, 31], { w: 0.7, a: 0.5 });
    s.segs([-6, 10, 6, 10, -6, 38, 6, 38], { w: 1.8, a: 0.85 });
    s.line([0, 38, 0, 48], { w: 1, passes: 1, jit: 0.2 });
  },
  live(g, P, st, pal) {
    const t = st.t,
      hc = st.hc,
      still = st.still;
    if (st.lit > 0.01) {
      for (const x of [-67, -1, 131]) glow(g, x, -120, 60, pal.warm, 0.34 * st.lit);
      glow(g, 65, -110, 50, pal.warm, 0.45 * st.lit);
    }
    /* the brush dips, and the ink goes out across the water */
    const dip = still ? 0 : Math.sin(t * 1.2) * 3 + hc * Math.sin(t * 7) * 1.5;
    g.save();
    g.translate(230, -52 + dip);
    g.rotate(still ? 0.02 : Math.sin(t * 0.6) * 0.025);
    g.translate(-230, 52);
    paint(g, P.brush, pal);
    g.restore();
    if (!still) {
      g.strokeStyle = pal.ink;
      g.lineWidth = 1 * pen.lw;
      for (let k = 0; k < 3; k++) {
        const r = (t * 0.32 + k / 3) % 1;
        g.globalAlpha = (1 - r) * 0.5;
        g.beginPath();
        g.ellipse(236, 20, 12 + r * 46, 2.5 + r * 8, 0, 0, 6.283);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    for (const [x, ph] of [
      [-204, 0],
      [204, 1.7],
    ]) {
      const sw = still ? 0.04 : Math.sin(t * 1.4 + ph) * 0.1 + hc * Math.sin(t * 4 + ph) * 0.1;
      glow(g, x, -168, 20 + 16 * st.lit, pal.warm, 0.35 + 0.35 * st.lit);
      g.save();
      g.translate(x, -198);
      g.rotate(sw);
      paint(g, P.lantern, pal);
      g.restore();
    }
    pennant(g, 0, -286, t, pal, still);
    koi(g, 70, 30, t, pal, still);
  },
  core: [-272, 304],
  door: [65, -110],
  pre(s) {
    s.hill(-506, -360, 6, 34, { fa: 0.5 });
    /* the garden: a rock, a pine, a stone lantern */
    s.poly([296, 6, 306, -22, 340, -38, 396, -34, 440, -14, 452, 6], { fill: 'wash', fa: 0.9, w: 1.3 });
    s.hatch(380, -32, 448, 4, 6, { a: 0.25 });
    s.line([366, -36, 362, -90, 374, -130, 366, -170], { w: 2.2, jit: 0.6 });
    for (const [x, y, r] of [
      [340, -120, 34],
      [392, -150, 30],
      [356, -186, 36],
      [404, -100, 22],
    ]) {
      s.fill(circ(x, y, r, r * 0.36, 0, 6.283, 0.5), 'leaf', 0.9, 0);
      s.line(arc(x, y, r, r * 0.36, Math.PI * 0.9, Math.PI * 2.1, 10), { w: 1, jit: 0.6, passes: 1 });
      s.hatch(x - r * 0.8, y - 2, x + r * 0.8, y + r * 0.3, 5, { a: 0.3, k: 0.3 });
    }
    s.poly(box(416, -34, 12, 16), { fill: 'paper', w: 1, r: 1.5 }).poly([410, -34, 434, -34, 428, -42, 416, -42], {
      fill: 'dark',
      fa: 0.8,
      w: 1,
      r: 1,
    });
  },
  under(s) {
    /* a jetty out to a gate */
    for (const x of [-474, -404, -334, -264]) {
      s.fill(box(x - 4, -14, 8, 24), 'dark', 0.8, 0);
      s.line([x - 4, -14, x - 3.5, 10], { w: 1.1 }).line([x + 4, -14, x + 3.5, 9], { w: 1.1 });
    }
    s.poly([-486, -24, -234, -24, -234, -14, -486, -14], { fill: 'wash', w: 1.3, r: 1.5 });
    const dk = [];
    for (let x = -478; x < -238; x += 16) dk.push(x, -23, x, -15);
    s.segs(dk, { w: 0.8, a: 0.45 });
    for (const x of [-424, -352])
      s.poly([x, -24, x + 2, -150, x + 10, -150, x + 12, -24], { fill: 'dark', fa: 0.9, w: 1.3, r: 1.5 });
    s.poly(box(-434, -134, 104, 9), { fill: 'dark', fa: 0.9, w: 1.2, r: 1.5 });
    s.poly([-452, -166, -420, -158, -382, -156, -344, -158, -312, -166, -314, -152, -382, -146, -450, -152], {
      fill: 'dark',
      fa: 0.95,
      w: 1.4,
      r: 1.5,
    });
    s.line([-382, -134, -382, -112], { w: 0.9, passes: 1 });
    s.poly([-390, -112, -374, -112, -376, -92, -388, -92], { fill: 'paperLit', w: 1, r: 2 });
  },
  post(s) {
    s.poly([-340, 4, -246, 4, -256, 18, -330, 18], { fill: 'wash', w: 1.3, r: 3 });
    s.segs([-320, 5, -318, 17, -292, 5, -292, 17, -266, 5, -268, 17], { w: 0.8, a: 0.5 });
    s.line(sagLine(-246, 6, -236, -14, 4, 5), { w: 0.8, passes: 1 });
    for (const [x, y, r] of [
      [300, 34, 12],
      [-420, 30, 11],
      [-390, 38, 8],
    ]) {
      s.fill(arc(x, y, r, r * 0.3, 0.4, 5.9, 12).concat([x, y]), 'leaf', 0.9, 0);
      s.line(arc(x, y, r, r * 0.3, 0.4, 5.9, 12).concat([x, y]), { w: 0.8, passes: 1, jit: 0.3, a: 0.7, step: 3 });
    }
  },
});
