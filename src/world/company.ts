/**
 * Company along the way: a hot-air balloon over the foothills, sailboats, a lighthouse, wildflowers leaning in the wind,
 * birds, chimney smoke, a fire on the night beach, the waves.
 */
import { clamp, mulberry32 } from '../lib/math';
import { glow } from './draw/pencil';
import { CHALK, INK, NEARWASH, PAPER, css, mix } from './palette';
import { S } from './state';
import { inAvoid, placeAt, tToU } from './zones';
import type { G } from './types';

export function drawBalloon(c: G, s: number, t: number, w: number): void {
  const still = S.reduce,
    x = S.B[1] - S.vw * 0.32 - s + (still ? 0 : Math.sin(t * 0.13) * 30),
    y = S.H * 0.19 + (still ? 0 : Math.sin(t * 0.5) * 6),
    z = clamp(S.H / 900, 0.7, 1.1);
  if (x < -60 || x > S.vw + 60 || w >= 1) return;
  const ink = css(INK[0]);
  c.save();
  c.translate(x, y);
  c.scale(z, z);
  c.rotate(still ? 0 : Math.sin(t * 0.5 + 1) * 0.03);
  c.globalAlpha = 1 - w;
  c.lineWidth = 1.1;
  c.strokeStyle = ink;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-7, 30);
  c.lineTo(-17, 13);
  c.moveTo(7, 30);
  c.lineTo(17, 13);
  c.stroke();
  const env = () => {
    c.beginPath();
    c.moveTo(-9, 20);
    c.bezierCurveTo(-34, 6, -30, -30, 0, -30);
    c.bezierCurveTo(30, -30, 34, 6, 9, 20);
    c.closePath();
  };
  env();
  c.fillStyle = '#F4EBD2';
  c.fill();
  c.save();
  env();
  c.clip();
  c.fillStyle = 'rgba(184,73,47,.82)';
  c.fillRect(-13, -32, 9, 56);
  c.fillRect(5, -32, 9, 56);
  c.fillStyle = 'rgba(227,179,65,.9)';
  c.fillRect(-4, -32, 9, 56);
  c.restore();
  env();
  c.stroke();
  c.fillStyle = '#C9A55B';
  c.beginPath();
  c.rect(-7, 30, 14, 9);
  c.fill();
  c.stroke();
  c.restore();
}
export function drawBoat(c: G, s: number, t: number, w: number, at: number, zz: number, k: number): void {
  const still = S.reduce,
    f = 0.5 + 0.12 * (zz - 0.5),
    x = tToU(S.B[2] + (S.B[3] - S.B[2]) * at, f) - s * f + (still ? 0 : Math.sin(t * 0.07 + k * 2) * 60),
    y = S.H * (0.632 + 0.036 * zz) + (still ? 0 : Math.sin(t * 1.1 + k) * 1.6),
    z = clamp(S.H / 900, 0.7, 1.1) * zz;
  if (x < -60 || x > S.vw + 60 || w >= 1) return;
  const ink = css(INK[0]);
  c.save();
  c.translate(x, y);
  c.scale(z, z);
  c.rotate(still ? 0 : Math.sin(t * 1.1 + 0.8) * 0.035);
  c.globalAlpha = 1 - w * 0.6;
  c.lineWidth = 1.1;
  c.strokeStyle = ink;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -40);
  c.stroke();
  c.fillStyle = '#FBFAF4';
  c.beginPath();
  c.moveTo(2, -38);
  c.quadraticCurveTo(22, -18, 20, -5);
  c.lineTo(2, -5);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = k === 1 ? '#D9C9A8' : 'rgba(227,179,65,.9)';
  c.beginPath();
  c.moveTo(-2, -34);
  c.quadraticCurveTo(-14, -18, -14, -6);
  c.lineTo(-2, -6);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = k ? '#6E7F96' : '#B8492F';
  c.beginPath();
  c.moveTo(-20, -2);
  c.lineTo(24, -2);
  c.quadraticCurveTo(20, 8, 12, 8);
  c.lineTo(-12, 8);
  c.quadraticCurveTo(-18, 7, -20, -2);
  c.closePath();
  c.fill();
  c.stroke();
  c.globalAlpha *= 0.4;
  c.beginPath();
  c.moveTo(-24, 12);
  c.lineTo(-6, 12);
  c.moveTo(2, 14);
  c.lineTo(28, 14);
  c.stroke();
  c.restore();
}
/* wildflowers and long grass along the way, leaning in the wind (not out at sea, not where a place stands) */
export function genFlowers(): void {
  S.flowers = [];
  const near = S.layers[2];
  if (!near) return;
  const r = mulberry32(4711),
    cols = ['rgb(222,170,74)', 'rgb(250,248,240)', 'rgb(196,98,74)', 'rgb(132,158,196)', 'rgb(222,170,74)'];
  for (let u = 80; u < near.W - 40; u += 10 + r() * 30) {
    const P = near.PAt(u);
    if (P > 1.55 && P < 2.6) continue;
    if (S.wide && inAvoid(u, 8)) continue;
    const n = 1 + ((r() * 3) | 0);
    for (let k = 0; k < n; k++)
      S.flowers.push({
        u: u + k * 5 + r() * 3,
        d: 4 + r() * (S.H - near.yAt(u)) * 0.16,
        h: 9 + r() * 15,
        c: r() < 0.55 ? cols[(r() * 5) | 0] : null,
        ph: r() * 6.283,
        night: P > 2.6,
      });
  }
}
export function drawFlowers(c: G, s: number, t: number): void {
  const near = S.layers[2],
    vw = S.vw,
    ink = css(INK[0]),
    still = S.reduce;
  c.lineWidth = 1;
  c.strokeStyle = ink;
  for (const f of S.flowers) {
    const x = f.u - s;
    if (x < -20 || x > vw + 20 || f.night) continue;
    const y = near.yAt(f.u) + f.d,
      sw = still
        ? 2
        : (Math.sin(t * 1.1 + f.u * 0.012 + f.ph * 0.3) * 0.7 + Math.sin(t * 2.3 + f.ph) * 0.3) * f.h * 0.22 +
          f.h * 0.1;
    c.globalAlpha = 0.6;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + sw * 0.3, y - f.h * 0.6, x + sw, y - f.h);
    c.stroke();
    if (f.c) {
      c.globalAlpha = 0.95;
      c.fillStyle = f.c;
      c.beginPath();
      c.arc(x + sw, y - f.h, 1.9, 0, 6.283);
      c.fill();
    }
  }
  c.globalAlpha = 1;
}

/* a lighthouse on the far point; its lamp comes round every few seconds, brighter as the day goes */
export function drawLight(c: G, s: number, t: number, w: number): void {
  const x = tToU(S.B[2] + (S.B[3] - S.B[2]) * 0.74, 0.5) - s * 0.5,
    y = S.H * 0.612,
    z = clamp(S.H / 900, 0.7, 1.1);
  if (x < -120 || x > S.vw + 120) return;
  const ink = css(INK[0]),
    on = S.reduce ? 0.5 : Math.pow(Math.max(0, Math.sin(t * 0.8)), 6);
  c.save();
  c.translate(x, y);
  c.scale(z, z);
  c.lineWidth = 1.1;
  c.strokeStyle = ink;
  c.lineJoin = 'round';
  c.fillStyle = css(mix(PAPER[2], NEARWASH[2], 0.5));
  c.beginPath();
  c.moveTo(-70, 2);
  c.quadraticCurveTo(-30, -14, 0, -12);
  c.quadraticCurveTo(40, -12, 80, 2);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#FBFAF4';
  c.beginPath();
  c.moveTo(-9, -12);
  c.lineTo(-6, -62);
  c.lineTo(6, -62);
  c.lineTo(9, -12);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(184,73,47,.85)';
  c.beginPath();
  c.moveTo(-8, -30);
  c.lineTo(-7, -44);
  c.lineTo(7, -44);
  c.lineTo(8, -30);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-9, -62);
  c.lineTo(9, -62);
  c.moveTo(-5, -62);
  c.lineTo(-5, -72);
  c.lineTo(5, -72);
  c.lineTo(5, -62);
  c.moveTo(-6, -72);
  c.lineTo(0, -79);
  c.lineTo(6, -72);
  c.stroke();
  c.restore();
  glow(c, x, y - 67 * z, (14 + 46 * on) * z, '255,214,130', (0.25 + 0.6 * on) * (0.35 + 0.65 * w));
}
/* the shade of a cloud, crossing the ground now and then */
export function drawCloudShade(c: G, s: number, t: number): void {
  if (S.reduce) return;
  const vw = S.vw,
    H = S.H;
  for (let k = 0; k < 1; k++) {
    const W = vw + 900,
      x = ((((t * (9 + k * 4) + k * 700 - s * 1.1) % W) + W) % W) - 450,
      P = placeAt(s + x);
    if (P > 1.55) continue;
    c.save();
    c.translate(x, H * (0.9 + k * 0.04));
    c.scale(1, 0.16);
    const gr = c.createRadialGradient(0, 0, 20, 0, 0, 260);
    gr.addColorStop(0, 'rgba(44,48,82,.085)');
    gr.addColorStop(1, 'rgba(44,48,82,0)');
    c.fillStyle = gr;
    c.beginPath();
    c.arc(0, 0, 260, 0, 6.283);
    c.fill();
    c.restore();
  }
}
export function drawWaves(c: G, col: string, alpha: number): void {
  const s = S.s,
    vw = S.vw,
    t = S.time;
  if (placeAt(s + vw) <= 1.6) return;
  c.strokeStyle = col;
  c.lineWidth = 1;
  for (let b = 0; b < 4; b++) {
    c.globalAlpha = (S.reduce ? 0.45 : 0.32 + 0.3 * Math.sin(t * 0.55 + b * 1.6)) * alpha;
    c.beginPath();
    for (const wv of S.waves) {
      if (wv.b !== b) continue;
      const x = wv.u - s * wv.f + (S.reduce ? 0 : Math.sin(t * 0.35 + wv.ph) * 2.5);
      if (x < -40 || x > vw + 4) continue;
      if (placeAt(s + x) < 1.75) continue;
      c.moveTo(x, wv.y);
      c.quadraticCurveTo(x + wv.len / 2, wv.y + wv.len * 0.13, x + wv.len, wv.y);
    }
    c.stroke();
    /* and a little light on the water, coming and going */
    if (b < 2 && col !== css(CHALK)) {
      c.strokeStyle = 'rgb(255,250,236)';
      c.globalAlpha = (S.reduce ? 0.4 : 0.25 + 0.45 * Math.max(0, Math.sin(t * 0.9 + b * 2.4))) * alpha;
      c.beginPath();
      for (const wv of S.waves) {
        if (wv.b !== b + 2) continue;
        const x = wv.u - s * wv.f;
        if (x < -40 || x > vw + 4 || placeAt(s + x) < 1.75) continue;
        c.moveTo(x + 3, wv.y - 2.5);
        c.lineTo(x + wv.len * 0.7, wv.y - 2.5);
      }
      c.stroke();
      c.strokeStyle = col;
    }
  }
  c.globalAlpha = 1;
}
/* ---------- small living things ---------- */
export function drawBirds(c: G, s: number, t: number, w: number): void {
  const vw = S.vw;
  c.lineWidth = 1.1;
  for (const b of S.birds) {
    const cyc = 80,
      ph = ((t + b.ph) % cyc) / cyc;
    const x = b.u - s * 0.6 + (ph - 0.5) * b.sp * cyc;
    if (x < -30 || x > vw + 30) continue;
    const a = Math.sin(ph * Math.PI) * (1 - w) * 0.7;
    if (a <= 0.01) continue;
    const y = b.y + Math.sin(t * 0.4 + b.ph) * 6,
      sc = b.sc;
    const flap = Math.sin(t * 0.45 + b.ph) > 0.2 ? Math.sin(t * 2.3 + b.ph) : 0.35,
      wy = -3.2 * sc * flap;
    c.strokeStyle = css(INK[0]);
    c.globalAlpha = a;
    c.beginPath();
    c.moveTo(x - 7 * sc, y + wy);
    c.quadraticCurveTo(x - 3 * sc, y - 2.4 * sc + wy * 0.3, x, y);
    c.quadraticCurveTo(x + 3 * sc, y - 2.4 * sc + wy * 0.3, x + 7 * sc, y + wy);
    c.stroke();
  }
  c.globalAlpha = 1;
}
export function drawSmoke(c: G, s: number, t: number): void {
  if (!S.yurt) return;
  const x = S.yurt.x - s,
    vw = S.vw;
  if (x < -80 || x > vw + 80) return;
  c.strokeStyle = css(INK[0]);
  c.lineWidth = 1;
  for (let st = 0; st < 2; st++) {
    let px = 0,
      py = 0;
    for (let k = 0; k < 30; k++) {
      const kk = k + st * 0.6;
      const nx = x + st * 2.5 + kk * 1.05 + Math.sin(kk * 0.3 - t * 1.1 + st * 2) * (1.2 + kk * 0.22),
        ny = S.yurt.y - kk * 3.3;
      if (k) {
        c.globalAlpha = 0.42 * (1 - k / 30);
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(nx, ny);
        c.stroke();
      }
      px = nx;
      py = ny;
    }
  }
  c.globalAlpha = 1;
}
/* a small fire on the night beach */
export function drawFire(c: G, s: number, t: number): void {
  if (!S.fire) return;
  const x = S.fire.x - s,
    y = S.fire.y,
    still = S.reduce,
    nn = 1;
  if (x < -100 || x > S.vw + 100) return;
  const fl = still ? 1 : 0.85 + 0.15 * Math.sin(t * 4.3) * Math.sin(t * 2.9 + 1);
  const gr = c.createRadialGradient(x, y - 6, 2, x, y - 6, 80);
  gr.addColorStop(0, `rgba(242,170,90,${(0.3 * nn * fl).toFixed(3)})`);
  gr.addColorStop(1, 'rgba(242,170,90,0)');
  c.fillStyle = gr;
  c.fillRect(x - 80, y - 86, 160, 160);
  for (let j = 0; j < 3; j++) {
    const bx = x - 5 + j * 5,
      h = (j === 1 ? 20 : 13) * (still ? 1 : 0.82 + 0.2 * Math.sin(t * 5.3 + j * 2.1) + 0.08 * Math.sin(t * 11 + j)),
      sw = still ? 0 : Math.sin(t * 3.7 + j) * 2;
    c.beginPath();
    c.moveTo(bx - 4, y);
    c.quadraticCurveTo(bx - 3 + sw * 0.5, y - h * 0.55, bx + sw, y - h);
    c.quadraticCurveTo(bx + 3 + sw * 0.5, y - h * 0.5, bx + 4, y);
    c.fillStyle = `rgba(236,150,70,${(0.7 * nn).toFixed(3)})`;
    c.fill();
    c.strokeStyle = `rgba(242,207,115,${(0.9 * nn).toFixed(3)})`;
    c.lineWidth = 1;
    c.stroke();
  }
}
