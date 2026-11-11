/**
 * The few animals and small moving things a sketcher would note in passing: small, plain, part of the scenery.
 */
import { box } from './pencil';
import { pen } from './sketch';
import type { G, Pal, Sketch } from '../types';

/* the play places each fly a small yellow pennant; the work places are on the telephone line */
export function pennant(g: G, x: number, y: number, t: number, pal: Pal, still: boolean): void {
  g.strokeStyle = pal.ink;
  g.lineWidth = 1.2 * pen.lw;
  g.globalAlpha = 0.9;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 28);
  g.stroke();
  const w = still ? 0 : Math.sin(t * 5) * 2.2,
    w2 = still ? 1 : Math.sin(t * 5 + 1.3) * 2.8;
  g.fillStyle = pal.flag;
  g.globalAlpha = 0.95;
  g.beginPath();
  g.moveTo(x, y - 28);
  g.quadraticCurveTo(x + 10, y - 27 + w, x + 22, y - 21 + w2);
  g.quadraticCurveTo(x + 10, y - 18 + w, x, y - 16);
  g.closePath();
  g.fill();
  g.globalAlpha = 0.9;
  g.stroke();
  g.globalAlpha = 1;
}
export function insulators(s: Sketch, xs: number[], y: number): void {
  for (const x of xs) {
    s.fill(box(x - 3, y - 11, 6, 10), 'paper');
    s.ell(x, y - 7, 3, 4.5, { w: 0.9, passes: 1, jit: 0.3 });
  }
}
/* ---------- the few animals a sketcher would note in passing: small, plain, part of the scenery ---------- */
export function crit(g: G, x: number, y: number, s: number, pal: Pal, dir?: number): void {
  g.save();
  g.translate(x, y);
  g.scale(s * (dir || 1), s);
  g.strokeStyle = pal.ink;
  g.lineWidth = (1 * pen.lw) / s;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.globalAlpha = 0.9;
}
/* a cat asleep, breathing; the tail moves now and then */
export function cat(g: G, x: number, y: number, s: number, t: number, pal: Pal, flick: number): void {
  crit(g, x, y, s, pal);
  const br = Math.sin(t * 1.2) * 0.45;
  g.fillStyle = pal.gold;
  g.beginPath();
  g.moveTo(11, -2);
  g.quadraticCurveTo(21, -1, 20 + flick * 2, -6 - flick * 3);
  g.stroke();
  g.beginPath();
  g.moveTo(-15, -1);
  g.quadraticCurveTo(-17, -9, -9, -10.5);
  g.quadraticCurveTo(0, -14.5 - br, 9, -11);
  g.quadraticCurveTo(15, -8, 13, -1);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-15.5, -8);
  g.lineTo(-15, -13);
  g.lineTo(-12, -10.5);
  g.lineTo(-9, -13);
  g.lineTo(-8, -8.5);
  g.stroke();
  g.globalAlpha = 0.45;
  g.beginPath();
  g.moveTo(-2, -12.5);
  g.lineTo(-1, -9.5);
  g.moveTo(3, -12.6);
  g.lineTo(3.8, -9.6);
  g.moveTo(-13.5, -6);
  g.lineTo(-10.5, -6);
  g.stroke();
  g.restore();
}
/* a small bird, side on */
export function bird(
  g: G,
  x: number,
  y: number,
  s: number,
  _t: number,
  pal: Pal,
  o: { hop?: number; dir?: number; bob?: number; c?: string } = {},
): void {
  crit(g, x, y - (o.hop || 0), s, pal, o.dir);
  const b = o.bob || 0;
  g.beginPath();
  g.moveTo(-4, -5.5);
  g.lineTo(-11.5, -7 + b * 0.5);
  g.moveTo(-1, -1);
  g.lineTo(-1, 1);
  g.moveTo(1.5, -1);
  g.lineTo(1.5, 1);
  g.stroke();
  g.fillStyle = o.c || pal.wash;
  g.beginPath();
  g.moveTo(-6, -5);
  g.quadraticCurveTo(-4, -10.5, 2, -10 + b * 0.3);
  g.quadraticCurveTo(4, -13.5 + b, 7.5, -11 + b);
  g.lineTo(10, -10 + b);
  g.lineTo(7, -9 + b);
  g.quadraticCurveTo(6, -1, -1, -1.5);
  g.quadraticCurveTo(-5, -2, -6, -5);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = pal.ink;
  g.beginPath();
  g.arc(6, -11.2 + b, 0.6, 0, 6.283);
  g.fill();
  g.globalAlpha = 0.5;
  g.beginPath();
  g.moveTo(-3.5, -6.5);
  g.quadraticCurveTo(0, -3.5, 3, -6);
  g.stroke();
  g.restore();
}
/* chimney smoke: soft, pale, gone quickly */
export function puffs(g: G, x: number, y: number, t: number, pal: Pal, still: boolean): void {
  g.fillStyle = pal.paper;
  for (let k = 0; k < 5; k++) {
    const p = still ? (k + 0.5) / 5 : (t * 0.1 + k / 5) % 1,
      r = 3 + p * 9;
    g.globalAlpha = Math.sin(p * Math.PI) * 0.5;
    g.beginPath();
    g.arc(x + Math.sin(p * 4 + k * 1.7) * 4 + p * 16, y - p * 52, r, 0, 6.283);
    g.fill();
  }
  g.globalAlpha = 1;
}
/* a koi, now and then */
export function koi(g: G, x0: number, y0: number, t: number, pal: Pal, still: boolean): void {
  if (still) return;
  const p = (t / 9) % 1;
  if (p > 0.16) {
    if (p < 0.4) {
      const r = (p - 0.16) / 0.24;
      g.strokeStyle = pal.ink;
      g.lineWidth = 0.9 * pen.lw;
      g.globalAlpha = (1 - r) * 0.45;
      g.beginPath();
      g.ellipse(x0 + 40, y0, 5 + r * 22, 1.5 + r * 4, 0, 0, 6.283);
      g.stroke();
      g.globalAlpha = 1;
    }
    return;
  }
  const u = p / 0.16,
    x = x0 + u * 40,
    y = y0 - Math.sin(Math.PI * u) * 26,
    a = Math.atan2(-Math.cos(Math.PI * u) * 26 * Math.PI, 40);
  crit(g, x, y, 1, pal);
  g.rotate(a);
  g.fillStyle = 'rgb(232,150,96)';
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(-12, -4);
  g.lineTo(-11, 4);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-7, 0);
  g.quadraticCurveTo(0, -5, 9, 0);
  g.quadraticCurveTo(0, 5, -7, 0);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = pal.paper;
  g.beginPath();
  g.ellipse(-1, -0.6, 3, 1.6, 0, 0, 6.283);
  g.fill();
  g.restore();
}
