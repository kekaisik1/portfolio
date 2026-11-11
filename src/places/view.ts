/**
 * How a place gets onto the page. Its strokes are built once (buildParts), painted onto sheets that are kept
 * (back, the place itself, front), and only its small living part is drawn again each frame, on a sheet of its own.
 * The sheets are separate canvases stacked in the button, so walking past slides the back and front ones with a
 * transform instead of repainting them.
 */
import { clamp, smooth } from '../lib/math';
import { ctx2d, newCanvas } from '../lib/dom';
import { rubGrain } from '../world/draw/grain';
import { Sk, paint, paintSeq, pen } from '../world/draw/sketch';
import { S } from '../world/state';
import type { G, Parts, PlaceDef, PlaceObj, View } from '../world/types';

/** narrow: extra sheet below the ground line, for the strip of ground the place brings with it */
export const PADB = 112;

/** Build every stroke of a place: behind it, the place itself, in front of it, its focus ring and its strip of ground. */
export function buildParts(def: PlaceDef, seed: number): Parts {
  const s = Sk(seed);
  /* behind it, the place itself, in front of it: three sheets that part a little as you walk past */
  s.part('bg');
  if (def.pre) def.pre(s);
  s.part('base');
  if (def.under) def.under(s);
  def.build(s);
  s.tf(null).lift(null).part('base');
  if (def.after) def.after(s);
  s.part('fg');
  if (def.post) def.post(s);
  /* a loose pencil loop round the whole place, for whoever comes by keyboard */
  const [hx0, hy0, hx1, hy1] = def.hit,
    cx = (hx0 + hx1) / 2,
    cy = (hy0 + hy1) / 2,
    sy = def.sy || 1,
    rx = (hx1 - hx0) / 2 + 2,
    ry = (hy1 - hy0) / 2 + 2,
    ring: number[] = [];
  for (let a = -2.3; a <= -2.3 + 6.283 * 1.05; a += 0.06) {
    const c = Math.cos(a),
      n = Math.sin(a);
    ring.push(
      cx + Math.sign(c) * Math.pow(Math.abs(c), 0.32) * rx,
      (cy + Math.sign(n) * Math.pow(Math.abs(n), 0.32) * ry) / sy,
    );
  }
  s.part('ring').line(ring, { w: 2.3, c: 'focus', jit: 1.2, a: 0.95, step: 8 });
  const F = def.full;
  /* on a phone the place brings its own strip of ground with it */
  if (def.sea !== 'stilts') {
    const gy = def.sea ? 14 : 2,
      r = s.rnd,
      gs: number[] = [];
    s.tf(null).lift(null);
    s.part('patch').line([F[0] + 14, gy, (F[0] + F[2]) / 2, gy + 1, F[2] - 14, gy], {
      w: 1.2,
      jit: 0.9,
      a: 0.7,
      step: 9,
    });
    for (let k = 0; k < 34; k++) {
      const x = F[0] + 30 + r() * (F[2] - F[0] - 110),
        y = gy + 9 + r() * 84;
      gs.push(x, y, x + 18 + r() * 50, y + (r() - 0.5));
    }
    s.segs(gs, { w: 0.8, a: 0.3 });
    if (!def.sea) {
      s.tufts(F[0] + 20, F[2] - 20, gy, { sp: 40 });
      s.plants(F[0] + 40, F[2] - 40, gy + 30, { fl: 0.12 });
      s.tufts(F[0] + 30, F[2] - 30, gy + 62, { sp: 60, h: 9 });
    }
  }
  return s.parts;
}

/** The canvases a place is drawn on. They start 1x1: paper is only taken out when you come near (see objects.ts). */
export function createView(): View {
  const wrap = document.createElement('span');
  wrap.className = 'obj-art';
  const sheet = (name: string): HTMLCanvasElement => {
    const c = newCanvas();
    c.className = name;
    c.setAttribute('aria-hidden', 'true');
    wrap.append(c);
    return c;
  };
  const bg = sheet('obj-bg'),
    cache = sheet('obj-base'),
    cv = sheet('obj-live'),
    fg = sheet('obj-fg');
  return {
    wrap,
    cv,
    g: ctx2d(cv),
    cache,
    cg: ctx2d(cache),
    bg,
    bgg: ctx2d(bg),
    fg,
    fgg: ctx2d(fg),
    ok: false,
    live: false,
    sc: 1,
    pr: 1,
    back: false,
    fx0: 0,
    fw: 1,
    offBg: 0,
    offFg: 0,
    split: false,
  };
}

/** Local place coordinates -> this view's pixels; sets the line weight to suit the scale. */
export function setT(g: G, o: PlaceObj, V: View): void {
  const k = V.sc * V.pr,
    F = o.def.full;
  g.setTransform(k, 0, 0, k * (o.def.sy || 1), -V.fx0 * k, -F[1] * k);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  pen.lw = clamp(1.28 / V.sc, 0.8, 1.8);
}

/**
 * narrow: the places scroll over the landscape, so each brings a little mist to stand in and a strip of ground to stand on.
 * Only the blurred shadow of each box is drawn (the box itself is kept far off the paper), so there are no edges.
 */
export function backing(g: G, o: PlaceObj, V: View): void {
  const F = o.def.full,
    k = V.sc * V.pr,
    m = 30,
    OFF = 30000,
    w = V.fw;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.shadowOffsetX = OFF;
  g.fillStyle = '#000';
  g.shadowColor = o.pal.back;
  g.shadowBlur = 30 * k;
  g.fillRect(m * k - OFF, m * k, (w - 2 * m) * k, (-F[1] - m + 4) * k);
  if (o.def.sea !== 'stilts') {
    const gy = (o.def.sea ? 14 : 2) - F[1];
    g.beginPath();
    g.rect(0, gy * k, w * k, (PADB + 30) * k);
    g.clip();
    g.shadowColor = o.pal.ground;
    g.shadowBlur = 22 * k;
    g.fillRect(m * k - OFF, (gy - 30) * k, (w - 2 * m) * k, (30 + PADB * 0.5) * k);
    /* and the shade the place throws on it */
    g.shadowColor = 'rgba(46,50,84,.2)';
    g.shadowBlur = 9 * k;
    g.fillRect((m + 26) * k - OFF, (gy - 8) * k, (w - 2 * m - 70) * k, 14 * k);
  }
  g.restore();
}

function wipe(g: G, c: HTMLCanvasElement): void {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.clearRect(0, 0, c.width, c.height);
}

/** Size a kept sheet to the live one (or put it away: 1x1 and hidden). */
function fitSheet(c: HTMLCanvasElement, V: View, use: boolean): void {
  const w = use ? V.cv.width : 1,
    h = use ? V.cv.height : 1;
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  c.hidden = !use;
}

/** Everything about the place that never moves, painted once onto its kept sheets. */
function renderStatic(o: PlaceObj, V: View): void {
  const P = o.parts,
    cg = V.cg,
    split = V.split;
  fitSheet(V.cache, V, true);
  fitSheet(V.bg, V, split);
  fitSheet(V.fg, V, split);
  wipe(cg, V.cache);
  setT(cg, o, V);
  if (V.back) {
    backing(cg, o, V);
    paint(cg, P.patch, o.pal);
  }
  if (split) {
    wipe(V.bgg, V.bg);
    setT(V.bgg, o, V);
    pen.ga = 0.78;
    pen.lw *= 0.9;
    paint(V.bgg, P.bg, o.pal);
    pen.ga = 1;
    rubGrain(V.bgg, V.bg);
    wipe(V.fgg, V.fg);
    setT(V.fgg, o, V);
    paint(V.fgg, P.fg, o.pal);
    rubGrain(V.fgg, V.fg);
    setT(cg, o, V);
  } else {
    pen.ga = 0.78;
    paint(cg, P.bg, o.pal);
    pen.ga = 1;
  }
  if (o.def.refl !== undefined) {
    /* a place over water is drawn once on a spare sheet, laid face down under the waterline, rubbed thin, then set upright on top */
    const tmp = newCanvas(V.cache.width, V.cache.height);
    const tg = ctx2d(tmp),
      k = V.sc * V.pr,
      wy = Math.round((o.def.refl - o.def.full[1]) * k),
      Wd = tmp.width,
      Hd = tmp.height;
    setT(tg, o, V);
    paint(tg, P.base, o.pal);
    cg.setTransform(1, 0, 0, -0.6, 0, wy * 1.6);
    cg.globalAlpha = 0.42;
    cg.drawImage(tmp, 0, 0, Wd, wy, 0, 0, Wd, wy);
    cg.setTransform(1, 0, 0, 1, 0, 0);
    cg.globalAlpha = 1;
    cg.globalCompositeOperation = 'destination-out';
    const fd = cg.createLinearGradient(0, wy, 0, wy + (Hd - wy) * 0.95);
    fd.addColorStop(0, 'rgba(0,0,0,.1)');
    fd.addColorStop(1, 'rgba(0,0,0,1)');
    cg.fillStyle = fd;
    cg.fillRect(0, wy, Wd, Hd - wy);
    cg.fillStyle = 'rgba(0,0,0,.55)';
    for (let y = wy + 5 * k, i = 0; y < Hd; y += (5 + (i % 3) * 2) * k, i++) cg.fillRect(0, y, Wd, 1.4 * k);
    cg.globalCompositeOperation = 'source-over';
    cg.drawImage(tmp, 0, 0);
    tmp.width = tmp.height = 1;
  } else paint(cg, P.base, o.pal);
  if (!split && P.fg) {
    setT(cg, o, V);
    paint(cg, P.fg, o.pal);
  }
  rubGrain(cg, V.cache);
}

/** Slide a sheet sideways by whole device pixels; the style is only written when the offset changes. */
function slide(c: HTMLCanvasElement, px: number, pr: number): void {
  c.style.transform = px ? `translate3d(${px / pr}px,0,0)` : '';
}

/**
 * Draw a place as it is right now. While it is still drawing itself, one stroke after another goes onto the live sheet;
 * after that the kept sheets show and only the living part (and the keyboard ring) is painted each frame.
 */
export function renderView(o: PlaceObj, V: View): void {
  const g = V.g,
    P = o.parts;
  wipe(g, V.cv);
  if (o.drawn < 1) {
    V.cache.hidden = V.bg.hidden = V.fg.hidden = true;
    V.ok = false;
    if (V.back) {
      setT(g, o, V);
      g.globalAlpha = smooth(o.drawn * 3);
      backing(g, o, V);
      g.globalAlpha = 1;
    }
    setT(g, o, V);
    if (!o.seq) o.seq = P.bg.concat(P.base, P.fg || []);
    paintSeq(g, o.seq, o.pal, o.drawn);
    pen.lw = 1;
    return;
  }
  V.split = S.wide && (P.bg.length > 0 || (P.fg ? P.fg.length > 0 : false));
  if (!V.ok) {
    renderStatic(o, V);
    V.ok = true;
    V.offBg = V.offFg = NaN;
  }
  /* how far off-centre it stands decides how far the back and front sheets slide */
  if (V.split) {
    const off = clamp((o.x + ((o.def.hit[0] + o.def.hit[2]) / 2) * o.sc - S.s - S.vw / 2) / S.vw, -1, 1) * V.pr;
    const b = Math.round(-off * 26),
      f = Math.round(off * 34);
    if (b !== V.offBg) slide(V.bg, (V.offBg = b), V.pr);
    if (f !== V.offFg) slide(V.fg, (V.offFg = f), V.pr);
  }
  setT(g, o, V);
  /* the windows are lit when you look in, and more and more of their own accord as the day goes on */
  const st = liveState;
  st.h = o.hot;
  st.hc = clamp(o.hot, 0, 1);
  st.t = S.time;
  st.lit = Math.max(st.hc, o.eve || 0);
  st.still = S.reduce;
  o.def.live(g, P, st, o.pal);
  if (o.ring > 0) paint(g, P.ring, o.pal, smooth(o.ring));
  pen.lw = 1;
}
/* one object, refilled each frame: nothing is allocated per place per frame */
const liveState = { h: 0, hc: 0, t: 0, lit: 0, still: false };
