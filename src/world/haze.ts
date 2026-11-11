/**
 * The mist the words sit in (wide layout): the sky itself, brought down in front of the far hills wherever there is text.
 */
import { stage, track } from './dom';
import { hz, hzc, skyc } from './sheets';
import { S } from './state';
import type { G } from './types';

export function measureHaze(): void {
  S.hazeV++;
  if (!S.wide) {
    S.haze = [];
    return;
  }
  const tr = track.getBoundingClientRect(),
    st = stage.getBoundingClientRect();
  S.haze = Array.from(document.querySelectorAll('.hero-text, .cap, .block'))
    .filter((el) => !el.closest('#night'))
    .map((el) => {
      const kids = el.children.length ? Array.from(el.children).filter((k) => !k.classList.contains('obj')) : [el];
      let l = Infinity,
        r = -Infinity,
        tp = Infinity,
        bt = -Infinity;
      for (const k of kids) {
        const q = k.getBoundingClientRect();
        if (!q.width) continue;
        l = Math.min(l, q.left);
        r = Math.max(r, q.right);
        tp = Math.min(tp, q.top);
        bt = Math.max(bt, q.bottom);
      }
      if (l === Infinity) return null;
      return { x: l - tr.left, y: tp - st.top, w: r - l, h: bt - tp, pad: 150 };
    })
    .filter((e) => e !== null);
}
/** the part of the mist sheet that has anything on it, in device pixels */
const box = { x: 0, y: 0, w: 0, h: 0 };

export function drawHaze(c: G, s: number): void {
  const g = hzc,
    vw = S.vw,
    H = S.H;
  /* made of the sky, the words' places and where you stand: while none of those change, last frame's mist is still right */
  const key = s + '|' + S.skyV + '|' + S.hazeV + '|' + S.D.w;
  if (key !== S.hazeKey) {
    S.hazeKey = key;
    g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, vw, H);
    let any = false,
      bx0 = Infinity,
      bx1 = -Infinity,
      by0 = Infinity,
      by1 = -Infinity;
    for (const e of S.haze) {
      const x = e.x - s,
        y = e.y,
        x0 = x - e.pad,
        x1 = x + e.w + e.pad;
      if (x1 < 0 || x0 > vw) continue;
      any = true;
      bx0 = Math.min(bx0, x0);
      bx1 = Math.max(bx1, x1);
      by0 = Math.min(by0, y - 62);
      by1 = Math.max(by1, y + e.h + 98);
      const gr = g.createLinearGradient(x0, 0, x1, 0),
        k = (e.pad * 0.85) / (x1 - x0);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(k * 0.5, 'rgba(0,0,0,.6)');
      gr.addColorStop(k, '#000');
      gr.addColorStop(1 - k, '#000');
      gr.addColorStop(1 - k * 0.5, 'rgba(0,0,0,.6)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (let j = 0; j < 8; j++) {
        g.globalAlpha = (j + 1) / 9;
        g.fillRect(x0, y - 62 + j * 7, x1 - x0, 7);
      }
      g.globalAlpha = 1;
      g.fillRect(x0, y - 7, x1 - x0, e.h + 21);
      for (let j = 0; j < 12; j++) {
        g.globalAlpha = (12 - j) / 13;
        g.fillRect(x0, y + e.h + 14 + j * 7, x1 - x0, 7);
      }
      g.globalAlpha = 1;
    }
    S.hazeAny = any;
    if (any) {
      /* the mist is the sky itself, brought down in front of the far hills */
      /* only the part of the sheet that has mist on it is worked on, and later laid over the scene */
      const d = S.dpr;
      box.x = Math.max(0, Math.floor(bx0 * d));
      box.y = Math.max(0, Math.floor(by0 * d));
      box.w = Math.min(hz.width, Math.ceil(bx1 * d)) - box.x;
      box.h = Math.min(hz.height, Math.ceil(by1 * d)) - box.y;
      any = box.w > 0 && box.h > 0;
      S.hazeAny = any;
    }
    if (any) {
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.beginPath();
      g.rect(box.x, box.y, box.w, box.h);
      g.clip();
      g.globalCompositeOperation = 'source-in';
      g.drawImage(skyc, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(250,249,244,${(0.45 * (1 - 0.7 * S.D.w)).toFixed(3)})`;
      g.fillRect(box.x, box.y, box.w, box.h);
      g.restore();
      g.globalCompositeOperation = 'source-over';
    }
  }
  if (!S.hazeAny) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 0.9;
  c.drawImage(hz, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
  c.globalAlpha = 1;
  c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
}
