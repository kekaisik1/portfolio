/**
 * The places as things on the page: create them, stand them on the ground, keep them alive.
 */
import { PROJECTS } from '../content/projects';
import { MESSAGES } from '../content/site';
import { clamp, makeNoise, smooth } from '../lib/math';
import { PLACES } from './index';
import { phoneScale } from './size';
import { PADB, buildParts, createView, renderView } from './view';
import { sections, stage, track } from '../world/dom';
import { palFor } from '../world/palette';
import { requestDraw } from '../world/scheduler';
import { S } from '../world/state';
import { heightFor, placeAt } from '../world/zones';
import type { PlaceObj, Pt } from '../world/types';

/**
 * Make a button (and its sheets of paper) for every project that has a spot on the page and a drawing.
 * `onEnter` is what pressing a place does.
 */
export function setupObjects(onEnter: (o: PlaceObj) => void): void {
  S.objs = [];
  PROJECTS.forEach((p, i) => {
    const host = document.getElementById(p.slug),
      def = PLACES[p.slug];
    const cap = host ? host.querySelector<HTMLElement>('.cap') : null;
    if (!host || !def || !cap) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'obj';
    btn.setAttribute('aria-label', MESSAGES.goInside(p.name));
    btn.setAttribute('aria-haspopup', 'dialog');
    const view = createView();
    btn.append(view.wrap);
    host.append(btn);
    const o: PlaceObj = {
      p,
      def,
      btn,
      host,
      cap,
      /* the seed follows the project's position in the list, so each drawing is the same on every visit */
      parts: buildParts(def, 700 + i * 53),
      seq: null,
      sc: 1,
      x: 0,
      base: 0,
      bx: 0,
      by: 0,
      top: 0,
      left: 0,
      pal: palFor(0),
      view,
      hot: 0,
      v: 0,
      target: 0,
      ring: 0,
      ringT: 0,
      drawn: S.reduce ? 1 : 0,
      going: false,
      vis: false,
      dirty: true,
      hover: false,
      focus: false,
      eve: 0,
      cw: 1,
      ch: 1,
      pw: 1,
      ph: 1,
    };
    const aim = (): void => {
      o.target = o.hover || o.focus ? 1 : 0;
      o.ringT = o.focus && btn.matches(':focus-visible') ? 1 : 0;
      requestDraw();
    };
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') {
        o.hover = true;
        aim();
      }
    });
    btn.addEventListener('pointerleave', () => {
      o.hover = false;
      aim();
    });
    btn.addEventListener('focus', () => {
      o.focus = true;
      aim();
    });
    btn.addEventListener('blur', () => {
      o.focus = false;
      aim();
    });
    btn.addEventListener('click', () => onEnter(o));
    S.objs.push(o);
  });
}
/* how big each place is. Wide: a good half of the screen's height, and its stretch of the track is as wide as it is.
   Narrow: as wide as the phone. */
export function sizeSpots(): void {
  for (const o of S.objs) {
    const def = o.def,
      F = def.full,
      hU = -def.hit[1],
      b = o.btn.style;
    if (S.wide) {
      o.sc = Math.max(0.3, Math.min((S.vh * def.size) / hU, (S.vw * 0.94) / (F[2] - F[0]), (S.vh * 0.82 - 96) / hU));
      o.host.style.width = ((def.hit[2] - def.hit[0]) * o.sc).toFixed(1) + 'px';
    } else {
      o.host.style.width = '';
      /* on a phone the middle of the scene fills the width; its outbuildings run off the sides */
      const cw = def.core ? def.core[1] - def.core[0] : F[2] - F[0],
        hostW = o.host.clientWidth || 300;
      o.sc = phoneScale(hostW, S.vh, cw, hU);
      b.left = b.top = '';
      b.width = Math.min(hostW, (F[2] - F[0]) * o.sc) + 'px';
      b.height = (F[3] - F[1] + PADB) * o.sc + 'px';
    }
  }
}
/* wide: stand each place on the ground, level the ground under it, and run the telephone line between the work places */
export function placeWide(): void {
  S.avoid = [];
  S.plats = [];
  S.lines = [];
  S.yurtX = S.treeX = S.sheepX = S.popX = S.bridgeX = null;
  const H = S.H,
    tr = track.getBoundingClientRect(),
    st = stage.getBoundingClientRect();
  const noise = makeNoise(37),
    ridge = (u: number) => heightFor('near', noise, u, placeAt(u, S.T), H);
  for (const o of S.objs) {
    const def = o.def,
      r = o.host.getBoundingClientRect(),
      bx = r.left - tr.left,
      by = r.top - st.top,
      sc = o.sc,
      x0 = bx,
      x1 = bx + r.width;
    let base;
    if (def.sea) base = H * (def.sea === 'stilts' ? 0.815 : 0.85);
    else {
      let m = 0,
        n = 0;
      for (let u = x0; u <= x1; u += 24) {
        m += ridge(u);
        n++;
      }
      base = clamp(m / n + 34, H * 0.8, H * 0.84);
    }
    o.x = bx - def.hit[0] * sc;
    o.base = Math.min(base, H - 46);
    o.bx = bx;
    o.by = by;
    S.avoid.push([x0 - 30, x1 + 30]);
    if (def.sea !== 'stilts')
      S.plats.push({
        x0: x0 - 6,
        x1: x1 + 6,
        y: o.base + 1,
        m: def.sea ? 170 : 130,
        sh: (def.hit[2] - def.hit[0]) * sc,
      });
  }
  /* poles between one work place and the next */
  const ground = (u: number) => {
    let y = ridge(u);
    for (const p of S.plats) {
      const w = smooth(Math.min((u - (p.x0 - p.m)) / p.m, (p.x1 + p.m - u) / p.m));
      y += (p.y - y) * w;
    }
    return y;
  };
  const wired: { o: PlaceObj; wire: Pt }[] = [];
  for (const o of S.objs) if (o.def.wire) wired.push({ o, wire: o.def.wire });
  for (let i = 0; i < wired.length - 1; i++) {
    const A = wired[i].o,
      Bq = wired[i + 1].o,
      end = (w: { o: PlaceObj; wire: Pt }) => [w.o.x + w.wire[0] * w.o.sc, w.o.base + w.wire[1] * w.o.sc];
    const xa = A.x + A.def.hit[2] * A.sc + 110,
      xb = Bq.x + Bq.def.hit[0] * Bq.sc - 110,
      n = Math.round((xb - xa) / 310);
    const pts = [end(wired[i]).concat(0)];
    if (xb > xa)
      for (let k = 0; k <= n; k++) {
        const u = n ? xa + ((xb - xa) * k) / n : (xa + xb) / 2,
          y = ground(u) + 3;
        pts.push([u, y - H * 0.17, y]);
        S.avoid.push([u - 18, u + 18]);
      }
    pts.push(end(wired[i + 1]).concat(0));
    S.lines.push(pts);
  }
  /* a yurt and a lone tree go wherever the steppe is still empty */
  const free = (half: number) => {
    let best = null,
      bd = half;
    for (let u = S.B[1] + 100; u < S.B[2] - 100; u += 16) {
      let d = Infinity;
      for (const [a, b] of S.avoid) d = Math.min(d, u < a ? a - u : u > b ? u - b : -1);
      if (d > bd) {
        bd = d;
        best = u;
      }
    }
    return best;
  };
  S.yurtX = free(96);
  if (S.yurtX !== null) S.avoid.push([S.yurtX - 70, S.yurtX + 70]);
  S.treeX = free(64);
  if (S.treeX !== null) S.avoid.push([S.treeX - 50, S.treeX + 50]);
  /* a row of poplars along a road, and a small bridge over a stream up in the foothills */
  S.popX = free(120);
  if (S.popX !== null) S.avoid.push([S.popX - 130, S.popX + 130]);
  {
    let best = null,
      bd = 80;
    for (let u = S.vw * 1.3; u < S.B[1] - 100; u += 16) {
      let d = Infinity;
      for (const [a, b] of S.avoid) d = Math.min(d, u < a ? a - u : u > b ? u - b : -1);
      if (d > bd) {
        bd = d;
        best = u;
      }
    }
    S.bridgeX = best;
    if (best !== null) S.avoid.push([best - 90, best + 90]);
  }
  S.sheepX = free(74);
  if (S.sheepX !== null) S.avoid.push([S.sheepX - 70, S.sheepX + 70]);
}
export function finishObjects(): void {
  for (const o of S.objs) {
    const def = o.def,
      F = def.full,
      sc = o.sc,
      h = def.hit,
      b = o.btn.style,
      V = o.view,
      c = V.wrap.style;
    if (S.wide) {
      V.fx0 = F[0];
      V.fw = F[2] - F[0];
    } else {
      /* on a phone the sheet is as wide as the screen and shows the middle of the scene */
      V.fw = Math.min(F[2] - F[0], (o.host.clientWidth || 300) / sc);
      const mid = def.core ? (def.core[0] + def.core[1]) / 2 : (F[0] + F[2]) / 2;
      V.fx0 = clamp(mid - V.fw / 2, F[0], F[2] - V.fw);
    }
    const fw = V.fw * sc,
      fh = (F[3] - F[1] + (S.wide ? 0 : PADB)) * sc;
    V.sc = sc;
    V.pr = S.wide ? S.ps : S.dpr;
    V.back = !S.wide;
    o.cw = fw;
    o.ch = fh;
    o.pw = Math.max(1, Math.round(fw * V.pr));
    o.ph = Math.max(1, Math.round(fh * V.pr));
    V.live = V.ok = false; /* the paper for it is taken out when you come near (updateObjs) */
    c.width = fw + 'px';
    c.height = fh + 'px';
    if (S.wide) {
      b.left = o.x + h[0] * sc - o.bx + 'px';
      b.top = o.base + h[1] * sc - o.by + 'px';
      b.width = Math.max(44, (h[2] - h[0]) * sc) + 'px';
      b.height = Math.max(44, (h[3] - h[1]) * sc) + 'px';
      c.left = (F[0] - h[0]) * sc + 'px';
      c.top = (F[1] - h[1]) * sc + 'px';
      o.pal = palFor(placeAt(o.x, S.T));
      o.eve = smooth((o.x / Math.max(1, S.sNight + S.vw) - 0.22) / 0.7) * 0.9;
      /* its name, pencilled in the sky beside it */
      const cs = o.cap.style;
      cs.maxWidth = def.capW ? Math.max(190, def.capW * sc) + 'px' : '';
      cs.left = o.x + def.capAt[0] * sc - o.bx + 'px';
      cs.top = Math.max(14, o.base + def.capAt[1] * sc - o.cap.offsetHeight - o.by) + 'px';
    } else {
      c.left = c.top = '';
      o.cap.style.maxWidth = o.cap.style.left = o.cap.style.top = '';
      const stretch = o.host.closest<HTMLElement>('.stretch');
      const zi = stretch ? Math.max(0, sections.indexOf(stretch)) : 0;
      o.pal = palFor(zi);
      o.eve = [0, 0.22, 0.8, 1][zi] * (S.objs.indexOf(o) === S.objs.length - 1 ? 1.06 : 1);
    }
    o.dirty = true;
  }
  if (!S.wide)
    for (const o of S.objs) {
      const r = o.btn.getBoundingClientRect();
      o.top = r.top + window.scrollY;
      o.left = r.left;
    }
}
export function updateObjs(dt: number): void {
  const vw = S.vw,
    vh = S.vh,
    sy = window.scrollY;
  for (const o of S.objs) {
    const F = o.def.full,
      V = o.view;
    let near, here;
    if (S.wide) {
      const l = o.x + F[0] * o.sc - S.s,
        r = o.x + F[2] * o.sc - S.s;
      near = r > -700 && l < vw + 700;
      here = r > vw * 0.14 && l < vw * 0.86;
      o.vis = r > -10 && l < vw + 10;
    } else {
      const t = o.top - sy,
        b = t + o.ch;
      near = b > -700 && t < vh + 700;
      here = t < vh * 0.8 && b > vh * 0.12;
      o.vis = b > -10 && t < vh + 10;
    }
    if (!near) {
      if (V.live) {
        for (const c of [V.cv, V.cache, V.bg, V.fg]) c.width = c.height = 1;
        V.live = V.ok = false;
      }
      continue;
    }
    if (!V.live) {
      V.cv.width = o.pw;
      V.cv.height = o.ph;
      V.live = true;
      V.ok = false;
      o.dirty = true;
    }
    if (here && o.drawn < 1) o.going = true;
    let moving = false;
    if (S.reduce) {
      if (o.drawn < 1) {
        o.drawn = 1;
        moving = true;
      }
      if (o.hot !== o.target || o.ring !== o.ringT) {
        o.hot = o.target;
        o.ring = o.ringT;
        moving = true;
      }
      o.v = 0;
    } else if (dt > 0) {
      const a = (o.target - o.hot) * 170 - o.v * 15;
      o.v += a * dt;
      o.hot += o.v * dt;
      if (Math.abs(o.v) < 0.003 && Math.abs(o.target - o.hot) < 0.003) {
        o.hot = o.target;
        o.v = 0;
      }
      const rt = o.ringT;
      if (o.ring !== rt) o.ring = rt ? Math.min(1, o.ring + dt / 0.5) : Math.max(0, o.ring - dt / 0.18);
      if (o.going && o.drawn < 1) o.drawn = Math.min(1, o.drawn + dt / 1.7);
      moving = o.vis; /* every place has one small thing in it that never stops */
    }
    if (o === S.inObj) continue; /* you are inside it: the drawing on the page has grown into the big one */
    if (moving || o.dirty) {
      renderView(o, V);
      o.dirty = false;
    }
  }
}
