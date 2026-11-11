/**
 * One frame of the landscape: the day (sky, sun, layers, everything living), the night, and the dusk between them.
 */
import { clamp, smooth } from '../lib/math';
import {
  drawBalloon,
  drawBirds,
  drawBoat,
  drawCloudShade,
  drawFire,
  drawFlowers,
  drawLight,
  drawSmoke,
  drawWaves,
} from './company';
import { canvas, ctx } from './dom';
import { drawStroke, glow } from './draw/pencil';
import { drawHaze } from './haze';
import { drawLanterns } from './lanterns';
import { drawLife } from './life';
import { CHALK, GLOW, GLOWA, INK, PAPER, SKYTOP, WASH, css, mix, stop, stop3, wt } from './palette';
import { nc, ncx, skyc, skyg } from './sheets';
import { S } from './state';
import { drawLayer } from './tiles';
import { drawWeather } from './weather';
import { placeAt } from './zones';
import type { G } from './types';

export function introState() {
  if (!S.intro) return { alpha: 1, tt: 99 };
  const tt = S.time - S.intro.t0;
  const alpha = smooth((tt - 1.1) / 1.1);
  if (alpha >= 1) S.intro = null;
  return { alpha, tt };
}
export function drawScene(): void {
  const vw = S.vw,
    H = S.H,
    D = S.D;
  /* opened in a tab or pane with no size yet: nothing to draw on until the resize that follows */
  if (!canvas.width || !canvas.height) return;
  if (D.ind < 1) drawDay(ctx);
  if (D.ind <= 0) return;
  if (D.ind >= 1) {
    drawNight(ctx);
    return;
  }
  /* the night is a band coming down from the top of the sky, over the land too */
  ncx.setTransform(1, 0, 0, 1, 0, 0);
  ncx.globalCompositeOperation = 'source-over';
  ncx.globalAlpha = 1;
  ncx.clearRect(0, 0, nc.width, nc.height);
  drawNight(ncx);
  const band = H * 0.42,
    e = D.ind * (H + band) - band;
  ncx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ncx.globalCompositeOperation = 'destination-in';
  const m = ncx.createLinearGradient(0, Math.max(0, e - 1), 0, e + band);
  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(0.55, 'rgba(0,0,0,.55)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  ncx.fillStyle = m;
  ncx.fillRect(0, 0, vw, H);
  ncx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(nc, 0, 0);
}
function paintSky(g: G): void {
  const vw = S.vw,
    H = S.H,
    s = S.s,
    w = S.D.w;
  g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  const gsky = g.createLinearGradient(0, 0, vw, 0);
  for (let k = 0; k <= 6; k++) gsky.addColorStop(k / 6, css(stop(SKYTOP, Math.min(2, placeAt(s + (vw * k) / 6)))));
  g.fillStyle = gsky;
  g.fillRect(0, 0, vw, H);
  const gv = g.createLinearGradient(0, H * 0.04, 0, H * 0.64);
  gv.addColorStop(0, 'rgba(255,253,247,0)');
  gv.addColorStop(1, `rgba(255,253,247,${(0.55 - 0.3 * w).toFixed(3)})`);
  g.fillStyle = gv;
  g.fillRect(0, 0, vw, H);
  {
    const Pc = clamp(((s + vw * 0.5) / Math.max(1, S.sNight)) * 2.1, 0, 2),
      gc = stop3(GLOW, Pc),
      ga = (GLOWA[0] * wt(Pc, 0) + GLOWA[1] * wt(Pc, 1) + GLOWA[2] * wt(Pc, 2)) * (1 - 0.5 * w);
    const gg = g.createLinearGradient(0, H * 0.14, 0, H * 0.64);
    gg.addColorStop(0, css(gc, 0));
    gg.addColorStop(0.7, css(gc, ga * 0.6));
    gg.addColorStop(1, css(gc, ga));
    g.fillStyle = gg;
    g.fillRect(0, 0, vw, H * 0.66);
  }
  if (w > 0) {
    /* sunset: dusty rose up high, apricot down at the sea */
    const wg = g.createLinearGradient(0, 0, 0, H * 0.64);
    wg.addColorStop(0, `rgba(196,150,168,${(0.42 * w).toFixed(3)})`);
    wg.addColorStop(0.55, `rgba(232,170,140,${(0.5 * w).toFixed(3)})`);
    wg.addColorStop(1, `rgba(246,190,122,${(0.72 * w).toFixed(3)})`);
    g.fillStyle = wg;
    g.fillRect(0, 0, vw, H);
  }
}
function sunPos() {
  const H = S.H,
    w = S.D.w,
    r = S.sun ? S.sun.r : 30;
  return { x: S.sunU - S.s * 0.2, y: H * 0.47 + w * (H * 0.605 + r + 6 - H * 0.47), r };
}
function drawDay(c: G): void {
  const vw = S.vw,
    H = S.H,
    s = S.s,
    t = S.time,
    D = S.D,
    w = D.w;
  if (skyc.width !== canvas.width || skyc.height !== canvas.height) {
    skyc.width = canvas.width;
    skyc.height = canvas.height;
    S.skyKey = '';
  }
  /* the sky only changes when you move (or the sun does), so standing still it is painted once and kept */
  const skyKey = s + '|' + w;
  if (skyKey !== S.skyKey) {
    paintSky(skyg);
    S.skyKey = skyKey;
    S.skyV++;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.drawImage(skyc, 0, 0);
  c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const I = introState();

  /* the sun: pale over the sea, then it goes down, warming as it goes */
  const sp = sunPos();
  if (S.sun && w < 1 && sp.x > -sp.r * 4 && sp.x < vw + sp.r * 4) {
    if (w > 0.05) glow(c, sp.x, sp.y, sp.r * 4.2, '250,184,120', 0.38 * w);
    c.save();
    c.translate(sp.x, sp.y);
    c.fillStyle = css(mix([246, 232, 186], [238, 146, 86], w));
    c.beginPath();
    c.arc(0, 0, sp.r, 0, 6.283);
    c.fill();
    drawStroke(c, S.sun.op);
    c.restore();
  }
  if (I.alpha < 1) drawIntro(c, I.tt);

  const L = S.layers;
  c.globalAlpha = I.alpha;
  drawLayer(c, L[0], s);
  c.globalAlpha = 1;
  /* clouds drift, slowly */
  for (const cl of S.clouds) {
    const spr = S.cloudSprites[cl.spr];
    const x = ((cl.u + t * 2.4) % cl.W) - s * 0.3 - 800;
    const cw = spr.w * cl.sc,
      ch = spr.h * cl.sc;
    if (x < -cw || x > vw) continue;
    c.globalAlpha = 0.95 * (1 - 0.35 * w) * I.alpha;
    c.drawImage(spr.c, x, cl.y, cw, ch);
  }
  c.globalAlpha = 1;
  drawBirds(c, s, t, w);
  drawBalloon(c, s, t, w);
  c.globalAlpha = I.alpha;
  drawLayer(c, L[1], s);
  c.globalAlpha = 1;
  /* the sun's path on the water */
  if (S.refl && S.sun && w < 1 && sp.x > -200 && sp.x < vw + 200) {
    const a = S.refl.segs,
      fade = 1 - smooth((w - 0.8) / 0.2);
    c.strokeStyle = css(mix(mix(WASH[1], PAPER[0], 0.1), [236, 140, 80], w));
    c.globalAlpha = (0.55 + 0.3 * w) * fade;
    c.lineWidth = 1.6;
    c.beginPath();
    for (let i = 0; i < a.length; i += 4) {
      c.moveTo(sp.x + a[i], a[i + 1]);
      c.lineTo(sp.x + a[i + 2], a[i + 3]);
    }
    c.stroke();
    c.globalAlpha = 1;
  }
  drawWaves(c, css(INK[0]), I.alpha);
  drawLight(c, s, t, w);
  drawBoat(c, s, t, w, 0.52, 1, 0);
  drawBoat(c, s, t, w, 0.2, 0.6, 1);
  drawBoat(c, s, t, w, 0.9, 0.5, 2);
  /* mist breathing through the mountains */
  const mist = S.mistSprite;
  if (mist && placeAt(s) < 1.2) {
    for (const m of S.mists) {
      const x = ((m.u + t * m.sp) % m.W) - s * 0.5 - 350;
      const mw = mist.w * m.sc,
        mh = mist.h * m.sc;
      if (x < -mw || x > vw) continue;
      const a = wt(placeAt(s + x + mw / 2), 0);
      if (a <= 0) continue;
      c.globalAlpha = a * 0.8 * I.alpha;
      c.drawImage(mist.c, x, m.y, mw, mh);
    }
    c.globalAlpha = 1;
  }
  if (S.wide) drawHaze(c, s);
  c.globalAlpha = I.alpha;
  drawLayer(c, L[2], s);
  drawLayer(c, L[3], s);
  c.globalAlpha = 1;
  drawFlowers(c, s, t);
  drawCloudShade(c, s, t);
  drawSmoke(c, s, t);
  drawLife(c);
  drawWeather(c, false);
  if (w > 0) {
    c.fillStyle = `rgba(238,158,104,${(0.1 * w).toFixed(3)})`;
    c.fillRect(0, 0, vw, H);
  }
}
function drawNight(c: G): void {
  const vw = S.vw,
    H = S.H,
    s = S.s,
    t = S.time,
    D = S.D;
  c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const g = c.createLinearGradient(0, 0, 0, H * 0.64);
  g.addColorStop(0, '#111433');
  g.addColorStop(0.62, '#1D2256');
  g.addColorStop(1, '#2A2F66');
  c.fillStyle = g;
  c.fillRect(0, 0, vw, H);
  /* what is left of the sunset, low over the water */
  const left = 0.3 * (1 - D.deep);
  if (left > 0.005) {
    const hg = c.createLinearGradient(0, H * 0.36, 0, H * 0.62);
    hg.addColorStop(0, 'rgba(170,110,130,0)');
    hg.addColorStop(1, `rgba(196,122,118,${left.toFixed(3)})`);
    c.fillStyle = hg;
    c.fillRect(0, H * 0.36, vw, H * 0.27);
  }
  /* stars, one by one */
  c.fillStyle = css(CHALK);
  for (const st of S.stars) {
    const x = st.u - s * 0.06;
    if (x < -4 || x > vw + 4) continue;
    let a = clamp((D.ind * 1.25 - st.th) * 5, 0, 1);
    if (a <= 0) continue;
    if (!S.reduce) a *= 0.72 + 0.28 * Math.sin(t * 0.7 + st.ph);
    c.globalAlpha = a;
    c.fillRect(x - st.r / 2, st.y - st.r / 2, st.r, st.r);
    if (st.r > 1.5) {
      c.globalAlpha = a * 0.5;
      c.fillRect(x - st.r * 2.2, st.y - 0.35, st.r * 4.4, 0.7);
      c.fillRect(x - 0.35, st.y - st.r * 2.2, 0.7, st.r * 4.4);
    }
  }
  c.globalAlpha = 1;
  /* moon */
  const mx = S.moonT - s,
    my = S.moonY;
  const moon = S.moonSprite;
  if (moon && mx > -200 && mx < vw + 200) c.drawImage(moon.c, mx - moon.s / 2, my - moon.s / 2, moon.s, moon.s);
  const N = S.nlayers;
  drawLayer(c, N[0], s);
  drawLayer(c, N[1], s);
  drawWaves(c, css(CHALK), 1);
  /* the moon on the water */
  if (mx > -100 && mx < vw + 100) {
    c.strokeStyle = css(CHALK);
    c.lineWidth = 1.3;
    for (let k = 0; k < 18; k++) {
      const y = H * 0.622 + k * k * 0.0009 * H + k * 2.5,
        half = (6 + k * 2.2) * (S.reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.8 + k * 1.3));
      c.globalAlpha = 0.75 - k * 0.03;
      const dx = S.reduce ? 0 : Math.sin(t * 0.4 + k) * 3;
      c.beginPath();
      c.moveTo(mx - half + dx, y);
      c.lineTo(mx + half + dx, y);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  drawLayer(c, N[2], s);
  drawLayer(c, N[3], s);
  drawFire(c, s, t);
  drawLanterns(c, s, t);
  drawWeather(c, true);
}
function drawIntro(c: G, tt: number): void {
  for (const it of S.introStrokes) {
    const delay = (it.op.x0 / S.vw) * 0.75 + (it.far ? 0.25 : 0);
    const f = clamp((tt - delay) / 0.7, 0, 1);
    if (f <= 0) continue;
    drawStroke(c, it.op, f);
  }
}
