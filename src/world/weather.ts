/**
 * The weather where Kaisar is falls here too: snow as soft dots, rain as short pencil strokes. Near ones are bigger and faster.
 */
import { CHALK, INK, css } from './palette';
import { S } from './state';
import type { G } from './types';

export function drawWeather(c: G, night: boolean): void {
  if (!S.wx) return;
  const vw = S.vw,
    H = S.H,
    t = S.time,
    s = S.s,
    W = vw + 80;
  if (S.wx === 'snow') {
    c.fillStyle = night ? css(CHALK) : '#fff';
    c.strokeStyle = css(INK[0]);
    c.lineWidth = 0.6;
    for (const f of S.flakes) {
      const y = ((f.y + t * (0.035 + f.z * 0.05)) % 1) * (H + 20) - 10;
      let x = (f.x * W + Math.sin(t * 0.7 + f.ph) * 14 * f.z - s * 0.25 * f.z) % W;
      if (x < 0) x += W;
      x -= 40;
      c.globalAlpha = 0.45 + f.z * 0.5;
      c.beginPath();
      c.arc(x, y, 1 + f.z * 2.1, 0, 6.283);
      c.fill();
      if (!night) {
        c.globalAlpha = 0.3 * f.z;
        c.stroke();
      }
    }
  } else if (S.wx === 'rain') {
    c.strokeStyle = night ? css(CHALK) : css(INK[0]);
    c.lineWidth = 1;
    for (const f of S.flakes) {
      const len = 9 + f.z * 15,
        y = ((f.y + t * (0.55 + f.z * 0.6)) % 1) * (H + 40) - 20;
      let x = (f.x * W - y * 0.28 - s * 0.25 * f.z) % W;
      if (x < 0) x += W;
      x -= 40;
      c.globalAlpha = 0.14 + f.z * 0.22;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - len * 0.28, y + len);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
}
