/**
 * Pencil primitives: every line on the page is a few wobbly passes over the same points.
 * Pure functions: points in, strokes out; the only side effect is on the context they are handed.
 */
import { clamp } from '../../lib/math';
import type { DrawOp, G, PencilPass, Rnd, SkOpts, StrokeOp, StrokeOpts } from '../types';

/* ---------- pencil ---------- */
export function pencil(pts: ArrayLike<number>, rnd: Rnd, jit: number, passes: number): PencilPass[] {
  const m = pts.length / 2,
    out: PencilPass[] = [];
  for (let p = 0; p < passes; p++) {
    const ph = rnd() * 6.283,
      ph2 = rnd() * 6.283,
      amp = jit * (0.45 + rnd() * 0.8);
    const dy = (rnd() - 0.5) * jit * 1.7,
      dx = (rnd() - 0.5) * jit * 2,
      fr = 0.07 + rnd() * 0.12;
    const a = new Float32Array(m * 2 + 4);
    const sx = pts[0],
      sy = pts[1],
      ex = pts[2 * m - 2],
      ey = pts[2 * m - 1];
    let ux = pts[2] - sx,
      uy = pts[3] - sy,
      L = Math.hypot(ux, uy) || 1;
    const o1 = (1 + rnd() * 5) * jit;
    a[0] = sx - (ux / L) * o1 + dx;
    a[1] = sy - (uy / L) * o1 + dy;
    for (let i = 0; i < m; i++) {
      a[2 + 2 * i] = pts[2 * i] + dx + Math.sin(i * fr + ph) * amp * 0.6;
      a[3 + 2 * i] = pts[2 * i + 1] + dy + Math.sin(i * fr * 1.7 + ph2) * amp + (rnd() - 0.5) * 0.5 * jit;
    }
    ux = ex - pts[2 * m - 4];
    uy = ey - pts[2 * m - 3];
    L = Math.hypot(ux, uy) || 1;
    const o2 = (1 + rnd() * 6) * jit;
    a[2 * m + 2] = ex + (ux / L) * o2 + dx;
    a[2 * m + 3] = ey + (uy / L) * o2 + dy;
    out.push({ pts: a, a: 0.55 + rnd() * 0.45, w: 0.75 + rnd() * 0.5 });
  }
  return out;
}
export function strokeOp(pts: ArrayLike<number>, rnd: Rnd, o: StrokeOpts): StrokeOp {
  let x0 = Infinity,
    x1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    if (pts[i] < x0) x0 = pts[i];
    if (pts[i] > x1) x1 = pts[i];
  }
  return {
    phase: o.phase ?? 2,
    x0: x0 - 12,
    x1: x1 + 12,
    kind: 's',
    passes: pencil(pts, rnd, o.jit ?? 1, o.passes ?? 2),
    w: o.w ?? 1.2,
    color: o.color,
    alpha: o.alpha ?? 0.7,
  };
}
export function drawStroke(g: G, op: StrokeOp, frac?: number): void {
  g.strokeStyle = op.color;
  for (let pi = 0; pi < op.passes.length; pi++) {
    const ps = op.passes[pi],
      a = ps.pts;
    let n = a.length / 2;
    if (frac !== undefined) {
      const f = clamp((frac - pi * 0.18) / (1 - 0.18 * (op.passes.length - 1) || 1), 0, 1);
      n = Math.floor(n * f);
      if (n < 2) continue;
    }
    g.globalAlpha = op.alpha * ps.a;
    g.lineWidth = op.w * ps.w;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    for (let i = 1; i < n; i++) g.lineTo(a[2 * i], a[2 * i + 1]);
    g.stroke();
  }
  g.globalAlpha = 1;
}
export function segOp(segs: number[], color: string, alpha: number, w: number, phase: number): DrawOp {
  let x0 = Infinity,
    x1 = -Infinity;
  for (let i = 0; i < segs.length; i += 2) {
    if (segs[i] < x0) x0 = segs[i];
    if (segs[i] > x1) x1 = segs[i];
  }
  const arr = Float32Array.from(segs);
  return {
    phase,
    x0: x0 - 4,
    x1: x1 + 4,
    draw(g) {
      g.strokeStyle = color;
      g.globalAlpha = alpha;
      g.lineWidth = w;
      g.beginPath();
      for (let i = 0; i < arr.length; i += 4) {
        g.moveTo(arr[i], arr[i + 1]);
        g.lineTo(arr[i + 2], arr[i + 3]);
      }
      g.stroke();
      g.globalAlpha = 1;
    },
  };
}
export function fillOp(pts: number[], color: string, phase = 2): DrawOp {
  let x0 = Infinity,
    x1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    if (pts[i] < x0) x0 = pts[i];
    if (pts[i] > x1) x1 = pts[i];
  }
  return {
    phase,
    x0,
    x1,
    draw(g) {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.closePath();
      g.fill();
    },
  };
}
export function dens(pts: number[], step?: number): number[] {
  step = step || 5;
  const out = [pts[0], pts[1]];
  for (let i = 2; i < pts.length; i += 2) {
    const x0 = pts[i - 2],
      y0 = pts[i - 1],
      x1 = pts[i],
      y1 = pts[i + 1],
      n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n);
  }
  return out;
}
export const circ = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 6.283, st = 0.25): number[] => {
  const p = [];
  for (let a = a0; a <= a1 + 1e-6; a += st) p.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  return p;
};
export const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): number[] => {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    p.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return p;
};
export const sagLine = (x0: number, y0: number, x1: number, y1: number, sag: number, n = 14): number[] => {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag);
  }
  return p;
};
export const box = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
export const band = (c: number[], hw: number): number[] => {
  const a: number[] = [],
    b: number[] = [];
  for (let i = 0; i < c.length; i += 2) {
    a.push(c[i], c[i + 1] - hw);
    b.unshift(c[i], c[i + 1] + hw);
  }
  return a.concat(b);
};
/* nothing here has a sharp corner: every closed shape gets its corners taken off, like a wooden toy */
export function soft(p: number[], r: number): number[] {
  const n = p.length / 2;
  if (n < 3 || n > 14 || !r) return p;
  const o = [];
  for (let i = 0; i < n; i++) {
    const a = (i + n - 1) % n,
      c = (i + 1) % n,
      bx = p[2 * i],
      by = p[2 * i + 1],
      l1 = Math.hypot(p[2 * a] - bx, p[2 * a + 1] - by),
      l2 = Math.hypot(p[2 * c] - bx, p[2 * c + 1] - by);
    if (l1 < 0.5 || l2 < 0.5) {
      o.push(bx, by);
      continue;
    }
    const d1 = Math.min(r, l1 * 0.3),
      d2 = Math.min(r, l2 * 0.3),
      x1 = bx + ((p[2 * a] - bx) / l1) * d1,
      y1 = by + ((p[2 * a + 1] - by) / l1) * d1,
      x2 = bx + ((p[2 * c] - bx) / l2) * d2,
      y2 = by + ((p[2 * c + 1] - by) / l2) * d2;
    o.push(x1, y1, (x1 + 2 * bx + x2) / 4, (y1 + 2 * by + y2) / 4, x2, y2);
  }
  return o;
}
export function glow(g: G, x: number, y: number, r: number, rgb: string, a: number): void {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
export function beamFill(
  g: G,
  pts: number[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgb: string,
  a: number,
): void {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fill();
}
export function inkLine(g: G, pts: number[], rnd: Rnd, o: SkOpts = {}): void {
  g.strokeStyle = o.c || '#2B2D33';
  for (const ps of pencil(dens(pts, o.step || 9), rnd, o.jit ?? 0.8, o.passes ?? 2)) {
    const a = ps.pts;
    g.globalAlpha = (o.a ?? 0.8) * ps.a;
    g.lineWidth = (o.w ?? 1.1) * ps.w;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    for (let i = 2; i < a.length; i += 2) g.lineTo(a[i], a[i + 1]);
    g.stroke();
  }
  g.globalAlpha = 1;
}
