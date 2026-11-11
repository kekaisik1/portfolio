/**
 * The sketch builder: places and rooms are described once with these tools (walls, roofs, trees, hatching...)
 * and kept as a list of strokes, then painted in whatever colours the country they stand in calls for.
 */
import { clamp, mulberry32 } from '../../lib/math';
import { arc, box, circ, dens, pencil, soft } from './pencil';
import type { G, Pal, Parts, SkOp, Sketch, Warp } from '../types';

/** Line weight and opacity of whatever is being painted right now: set by the view, read by every stroke. */
export const pen = { lw: 1, ga: 1 };

export function Sk(seed: number): Sketch {
  const rnd = mulberry32(seed),
    parts: Parts = { base: [] };
  let cur = parts.base,
    T: Warp | null = null,
    T0: Warp | null = null;
  const tf = (p: number[]): number[] => {
    if (!T && !T0) return p;
    const o = new Array(p.length);
    for (let i = 0; i < p.length; i += 2) {
      let q = T ? T(p[i], p[i + 1]) : [p[i], p[i + 1]];
      if (T0) q = T0(q[0], q[1]);
      o[i] = q[0];
      o[i + 1] = q[1];
    }
    return o;
  };
  const api: Sketch = {
    rnd,
    parts,
    tf(fn) {
      T = fn || null;
      return api;
    },
    lift(fn) {
      T0 = fn || null;
      return api;
    },
    part(n) {
      cur = parts[n] || (parts[n] = []);
      return api;
    },
    line(pts, o = {}) {
      cur.push({
        k: 's',
        passes: pencil(dens(tf(pts), o.step), rnd, o.jit ?? 0.8, o.passes ?? 2),
        w: o.w ?? 1.1,
        a: o.a ?? 0.85,
        c: o.c || 'ink',
      });
      return api;
    },
    fill(pts, c = 'fill', a = 1, r = 4) {
      cur.push({ k: 'f', pts: tf(soft(pts, r)), c, a });
      return api;
    },
    segs(arr, o = {}) {
      cur.push({ k: 'g', arr: tf(arr), w: o.w ?? 0.8, a: o.a ?? 0.4, c: o.c || 'ink' });
      return api;
    },
    ell(cx, cy, rx, ry, o = {}) {
      return api.line(circ(cx, cy, rx, ry, o.a0 ?? 0, o.a1 ?? 6.5, o.da ?? 0.22), o);
    },
    dot(cx, cy, r, c = 'ink', a = 0.9) {
      return api.fill(circ(cx, cy, r, r, 0, 6.283, 0.7), c, a);
    },
    rect(x, y, w, h, o) {
      const q = soft(box(x, y, w, h), 4);
      return api.line(q.concat([q[0], q[1]]), o);
    },
    poly(pts, o = {}) {
      pts = soft(pts, o.r ?? 4);
      if (o.fill) api.fill(pts, o.fill, o.fa ?? 1, 0);
      return api.line(pts.concat([pts[0], pts[1]]), o);
    },
    text(str, x, y, size, o = {}) {
      let q = T ? T(x, y) : [x, y];
      if (T0) q = T0(q[0], q[1]);
      cur.push({ k: 't', str, x: q[0], y: q[1], size, rot: o.rot || 0, c: o.c || 'ink', a: o.a ?? 0.85 });
      return api;
    },
    /* shading: slanted strokes inside a box */
    hatch(x0, y0, x1, y1, sp, o = {}) {
      const a = [],
        k = o.k ?? 0.7,
        h = y1 - y0;
      for (let x = x0 - h * k; x < x1; x += sp * (0.7 + rnd() * 0.6)) {
        let xa = x,
          ya = y0,
          xb = x + h * k,
          yb = y1;
        if (xa < x0) {
          ya = y0 + (x0 - xa) / k;
          xa = x0;
        }
        if (xb > x1) {
          yb = y1 - (xb - x1) / k;
          xb = x1;
        }
        if (yb - ya > 1.5) a.push(xa, ya, xb, yb);
      }
      return api.segs(a, { w: o.w ?? 0.7, a: o.a ?? 0.28, c: o.c });
    },
    /* a few courses of stone or brick, never all of them */
    bricks(x0, y0, x1, y1, o = {}) {
      const a = [],
        rh = o.rh || 10,
        bw = o.bw || 22;
      for (let y = y0 + rh, r = 0; y <= y1 + 0.1; y += rh, r++)
        for (let x = x0 + (r % 2 ? bw / 2 : 0); x < x1 - 5; x += bw) {
          if (rnd() > (o.d ?? 0.45)) continue;
          const l = Math.min(bw * (0.55 + rnd() * 0.45), x1 - x);
          a.push(x, y, x + l, y + (rnd() - 0.5));
          if (rnd() < 0.55) a.push(x, y, x + (rnd() - 0.5), y - rh);
        }
      return api.segs(a, { w: o.w ?? 0.7, a: o.a ?? 0.3, c: o.c });
    },
    win(x, y, w, h, o = {}) {
      api.fill(box(x, y, w, h), o.c || 'glass', o.fa ?? 0.85);
      api.rect(x, y, w, h, { w: o.w ?? 1.05, jit: 0.4 });
      const m = [],
        nx = o.nx ?? 2,
        ny = o.ny ?? 2;
      for (let i = 1; i < nx; i++) m.push(x + (w * i) / nx, y, x + (w * i) / nx, y + h);
      for (let j = 1; j < ny; j++) m.push(x, y + (h * j) / ny, x + w, y + (h * j) / ny);
      if (m.length) api.segs(m, { w: 0.8, a: 0.65 });
      if (o.sill !== false) api.line([x - 4, y + h + 2.5, x + w + 4, y + h + 2], { w: 1.3, passes: 1, jit: 0.3 });
      return api;
    },
    /* grasses, leaves and a few small flowers along the foot of a wall */
    plants(x0, x1, y = 0, o = {}) {
      const a = [],
        cols = ['gold', 'paper', 'red', 'gold'];
      for (let x = x0; x < x1; x += 4 + rnd() * 8) {
        const h = 4 + rnd() * 9,
          l = (rnd() - 0.5) * 7;
        a.push(x, y + 1, x + l, y - h);
        if (rnd() < 0.35) a.push(x, y + 1, x - l * 0.7, y - h * 0.65);
        if (rnd() < (o.fl ?? 0.25)) api.dot(x + l, y - h - 1, 1.3 + rnd() * 0.9, cols[(rnd() * 4) | 0], 0.95);
      }
      return api.segs(a, { w: 0.8, a: 0.6 });
    },
    shrub(cx, y, r, c = 'wash') {
      api.fill(circ(cx, y - r * 0.8, r * 1.15, r * 0.95, 0, 6.283, 0.5), c, 0.92, 0);
      const sc = [],
        lf = [];
      for (let q = Math.PI * 0.9; q < Math.PI * 2.12; q += 0.26) {
        const k = 1 + 0.14 * Math.sin(q * 7);
        sc.push(cx + Math.cos(q) * r * 1.15 * k, y - r * 0.8 + Math.sin(q) * r * 0.95 * k);
      }
      for (let i = 0; i < r; i++) {
        const x = cx + (rnd() - 0.5) * r * 1.6,
          yy = y - r * 0.3 - rnd() * r;
        lf.push(x, yy, x + 2.5, yy - 2);
      }
      api.line(sc, { w: 1, jit: 0.5, step: 3 });
      return api.segs(lf, { w: 0.8, a: 0.4 });
    },
    bench(x, y, w = 44) {
      api
        .line([x - 2, y - 13, x + w + 2, y - 13.5], { w: 1.7, jit: 0.3 })
        .line([x, y - 26, x + w, y - 26.5], { w: 1.3, jit: 0.3 })
        .line([x, y - 20, x + w, y - 20.5], { w: 0.9, passes: 1, jit: 0.3, a: 0.7 });
      return api.segs(
        [
          x + 3,
          y - 13,
          x + 2,
          y,
          x + w - 3,
          y - 13,
          x + w - 2,
          y,
          x + 3,
          y - 13,
          x + 3,
          y - 27,
          x + w - 3,
          y - 13,
          x + w - 3,
          y - 27,
        ],
        { w: 1.2, a: 0.75 },
      );
    },
    bike(x, y, k = 1) {
      const r = 11 * k,
        X = (v: number) => x + v * k,
        Y = (v: number) => y - v * k;
      api.ell(X(0), Y(11), r, r, { w: 1, jit: 0.3 }).ell(X(36), Y(11), r, r, { w: 1, jit: 0.3 });
      const sp = [];
      for (const c of [0, 36])
        for (let q = 0; q < 3.1; q += 0.52)
          sp.push(X(c) + Math.cos(q) * r, Y(11) + Math.sin(q) * r, X(c) - Math.cos(q) * r, Y(11) - Math.sin(q) * r);
      api.segs(sp, { w: 0.5, a: 0.3 });
      api
        .line([X(0), Y(11), X(11), Y(27), X(27), Y(28), X(17), Y(11), X(0), Y(11)], {
          w: 1.2,
          jit: 0.25,
          passes: 1,
          step: 4,
        })
        .line([X(17), Y(11), X(11), Y(27), X(9.5), Y(32)], { w: 1.1, jit: 0.25, passes: 1 });
      api.line([X(36), Y(11), X(28), Y(31), X(24), Y(33)], { w: 1.2, jit: 0.25, passes: 1 });
      return api.segs([X(5), Y(32.5), X(13), Y(32.5), X(15), Y(11), X(19), Y(11)], { w: 1.8, a: 0.8 });
    },
    /* the trodden bit in front of a door */
    pathTo(x, w, y = 2) {
      api.fill([x - w, y, x + w, y, x + w * 1.7, y + 11, x - w * 1.5, y + 11], 'paper', 0.5, 0);
      api
        .line([x - w, y, x - w * 1.5, y + 11], { w: 0.8, passes: 1, a: 0.45, jit: 0.5 })
        .line([x + w, y, x + w * 1.7, y + 11], { w: 0.8, passes: 1, a: 0.45, jit: 0.5 });
      const st = [];
      for (let i = 0; i < 5; i++) {
        const px = x + (rnd() - 0.5) * w * 1.6,
          py = y + 3 + rnd() * 6;
        st.push(px, py, px + 4 + rnd() * 4, py + (rnd() - 0.5));
      }
      return api.segs(st, { w: 0.8, a: 0.35 });
    },
    /* ---- building blocks: walls with their texture and their shaded side, roofs, chimneys, shuttered windows, doors, fences, trees ---- */
    house(x, w, h, o = {}) {
      const y = o.y || 0,
        l = o.lean || 0;
      api.poly([x, y, x + l, y - h, x + w + l, y - h, x + w, y], { fill: o.c || 'fill', w: 1.5 });
      if (o.tex === 'brick') api.bricks(x + 4, y - h + 6, x + w - 4, y - 4, { rh: 9, bw: 20, d: 0.32, a: 0.28 });
      else if (o.tex === 'stone') api.bricks(x + 4, y - h + 6, x + w - 4, y - 4, { rh: 13, bw: 26, d: 0.45, a: 0.32 });
      else if (o.tex === 'plank') {
        const a = [];
        for (let q = x + 10; q < x + w - 4; q += 13 + rnd() * 5) a.push(q, y - h + 4, q, y - 3);
        api.segs(a, { w: 0.6, a: 0.22 });
      } else if (o.tex === 'timber')
        api.segs(
          [
            x,
            y - h * 0.5,
            x + w,
            y - h * 0.5,
            x + w * 0.33 + l,
            y - h,
            x + w * 0.33,
            y,
            x + w * 0.66 + l,
            y - h,
            x + w * 0.66,
            y,
            x + l,
            y - h,
            x + w * 0.33,
            y - h * 0.5,
            x + w + l,
            y - h,
            x + w * 0.66,
            y - h * 0.5,
          ],
          { w: 1.5, a: 0.6 },
        );
      api.hatch(x + w * 0.74, y - h + 3, x + w - 2, y - 3, 6, { a: 0.2 });
      return api.hatch(x + 3, y - h + 2, x + w - 3, y - h + 9, 4, { a: 0.3, k: 0.4 });
    },
    roofG(x, w, y, rise, o = {}) {
      api.fill([x - 8, y, x + w / 2, y - rise, x + w + 8, y], o.wall || 'fill', 1, 0);
      return api.poly(
        [
          x - 16,
          y + 4,
          x + w / 2,
          y - rise - 8,
          x + w + 16,
          y + 4,
          x + w + 6,
          y + 10,
          x + w / 2,
          y - rise + 8,
          x - 6,
          y + 10,
        ],
        { fill: o.c || 'dark', fa: 0.85, w: 1.45, r: 2 },
      );
    },
    roofH(x, w, y, rise, o = {}) {
      const i = o.inset ?? rise * 0.6;
      api.poly([x - 10, y, x + i, y - rise, x + w - i, y - rise, x + w + 10, y], {
        fill: o.c || 'dark',
        fa: o.fa ?? 0.8,
        w: 1.45,
        r: 2,
      });
      const a = [];
      for (let r = 1; r * 9 < rise; r++) {
        const yy = y - r * 9,
          tt = (r * 9) / rise;
        for (let q = x - 6 + i * tt + (r % 2) * 6; q < x + w + 6 - i * tt - 4; q += 12) a.push(q, yy, q + 2, yy + 7);
      }
      return api.segs(a, { c: 'paper', w: 0.9, a: 0.4 });
    },
    chim(x, y, w, h) {
      api.poly(box(x, y - h, w, h), { fill: 'fill', w: 1.2 });
      api.bricks(x + 1, y - h + 4, x + w - 1, y - 2, { rh: 7, bw: 12, d: 0.6, a: 0.4 });
      return api.poly(box(x - 3, y - h - 6, w + 6, 6), { fill: 'dark', fa: 0.8, w: 1, r: 1.5 });
    },
    winS(x, y, w, h, o = {}) {
      api.win(x, y, w, h, o);
      if (o.sh !== false)
        for (const sx of [x - w * 0.42 - 2, x + w + 2]) {
          api.poly(box(sx, y - 1, w * 0.42, h + 2), { fill: o.shc || 'wash', w: 0.9, passes: 1, r: 1.5 });
          const a = [];
          for (let q = y + 4; q < y + h - 2; q += 4.5) a.push(sx + 2, q, sx + w * 0.42 - 2, q);
          api.segs(a, { w: 0.6, a: 0.5 });
        }
      if (o.box) {
        api.poly([x - 3, y + h + 3, x + w + 3, y + h + 3, x + w + 1, y + h + 10, x - 1, y + h + 10], {
          fill: 'dark',
          fa: 0.7,
          w: 0.9,
          passes: 1,
          r: 1.5,
        });
        api.plants(x, x + w, y + h + 3, { fl: 0.7 });
      }
      return api;
    },
    door(x, w, h, o = {}) {
      const y = o.y || 0,
        p = o.arch
          ? [x, y, x, y - h + w / 2].concat(arc(x + w / 2, y - h + w / 2, w / 2, w / 2, Math.PI, 2 * Math.PI, 8), [
              x + w,
              y,
            ])
          : [x, y, x, y - h, x + w, y - h, x + w, y];
      api.fill(p, o.c || 'dark', o.fa ?? 0.85, 0);
      api.line(p, { w: 1.35 });
      api.segs([x + w * 0.33, y - 3, x + w * 0.33, y - h * 0.8, x + w * 0.66, y - 3, x + w * 0.66, y - h * 0.8], {
        w: 0.7,
        a: 0.4,
      });
      api.dot(x + w * 0.82, y - h * 0.45, 1.8, 'gold', 1);
      return api.poly([x - 5, y, x - 5, y - 5, x + w + 5, y - 5, x + w + 5, y], { fill: 'paper', w: 1, r: 1.5 });
    },
    fence(x0, x1, y, h, o = {}) {
      const a = [];
      for (let q = x0; q <= x1; q += o.sp || 9) a.push(q, y + 1, q + (rnd() - 0.5), y - h - rnd() * 3);
      api.segs(a, { w: 1.5, a: 0.8 });
      return api
        .line([x0 - 2, y - h * 0.35, x1 + 2, y - h * 0.38], { w: 1.1, passes: 1 })
        .line([x0 - 2, y - h * 0.78, x1 + 2, y - h * 0.8], { w: 1.1, passes: 1 });
    },
    tree(x, y, h, kind = 'round', c = 'wash') {
      if (kind === 'pine') {
        api.fill([x, y - h, x - h * 0.3, y - h * 0.1, x + h * 0.3, y - h * 0.1], c, 0.9, 0);
        const z = [x, y + 1, x, y - h];
        for (let j = 0; j < 6; j++) {
          const yy = y - h + j * h * 0.14 + h * 0.1,
            wd = (j + 1) * h * 0.05;
          z.push(x - wd, yy + h * 0.05, x + wd, yy + h * 0.015);
        }
        return api.line(z, { w: 1.1, jit: 0.55 });
      }
      const rx = kind === 'round' ? h * 0.34 : h * 0.13,
        ry = kind === 'round' ? h * 0.3 : h * 0.42,
        cy = y - h + ry;
      api
        .line([x - 1.5, y, x - 1, cy + ry * 0.5], { w: 1.4 })
        .line([x + 2, y, x + 1, cy + ry * 0.5], { w: 1, passes: 1 });
      api.fill(circ(x, cy, rx, ry, 0, 6.283, 0.4), c, 0.9, 0);
      const sc = [];
      for (let a = 0; a < 6.283 * 2.1; a += 0.24) {
        const r = 1 + 0.12 * Math.sin(a * 5.3) + rnd() * 0.06;
        sc.push(x + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r);
      }
      api.line(sc, { w: 0.9, jit: 0.5, passes: 1, a: 0.75, step: 4 });
      return api.hatch(x + rx * 0.2, cy - ry * 0.5, x + rx * 0.8, cy + ry * 0.6, 5, { a: 0.25 });
    },
    hill(x0, x1, y, h, o = {}) {
      const p = [];
      for (let q = x0; q <= x1; q += 12) {
        const tt = (q - x0) / (x1 - x0);
        p.push(q, y - h * Math.pow(Math.sin(Math.PI * tt), 0.7) * (1 + 0.1 * Math.sin(q * 0.05)));
      }
      api.fill([x0, y].concat(p, [x1, y]), o.c || 'wash', o.fa ?? 0.45, 0);
      return api.line(p, { w: 1, jit: 0.9, a: 0.6 });
    },
    lampP(x, y, h) {
      api.line([x - 2, y, x - 1.5, y - h], { w: 1.4 }).line([x + 2, y, x + 1.5, y - h], { w: 1.2 });
      api
        .poly([x - 7, y - h - 22, x + 7, y - h - 22, x + 5, y - h, x - 5, y - h], {
          fill: 'gold',
          fa: 0.85,
          w: 1.1,
          r: 1.5,
        })
        .poly([x - 9, y - h - 22, x, y - h - 31, x + 9, y - h - 22], { fill: 'dark', fa: 0.85, w: 1, r: 1 });
      return api.poly([x - 5, y, x - 4, y - 10, x + 4, y - 10, x + 5, y], { fill: 'dark', fa: 0.8, w: 1, r: 1 });
    },
    barrel(x, y, k = 1) {
      api.poly(
        [
          x - 15 * k,
          y,
          x - 18 * k,
          y - 21 * k,
          x - 15 * k,
          y - 42 * k,
          x + 15 * k,
          y - 42 * k,
          x + 18 * k,
          y - 21 * k,
          x + 15 * k,
          y,
        ],
        { fill: 'wash', w: 1.2 },
      );
      return api.segs(
        [
          x - 17 * k,
          y - 11 * k,
          x + 17 * k,
          y - 11 * k,
          x - 17 * k,
          y - 31 * k,
          x + 17 * k,
          y - 31 * k,
          x - 6 * k,
          y - 41 * k,
          x - 7 * k,
          y - 1,
          x + 6 * k,
          y - 41 * k,
          x + 7 * k,
          y - 1,
        ],
        { w: 0.9, a: 0.55 },
      );
    },
    crate(x, y, w, h, c = 'wash') {
      api.poly(box(x, y - h, w, h), { fill: c, w: 1.15, r: 1.5 });
      return api.segs(
        [x, y - h / 2, x + w, y - h / 2, x + w * 0.33, y - h, x + w * 0.33, y, x + w * 0.66, y - h, x + w * 0.66, y],
        { w: 0.7, a: 0.4 },
      );
    },
    stairs(cx, hw0, y0, n, rise, grow) {
      for (let i = 0; i < n; i++) {
        const hw = hw0 + i * grow,
          y = y0 + i * rise;
        api.poly([cx - hw, y + rise, cx - hw, y, cx + hw, y, cx + hw, y + rise], { fill: 'paper', w: 1.05, r: 1.5 });
        api.hatch(cx - hw + 2, y + rise - 4, cx + hw - 2, y + rise - 1, 6, { a: 0.22, k: 0.5 });
      }
      return api;
    },
    tufts(x0, x1, y, o = {}) {
      const a = [];
      for (let x = x0; x < x1; x += (o.sp ?? 26) * (0.5 + rnd()))
        for (let k = 0; k < 3; k++)
          a.push(x + k * 2.2, y, x + k * 2.2 + (rnd() - 0.5) * 6, y - (o.h ?? 6) - rnd() * (o.h ?? 6));
      return api.segs(a, { w: 0.9, a: o.a ?? 0.5 });
    },
  };
  return api;
}
export function paintOp(g: G, op: SkOp, pal: Pal, frac?: number, warp?: Warp | null): void {
  const W = warp || null;
  if (op.k === 'f') {
    g.globalAlpha = op.a * pen.ga * (frac === undefined ? 1 : frac);
    g.fillStyle = pal[op.c];
    const p = op.pts;
    g.beginPath();
    for (let i = 0; i < p.length; i += 2) {
      const q = W ? W(p[i], p[i + 1]) : null;
      const x = q ? q[0] : p[i],
        y = q ? q[1] : p[i + 1];
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    g.fill();
  } else if (op.k === 'g') {
    g.globalAlpha = op.a * pen.ga * (frac === undefined ? 1 : frac);
    g.strokeStyle = pal[op.c];
    g.lineWidth = op.w * pen.lw;
    const a = op.arr;
    g.beginPath();
    for (let i = 0; i < a.length; i += 4) {
      g.moveTo(a[i], a[i + 1]);
      g.lineTo(a[i + 2], a[i + 3]);
    }
    g.stroke();
  } else if (op.k === 't') {
    g.globalAlpha = op.a * pen.ga * (frac === undefined ? 1 : frac);
    g.fillStyle = pal[op.c];
    g.font = `700 ${op.size}px Gaegu, cursive`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.save();
    g.translate(op.x, op.y);
    if (op.rot) g.rotate(op.rot);
    g.fillText(op.str, 0, 0);
    g.restore();
  } else {
    g.strokeStyle = pal[op.c];
    const np = op.passes.length;
    for (let pi = 0; pi < np; pi++) {
      const ps = op.passes[pi],
        a = ps.pts;
      let n = a.length / 2;
      if (frac !== undefined) {
        const f = clamp((frac - pi * 0.15) / (1 - 0.15 * (np - 1)), 0, 1);
        n = Math.floor(n * f);
        if (n < 2) continue;
      }
      g.globalAlpha = op.a * ps.a * pen.ga;
      g.lineWidth = op.w * ps.w * pen.lw;
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const q = W ? W(a[2 * i], a[2 * i + 1]) : null;
        const x = q ? q[0] : a[2 * i],
          y = q ? q[1] : a[2 * i + 1];
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
  }
}
export function paint(g: G, ops: SkOp[] | undefined, pal: Pal, frac?: number, warp?: Warp | null): void {
  if (!ops) return;
  for (const op of ops) paintOp(g, op, pal, frac, warp);
  g.globalAlpha = 1;
}
/* the place drawing itself: one stroke after another, in the order it was made */
export function paintSeq(g: G, ops: SkOp[], pal: Pal, f: number): void {
  const n = ops.length,
    lead = Math.max(14, n * 0.12),
    head = f * (n + lead);
  for (let i = 0; i < n; i++) {
    const fi = (head - i) / lead;
    if (fi <= 0) break;
    paintOp(g, ops[i], pal, fi >= 1 ? undefined : fi);
  }
  g.globalAlpha = 1;
}
