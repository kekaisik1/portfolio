/**
 * Static landscape is drawn once into offscreen strips ("tiles") and only blitted afterwards.
 * Strips near where you stand are made first; the rest are filled in while the browser is idle.
 */
import { ctx2d, newCanvas, whenIdle } from '../lib/dom';
import { rubGrain } from './draw/grain';
import { drawStroke } from './draw/pencil';
import { tracePoly } from './layers';
import { S, TILE } from './state';
import type { G, Layer, LayerOp } from './types';

function drawOp(g: G, o: LayerOp, a: number, b: number): void {
  if (o.kind === 's') drawStroke(g, o);
  else o.draw(g, a, b);
}
/* a spare sheet the strips are copied onto to be looked at (reading a strip itself would make it slow to draw for good) */
const probe = newCanvas();
const probeG = probe.getContext('2d', { willReadFrequently: true });

/** The first row of a strip that has anything drawn on it, in device pixels. */
function firstInkedRow(t: HTMLCanvasElement): number {
  if (!probeG) return 0;
  if (probe.width !== t.width || probe.height < t.height) {
    probe.width = t.width;
    probe.height = t.height;
  }
  probeG.clearRect(0, 0, t.width, t.height);
  probeG.drawImage(t, 0, 0);
  const px = probeG.getImageData(0, 0, t.width, t.height).data;
  for (let i = 3; i < px.length; i += 4) if (px[i]) return Math.floor(i / 4 / t.width);
  return t.height;
}

export function renderTile(L: Layer, i: number): HTMLCanvasElement {
  const ps = S.ps,
    x0 = i * TILE,
    a = x0 - 90,
    b = x0 + TILE + 90;
  const c = newCanvas();
  c.width = Math.ceil(TILE * ps);
  c.height = Math.max(1, Math.ceil(L.h * ps));
  const g = ctx2d(c);
  g.setTransform(ps, 0, 0, ps, -x0 * ps, -L.top * ps);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const ops = L.ops;
  for (let k = 0; k < ops.length; k++) {
    const o = ops[k];
    if (o.phase === 0 && o.x1 >= a && o.x0 <= b) drawOp(g, o, a, b);
  }
  if (!L.d.nofill) {
    g.save();
    tracePoly(L, g, a, b);
    g.clip();
  }
  for (let k = 0; k < ops.length; k++) {
    const o = ops[k];
    if (o.phase === 1 && o.x1 >= a && o.x0 <= b) drawOp(g, o, a, b);
  }
  if (!L.d.nofill) g.restore();
  for (let ph = 2; ph <= 3; ph++)
    for (let k = 0; k < ops.length; k++) {
      const o = ops[k];
      if (o.phase === ph && o.x1 >= a && o.x0 <= b) drawOp(g, o, a, b);
    }
  /* pencil grain: rub a little out of everything */
  rubGrain(g, c, 0.5);
  L.tiles[i] = c;
  L.tileTop[i] = firstInkedRow(c);
  return c;
}
export function drawLayer(c: G, L: Layer, s: number): void {
  const off = s * L.f,
    first = Math.max(0, Math.floor(off / TILE)),
    last = Math.min(L.tiles.length - 1, Math.floor((off + S.vw) / TILE));
  const ox = Math.round(-off * S.dpr) / S.dpr;
  for (let i = first; i <= last; i++) {
    const t = L.tiles[i] || renderTile(L, i);
    /* the empty sky at the top of a strip is not blended at all: only the rows from the first inked one down */
    const r0 = L.tileTop[i];
    if (r0 >= t.height) continue;
    const y0 = (r0 * L.h) / t.height;
    c.drawImage(t, 0, r0, t.width, t.height - r0, ox + i * TILE, L.top + y0, TILE, L.h - y0);
  }
}
function nextTile() {
  let best = null,
    bd = Infinity;
  for (const L of S.layers.concat(S.nlayers)) {
    const cur = (S.s * L.f + S.vw / 2) / TILE;
    for (let i = L.from; i < L.tiles.length; i++) {
      if (L.tiles[i]) continue;
      const dd = Math.abs(i - cur) / Math.max(0.3, L.f);
      if (dd < bd) {
        bd = dd;
        best = { L, i };
      }
    }
  }
  return best;
}
export function schedulePump(): void {
  if (S.pumpId) return;
  const gen = S.gen;
  const run = () => {
    S.pumpId = 0;
    if (gen !== S.gen) return schedulePump();
    const t0 = performance.now();
    while (performance.now() - t0 < 9) {
      const j = nextTile();
      if (!j) return;
      renderTile(j.L, j.i);
    }
    schedulePump();
  };
  S.pumpId = whenIdle(run, 500, 50);
}
