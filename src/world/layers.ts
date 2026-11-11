/**
 * The four parallax layers of landscape (far, mid, near, foreground): the shape of the land along the whole journey
 * and everything pencilled on it. Each layer is a list of strokes; tiles.ts turns stretches of it into cached strips.
 */
import { clamp, fbm, makeNoise, mulberry32, smooth } from '../lib/math';
import { fillOp, segOp, strokeOp } from './draw/pencil';
import { INK, NEARWASH, PAPER, WASH, css, hex, mix, stop, wt } from './palette';
import { S, TILE } from './state';
import { heightFor, inAvoid, placeAt, uToT } from './zones';
import type { G, Layer, LayerDef, Rnd } from './types';

interface ShapeOpts {
  color: string;
  fill?: string;
  closed?: boolean;
  jit?: number;
  passes?: number;
  w?: number;
  alpha?: number;
}
/** short strokes are gathered by stretch of ground, so each stretch is one path in one colour */
interface Bucket {
  segs: number[];
  col: string;
}
function bucket(m: Map<number, Bucket>, key: number, col: string): Bucket {
  let b = m.get(key);
  if (!b) {
    b = { segs: [], col };
    m.set(key, b);
  }
  return b;
}

/* ---------- layers ---------- */
export const DEFS: LayerDef[] = [
  { name: 'far', f: 0.2, top: 0.06, bot: 0.76, wash: 0.26, ink: 0.34, line: 0.95, jit: 0.9, washStops: WASH, seed: 11 },
  { name: 'mid', f: 0.5, top: 0.2, bot: 1, wash: 0.42, ink: 0.6, line: 1.15, jit: 1.1, washStops: WASH, seed: 23 },
  { name: 'near', f: 1, top: 0.48, bot: 1, wash: 0.3, ink: 0.78, line: 1.3, jit: 1.2, washStops: NEARWASH, seed: 37 },
  {
    name: 'fg',
    f: 1.3,
    top: 0.56,
    bot: 1,
    wash: 0,
    ink: 0.7,
    line: 1.2,
    jit: 1,
    washStops: WASH,
    seed: 41,
    nofill: true,
  },
];
export function genLayer(d: LayerDef, night: boolean): Layer {
  const H = S.H,
    f = d.f;
  const W = Math.ceil(S.sMax * f + S.vw + 80);
  const step = 4,
    n = Math.ceil(W / step) + 2;
  const ys = new Float32Array(n),
    Ps = new Float32Array(n);
  const noise = makeNoise(d.seed);
  /* Ps is where you are (shape of the land); Cs is what light it is in. Day stops at the sea's colours,
     the night copy is all night: the two are cross-faded as the dusk comes down. */
  const Cs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = i * step;
    const P = placeAt(uToT(u, f), S.T / f);
    Ps[i] = P;
    Cs[i] = night ? 3 : Math.min(P, 2);
    ys[i] = heightFor(d.name, noise, u, P, H);
  }
  /* the ground is levelled where a place stands (and raised into a sandbank for the ones out at sea) */
  if (d.name === 'near')
    for (const p of S.plats) {
      const i0 = Math.max(0, Math.floor((p.x0 - p.m) / step)),
        i1 = Math.min(n - 1, Math.ceil((p.x1 + p.m) / step));
      for (let i = i0; i <= i1; i++) {
        const u = i * step,
          w = smooth(Math.min((u - (p.x0 - p.m)) / p.m, (p.x1 + p.m - u) / p.m));
        ys[i] += (p.y - ys[i]) * w;
      }
    }
  const plats = d.name === 'near' ? S.plats : [];
  const rnd = mulberry32(d.seed * 977 + Math.round(S.vw) + Math.round(H));
  const idx = (u: number) => clamp(Math.round(u / step), 0, n - 1);
  const L: Layer = {
    d,
    f,
    W,
    n,
    step,
    ys,
    Ps,
    Cs,
    night: !!night,
    from: 0,
    top: d.top * H,
    bot: d.bot * H,
    h: (d.bot - d.top) * H,
    ops: [],
    tiles: new Array<HTMLCanvasElement | null>(Math.ceil(W / TILE)).fill(null),
    tileTop: new Array<number>(Math.ceil(W / TILE)).fill(0),
    yAt: (u) => ys[idx(u)],
    PAt: (u) => Ps[idx(u)],
    CAt: (u) => Cs[idx(u)],
    inkAt: (u, a = 1) => css(stop(INK, Cs[idx(u)]), a),
  };
  const ops = L.ops;

  if (!d.nofill) {
    /* paper + wash fill, with absolute-position gradient stops so tiles never seam */
    ops.push({
      phase: 0,
      x0: 0,
      x1: W,
      draw(g, a, b) {
        const a0 = Math.floor(a / 128) * 128,
          b0 = Math.ceil(b / 128) * 128;
        const grad = g.createLinearGradient(a0, 0, b0, 0);
        for (let u = a0; u <= b0; u += 128) {
          const P = L.CAt(u);
          grad.addColorStop((u - a0) / (b0 - a0), css(mix(stop(PAPER, P), stop(d.washStops, P), d.wash)));
        }
        g.fillStyle = grad;
        tracePoly(L, g, a, b);
        g.fill();
        /* pooled wash along the edge, like watercolour drying */
        const grad2 = g.createLinearGradient(a0, 0, b0, 0);
        for (let u = a0; u <= b0; u += 128) {
          const P = L.CAt(u);
          grad2.addColorStop((u - a0) / (b0 - a0), css(stop(d.washStops, P), P > 2.5 ? 0.32 : 0.22));
        }
        g.fillStyle = grad2;
        g.beginPath();
        const i0 = clamp(Math.floor(a / step) - 1, 0, n - 1),
          i1 = clamp(Math.ceil(b / step) + 1, 0, n - 1);
        g.moveTo(i0 * step, ys[i0]);
        for (let i = i0; i <= i1; i++) g.lineTo(i * step, ys[i] + 1);
        for (let i = i1; i >= i0; i--) g.lineTo(i * step, ys[i] + H * 0.018 + Math.sin(i * 0.3) * 1.5);
        g.closePath();
        g.fill();
      },
    });
    /* soft blotches inside */
    for (let u = 0; u < W; u += 90 + rnd() * 200) {
      const P = L.CAt(u),
        y = L.yAt(u) + 20 + rnd() * (L.bot - L.yAt(u)) * 0.6,
        rx = 40 + rnd() * 110,
        ry = 10 + rnd() * 26;
      const col = css(stop(d.washStops, P), 0.07 + rnd() * 0.08);
      ops.push({
        phase: 1,
        x0: u - rx,
        x1: u + rx,
        draw(g) {
          g.fillStyle = col;
          g.beginPath();
          g.ellipse(u, y, rx, ry, 0, 0, 6.283);
          g.fill();
        },
      });
    }
  }

  /* outline: chunks of overlapping pencil strokes */
  if (!d.nofill) {
    let i = 0;
    while (i < n - 3) {
      const len = 14 + Math.floor(rnd() * 34),
        j = Math.min(n - 1, i + len * 2);
      const pts = [];
      for (let k = i; k <= j; k += 2) pts.push(k * step, ys[k] + (rnd() - 0.5) * 0.4);
      if (pts.length >= 4) {
        const um = ((i + j) / 2) * step;
        const op = strokeOp(pts, rnd, {
          jit: d.jit,
          passes: 2 + (rnd() < 0.4 ? 1 : 0),
          w: d.line,
          color: L.inkAt(um),
          alpha: d.ink,
        });
        ops.push(op);
        if (!night && (d.name === 'mid' || d.name === 'far') && op.x0 < S.vw + 30)
          S.introStrokes.push({ op, far: d.name === 'far' });
      }
      i = j - 2 - Math.floor(rnd() * 4);
    }
  }

  /* long soft shade on the ground from every place, falling toward you */
  for (const p of plats) {
    if (!p.sh) continue;
    const dp = H * 0.1;
    ops.push({
      phase: 1,
      x0: p.x0 - 140,
      x1: p.x1 + 60,
      draw(g) {
        const rx = (p.x1 - p.x0) * 0.56,
          ry = dp * 0.62;
        g.save();
        g.translate((p.x0 + p.x1) / 2 - 50, p.y + ry * 0.45);
        g.scale(1, ry / rx);
        const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
        gr.addColorStop(0, 'rgba(44,48,82,.2)');
        gr.addColorStop(0.6, 'rgba(44,48,82,.09)');
        gr.addColorStop(1, 'rgba(44,48,82,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(0, 0, rx, 0, 6.283);
        g.fill();
        g.restore();
      },
    });
  }
  if (d.name === 'far' || d.name === 'mid') mountainDetail(L, rnd);
  if (d.name === 'mid') waterDetail(L, rnd);
  if (d.name === 'far' && !night) sunFeature();
  if (d.name === 'near') nearFeatures(L, rnd);
  if (d.name === 'fg') fgFeatures(L, rnd);
  if (d.name === 'far' || d.name === 'mid') mistColumns(L);
  if (d.name === 'mid' || d.name === 'near') smudges(L, rnd);
  return L;
}

export function tracePoly(L: Layer, g: G, a: number, b: number): void {
  const step = L.step,
    n = L.n;
  const i0 = clamp(Math.floor(a / step) - 1, 0, n - 1),
    i1 = clamp(Math.ceil(b / step) + 1, 0, n - 1);
  g.beginPath();
  g.moveTo(i0 * step, L.bot + 4);
  for (let i = i0; i <= i1; i++) g.lineTo(i * step, L.ys[i]);
  g.lineTo(i1 * step, L.bot + 4);
  g.closePath();
}

function mountainDetail(L: Layer, rnd: Rnd): void {
  const { ys, Ps, step, n, d } = L,
    H = S.H;
  /* hatching on slopes that face away from the light */
  let segs: number[] = [],
    start = 0,
    lastCol = '';
  const flush = (u: number) => {
    if (segs.length) L.ops.push(segOp(segs, lastCol, d.name === 'far' ? 0.2 : 0.34, 0.8, 1));
    segs = [];
    start = u;
  };
  for (let i = 0; i < n - 1; i++) {
    const u = i * step,
      P = Ps[i],
      wm = wt(P, 0) + wt(P, 1) * 0.25;
    if (u - start > 300) flush(u);
    if (wm < 0.3) continue;
    const slope = (ys[i + 1] - ys[i]) / step;
    if (slope > 0.2 && i % 2 === 0 && rnd() < 0.7 * wm) {
      const far = d.name === 'far',
        k = slope * 1.5 + 0.5,
        nrm = Math.hypot(1, k);
      const len = (5 + rnd() * 10) * (far ? 0.7 : 1) * Math.min(1.6, 0.7 + slope);
      const x = u + rnd() * 2,
        y = ys[i] + 2 + rnd() * 3;
      segs.push(x, y, x + len / nrm, y + (len * k) / nrm);
      if (slope > 0.45 && rnd() < 0.45) {
        const y2 = y + 7 + rnd() * 6,
          l2 = len * 0.55;
        segs.push(x + 2, y2, x + 2 + l2 / nrm, y2 + (l2 * k) / nrm);
      }
      lastCol = css(stop(INK, L.Cs[i]));
    }
  }
  flush(0);
  /* contour lines: the topographic part */
  if (d.name === 'mid') {
    const base = H * 0.76;
    for (let k = 1; k <= 4; k++) {
      let pts: number[] = [];
      const emit = () => {
        if (pts.length >= 8) {
          const um = pts[(pts.length / 2) | 0];
          L.ops.push(strokeOp(pts, rnd, { phase: 1, jit: 0.6, passes: 1, w: 0.85, color: L.inkAt(um), alpha: 0.22 }));
        }
        pts = [];
      };
      for (let i = 0; i < n; i += 2) {
        const P = Ps[i],
          wm = wt(P, 0);
        if (wm < 0.35 || pts.length > 160) {
          emit();
          if (wm < 0.35) continue;
        }
        const y = ys[i] + (base - ys[i]) * k * 0.17 + Math.sin(i * 0.05 + k) * 2;
        pts.push(i * step, y);
      }
      emit();
    }
  }
}

function waterDetail(L: Layer, rnd: Rnd): void {
  const H = S.H,
    horizon = H * 0.612;
  const buckets = new Map<number, Bucket>();
  for (let y = horizon + 4; y < L.bot; y += 3 + (y - horizon) * 0.07) {
    const depth = (y - horizon) / (H - horizon);
    for (let u = rnd() * 80; u < L.W; u += 40 + rnd() * 160 * (1 - depth * 0.5)) {
      const P = L.PAt(u);
      if (wt(P, 2) + wt(P, 3) < 0.55) continue;
      const len = 8 + depth * 60 + rnd() * 34;
      const key = Math.floor(u / 300);

      const yy = y + (rnd() - 0.5) * 2;
      bucket(buckets, key, L.inkAt(u)).segs.push(u, yy, u + len, yy + (rnd() - 0.5) * 1.2);
    }
  }
  buckets.forEach((b) => L.ops.push(segOp(b.segs, b.col, 0.26, 0.8, 1)));
  if (L.night) return;
  /* the sun's path on the sea (drawn under wherever the sun is) */
  const r2 = mulberry32(611),
    segs = [];
  for (let y = horizon + 3; y < H * 0.9; y += 4 + (y - horizon) * 0.05) {
    const spread = 18 + (y - horizon) * 0.25,
      cnt = 2 + ((r2() * 3) | 0);
    for (let c = 0; c < cnt; c++) {
      const x = (r2() - 0.5) * spread * 2;
      segs.push(x, y, x + 6 + r2() * 22, y);
    }
  }
  S.refl = { segs: Float32Array.from(segs) };
}

function sunFeature(): void {
  const r = Math.max(26, S.H * 0.062),
    pts = [],
    rr = mulberry32(57);
  for (let a = 0; a <= 6.4; a += 0.12) pts.push(Math.cos(a) * r, Math.sin(a) * r);
  S.sun = { r, op: strokeOp(pts, rr, { jit: 0.8, passes: 2, w: 1.1, color: css(INK[2]), alpha: 0.55 }) };
}

function mistColumns(L: Layer): void {
  const H = S.H,
    d = L.d;
  const y0 = d.name === 'far' ? H * 0.44 : H * 0.55,
    y1 = d.name === 'far' ? H * 0.62 : H * 0.74;
  L.ops.push({
    phase: 3,
    x0: 0,
    x1: L.W,
    draw(g, a, b) {
      for (let u = Math.floor(a / 24) * 24; u < b; u += 24) {
        const P = L.PAt(u + 12),
          m = (wt(P, 0) + wt(P, 1) * 0.35) * 0.88;
        if (m < 0.02) continue;
        const pc = stop(PAPER, L.CAt(u + 12));
        const gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, css(pc, 0));
        gr.addColorStop(0.7, css(pc, m * 0.8));
        gr.addColorStop(1, css(pc, m));
        g.fillStyle = gr;
        g.fillRect(u, y0, 24, (d.name === 'far' ? L.bot : y1 + 60) - y0);
      }
    },
  });
}

function smudges(L: Layer, rnd: Rnd): void {
  for (let u = 200 + rnd() * 500; u < L.W; u += 500 + rnd() * 900) {
    const y = L.yAt(u) + (rnd() - 0.3) * 40,
      r = 24 + rnd() * 40,
      pc = stop(PAPER, L.CAt(u));
    L.ops.push({
      phase: 3,
      x0: u - r,
      x1: u + r,
      draw(g) {
        const gr = g.createRadialGradient(u, y, 2, u, y, r);
        gr.addColorStop(0, css(pc, 0.45));
        gr.addColorStop(1, css(pc, 0));
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(u, y, r * 1.5, r * 0.7, -0.2, 0, 6.283);
        g.fill();
      },
    });
  }
}

/* --- things standing in the landscape (near layer, f = 1, so u = track x) --- */
function shape(L: Layer, rnd: Rnd, pts: number[], o: ShapeOpts): void {
  if (o.fill) L.ops.push(fillOp(pts, o.fill, 2));
  const p = o.closed ? pts.concat([pts[0], pts[1]]) : pts;
  L.ops.push(
    strokeOp(p, rnd, {
      jit: o.jit ?? 0.8,
      passes: o.passes ?? 2,
      w: o.w ?? 1.2,
      color: o.color,
      alpha: o.alpha ?? 0.8,
    }),
  );
}
function nearFeatures(L: Layer, rnd: Rnd): void {
  const H = S.H,
    B = S.B,
    END = S.END;
  const ink = (u: number) => L.inkAt(u);
  const fillAt = (u: number, k: number) => css(mix(stop(PAPER, L.CAt(u)), stop(NEARWASH, L.CAt(u)), k));
  /* ground texture */
  const tex = new Map<number, Bucket>();
  for (let u = 0; u < L.W; u += 6 + rnd() * 30) {
    const P = L.PAt(u),
      y = L.yAt(u);
    const key = Math.floor(u / 300);
    const s = bucket(tex, key, ink(u)).segs;
    if (wt(P, 1) > 0.5) {
      if (rnd() < 0.5) {
        const h = 3 + rnd() * 7;
        s.push(u, y + 1, u + (rnd() - 0.5) * 4, y - h);
      }
      if (rnd() < 0.18) {
        const yy = y + 8 + rnd() * (H - y) * 0.8;
        s.push(u, yy, u + 40 + rnd() * 140, yy + (rnd() - 0.5) * 2);
      }
    } else if (wt(P, 0) > 0.5) {
      if (rnd() < 0.3) {
        const slope = (L.yAt(u + 4) - y) / 4;
        if (slope > 0.12) {
          const Lh = 4 + rnd() * 8,
            k = slope * 1.5 + 0.4;
          s.push(u, y + 2, u + Lh, y + 2 + Lh * k);
        }
      }
    } else if (wt(P, 3) > 0.5) {
      if (rnd() < 0.25) {
        const yy = y + 6 + rnd() * (H - y) * 0.7;
        s.push(u, yy, u + 10 + rnd() * 30, yy + (rnd() - 0.5));
      }
    }
  }
  tex.forEach((b) => L.ops.push(segOp(b.segs, b.col, 0.32, 0.8, 1)));

  /* pines and rocks in the foothills */
  for (let u = 60; u < B[1] - 80; u += 70 + rnd() * 260) {
    if (wt(L.PAt(u), 0) < 0.7 || inAvoid(u, 26)) continue;
    if (rnd() < 0.65) {
      const y = L.yAt(u) + 4,
        h = 24 + rnd() * 38,
        col = ink(u);
      L.ops.push(fillOp([u, y - h, u - h * 0.32, y - h * 0.12, u + h * 0.32, y - h * 0.12], fillAt(u, 0.75), 2));
      const z = [u, y];
      z.push(u, y - h);
      for (let j = 0; j < 5; j++) {
        const yy = y - h + j * h * 0.17 + h * 0.1,
          wd = (j + 1) * h * 0.065;
        z.push(u - wd, yy + h * 0.06, u + wd, yy + h * 0.02);
      }
      shape(L, rnd, z, { color: col, jit: 0.5, w: 1.05, passes: 2 });
    } else {
      const y = L.yAt(u) + 2,
        r = 6 + rnd() * 12,
        pts = [];
      for (let a = Math.PI; a <= Math.PI * 2.05; a += 0.25) pts.push(u + Math.cos(a) * r * 1.4, y + Math.sin(a) * r);
      shape(L, rnd, pts, { color: ink(u), fill: fillAt(u, 0.5), jit: 0.5, w: 1.1 });
    }
  }

  /* steppe: a yurt and a lone tree where the places leave room, and the telephone line that joins the three work places
     (wide only: on a phone the places scroll straight over this ground) */
  S.yurt = null;
  if (S.wide) {
    if (S.yurtX !== null) {
      const u = S.yurtX,
        z = 1.3,
        y = L.yAt(u) + 2,
        col = ink(u),
        fc = fillAt(u, 0.18);
      const dome = [];
      for (let a = 0; a <= 1.0001; a += 0.05)
        dome.push(u + (-40 + 80 * a) * z, y - (30 + 28 * Math.pow(Math.sin(Math.PI * a), 0.8)) * z);
      L.ops.push(
        fillOp(
          [u - 36 * z, y, u - 36 * z, y - 30 * z].concat(dome).concat([u + 36 * z, y - 30 * z, u + 36 * z, y]),
          fc,
          2,
        ),
      );
      shape(L, rnd, [u - 36 * z, y, u - 36 * z, y - 30 * z, u + 36 * z, y - 30 * z, u + 36 * z, y], {
        color: col,
        w: 1.2,
      });
      shape(L, rnd, dome, { color: col, w: 1.3 });
      shape(L, rnd, [u - 7 * z, y, u - 7 * z, y - 20 * z, u + 7 * z, y - 20 * z, u + 7 * z, y], {
        color: col,
        w: 1.1,
        fill: fillAt(u, 0.7),
      });
      const lat = [];
      for (let k = -32; k < 30; k += 8) {
        if (k > -12 && k < 8) continue;
        lat.push(u + k * z, y - 2 * z, u + (k + 7) * z, y - 27 * z, u + (k + 7) * z, y - 2 * z, u + k * z, y - 27 * z);
      }
      L.ops.push(segOp(lat, col, 0.38, 0.8, 2));
      const ribs = [];
      for (let k = -3; k <= 3; k++) ribs.push(u, y - 57 * z, u + k * 12 * z, y - 31 * z);
      L.ops.push(segOp(ribs, col, 0.3, 0.8, 2));
      S.yurt = { x: u + 1, y: y - 58 * z };
    }
    if (S.treeX !== null) {
      const u = S.treeX,
        y = L.yAt(u) + 2,
        col = ink(u);
      shape(L, rnd, [u - 3, y, u - 2, y - 24, u - 1, y - 44], { color: col, w: 1.4, passes: 2 });
      shape(L, rnd, [u + 4, y, u + 2, y - 26, u + 1, y - 44], { color: col, w: 1.2, passes: 1 });
      shape(L, rnd, [u, y - 30, u + 14, y - 46], { color: col, w: 1, passes: 1 });
      const cx = u,
        cy = y - 66;
      L.ops.push({
        phase: 2,
        x0: cx - 50,
        x1: cx + 50,
        draw(g) {
          g.fillStyle = fillAt(u, 0.6);
          g.beginPath();
          g.ellipse(cx, cy, 36, 25, 0, 0, 6.283);
          g.fill();
        },
      });
      const sc = [];
      for (let a = 0; a < 6.283 * 3.2; a += 0.22) {
        const r = 25 + 7 * Math.sin(a * 2.3) + rnd() * 4;
        sc.push(cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 0.9);
      }
      L.ops.push(strokeOp(sc, rnd, { jit: 0.6, passes: 1, w: 0.95, color: col, alpha: 0.7 }));
      const sh = [];
      for (let k = 0; k < 9; k++) {
        const yy = y + 3 + k * 2.2;
        sh.push(u - 30 + k * 2, yy, u + 44 - k * 3, yy);
      }
      L.ops.push(segOp(sh, col, 0.25, 0.8, 2));
    }
    /* poplars along a road */
    if (S.popX !== null) {
      const u0 = S.popX,
        col = ink(u0),
        rd = [];
      for (let k = -4; k <= 4; k++) {
        const x = u0 + k * 26,
          y = L.yAt(x) + 22;
        rd.push(x - 10, y, x + 8, y + (rnd() - 0.5));
      }
      L.ops.push(segOp(rd, col, 0.35, 0.9, 2));
      for (let k = 0; k < 6; k++) {
        const u = u0 - 100 + k * 40,
          y = L.yAt(u) + 3,
          h = H * (0.17 + 0.05 * Math.sin(k * 2.1)),
          rx = h * 0.11,
          cy = y - h * 0.56,
          fc = fillAt(u, 0.62);
        shape(L, rnd, [u, y, u + 0.5, y - h * 0.3], { color: col, w: 1.4, passes: 2 });
        L.ops.push({
          phase: 2,
          x0: u - rx - 2,
          x1: u + rx + 2,
          draw(g) {
            g.fillStyle = fc;
            g.beginPath();
            g.ellipse(u, cy, rx, h * 0.44, 0, 0, 6.283);
            g.fill();
          },
        });
        const sc = [];
        for (let a = 0; a < 6.283 * 2.2; a += 0.25) {
          const r = 1 + 0.14 * Math.sin(a * 4.7) + rnd() * 0.06;
          sc.push(u + Math.cos(a) * rx * r, cy + Math.sin(a) * h * 0.44 * r);
        }
        L.ops.push(strokeOp(sc, rnd, { jit: 0.5, passes: 1, w: 0.95, color: col, alpha: 0.7 }));
      }
    }
    /* a bridge, and the stream it crosses */
    if (S.bridgeX !== null) {
      const u = S.bridgeX,
        y = L.yAt(u) + 4,
        col = ink(u),
        wc = css(mix(stop(PAPER, L.CAt(u)), hex('#8EA7C2'), 0.55));
      L.ops.push({
        phase: 2,
        x0: u - 60,
        x1: u + 60,
        draw(g) {
          g.fillStyle = wc;
          g.beginPath();
          g.moveTo(u - 16, y - 2);
          g.bezierCurveTo(u - 10, y + H * 0.06, u - 44, y + H * 0.1, u - 30, y + H * 0.2);
          g.lineTo(u + 44, y + H * 0.2);
          g.bezierCurveTo(u + 20, y + H * 0.1, u + 26, y + H * 0.06, u + 16, y - 2);
          g.closePath();
          g.fill();
        },
      });
      const wl = [];
      for (let k = 0; k < 9; k++) {
        const yy = y + 8 + k * H * 0.02,
          xx = u - 14 + Math.sin(k * 1.3) * 12 - k * 1.5;
        wl.push(xx, yy, xx + 12 + k * 2, yy + (rnd() - 0.5));
      }
      L.ops.push(segOp(wl, col, 0.4, 0.8, 2));
      const ar = [],
        dk = [];
      for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += 0.2) {
        ar.push(u + Math.cos(a) * 30, y + Math.sin(a) * 15);
        dk.push(u + Math.cos(a) * 46, y - 12 + Math.sin(a) * 9);
      }
      L.ops.push(
        fillOp(
          [u - 46, y - 2].concat(dk, [u + 46, y - 2]).concat(
            ar
              .slice()
              .reverse()
              .reduce((o, v, i, arr) => {
                if (i % 2 === 0) o.push(arr[i + 1], v);
                return o;
              }, [] as number[]),
          ),
          fillAt(u, 0.2),
          2,
        ),
      );
      shape(L, rnd, ar, { color: col, w: 1.3 });
      shape(L, rnd, dk, { color: col, w: 1.3 });
      const rl = dk.map((v, i) => (i % 2 ? v - 11 : v));
      shape(L, rnd, rl, { color: col, w: 1, passes: 1 });
      const ps = [];
      for (let i = 0; i < dk.length; i += 4) ps.push(dk[i], dk[i + 1], dk[i], dk[i + 1] - 11);
      L.ops.push(segOp(ps, col, 0.7, 1, 2));
    }
    /* three sheep */
    if (S.sheepX !== null)
      for (const [dx, z, flip] of [
        [-34, 1, 1],
        [6, 1.25, -1],
        [44, 0.9, 1],
      ]) {
        const u = S.sheepX + dx,
          y = L.yAt(u) + 3,
          col = ink(u),
          wool = css(mix(stop(PAPER, L.CAt(u)), [255, 254, 248], 0.7));
        L.ops.push(
          segOp(
            [
              u - 6 * z,
              y - 7 * z,
              u - 6 * z,
              y,
              u - 2 * z,
              y - 7 * z,
              u - 2 * z,
              y,
              u + 3 * z,
              y - 7 * z,
              u + 3 * z,
              y,
              u + 7 * z,
              y - 7 * z,
              u + 7 * z,
              y,
            ],
            col,
            0.8,
            1.2,
            2,
          ),
        );
        L.ops.push({
          phase: 2,
          x0: u - 16 * z,
          x1: u + 16 * z,
          draw(g) {
            g.fillStyle = wool;
            g.beginPath();
            g.ellipse(u, y - 12 * z, 12 * z, 8 * z, 0, 0, 6.283);
            g.fill();
          },
        });
        const sc = [];
        for (let a = 0; a < 6.283 * 1.1; a += 0.3) {
          const r = 1 + 0.14 * Math.sin(a * 7);
          sc.push(u + Math.cos(a) * 12 * z * r, y - 12 * z + Math.sin(a) * 8 * z * r);
        }
        L.ops.push(strokeOp(sc, rnd, { jit: 0.5, passes: 2, w: 1, color: col, alpha: 0.8 }));
        const hx = u + flip * 12 * z,
          hy = y - 15 * z;
        L.ops.push({
          phase: 2,
          x0: hx - 6 * z,
          x1: hx + 6 * z,
          draw(g) {
            g.fillStyle = col;
            g.globalAlpha = 0.85;
            g.beginPath();
            g.ellipse(hx, hy, 4.2 * z, 5 * z, flip * 0.4, 0, 6.283);
            g.fill();
            g.globalAlpha = 1;
            g.fillStyle = wool;
            g.beginPath();
            g.arc(hx + flip * 1.2 * z, hy - 1 * z, 0.9 * z, 0, 6.283);
            g.fill();
          },
        });
      }
    for (const pts of S.lines) {
      for (let k = 1; k < pts.length - 1; k++) {
        const [u, top, y] = pts[k],
          col = ink(u);
        shape(L, rnd, [u, y, u + 1, top - 8], { color: col, w: 1.5, passes: 2 });
        shape(L, rnd, [u - 13, top, u + 13, top - 1], { color: col, w: 1.2, passes: 2 });
      }
      for (let k = 0; k < pts.length - 1; k++)
        for (const dx of [-9, 9]) {
          const a = pts[k],
            b = pts[k + 1],
            w = [],
            sag = Math.min(34, Math.abs(b[0] - a[0]) * 0.08),
            ea = k ? dx : dx * 0.3,
            eb = k < pts.length - 2 ? dx : dx * 0.3;
          for (let q = 0; q <= 22; q++) {
            const t = q / 22;
            w.push(a[0] + ea + (b[0] + eb - a[0] - ea) * t, a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * sag);
          }
          L.ops.push(strokeOp(w, rnd, { jit: 0.3, passes: 1, w: 0.85, color: ink((a[0] + b[0]) / 2), alpha: 0.5 }));
        }
    }
  }

  /* night beach: grass, a driftwood log */
  for (let u = B[3] + 60; u < END; u += 80 + rnd() * 240) {
    if (wt(L.PAt(u), 3) < 0.7) continue;
    const y = L.yAt(u) + 3,
      col = ink(u),
      segs = [];
    const cnt = 4 + ((rnd() * 5) | 0);
    for (let k = 0; k < cnt; k++) {
      const h = 12 + rnd() * 26,
        lean = (rnd() - 0.5) * 18;
      segs.push(u + k * 2, y, u + k * 2 + lean, y - h);
    }
    L.ops.push(segOp(segs, col, 0.7, 1, 2));
  }
  {
    const fx0 = S.fireT ?? B[3] + (END - B[3]) * 0.28 + 190,
      u = fx0 - 190,
      y = L.yAt(u) + 6,
      col = ink(u);
    shape(L, rnd, [u, y, u + 30, y - 6, u + 90, y - 4, u + 120, y - 9], { color: col, w: 1.3 });
    shape(L, rnd, [u + 4, y + 5, u + 60, y + 2, u + 118, y - 1], { color: col, w: 1.1 });
    const fx = fx0,
      fy = L.yAt(fx) + 5;
    S.fire = { x: fx, y: fy };
    L.ops.push(
      segOp(
        [fx - 13, fy + 2, fx + 9, fy - 5, fx + 13, fy + 2, fx - 9, fy - 5, fx - 15, fy + 3, fx + 15, fy + 2],
        col,
        0.8,
        1.3,
        2,
      ),
    );
    for (const dx of [-21, -12, 12, 21]) {
      const st = [];
      for (let a = 3.1; a <= 6.3; a += 0.35) st.push(fx + dx + Math.cos(a) * 4.5, fy + 4 + Math.sin(a) * 3);
      shape(L, rnd, st, { color: col, w: 1, passes: 1, jit: 0.4 });
    }
  }
}

/* a pine, in a few pencil goes: a pale wash, the trunk, then the branches zig-zagging down */
function pine(L: Layer, rnd: Rnd, u: number, y: number, h: number, fill: string, col: string, w?: number): void {
  L.ops.push(fillOp([u, y - h, u - h * 0.34, y - h * 0.1, u + h * 0.34, y - h * 0.1], fill, 2));
  const z = [u, y + 2, u, y - h];
  const tiers = h > 60 ? 7 : 5;
  for (let j = 0; j < tiers; j++) {
    const yy = y - h + j * h * (0.85 / tiers) + h * 0.1,
      wd = (j + 1) * h * (0.33 / tiers);
    z.push(u - wd, yy + h * 0.05, u + wd * (0.8 + rnd() * 0.3), yy + h * 0.015);
  }
  shape(L, rnd, z, { color: col, jit: 0.55, w: w || 1.1, passes: 2 });
}
/* the first screen: a near ridge with pines, and a path going over it into the mountains */
function heroHill(L: Layer): void {
  const H = S.H,
    vw = S.vw,
    rnd = mulberry32(4242),
    noise = makeNoise(4243),
    wide = S.wide;
  const ink = css(INK[0]),
    wash = css(mix(PAPER[0], WASH[0], wide ? 0.5 : 0.4)),
    deep = css(mix(PAPER[0], WASH[0], 0.68));
  const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
  const crest = (u: number) => {
    const U = u / vw;
    let y = wide
      ? 0.8 - 0.1 * g(U, 0.06, 0.2) - 0.06 * g(U, 0.95, 0.16)
      : 0.87 - 0.05 * g(U, 0.1, 0.25) - 0.04 * g(U, 0.92, 0.2);
    y += 0.012 * (fbm(noise, u / 120) - 0.5);
    y += smooth((U - 0.98) / 0.42) * 0.3;
    return y * H;
  };
  const end = vw * 1.5,
    pts: number[] = [];
  for (let u = -20; u <= end; u += 6) pts.push(u, crest(u));
  L.ops.push({
    phase: 0,
    x0: -20,
    x1: end,
    draw(g2) {
      const gr = g2.createLinearGradient(0, H * 0.7, 0, H);
      gr.addColorStop(0, wash);
      gr.addColorStop(1, deep);
      g2.fillStyle = gr;
      g2.beginPath();
      g2.moveTo(-20, H + 4);
      for (let i = 0; i < pts.length; i += 2) g2.lineTo(pts[i], pts[i + 1]);
      g2.lineTo(end, H + 4);
      g2.closePath();
      g2.fill();
    },
  });
  for (let i = 0; i < pts.length - 6;) {
    const j = Math.min(pts.length, i + (30 + ((rnd() * 50) | 0)) * 2);
    L.ops.push(
      strokeOp(pts.slice(i, j), rnd, { jit: 1.2, passes: 2 + (rnd() < 0.4 ? 1 : 0), w: 1.35, color: ink, alpha: 0.78 }),
    );
    if (j >= pts.length) break;
    i = j - 8;
  }
  /* hatching on the shaded side of the ridge */
  const hs = [];
  for (let u = 0; u < end; u += 5) {
    const y = crest(u),
      sl = (crest(u + 5) - y) / 5;
    if (sl > 0.05 && rnd() < 0.7) {
      const l = 6 + rnd() * 9;
      hs.push(u, y + 3, u + l * 0.55, y + 3 + l);
    }
  }
  L.ops.push(segOp(hs, ink, 0.3, 0.8, 2));
  /* pines: a dark stand on the left, a few on the right */
  if (wide) {
    const k = H / 900;
    const stands = [
      [0.005, 0.2, 9],
      [0.82, 1.06, 6],
    ];
    for (const [a, b, cnt] of stands)
      for (let q = 0; q < cnt; q++) {
        const u = vw * (a + ((b - a) * (q + rnd() * 0.7)) / cnt),
          y = crest(u) + 4 + rnd() * 10,
          h = (64 + rnd() * 72) * k * (1 - 0.3 * Math.abs(q / cnt - 0.4));
        pine(L, rnd, u, y, h, css(mix(PAPER[0], WASH[0], 0.72)), ink, 1.2);
      }
  }
  /* the path: two pencil lines that narrow as they climb over the ridge */
  const cx = (t: number) => vw * (0.56 + 0.05 * Math.sin(t * 3.4 + 0.6) - 0.025 * t),
    hw = (t: number) => vw * (0.075 * Math.pow(1 - t, 1.35) + 0.004);
  const yAt = (t: number) => H * 1.01 + (crest(cx(1)) + 4 - H * 1.01) * t;
  for (const side of [-1, 1]) {
    const p2 = [];
    for (let t = 0; t <= 1.0001; t += 0.02) p2.push(cx(t) + side * hw(t), yAt(t));
    L.ops.push(strokeOp(p2, rnd, { jit: 0.8, passes: 2, w: 1.05, color: ink, alpha: 0.6 }));
  }
  const stones = [];
  for (let t = 0.05; t < 0.9; t += 0.07 + rnd() * 0.08) {
    const side = rnd() < 0.5 ? -1 : 1,
      x = cx(t) + side * (hw(t) + 4 + rnd() * 8),
      y = yAt(t),
      r = (1 - t) * 4 + 1.5;
    for (let a = 3.2; a < 6.2; a += 0.6)
      stones.push(
        x + Math.cos(a) * r * 1.5,
        y + Math.sin(a) * r,
        x + Math.cos(a + 0.6) * r * 1.5,
        y + Math.sin(a + 0.6) * r,
      );
  }
  L.ops.push(segOp(stones, ink, 0.5, 0.9, 2));
}
function fgFeatures(L: Layer, rnd: Rnd): void {
  const H = S.H;
  if (!L.night) heroHill(L);
  const buckets = new Map<number, Bucket>();
  for (let u = 30; u < L.W; u += 50 + rnd() * 190) {
    const P = L.PAt(u);
    if (wt(P, 2) > 0.5) continue;
    const y = H * (0.995 - rnd() * 0.02),
      key = Math.floor(u / 300);
    const s = bucket(buckets, key, L.inkAt(u)).segs,
      cnt = 3 + ((rnd() * 5) | 0);
    for (let k = 0; k < cnt; k++) {
      const h = 10 + rnd() * (wt(P, 3) > 0.5 ? 34 : 22),
        lean = (rnd() - 0.5) * 16;
      s.push(u + k * 2.5, y, u + k * 2.5 + lean, y - h);
    }
    if (rnd() < 0.3) {
      const r = 4 + rnd() * 6;
      for (let a = 3.3; a < 6.1; a += 0.5)
        s.push(
          u + 20 + Math.cos(a) * r * 1.5,
          y + Math.sin(a) * r,
          u + 20 + Math.cos(a + 0.5) * r * 1.5,
          y + Math.sin(a + 0.5) * r,
        );
    }
  }
  buckets.forEach((b) => L.ops.push(segOp(b.segs, b.col, 0.7, 1.1, 2)));
}
