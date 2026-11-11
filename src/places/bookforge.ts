/**
 * The drawing of the place for "bookforge": the scene on its three sheets, and its one small moving part.
 */
import { bigBook, definePlace } from './define';
import { pennant } from '../world/draw/critters';
import { arc, box, glow, sagLine } from '../world/draw/pencil';
import { paint, pen } from '../world/draw/sketch';
import type { PlaceDef } from '../world/types';

/** where the red thread is pinned */
const PINS = [
  [-228, -302],
  [-70, -285],
  [30, -334],
  [204, -160],
  [247, -384],
];

/* BookForge: a library made of books, with red thread strung between its pins */
export const place: PlaceDef = definePlace({
  sy: 0.94,
  hit: [-380, -502, 330, 10],
  ext: [-386, -508, 336, 14],
  size: 0.72,
  sea: 'island',
  capAt: [-380, -452],
  capW: 220,
  life: { kind: 'page', ax: 0.56, ay: 0.14 },
  pins: PINS,
  build(s) {
    const R = s.rnd;
    s.lift((x, y) => [x, y - 110]);
    const book = (
      x0: number,
      x1: number,
      y: number,
      th: number,
      c: string,
      o: { fa?: number; title?: boolean } = {},
    ) => {
      /* lying flat, spine to us */
      s.poly(box(x0, y - th, x1 - x0, th), { fill: c, fa: o.fa ?? 0.95, w: 1.35 });
      s.fill(box(x1 - 16, y - th + 4, 16, th - 8), 'paper');
      const pg = [];
      for (let yy = y - th + 7; yy < y - 5; yy += 3.2) pg.push(x1 - 15, yy, x1 - 1, yy + (R() - 0.5));
      s.segs(pg, { w: 0.6, a: 0.5 });
      s.line([x1 - 16, y - th + 3, x1 - 16, y - 3], { w: 0.9, passes: 1 });
      s.segs(
        [
          x0 + 16,
          y - th + 1,
          x0 + 16,
          y - 1,
          x0 + 22,
          y - th + 1,
          x0 + 22,
          y - 1,
          x1 - 40,
          y - th + 1,
          x1 - 40,
          y - 1,
          x1 - 34,
          y - th + 1,
          x1 - 34,
          y - 1,
        ],
        { w: 1, a: 0.55 },
      );
      if (o.title !== false)
        s.segs(
          [
            x0 + 44,
            y - th / 2 - 3,
            x0 + 44 + (x1 - x0) * 0.32,
            y - th / 2 - 3,
            x0 + 44,
            y - th / 2 + 4,
            x0 + 44 + (x1 - x0) * 0.2,
            y - th / 2 + 4,
          ],
          { c: 'paper', w: 2, a: 0.75 },
        );
      s.hatch(x0 + 2, y - 9, x1 - 18, y - 1, 6, { a: 0.22, k: 0.5 });
    };
    /* three standing at the back, like towers */
    s.tf((x, y) => [x + y * 0.05, y]);
    s.poly(box(-296, -232, 42, 232), { fill: 'wash', w: 1.3 });
    s.segs([-296, -200, -254, -200, -296, -190, -254, -190, -296, -40, -254, -40], { w: 1, a: 0.55 });
    s.segs([-284, -170, -284, -70, -274, -160, -274, -90], { c: 'paper', w: 2, a: 0.7 });
    s.tf(null);
    s.poly(box(-252, -302, 48, 302), { fill: 'blue', w: 1.35 });
    s.segs([-252, -268, -204, -268, -252, -258, -204, -258, -252, -46, -204, -46, -252, -36, -204, -36], {
      w: 1,
      a: 0.55,
    });
    s.segs([-236, -230, -236, -90, -222, -220, -222, -130], { c: 'paper', w: 2.2, a: 0.75 });
    s.win(-240, -84, 24, 30, { nx: 2, ny: 2, c: 'gold', fa: 0.8 });
    s.poly([-204, 0, -204, -262, -168, -264, -168, 0], { fill: 'dark', fa: 0.75, w: 1.3 });
    s.segs([-204, -236, -168, -238, -204, -30, -168, -30], { w: 1, a: 0.55 });
    s.segs([-186, -210, -186, -80], { c: 'paper', w: 2, a: 0.6 });
    /* the stack */
    book(-150, 196, 0, 58, 'wash');
    book(-170, 162, -58, 44, 'blue');
    book(-128, 204, -102, 58, 'fill');
    book(-152, 152, -160, 40, 'dark', { fa: 0.8 });
    book(-112, 172, -200, 50, 'wash');
    /* door and windows cut into the spines */
    const dr = [8, 0, 8, -34].concat(arc(27, -34, 19, 16, Math.PI, 2 * Math.PI, 8), [46, 0]);
    s.fill(dr, 'deep', 0.88);
    s.line(dr, { w: 1.3 });
    s.segs([27, -50, 27, -1], { c: 'paper', w: 0.8, a: 0.4 });
    s.dot(32, -24, 2, 'gold', 1);
    s.poly([2, 0, 2, -5, 52, -5, 52, 0], { fill: 'paper', w: 1 }).poly([-4, 8, -4, 0, 58, 0, 58, 8], {
      fill: 'paper',
      w: 1,
    });
    for (const x of [-84, -44, 84, 124]) s.win(x, -150, 22, 34, { nx: 1, ny: 2, c: 'gold', fa: 0.8 });
    for (const x of [-60, 20, 100]) {
      s.fill([x, -206].concat(arc(x + 11, -228, 11, 10, Math.PI, 2 * Math.PI, 6), [x + 22, -206]), 'gold', 0.8);
      s.line([x, -206, x, -228].concat(arc(x + 11, -228, 11, 10, Math.PI, 2 * Math.PI, 6), [x + 22, -206, x, -206]), {
        w: 1,
        jit: 0.3,
      });
    }
    s.win(-96, -92, 20, 22, { nx: 2, ny: 1, c: 'gold', fa: 0.8 }).win(60, -92, 20, 22, {
      nx: 2,
      ny: 1,
      c: 'gold',
      fa: 0.8,
    });
    /* the roof: a book laid open, face down */
    s.fill([-136, -250, 30, -324, 196, -250], 'paper');
    const pe = [];
    for (let k = 1; k < 6; k++)
      pe.push(-136 + k * 11, -250, 30, -324 + k * 8.5, 30, -324 + k * 8.5, 196 - k * 11, -250);
    s.segs(pe, { w: 0.7, a: 0.4 });
    s.poly([-152, -250, 30, -338, 212, -250, 196, -250, 30, -324, -136, -250], { fill: 'red', fa: 0.84, w: 1.4 });
    s.line([-136, -250, 196, -250.5], { w: 1.1, passes: 1 });
    /* a ribbon marking the place */
    s.poly([150, -160, 162, -160, 163, -118, 156, -126, 150, -118], {
      fill: 'red',
      fa: 0.85,
      w: 1,
      passes: 1,
      jit: 0.3,
    });
    /* a ladder */
    s.line([-124, 2, -96, -160], { w: 1.4 }).line([-104, 2, -76, -160], { w: 1.4 });
    const ld = [];
    for (let k = 1; k < 9; k++) {
      const y = -k * 18;
      ld.push(-124 + k * 3.1, y, -104 + k * 3.1, y);
    }
    s.segs(ld, { w: 1.2, a: 0.75 });
    /* the pencil: it holds the crane (the place is still going up) */
    s.poly([236, 0, 236, -356, 247, -384, 258, -356, 258, 0], { fill: 'gold', fa: 0.9, w: 1.35 });
    s.fill([240.5, -367, 247, -384, 253.5, -367], 'deep', 0.95);
    s.line([236, -356, 242, -350, 247, -356, 252, -350, 258, -356], { w: 1, passes: 1, jit: 0.3, step: 3 });
    s.segs([243, -346, 243, -24, 251, -346, 251, -24], { w: 0.8, a: 0.4 });
    s.poly(box(236, -24, 22, 10), { fill: 'wash', w: 1, passes: 1 });
    s.fill(box(236, -14, 22, 14), 'red', 0.5);
    s.line([247, -338, 118, -364], { w: 1.6 }).line([247, -296, 186, -350], { w: 1, passes: 1 });
    s.ell(120, -360, 4.5, 4.5, { w: 1.1, passes: 1, jit: 0.2 });
    /* pins */
    for (const [x, y] of PINS) {
      s.line([x, y, x + 1.5, y + 9], { w: 1.1, passes: 1, jit: 0.2 });
      s.dot(x, y, 3.6, 'red', 1);
      s.ell(x, y, 3.6, 3.6, { w: 0.8, passes: 1, jit: 0.2 });
    }
    s.line([52, -30, 60, -32, 60, -26], { w: 1, passes: 1, jit: 0.3 });
    s.poly([55, -26, 65, -26, 64, -14, 56, -14], { fill: 'gold', fa: 0.9, w: 0.9, passes: 1, jit: 0.3 });
    s.line([-252, -4, -246, -40, -252, -80, -245, -120, -250, -160], { w: 0.8, passes: 1, jit: 0.8, a: 0.55 });
    const iv = [];
    for (let y = -8; y > -160; y -= 9) {
      const x = -249 + Math.sin(y * 0.1) * 3;
      iv.push(x, y, x + 6 + R() * 4, y - 4, x, y - 3, x - 5 - R() * 3, y - 8);
    }
    s.segs(iv, { w: 1, a: 0.5 });
    /* the book on the hook */
    s.lift(null);
    s.part('hook');
    s.poly(box(-26, 0, 52, 14), { fill: 'blue', w: 1.2, jit: 0.3 });
    s.fill(box(-24, 3, 8, 8), 'paper');
    s.segs([-10, 0, -10, 14, 16, 0, 16, 14], { w: 0.9, a: 0.6 });
    s.line([-20, 0, 0, -14, 20, 0], { w: 0.9, passes: 1, jit: 0.2 });
  },
  live(g, P, st, pal) {
    const t = st.t,
      hc = st.hc,
      pins = PINS,
      still = st.still;
    g.save();
    g.translate(0, -110);
    /* the thread, pin to pin, with cards hung on it */
    g.strokeStyle = pal.red;
    g.lineWidth = 1.35 * pen.lw;
    g.globalAlpha = 0.95;
    g.lineJoin = 'round';
    const cards = [];
    for (let i = 0; i < pins.length - 1; i++) {
      const a = pins[i],
        b = pins[i + 1],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const sag = len * 0.1 + (still ? 0 : Math.sin(t * 1.3 + i * 1.9) * (2.2 + 4 * hc)),
        sx = still ? 0 : Math.sin(t * 0.9 + i) * (1.5 + 3 * hc);
      const mx = (a[0] + b[0]) / 2 + sx,
        my = (a[1] + b[1]) / 2 + sag * 2;
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.quadraticCurveTo(mx, my, b[0], b[1]);
      g.stroke();
      if (i === 0 || i === 2)
        for (const u of i === 0 ? [0.34, 0.66] : [0.3, 0.55, 0.78]) {
          const v = 1 - u;
          cards.push([
            v * v * a[0] + 2 * v * u * mx + u * u * b[0],
            v * v * a[1] + 2 * v * u * my + u * u * b[1],
            i + u * 7,
          ]);
        }
    }
    g.lineWidth = 0.9 * pen.lw;
    for (const [x, y, k] of cards) {
      const r = still ? 0.06 : Math.sin(t * 1.7 + k * 2.3) * (0.1 + 0.16 * hc);
      g.save();
      g.translate(x, y);
      g.rotate(r);
      g.globalAlpha = 1;
      g.fillStyle = pal.paper;
      g.fillRect(-7, 1, 14, 18);
      g.globalAlpha = 0.8;
      g.strokeStyle = pal.ink;
      g.strokeRect(-7, 1, 14, 18);
      g.beginPath();
      g.moveTo(-4, 6);
      g.lineTo(4, 6);
      g.moveTo(-4, 10);
      g.lineTo(3, 10);
      g.moveTo(-4, 14);
      g.lineTo(1, 14);
      g.globalAlpha = 0.5;
      g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
    /* the next book, going up */
    const sw = still ? 0.03 : Math.sin(t * 1.1) * 0.06,
      up = still ? 0 : Math.sin(t * 0.5) * 8 + 8;
    g.strokeStyle = pal.ink;
    g.lineWidth = 1 * pen.lw;
    g.globalAlpha = 0.8;
    g.save();
    g.translate(120, -356);
    g.rotate(sw);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, 12 + up * 0.5);
    g.stroke();
    g.globalAlpha = 1;
    g.translate(0, 26 + up * 0.5);
    paint(g, P.hook, pal);
    g.restore();
    if (st.lit > 0.01) {
      for (const x of [-73, -33, 95, 135]) glow(g, x, -133, 26, pal.warm, 0.5 * st.lit);
      glow(g, 27, -30, 36, pal.warm, 0.5 * st.lit);
    }
    pennant(g, -272, -232, t, pal, still);
    g.restore();
  },
  core: [-340, 304],
  door: [-11, -26],
  pre(s) {
    s.poly([262, 0, 284, -400, 330, -396, 318, 0], { fill: 'wash', fa: 0.7, w: 1.2 });
    s.poly([-378, 0, -366, -330, -330, -332, -334, 0], { fill: 'blue', fa: 0.7, w: 1.2 });
    s.segs([288, -360, 326, -357, 290, -40, 316, -40, -362, -300, -334, -301], { w: 1, a: 0.5 });
  },
  under(s) {
    s.poly(box(236, -114, 22, 114), { fill: 'gold', fa: 0.9, w: 1.35 });
    s.segs([243, -112, 243, -24, 251, -112, 251, -24], { w: 0.8, a: 0.4 });
    /* two more volumes underneath: the ground floor and the one above it */
    bigBook(s, -330, 232, 0, 58, 'blue');
    bigBook(s, -300, 224, -58, 52, 'wash');
    s.door(-34, 46, 52, { arch: true });
    for (const x of [-250, -190, -130, 60, 120]) s.win(x, -46, 24, 30, { nx: 1, ny: 2, c: 'gold', fa: 0.8 });
    for (const x of [-240, -170, 120, 170]) {
      s.fill([x, -66].concat(arc(x + 12, -88, 12, 11, Math.PI, 2 * Math.PI, 6), [x + 24, -66]), 'gold', 0.8, 0);
      s.line([x, -66, x, -88].concat(arc(x + 12, -88, 12, 11, Math.PI, 2 * Math.PI, 6), [x + 24, -66, x, -66]), {
        w: 1,
        jit: 0.3,
      });
    }
  },
  after(s) {
    /* stairs up the outside, a ladder for the last bit, a balcony */
    s.poly([150, 0, 176, 0, 98, -58, 72, -58], { fill: 'paper', w: 1.3, r: 0 });
    const st = [];
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      st.push(150 - 78 * t, -58 * t, 176 - 78 * t, -58 * t);
    }
    s.segs(st, { w: 1, a: 0.7 });
    s.line([176, -18, 98, -76, 98, -58], { w: 1.1, passes: 1 }).segs([150, -18, 150, -37, 124, -38, 124, -57], {
      w: 1,
      a: 0.7,
    });
    s.line([84, -58, 62, -112], { w: 1.4 }).line([98, -58, 76, -112], { w: 1.4 });
    const ld = [];
    for (let k = 1; k < 6; k++) ld.push(84 - k * 3.7, -58 - k * 9, 98 - k * 3.7, -58 - k * 9);
    s.segs(ld, { w: 1.1, a: 0.75 });
    s.fence(-296, -262, -110, 15, { sp: 7 }).fence(-160, -128, -110, 15, { sp: 7 });
    /* the thread goes on down, room to room */
    const pts = [
      [204, -270],
      [226, -84],
      [132, -32],
      [-11, -56],
      [-178, -34],
      [-318, -80],
    ];
    for (let i = 0; i < pts.length - 1; i++)
      s.line(sagLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 9, 10), {
        c: 'red',
        w: 1.3,
        passes: 1,
        jit: 0.3,
        a: 0.95,
      });
    for (const [x, y] of pts.slice(1)) {
      s.dot(x, y, 3.4, 'red', 1);
      s.ell(x, y, 3.4, 3.4, { w: 0.8, passes: 1, jit: 0.2 });
    }
  },
  post(s) {
    s.lampP(-356, 0, 130);
    s.bench(272, 0, 44);
    s.pathTo(-11, 18, 2);
    s.plants(-380, -338, 1, { fl: 0.3 }).plants(-300, -60, 1, { fl: 0.25 }).plants(190, 262, 1, { fl: 0.3 });
  },
});
