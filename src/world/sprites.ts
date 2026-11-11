/**
 * Things made once and stamped many times: the paper grain, clouds, the moon, a puff of mist;
 * and the lists of everything that drifts (clouds, birds, stars, waves, snowflakes).
 */
import { grainEl } from './dom';
import { ctx2d, newCanvas } from '../lib/dom';
import { clamp, fbm, makeNoise, mulberry32 } from '../lib/math';
import { genFlowers } from './company';
import { drawStroke, strokeOp } from './draw/pencil';
import { INK, css } from './palette';
import { S } from './state';
import { tToU } from './zones';

export function makeGrain(): void {
  const c = newCanvas();
  c.width = c.height = 96;
  const g = ctx2d(c),
    im = g.createImageData(96, 96),
    r = mulberry32(5);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = r();
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 0;
    im.data[i + 3] = v > 0.82 ? (v - 0.82) * 900 : 0;
  }
  g.putImageData(im, 0, 0);
  S.grain = c;
  /* paper texture overlay */
  const p = newCanvas();
  p.width = p.height = 160;
  const pg = ctx2d(p),
    pim = pg.createImageData(160, 160);
  for (let i = 0; i < pim.data.length; i += 4) {
    const v = 120 + r() * 120;
    pim.data[i] = pim.data[i + 1] = pim.data[i + 2] = v;
    pim.data[i + 3] = 26 + r() * 28;
  }
  pg.putImageData(pim, 0, 0);
  grainEl.style.backgroundImage = `url(${p.toDataURL()})`;
}
/* clouds, drawn the way the ridges are: a soft top found by noise, gone over in several wobbly pencil runs,
   a pale underside that never quite closes, a little hatching underneath */
export function makeSprites(): void {
  const ps = S.ps,
    rnd = mulberry32(99),
    noise = makeNoise(73);
  S.cloudSprites = [];
  const ink0 = css(INK[0]);
  for (let k = 0; k < 5; k++) {
    const w0 = 180 + rnd() * 120,
      h0 = 64 + rnd() * 26,
      pad = 18,
      w = w0 + pad * 2,
      h = h0 + pad * 2,
      c = newCanvas();
    c.width = Math.ceil(w * ps);
    c.height = Math.ceil(h * ps);
    const g = ctx2d(c);
    g.scale(ps, ps);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const cx = w / 2 + (rnd() - 0.5) * w0 * 0.16,
      rx = w0 / 2,
      base = pad + h0 * 0.84,
      off = rnd() * 900,
      lean = (rnd() - 0.5) * 0.5;
    const env = (x: number) => {
      const d = (x - cx) / rx;
      return Math.max(0, 1 - d * d) * (1 + lean * d);
    };
    /* round ones: a row of bumps, the middle ones tallest */
    const lob = Array.from({ length: 3 + (k % 2) }, (_, i) => {
      const f = (i + 0.5) / (3 + (k % 2));
      return [cx - rx + f * 2 * rx + (rnd() - 0.5) * 12, rx * (0.25 + 0.2 * Math.sin(Math.PI * f) + rnd() * 0.04)];
    });
    const top = (x: number) => {
      let m = 0;
      for (const [c, r] of lob) {
        const d = (x - c) / r;
        if (d * d < 1) m = Math.max(m, Math.sqrt(1 - d * d) * r);
      }
      return (
        base - ((m * h0) / (rx * 0.46)) * Math.min(1, Math.sqrt(env(x)) * 2.4) - 1.2 * fbm(noise, (x + off) / 18, 2)
      );
    };
    const bot = (x: number) => base + h0 * 0.06 * Math.pow(env(x), 0.5) + Math.sin((x + off) * 0.045) * 1.2;
    const tp = [],
      bp = [];
    for (let x = cx - rx; x <= cx + rx; x += 3) {
      tp.push(x, top(x));
      bp.push(x, bot(x));
    }
    const gr = g.createLinearGradient(0, pad, 0, base + 6);
    gr.addColorStop(0, 'rgba(250,250,246,.94)');
    gr.addColorStop(0.75, 'rgba(244,245,242,.9)');
    gr.addColorStop(1, 'rgba(206,216,228,.7)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(tp[0], tp[1]);
    for (let i = 2; i < tp.length; i += 2) g.lineTo(tp[i], tp[i + 1]);
    for (let i = bp.length - 2; i >= 0; i -= 2) g.lineTo(bp[i], bp[i + 1]);
    g.closePath();
    g.fill();
    const N = tp.length / 2;
    for (let i = 0; i < N - 3;) {
      const j = Math.min(N - 1, i + 12 + ((rnd() * 26) | 0));
      drawStroke(
        g,
        strokeOp(tp.slice(2 * i, 2 * j + 2), rnd, {
          jit: 1.05,
          passes: 2 + (rnd() < 0.45 ? 1 : 0),
          w: 1.05,
          color: ink0,
          alpha: 0.5,
        }),
      );
      if (j >= N - 1) break;
      i = j - 2 - ((rnd() * 3) | 0);
    }
    const b0 = Math.floor(N * (0.1 + rnd() * 0.12)),
      b1 = Math.floor(N * (0.72 + rnd() * 0.16));
    drawStroke(g, strokeOp(bp.slice(2 * b0, 2 * b1), rnd, { jit: 0.9, passes: 2, w: 0.85, color: ink0, alpha: 0.24 }));
    const hs = [];
    for (let x = cx - rx * 0.7; x < cx + rx * 0.75; x += 5 + rnd() * 4) {
      if (env(x) < 0.35 || rnd() < 0.35) continue;
      const y = bot(x) - 2 - rnd() * 2,
        l = 4 + rnd() * 6;
      hs.push(x, y, x + l * 0.7, y - l * 0.55);
    }
    g.strokeStyle = ink0;
    g.globalAlpha = 0.16;
    g.lineWidth = 0.75;
    g.beginPath();
    for (let i = 0; i < hs.length; i += 4) {
      g.moveTo(hs[i], hs[i + 1]);
      g.lineTo(hs[i + 2], hs[i + 3]);
    }
    g.stroke();
    g.globalAlpha = 1;
    S.cloudSprites.push({ c, w, h });
  }
  /* moon */
  const R = S.R,
    ms = R * 5,
    mc = newCanvas();
  mc.width = mc.height = ms * ps;
  const mg = ctx2d(mc);
  mg.scale(ps, ps);
  mg.lineCap = 'round';
  const cx = ms / 2,
    gl = mg.createRadialGradient(cx, cx, R * 0.8, cx, cx, ms / 2);
  gl.addColorStop(0, 'rgba(232,230,240,.22)');
  gl.addColorStop(1, 'rgba(232,230,240,0)');
  mg.fillStyle = gl;
  mg.fillRect(0, 0, ms, ms);
  mg.fillStyle = '#EEEADC';
  mg.beginPath();
  mg.arc(cx, cx, R, 0, 6.283);
  mg.fill();
  const mr = mulberry32(17),
    circ = [];
  for (let a = 0; a <= 6.45; a += 0.1) circ.push(cx + Math.cos(a) * R, cx + Math.sin(a) * R);
  drawStroke(mg, strokeOp(circ, mr, { jit: 0.8, passes: 3, w: 1.1, color: '#7C7A92', alpha: 0.7 }));
  for (const [dx, dy, r] of [
    [-0.3, -0.2, 0.18],
    [0.25, 0.15, 0.12],
    [-0.05, 0.38, 0.09],
    [0.35, -0.3, 0.07],
  ]) {
    const cr = [];
    for (let a = 0; a <= 6.4; a += 0.4)
      cr.push(cx + dx * R + Math.cos(a) * r * R, cx + dy * R + Math.sin(a) * r * R * 0.85);
    drawStroke(mg, strokeOp(cr, mr, { jit: 0.4, passes: 1, w: 0.8, color: '#8E8CA4', alpha: 0.5 }));
  }
  S.moonSprite = { c: mc, s: ms };
  /* mist sprite */
  const mw = 700,
    mh = 120,
    m = newCanvas();
  m.width = mw;
  m.height = mh;
  const g2 = ctx2d(m);
  g2.translate(mw / 2, mh / 2);
  g2.scale(mw / mh, 1);
  const rg = g2.createRadialGradient(0, 0, 0, 0, 0, mh / 2);
  rg.addColorStop(0, 'rgba(246,246,242,.75)');
  rg.addColorStop(0.6, 'rgba(246,246,242,.35)');
  rg.addColorStop(1, 'rgba(246,246,242,0)');
  g2.fillStyle = rg;
  g2.beginPath();
  g2.arc(0, 0, mh / 2, 0, 6.283);
  g2.fill();
  S.mistSprite = { c: m, w: mw, h: mh };
}
export function genMoving(): void {
  const H = S.H,
    vw = S.vw,
    rnd = mulberry32(321);
  /* few clouds, evenly spaced, all drifting at the same speed, so two never overlap */
  const cw = S.sMax * 0.3 + vw + 1600,
    cnt = Math.max(3, Math.round(cw / 1900)),
    gap = cw / cnt;
  S.clouds = [];
  for (let k = 0; k < cnt; k++)
    S.clouds.push({
      u: k * gap + rnd() * Math.max(0, gap - 760) * 0.5,
      y: H * (0.05 + rnd() * 0.19),
      sc: 0.78 + rnd() * 0.3,
      spr: k % S.cloudSprites.length,
      W: cw,
    });
  S.birds = [];
  for (let k = 0; k < 7; k++) {
    const t = S.B[0] + (S.B[3] - S.B[0]) * (0.06 + k * 0.135 + rnd() * 0.05);
    S.birds.push({
      u: tToU(t, 0.6),
      y: H * (0.3 + rnd() * 0.12),
      sp: 6 + rnd() * 5,
      ph: rnd() * 60,
      sc: 0.55 + rnd() * 0.6,
    });
  }
  genFlowers();
  const sw = S.sMax * 0.06 + vw;
  S.stars = [];
  const sc = Math.min(900, Math.round((sw * H * 0.58) / 2600));
  for (let k = 0; k < sc; k++)
    S.stars.push({
      u: rnd() * sw,
      y: rnd() * H * 0.58,
      r: 0.5 + Math.pow(rnd(), 3) * 1.6,
      th: rnd(),
      ph: rnd() * 6.283,
    });
  S.waves = [];
  const t0 = S.B[2] - S.T / 2,
    span = S.END - t0;
  const wc = Math.round((span / Math.max(400, vw)) * 80);
  for (let k = 0; k < wc; k++) {
    const yr = Math.pow(rnd(), 0.8),
      f = 0.5 + yr * 0.5,
      t = t0 + rnd() * span;
    S.waves.push({
      u: tToU(t, f),
      f,
      y: H * (0.625 + yr * 0.33),
      len: 10 + yr * 30 + rnd() * 10,
      ph: rnd() * 6.283,
      b: k % 4,
    });
  }
  S.flakes = [];
  const fr = mulberry32(91),
    fn = clamp(Math.round((vw * H) / 9000), 50, 170);
  for (let k = 0; k < fn; k++) S.flakes.push({ x: fr(), y: fr(), z: 0.35 + fr() * 0.65, ph: fr() * 6.283 });
  S.mists = [];
  const mz = tToU(S.B[1], 0.5) + 400;
  for (let k = 0; k < 4; k++)
    S.mists.push({ u: rnd() * mz, y: H * (0.5 + rnd() * 0.14), sc: 0.8 + rnd() * 0.9, sp: 4 + rnd() * 4, W: mz });
}
