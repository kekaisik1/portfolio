/**
 * The drawing of the place for "history-lens": the scene on its three sheets, and its one small moving part.
 */
import { definePlace } from './define';
import { bird, pennant } from '../world/draw/critters';
import { arc, box, circ, glow, sagLine } from '../world/draw/pencil';
import { paint } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* History Lens: Broad Street, Soho, 1854. The pump, a gas lamp, and a glass that shows what the street can't */
export const place: PlaceDef = definePlace({
  hit: [-566, -386, 372, 12],
  ext: [-572, -392, 378, 24],
  size: 0.66,
  sea: 'island',
  capAt: [96, -352],
  capW: 236,
  life: { kind: 'ticket', ax: 0.25, ay: 0.06, nax: 0.74, nay: 0.5, n: 0.4, b: 0.55 },
  build(s) {
    const R = s.rnd;
    /* the quay it stands on */
    s.poly([-306, 0, 300, 0, 296, 12, -302, 12], { fill: 'wash', w: 1.2 });
    const qs = [];
    for (let x = -290; x < 296; x += 26 + R() * 18) qs.push(x, 1, x - 1, 11);
    s.segs(qs, { w: 0.8, a: 0.5 });
    const cb = [];
    for (let x = -296; x < 292; x += 9 + R() * 5)
      if (R() < 0.6) cb.push(...[x, -1, x + 3, -3.2, x + 3, -3.2, x + 6.5, -1]);
    s.segs(cb, { w: 0.8, a: 0.4 });
    /* gas lamp */
    s.fill([-276, 0, -274, -206, -268, -206, -266, 0], 'dark', 0.75);
    s.line([-276, 1, -274, -206], { w: 1.4 }).line([-266, 1, -268, -206], { w: 1.2 });
    s.poly([-282, 0, -280, -16, -262, -16, -260, 0], { fill: 'dark', fa: 0.85, w: 1.1 });
    s.segs([-278, -60, -264, -60, -277, -64, -265, -64, -284, -190, -258, -190], { w: 1.5, a: 0.75 });
    s.poly([-282, -244, -260, -244, -264, -208, -278, -208], { fill: 'gold', fa: 0.8, w: 1.25, jit: 0.3 });
    s.segs([-271, -244, -271, -208], { w: 0.8, a: 0.6 });
    s.poly([-286, -244, -271, -260, -256, -244], { fill: 'dark', fa: 0.85, w: 1.1, jit: 0.3 });
    s.line([-271, -260, -271, -268], { w: 1.4, passes: 1 });
    s.dot(-271, -270, 2.4, 'dark', 0.9);
    /* the house: front, then the side going off round the corner */
    s.poly([-226, 0, -226, -306, -30, -306, -30, 0], { fill: 'fill', w: 1.4 });
    s.bricks(-222, -298, -34, -118, { rh: 9, bw: 20, d: 0.38, a: 0.3 });
    s.poly([-30, 0, -30, -306, 58, -288, 58, 0], { fill: 'wash', w: 1.3 });
    s.hatch(-28, -296, 56, -4, 7, { a: 0.22 });
    for (const y of [-210, -110]) s.line([-226, y, -30, y - 0.5, 58, y + 5], { w: 1, passes: 1, a: 0.7 });
    s.poly([-232, -306, -232, -318, -28, -318, 62, -299, 62, -288, -30, -306], { fill: 'paper', w: 1.25 });
    /* roof and chimneys */
    s.poly([-222, -318, -196, -344, -44, -344, -30, -318], { fill: 'dark', fa: 0.75, w: 1.25 });
    s.poly([-30, -318, -44, -344, 40, -322, 60, -300], { fill: 'dark', fa: 0.55, w: 1.1 });
    for (const [x, n] of [
      [-208, 3],
      [-92, 2],
    ]) {
      s.poly(box(x, -372, 14 * n + 6, 36), { fill: 'fill', w: 1.2 });
      s.bricks(x + 2, -368, x + 14 * n + 4, -340, { rh: 7, bw: 12, d: 0.6, a: 0.4 });
      for (let k = 0; k < n; k++) {
        s.poly(box(x + 4 + k * 14, -380, 9, 9), { fill: 'wash', w: 0.9, passes: 1, jit: 0.3 });
      }
    }
    /* windows: sashes upstairs */
    for (const y of [-290, -192])
      for (const x of [-208, -148, -88]) {
        s.win(x, y, 40, 62, { nx: 2, ny: 3, fa: 0.8 });
        s.poly([x - 4, y, x + 44, y, x + 40, y - 8, x, y - 8], { fill: 'paper', w: 0.9, passes: 1, jit: 0.3 });
      }
    for (const [y, h] of [
      [-284, 56],
      [-186, 56],
    ])
      s.poly([-16, y, 12, y + 6, 12, y + h + 5, -16, y + h], { fill: 'glass', fa: 0.7, w: 1, passes: 1 });
    s.poly([24, -278, 46, -273, 46, -220, 24, -224], { fill: 'glass', fa: 0.6, w: 0.9, passes: 1 }).poly(
      [24, -180, 46, -176, 46, -124, 24, -126],
      { fill: 'glass', fa: 0.6, w: 0.9, passes: 1 },
    );
    /* the shop front on the corner */
    s.poly([-232, -110, -232, -98, -28, -98, 60, -93, 60, -104, -30, -110], { fill: 'dark', fa: 0.8, w: 1.2 });
    s.text('BROAD  ST.', -130, -104, 12, { c: 'paper', a: 0.95 });
    s.fill(box(-214, -92, 110, 62), 'glass', 0.8);
    s.rect(-214, -92, 110, 62, { w: 1.25, jit: 0.4 });
    const pn = [];
    for (let i = 1; i < 6; i++) pn.push(-214 + i * 18.3, -92, -214 + i * 18.3, -30);
    for (let j = 1; j < 3; j++) pn.push(-214, -92 + j * 20.6, -104, -92 + j * 20.6);
    s.segs(pn, { w: 0.9, a: 0.65 });
    s.segs(
      [
        -204, -36, -200, -52, -196, -36, -180, -36, -180, -48, -172, -48, -172, -36, -150, -36, -146, -56, -142, -36,
        -124, -36, -124, -46, -116, -46, -116, -36,
      ],
      { w: 1, a: 0.5 },
    );
    s.poly(box(-218, -30, 118, 30), { fill: 'wash', w: 1.2 });
    s.rect(-210, -24, 46, 18, { w: 0.7, passes: 1, a: 0.5 }).rect(-156, -24, 46, 18, { w: 0.7, passes: 1, a: 0.5 });
    s.poly([-92, 0, -92, -92, -42, -92, -42, 0], { fill: 'dark', fa: 0.8, w: 1.3 });
    s.rect(-86, -86, 38, 34, { w: 0.8, passes: 1, c: 'paper', a: 0.5 }).rect(-86, -46, 38, 40, {
      w: 0.8,
      passes: 1,
      c: 'paper',
      a: 0.5,
    });
    s.dot(-49, -46, 2.4, 'gold', 1);
    s.poly([-98, 0, -98, -6, -36, -6, -36, 0], { fill: 'paper', w: 1 });
    s.poly([-16, 0, -16, -84, 22, -80, 22, 0], { fill: 'glass', fa: 0.6, w: 1.1 });
    s.segs([3, -82, 3, -1, -16, -42, 22, -40], { w: 0.8, a: 0.6 });
    /* a handbill, a barrel, a crate */
    s.poly([-36, -150, -6, -146, -8, -116, -38, -120], { fill: 'paper', w: 1, passes: 1, jit: 0.3 });
    s.segs([-32, -142, -12, -139, -32, -135, -14, -132, -33, -128, -20, -126], { w: 1, a: 0.55 });
    s.poly([68, 0, 64, -24, 68, -48, 98, -48, 102, -24, 98, 0], { fill: 'wash', w: 1.25 });
    s.segs([65, -13, 101, -13, 65, -35, 101, -35, 78, -47, 77, -1, 90, -47, 91, -1], { w: 0.9, a: 0.55 });
    s.ell(83, -48, 15, 3.5, { w: 1, passes: 1, jit: 0.3 });
    /* the pump */
    s.poly([128, 0, 130, -16, 176, -16, 178, 0], { fill: 'paper', w: 1.25 });
    s.bricks(130, -16, 176, -1, { rh: 8, bw: 16, d: 0.7, a: 0.4 });
    s.poly([141, -16, 143, -112, 163, -112, 165, -16], { fill: 'dark', fa: 0.8, w: 1.4 });
    s.segs([142, -40, 164, -40, 143, -90, 163, -90], { w: 1.2, a: 0.7 });
    s.line([147, -22, 148, -108], { c: 'paper', w: 1.1, passes: 1, a: 0.45 });
    s.poly([139, -112, 167, -112, 163, -122, 143, -122], { fill: 'dark', fa: 0.9, w: 1.1, jit: 0.3 });
    s.poly(arc(153, -122, 9, 12, Math.PI, 2 * Math.PI, 8), { fill: 'dark', fa: 0.9, w: 1.1, jit: 0.3 });
    s.dot(153, -138, 3, 'dark', 0.95);
    s.poly([142, -74, 118, -72, 114, -62, 121, -62, 124, -66, 142, -64], { fill: 'dark', fa: 0.9, w: 1.2, jit: 0.3 });
    s.poly([108, 0, 106, -16, 130, -16, 128, 0], { fill: 'blue', w: 1.1 });
    s.line(arc(118, -16, 12, 9, Math.PI, 2 * Math.PI, 8), { w: 0.9, passes: 1 });
    s.segs([106, -9, 130, -9], { w: 0.8, a: 0.5 });
    /* the glass, propped on a crate: big enough to stand in */
    s.tf((x, y) => [180 + (x - 180) * 1.36, y * 1.36]);
    s.poly(box(244, -30, 46, 30), { fill: 'wash', w: 1.2 });
    s.segs([244, -15, 290, -15, 260, -30, 260, 0, 275, -30, 275, 0], { w: 0.8, a: 0.45 });
    s.fill(circ(180, -166, 80, 80, 0, 6.283, 0.12), 'lensFill', 0.86);
    /* through it: the map. Streets, a bar for every death, and where they gather */
    s.segs(
      [
        108, -150, 256, -186, 110, -138, 258, -174, 164, -244, 190, -90, 176, -246, 202, -92, 118, -206, 160, -216, 204,
        -112, 250, -124,
      ],
      { w: 1, a: 0.55 },
    );
    const bars = [];
    for (let i = 0; i < 46; i++) {
      const a = R() * 6.283,
        d = 8 + R() * R() * 62,
        x = 184 + Math.cos(a) * d * 1.05,
        y = -164 + Math.sin(a) * d * 0.8;
      if (Math.hypot(x - 180, y + 166) < 70) bars.push(x, y, x + 5.5, y - 1.4);
    }
    s.segs(bars, { c: 'red', w: 2.3, a: 0.9 });
    s.ell(184, -164, 9, 9, { c: 'red', w: 1.6, jit: 0.3, passes: 2 });
    s.dot(184, -164, 3.4, 'red', 1);
    s.ell(180, -166, 80, 80, { w: 2.6, jit: 0.5, da: 0.1 });
    s.ell(180, -166, 86, 86, { w: 1.3, jit: 0.5, da: 0.1 });
    s.line(arc(180, -166, 70, 70, Math.PI * 1.1, Math.PI * 1.45, 10), {
      c: 'paper',
      w: 2,
      passes: 1,
      a: 0.8,
      jit: 0.3,
    });
    s.poly([236, -102, 246, -112, 286, -38, 272, -30], { fill: 'dark', fa: 0.92, w: 1.4 });
    s.segs([240, -100, 249, -108, 246, -90, 255, -98], { c: 'paper', w: 1, a: 0.5 });
    s.tf(null);
    for (const x of [-208, -148, -88]) {
      s.line(arc(x + 9, -192, 9, 30, 0, Math.PI * 0.5, 5), { w: 0.7, passes: 1, a: 0.45 }).line(
        arc(x + 31, -192, 9, 30, Math.PI * 0.5, Math.PI, 5),
        { w: 0.7, passes: 1, a: 0.45 },
      );
      s.poly([x - 2, -128, x + 42, -128, x + 40, -120, x, -120], { fill: 'dark', fa: 0.7, w: 0.9, passes: 1 });
      s.plants(x, x + 40, -128, { fl: 0.7 });
    }
    s.plants(-300, -284, 0).plants(-260, -232, 0);
    s.part('handle');
    s.line([153, -100, 170, -112, 196, -100, 214, -62], { w: 3.2, jit: 0.3, step: 4 });
    s.ell(214, -58, 4, 5, { w: 1.6, passes: 1, jit: 0.2 });
  },
  live(g, P, st, pal) {
    const t = st.t,
      hc = st.hc,
      cyc = st.still ? 0.2 : (t * (0.3 + 0.25 * hc)) % 1,
      dn = cyc < 0.5 ? Math.sin(cyc * 2 * Math.PI) : 0;
    g.save();
    g.translate(153, -100);
    g.rotate(-0.1 + dn * 0.32);
    g.translate(-153, 100);
    paint(g, P.handle, pal);
    g.restore();
    /* water, when the handle comes down */
    if (!st.still && cyc > 0.2 && cyc < 0.9) {
      const f = (cyc - 0.2) / 0.7;
      g.fillStyle = pal.water;
      g.globalAlpha = 0.9 * (1 - f * f);
      for (let k = 0; k < 3; k++) {
        const ff = f - k * 0.12;
        if (ff < 0) continue;
        g.beginPath();
        g.ellipse(117.5 + k * 0.8, -60 + ff * 40, 1.7, 3.2, 0, 0, 6.283);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    const fl = st.still ? 1 : 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 5.3);
    glow(g, -271, -226, 34 + 30 * st.lit, pal.warm, (0.34 + 0.4 * st.lit) * fl);
    if (st.lit > 0.01) for (const x of [-188, -128, -68]) glow(g, x, -160, 34, pal.warm, 0.4 * st.lit);
    pennant(g, -200, -378, t, pal, st.still);
    bird(g, 84, -51, 1.1, t, pal, {
      dir: 1,
      bob: st.still ? 0 : Math.sin(t * 0.9) > 0.5 ? Math.sin(t * 7) * 1 : 0,
      c: pal.glass,
    });
  },
  core: [-244, 376],
  door: [-67, -45],
  pre(s) {
    s.poly([300, 0, 316, -250, 332, 0], { fill: 'wash', fa: 0.6, w: 1, r: 0 });
    s.house(280, 80, 90, { c: 'fill' });
    s.roofH(280, 80, -90, 30);
    for (const x of [330, 352]) {
      s.line([x, 0, x, -200], { w: 1 });
      s.segs([x - 16, -150, x + 16, -150, x - 11, -180, x + 11, -180, x, -200, x - 20, -40, x, -200, x + 20, -40], {
        w: 0.7,
        a: 0.5,
      });
    }
  },
  under(s) {
    const R = s.rnd;
    s.poly([-566, 0, 372, 0, 368, 12, -562, 12], { fill: 'wash', w: 1.2, r: 0 });
    const qs = [];
    for (let x = -556; x < 366; x += 26 + R() * 18) qs.push(x, 1, x - 1, 11);
    s.segs(qs, { w: 0.8, a: 0.5 });
    /* the rest of the terrace */
    s.house(-560, 162, 252, { tex: 'brick', c: 'wash' });
    s.roofH(-560, 162, -252, 30, { inset: 12 });
    s.chim(-536, -280, 30, 34);
    for (const y of [-236, -156]) for (const x of [-540, -468]) s.winS(x, y, 34, 52, { nx: 2, ny: 3, sh: false });
    s.door(-452, 36, 82, { arch: true });
    s.win(-544, -86, 72, 58, { nx: 3, ny: 2 });
    s.line([-560, -98, -398, -98.5], { w: 1, passes: 1, a: 0.7 });
    s.house(-398, 168, 290, { tex: 'brick' });
    s.poly(box(-402, -300, 176, 10), { fill: 'paper', w: 1.2, r: 2 });
    s.roofH(-398, 168, -300, 28, { inset: 12 });
    s.chim(-384, -326, 36, 36).chim(-268, -326, 24, 30);
    for (const y of [-276, -182])
      for (const x of [-378, -302]) s.winS(x, y, 36, 58, { nx: 2, ny: 3, sh: false, box: y > -200 });
    s.poly([-402, -106, -402, -96, -228, -96, -228, -106], { fill: 'dark', fa: 0.8, w: 1.2, r: 1.5 });
    s.win(-386, -90, 74, 62, { nx: 4, ny: 3 });
    s.door(-296, 40, 86);
  },
  post(s) {
    for (let x = -540; x <= 360; x += 100) {
      s.poly([x - 4, 12, x - 3, -8, x + 3, -8, x + 4, 12], { fill: 'dark', fa: 0.85, w: 1.1, r: 1.5 });
      if (x < 360) s.line(sagLine(x + 3, -4, x + 97, -4, 7, 8), { w: 0.9, passes: 1, a: 0.6, jit: 0.3 });
    }
    s.poly(box(-520, -34, 64, 22), { fill: 'wash', w: 1.2 });
    s.ell(-488, -11, 13, 13, { w: 1.3, jit: 0.3 });
    s.segs([-488, -24, -488, 2, -501, -11, -475, -11], { w: 0.8, a: 0.5 });
    s.line([-456, -30, -428, -40], { w: 1.4, passes: 1 });
  },
});
