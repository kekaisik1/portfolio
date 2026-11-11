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
  return c;
}
export function drawLayer(c: G, L: Layer, s: number): void {
  const off = s * L.f,
    first = Math.max(0, Math.floor(off / TILE)),
    last = Math.min(L.tiles.length - 1, Math.floor((off + S.vw) / TILE));
  const ox = Math.round(-off * S.dpr) / S.dpr;
  for (let i = first; i <= last; i++) {
    const t = L.tiles[i] || renderTile(L, i);
    c.drawImage(t, ox + i * TILE, L.top, TILE, L.h);
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
