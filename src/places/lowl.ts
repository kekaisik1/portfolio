/**
 * The drawing of the place for "lowl": the scene on its three sheets, and its one small moving part.
 */
import { definePlace } from './define';
import { insulators } from '../world/draw/critters';
import { arc, beamFill, box, circ, glow } from '../world/draw/pencil';
import { pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/* LOWL: a repair shop: a washing machine turning in the window, a wrench for a sign, the van outside */
export const place: PlaceDef = definePlace({
  hit: [-440, -378, 470, 10],
  ext: [-446, -384, 476, 14],
  size: 0.62,
  wire: [-190, -332],
  capAt: [112, -178],
  capW: 196,
  life: { kind: 'bubble', ax: 0.2, ay: 0.34 },
  build(s) {
    const R = s.rnd;
    /* upstairs: where the line comes in */
    s.poly([-200, -150, -200, -246, -30, -246, -30, -150], { fill: 'fill', w: 1.3 });
    s.bricks(-196, -240, -34, -154, { rh: 11, bw: 26, d: 0.3, a: 0.22 });
    s.poly([-214, -244, -190, -288, -40, -288, -16, -244], { fill: 'dark', fa: 0.7, w: 1.3 });
    const tl = [];
    for (let y = -280; y < -246; y += 9)
      for (let x = -200 + (y % 2 ? 6 : 0); x < -30; x += 13) if (R() < 0.7) tl.push(x, y, x + 2, y + 7);
    s.segs(tl, { w: 0.7, a: 0.4 });
    s.line([-190, -288, -190, -340], { w: 1.5 }).line([-208, -330, -172, -332], { w: 1.6 });
    insulators(s, [-202, -178], -331);
    for (const x of [-182, -106]) {
      s.win(x, -228, 52, 54, { nx: 2, ny: 2 });
      s.line(arc(x + 13, -228, 13, 22, 0, Math.PI * 0.5, 5), { w: 0.7, passes: 1, a: 0.5 }).line(
        arc(x + 39, -228, 13, 22, Math.PI * 0.5, Math.PI, 5),
        { w: 0.7, passes: 1, a: 0.5 },
      );
    }
    s.poly([-186, -172, -126, -172, -128, -164, -184, -164], { fill: 'wash', w: 0.9, passes: 1 });
    s.tufts(-182, -130, -172, { sp: 7, h: 5, a: 0.6 });
    /* the shop */
    s.poly([-200, 0, -200, -150, 120, -150, 120, 0], { fill: 'fill', w: 1.35 });
    s.hatch(86, -116, 118, -2, 7, { a: 0.2 });
    s.poly([-30, -150, -30, -160, 126, -160, 126, -150], { fill: 'wash', w: 1.1 });
    s.poly([-206, -152, 126, -152, 126, -118, -206, -118], { fill: 'paper', w: 1.3 });
    s.text('LOWL', -112, -134, 30, { a: 0.9 });
    s.line([-52, -134, 22, -135], { w: 2.6, jit: 0.3, passes: 1 });
    s.ell(30, -135, 7, 7, { w: 1.6, passes: 1, jit: 0.3 });
    s.line([-52, -134, -62, -141, -66, -137, -60, -134, -66, -130, -62, -127, -52, -134], {
      w: 1.4,
      passes: 1,
      jit: 0.2,
      step: 3,
    });
    s.text('repair', 82, -134, 17, { a: 0.7 });
    /* the shop window is a washing-machine door, as tall as the shop */
    s.fill(circ(-142, -58, 52, 52, 0, 6.283, 0.2), 'paper', 1, 0);
    s.ell(-142, -58, 52, 52, { w: 1.9, jit: 0.5, da: 0.1 });
    s.ell(-142, -58, 45, 45, { w: 1, jit: 0.4, da: 0.1, passes: 1 });
    s.fill(circ(-142, -58, 40, 40, 0, 6.283, 0.2), 'blue', 0.9, 0);
    s.ell(-142, -58, 40, 40, { w: 1.3, jit: 0.4, da: 0.1 });
    for (let a = 0; a < 6.2; a += 0.524) s.dot(-142 + Math.cos(a) * 48.5, -58 + Math.sin(a) * 48.5, 1.3, 'ink', 0.7);
    s.poly(box(-200, -70, 9, 24), { fill: 'dark', fa: 0.85, w: 1, r: 1.5 }).poly(box(-93, -66, 7, 16), {
      fill: 'dark',
      fa: 0.85,
      w: 1,
      r: 1.5,
    });
    s.line(arc(-142, -58, 33, 33, Math.PI * 1.1, Math.PI * 1.45, 8), {
      c: 'paper',
      w: 1.8,
      passes: 1,
      a: 0.8,
      jit: 0.3,
    });
    /* door */
    s.poly([-78, 0, -78, -100, -34, -100, -34, 0], { fill: 'wash', w: 1.25 });
    s.win(-72, -94, 32, 46, { nx: 1, ny: 1, sill: false });
    s.segs([-42, -44, -42, -34], { w: 2, a: 0.8 });
    s.poly([-66, -70, -46, -70, -46, -60, -66, -60], { fill: 'paper', w: 0.8, passes: 1, jit: 0.2 });
    s.segs([-62, -65, -50, -65], { w: 1.2, a: 0.6 });
    s.poly([-84, 0, -84, -6, -28, -6, -28, 0], { fill: 'paper', w: 1 });
    /* the open bay: tools on the wall, an oven on the bench */
    s.fill(box(-14, -108, 118, 108), 'deep', 0.78);
    s.rect(-14, -108, 118, 108, { w: 1.3, jit: 0.4 });
    s.fill(box(-14, -108, 118, 14), 'wash');
    s.segs([-14, -103, 104, -103, -14, -98.5, 104, -98.5], { w: 0.8, a: 0.6 });
    s.line([-14, -94, 104, -94.5], { w: 1.2, passes: 1 });
    const P = { c: 'paper', w: 1.1, passes: 1, jit: 0.3, a: 0.75 };
    s.line([-4, -84, -4, -62], P).line([-9, -84, 1, -84], { ...P, w: 2.4 }); /* hammer */
    s.line([10, -86, 10, -64], P).ell(10, -60, 3.5, 4, { ...P, a0: 0.6, a1: 5.7 }); /* spanner */
    s.line([22, -86, 22, -74, 18, -62, 22, -74, 26, -62], P); /* pliers */
    s.poly([34, -86, 62, -86, 62, -80, 40, -76], { ...P }); /* saw */
    s.line([70, -86, 70, -66], P).segs([67, -66, 73, -66], { c: 'paper', w: 1.6, a: 0.75 }); /* screwdriver */
    s.ell(88, -76, 8, 8, { ...P, a: 0.6 }); /* a coil of hose */
    s.ell(88, -76, 4.5, 4.5, { ...P, a: 0.5 });
    s.line([-12, -40, 102, -41], { ...P, w: 1.4 }).segs([-6, -40, -6, -2, 96, -41, 96, -2], {
      c: 'paper',
      w: 1.1,
      a: 0.6,
    });
    s.rect(8, -66, 36, 26, P)
      .rect(13, -58, 26, 14, { ...P, a: 0.55 })
      .segs([13, -62, 16, -62, 22, -62, 25, -62], { c: 'paper', w: 1.6, a: 0.7 });
    s.rect(56, -58, 22, 18, { ...P, a: 0.6 });
    s.ell(67, -49, 5, 5, { ...P, a: 0.5 });
    s.rect(20, -30, 30, 28, { ...P, a: 0.5 }).rect(56, -24, 34, 22, { ...P, a: 0.5 });
    /* the wrench on the roof */
    s.poly(box(40, -178, 40, 18), { fill: 'dark', fa: 0.8, w: 1.1 });
    s.line([60, -268, -6, -161], { w: 0.8, passes: 1, a: 0.5 }).line([60, -268, 122, -161], {
      w: 0.8,
      passes: 1,
      a: 0.5,
    });
    const wr = [46, -178, 46, -292].concat(
      arc(60, -330, 40, 40, Math.PI * 0.62, Math.PI * 2.38, 22),
      [74, -292, 74, -178],
    );
    s.poly(wr, { fill: 'red', fa: 0.88, w: 1.5 });
    const hx = [];
    for (let i = 0; i < 6; i++) hx.push(60 + Math.cos((i * Math.PI) / 3) * 18, -330 + Math.sin((i * Math.PI) / 3) * 18);
    s.poly(hx, { fill: 'sky', w: 1.2, jit: 0.3 });
    s.line([52, -200, 52, -288], { c: 'paper', w: 1.2, passes: 1, a: 0.5 });
    s.hatch(63, -290, 72, -184, 6, { a: 0.3, k: 0.3 });
    /* a fridge on its way in */
    s.tf((x, y) => [x * 0.99 - y * 0.12 - 268, y * 0.99 + x * 0.12]);
    s.poly(box(-22, -100, 44, 100), { fill: 'paper', w: 1.3 });
    s.line([-22, -66, 22, -66], { w: 1, passes: 1 });
    s.segs([14, -92, 14, -74, 14, -58, 14, -34], { w: 2, a: 0.7 });
    s.hatch(-20, -98, -8, -2, 6, { a: 0.2, k: 0.3 });
    s.line([26, 0, 26, -112, 34, -116], { w: 1.3 }).line([26, -2, -24, -2], { w: 1.3, passes: 1 });
    s.tf(null);
    s.fill(circ(-241, -6, 7, 7), 'dark', 0.9);
    s.ell(-241, -6, 7, 7, { w: 1.2, jit: 0.3 });
    /* toolbox, flowerpot, drainpipe */
    s.poly(box(-26, -15, 34, 15), { fill: 'red', fa: 0.8, w: 1.1 });
    s.line([-18, -15, -16, -23, -2, -23, 0, -15], { w: 1.2, passes: 1, jit: 0.3 });
    s.segs([-26, -9, 8, -9], { w: 0.8, a: 0.6 });
    s.poly([-98, 0, -100, -12, -86, -12, -88, 0], { fill: 'wash', w: 1, passes: 1 });
    s.tufts(-98, -86, -12, { sp: 4, h: 8, a: 0.7 });
    s.line([116, -150, 116, -4, 124, 0], { w: 1.3, passes: 1 }).segs([113, -110, 119, -110, 113, -50, 119, -50], {
      w: 1.4,
      a: 0.7,
    });
    s.pathTo(-56, 15, 2);
    s.shrub(-218, 0, 11).plants(-200, -196, 0, { fl: 0.3 }).plants(-304, -250, 1).plants(104, 136, 1);
    s.poly([-14, 0, -16, -10, -4, -10, -6, 0], { fill: 'wash', w: 0.9, passes: 1 });
    s.plants(-14, -5, -10, { fl: 0.9 });
    /* the van */
    s.tf((x, y) => [x * 1.16 + 190, y * 1.16]);
    for (const cx of [-22, 66]) {
      s.fill(circ(cx, -12, 11, 11), 'dark', 0.9);
      s.ell(cx, -12, 11, 11, { w: 1.3, jit: 0.4 });
      s.ell(cx, -12, 4, 4, { w: 1, passes: 1, jit: 0.3 });
    }
    const wa = (cx: number) => {
      const p = [];
      for (let a = 0; a <= Math.PI + 1e-6; a += Math.PI / 8) p.push(cx + Math.cos(a) * 14, -12 - Math.sin(a) * 14);
      return p;
    };
    s.poly([-44, -12, -44, -58, -40, -63, 54, -63, 73, -40, 89, -36, 92, -30, 92, -12].concat(wa(66), wa(-22)), {
      fill: 'blue',
      w: 1.3,
    });
    s.poly([-36, -55, -6, -55, -6, -40, -36, -40], { fill: 'glass', w: 0.9, passes: 1 }).poly(
      [56, -58, 70, -41, 56, -41],
      { fill: 'glass', w: 0.9, passes: 1 },
    );
    s.line([2, -60, 2, -15], { w: 0.9, passes: 1, a: 0.7 }).line([40, -61, 40, -15], { w: 0.9, passes: 1, a: 0.7 });
    s.segs([30, -36, 35, -36], { w: 1.6, a: 0.8 });
    s.line([-44, -29, 92, -27], { w: 1.4, a: 0.5 });
    s.line([-36, -68, 44, -68], { w: 1 });
    const rg = [];
    for (let x = -34; x <= 42; x += 9) rg.push(x, -63, x, -68);
    s.segs(rg, { w: 0.9, a: 0.6 });
    s.line([-40, -72, 46, -73], { w: 1.6, passes: 1 });
    s.line([88, -14, 97, -14], { w: 1.6 });
    s.ell(89, -31, 2.6, 2.2, { w: 0.9, passes: 1, jit: 0.3 });
    s.ell(18, -42, 5.5, 5.5, { w: 1, passes: 1, jit: 0.3, a0: 0.7, a1: 5.6 });
    s.line([18, -38, 18, -26], { w: 1.4, passes: 1, jit: 0.2 });
    s.tf(null);
    s.tufts(-304, -284, 2, { sp: 12 }).tufts(126, 150, 2, { sp: 12 }).tufts(292, 306, 2, { sp: 8 });
  },
  live(g, _parts, st, pal) {
    const t = st.still ? 1 : st.t,
      hc = st.hc,
      a0 = t * (0.9 + 1.6 * hc);
    /* the wash goes round */
    g.save();
    g.translate(-142, -58);
    g.scale(2.5, 2.5);
    g.translate(140, 50);
    g.save();
    g.beginPath();
    g.arc(-140, -50, 15.5, 0, 6.283);
    g.clip();
    g.fillStyle = pal.paper;
    g.globalAlpha = 0.9;
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = a0 + (i / 20) * 3.6,
        r = 14.5 - 7 * Math.sin((i / 20) * Math.PI);
      g.lineTo(-140 + Math.cos(a) * r, -50 + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.fillStyle = pal.red;
    g.globalAlpha = 0.7;
    g.beginPath();
    g.ellipse(-140 + Math.cos(a0 + 4.6) * 8, -50 + Math.sin(a0 + 4.6) * 8, 5, 3.4, a0, 0, 6.283);
    g.fill();
    g.restore();
    g.strokeStyle = pal.ink;
    g.lineWidth = 0.4 * pen.lw;
    g.globalAlpha = 0.7;
    for (let k = 0; k < 3; k++) {
      const a = a0 * 0.9 + k * 2.094;
      g.beginPath();
      g.arc(-140, -50, 11, a, a + 1.1);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
    /* washing on a line between the upstairs wall and the wrench */
    {
      const sw = st.still ? 0.2 : Math.sin(t * 1.1),
        mx = 8 + sw * 2,
        my = -212;
      g.strokeStyle = pal.ink;
      g.lineWidth = 0.9 * pen.lw;
      g.globalAlpha = 0.8;
      g.beginPath();
      g.moveTo(-30, -228);
      g.quadraticCurveTo(mx, my, 46, -238);
      g.stroke();
      g.globalAlpha = 1;
      (
        [
          [0.24, pal.paper, 0],
          [0.5, pal.gold, 1],
          [0.76, pal.blue, 2],
        ] as [number, string, number][]
      ).forEach(([u, col, kind]) => {
        const v = 1 - u,
          x = v * v * -30 + 2 * v * u * mx + u * u * 46,
          y = v * v * -228 + 2 * v * u * my + u * u * -238;
        g.save();
        g.translate(x, y);
        g.rotate(st.still ? 0.05 : Math.sin(t * 1.1 + kind * 1.3) * 0.1);
        g.fillStyle = col;
        g.lineWidth = 1 * pen.lw;
        g.beginPath();
        if (kind === 0) {
          g.moveTo(-7, 1);
          g.lineTo(-3, 0);
          g.lineTo(3, 0);
          g.lineTo(7, 1);
          g.lineTo(9, 6);
          g.lineTo(6, 7);
          g.lineTo(5, 16);
          g.lineTo(-5, 16);
          g.lineTo(-6, 7);
          g.lineTo(-9, 6);
        } else if (kind === 1) {
          g.rect(-6, 0, 12, 15);
        } else {
          g.moveTo(-3, 0);
          g.lineTo(3, 0);
          g.lineTo(3, 9);
          g.lineTo(8, 11);
          g.lineTo(7, 15);
          g.lineTo(-3, 14);
        }
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      });
    }
    if (st.lit > 0.01) {
      glow(g, 45, -60, 70, pal.warm, 0.42 * st.lit);
      glow(g, -56, -70, 30, pal.warm, 0.4 * st.lit);
      beamFill(g, [293, -36, 310, -44, 310, -14, 293, -30], 293, -33, 310, -33, pal.warm, 0.5 * st.lit);
    }
  },
  core: [-312, 312],
  door: [-56, -50],
  pre(s) {
    s.house(-438, 176, 170, { tex: 'brick', c: 'paper' });
    s.roofG(-438, 176, -170, 66);
    s.chim(-300, -214, 22, 44);
    for (const x of [-410, -340]) s.winS(x, -150, 34, 46, { sh: false });
    s.winS(-378, -214, 30, 30, { sh: false });
    s.tree(346, 0, 330, 'poplar').tree(388, 0, 280, 'poplar').tree(432, 0, 240, 'poplar');
  },
  under(s) {
    s.fence(312, 470, 0, 70, { sp: 12 });
    s.lampP(-330, 0, 170);
  },
  after(s) {
    /* the yard: things waiting their turn */
    s.poly(box(322, -96, 38, 96), { fill: 'paper', w: 1.3 });
    s.line([322, -62, 360, -62], { w: 1, passes: 1 });
    s.segs([354, -90, 354, -70, 354, -54, 354, -30], { w: 2, a: 0.7 });
    s.poly(box(368, -52, 44, 52), { fill: 'fill', w: 1.3 });
    s.rect(374, -36, 32, 26, { w: 1, passes: 1 });
    s.segs([374, -44, 378, -44, 384, -44, 388, -44, 394, -44, 398, -44], { w: 2, a: 0.7 });
    s.segs([372, -54, 384, -54, 394, -54, 406, -54], { w: 2.2, a: 0.8 });
    s.poly(box(374, -84, 34, 26), { fill: 'blue', w: 1.1 });
    s.rect(378, -80, 20, 18, { w: 0.8, passes: 1 });
    s.poly(box(420, -58, 44, 58), { fill: 'paper', w: 1.3 });
    s.fill(circ(442, -26, 15, 15), 'blue', 0.85, 0);
    s.ell(442, -26, 15, 15, { w: 1.2, jit: 0.3 });
    s.line([420, -48, 464, -48.5], { w: 0.9, passes: 1 });
    s.dot(456, -53, 2, 'dark', 0.9);
    s.hatch(350, -94, 359, -2, 6, { a: 0.22 }).hatch(452, -56, 463, -2, 6, { a: 0.22 });
  },
  post(s) {
    s.line([-446, 6, 476, 7], { w: 1, passes: 1, a: 0.5, jit: 0.8 });
    s.poly([-398, 0, -386, -44, -374, 0], { fill: 'paper', w: 1.2, r: 2 });
    s.segs([-392, -22, -380, -22, -390, -14, -382, -14], { w: 1, a: 0.6 });
    s.fence(314, 474, 0, 22, { sp: 10 });
    s.plants(-446, -410, 1, { fl: 0.3 }).plants(304, 320, 1);
  },
});
