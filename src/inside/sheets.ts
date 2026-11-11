/**
 * Each place writes on its own kind of paper: an appointment book, a till receipt, a job sheet on a clipboard,
 * a scroll, a sealed letter, an index card on a pin, a sheet of squared manuscript paper.
 */
import { mulberry32 } from '../lib/math';
import { arc, inkLine } from '../world/draw/pencil';
import type { G, SheetKind } from '../world/types';

export function sheetArt(theme: SheetKind, g: G, w: number, h: number): void {
  const rnd = mulberry32(31 + theme.length * 17 + Math.round(w)),
    red = '#B8492F',
    ink = '#2B2D33';
  const poly = (p: number[]) => {
    g.beginPath();
    g.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
    g.closePath();
  };
  const rules = (xa: number, xb: number, ya: number, yb: number, sp: number, col: string, al: number) => {
    g.strokeStyle = col;
    g.globalAlpha = al;
    g.lineWidth = 1;
    g.beginPath();
    for (let y = ya; y < yb; y += sp) {
      g.moveTo(xa, y + (rnd() - 0.5));
      g.lineTo(xb, y + (rnd() - 0.5));
    }
    g.stroke();
    g.globalAlpha = 1;
  };
  let x0 = 7,
    y0 = 7,
    x1 = w - 9,
    y1 = h - 10,
    edge: number[] = [];
  if (theme === 'ticket') {
    g.fillStyle = 'rgba(30,32,44,.14)';
    poly([5, 8, w - 1, 6, w, h, 4, h - 1]);
    g.fill();
    g.fillStyle = '#C8B48C';
    poly([1, 4, w - 5, 2, w - 3, h - 4, 3, h - 3]);
    g.fill();
    inkLine(g, [1, 4, w - 5, 2, w - 3, h - 4, 3, h - 3, 1, 4], rnd, { w: 1.2, a: 0.7 });
    x0 = 14;
    y0 = 26;
    x1 = w - 18;
    y1 = h - 18;
  }
  if (theme === 'ledger') {
    edge = [];
    for (let x = x0, i = 0; x <= x1; x += 11, i++) edge.push(Math.min(x, x1), y0 + (i % 2 ? 7 : 0));
    edge.push(x1, y0 + 4);
    for (let x = x1, i = 0; x >= x0; x -= 11, i++) edge.push(Math.max(x, x0), y1 - (i % 2 ? 7 : 0));
  } else if (theme === 'scroll') {
    edge = [];
    for (let y = y0 + 8; y <= y1 - 8; y += 14) edge.push(x1 - 4 + Math.sin(y * 0.045) * 2.5 + (rnd() - 0.5) * 1.5, y);
    for (let y = y1 - 8; y >= y0 + 8; y -= 14)
      edge.push(x0 + 5 + Math.sin(y * 0.05 + 2) * 2.5 + (rnd() - 0.5) * 1.5, y);
  } else edge = [x0 + 1, y0 + 2, x1 - 2, y0, x1, y1 - 2, x0 + 2, y1];
  if (theme !== 'ticket') {
    g.fillStyle = 'rgba(30,32,44,.13)';
    g.save();
    g.translate(4, 5);
    poly(edge);
    g.fill();
    g.restore();
  }
  g.fillStyle = theme === 'scroll' ? '#F4ECD8' : theme === 'card' ? '#FAF8F0' : '#F8F6EF';
  poly(edge);
  g.fill();
  inkLine(g, edge.concat([edge[0], edge[1]]), rnd, {
    w: 1.1,
    a: 0.7,
    jit: theme === 'ledger' ? 0.3 : 0.8,
    step: theme === 'ledger' ? 4 : 9,
  });
  if (theme === 'book') {
    rules(x0 + 50, x1 - 12, y0 + 40, y1 - 14, 31, ink, 0.1);
    g.strokeStyle = red;
    g.globalAlpha = 0.45;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(x0 + 46, y0 + 8);
    g.lineTo(x0 + 45, y1 - 8);
    g.stroke();
    g.globalAlpha = 1;
    for (let y = y0 + 26; y < y1 - 14; y += 27) {
      g.fillStyle = '#D8D5CA';
      g.beginPath();
      g.arc(x0 + 20, y, 4.2, 0, 6.283);
      g.fill();
      inkLine(g, arc(x0 + 20, y, 4.2, 4.2, 0, 6.4, 10), rnd, { w: 0.9, a: 0.6, passes: 1, jit: 0.3, step: 3 });
      g.strokeStyle = ink;
      g.globalAlpha = 0.75;
      g.lineWidth = 1.6;
      g.beginPath();
      g.ellipse(x0 + 8, y, 12, 4.2, -0.08, Math.PI * 0.92, Math.PI * 2.02);
      g.stroke();
      g.globalAlpha = 1;
    }
  } else if (theme === 'ledger') {
    inkLine(g, [x0 + 12, y0 + 26, x1 - 12, y0 + 25], rnd, { w: 1, a: 0.5, passes: 1 });
    inkLine(g, [x0 + 12, y0 + 30, x1 - 12, y0 + 29.5], rnd, { w: 1, a: 0.5, passes: 1 });
    g.strokeStyle = red;
    g.globalAlpha = 0.28;
    g.lineWidth = 1;
    g.beginPath();
    for (const x of [x1 - 74, x1 - 30]) {
      g.moveTo(x, y0 + 30);
      g.lineTo(x, y1 - 30);
    }
    g.stroke();
    g.globalAlpha = 1;
    inkLine(g, [x0 + 12, y1 - 28, x1 - 12, y1 - 28.5], rnd, { w: 1, a: 0.45, passes: 1 });
  } else if (theme === 'ticket') {
    rules(x0 + 16, x1 - 16, y0 + 78, y1 - 14, 31, ink, 0.08);
    const cx = w / 2;
    g.fillStyle = '#9BA4AE';
    poly([cx - 38, 20, cx - 34, 6, cx + 34, 5, cx + 38, 20, cx + 30, 34, cx - 30, 34]);
    g.fill();
    inkLine(g, [cx - 38, 20, cx - 34, 6, cx + 34, 5, cx + 38, 20, cx + 30, 34, cx - 30, 34, cx - 38, 20], rnd, {
      w: 1.2,
      a: 0.8,
      jit: 0.5,
    });
    inkLine(g, arc(cx, 9, 10, 8, Math.PI, 2 * Math.PI, 8), rnd, { w: 1.4, a: 0.8, passes: 1, jit: 0.3, step: 3 });
    g.fillStyle = '#E9E5D8';
    poly([x1 - 26, y1 - 1, x1, y1 - 27, x1 - 22, y1 - 22]);
    g.fill();
    inkLine(g, [x1 - 26, y1 - 1, x1 - 22, y1 - 22, x1, y1 - 27], rnd, { w: 1, a: 0.6, passes: 1, jit: 0.4 });
  } else if (theme === 'scroll') {
    for (const y of [y0 + 2, y1 - 16]) {
      g.fillStyle = '#E4D3A8';
      poly([x0 - 4, y, x1 + 5, y - 1, x1 + 5, y + 15, x0 - 4, y + 16]);
      g.fill();
      inkLine(g, [x0 - 4, y, x1 + 5, y - 1], rnd, { w: 1.2, a: 0.75 });
      inkLine(g, [x0 - 4, y + 16, x1 + 5, y + 15], rnd, { w: 1.2, a: 0.75 });
      inkLine(g, [x0 + 8, y + 6, x1 - 30, y + 5.5], rnd, { w: 0.8, a: 0.3, passes: 1 });
      for (const x of [x0 - 4, x1 + 5]) {
        g.fillStyle = '#7E6747';
        g.beginPath();
        g.ellipse(x, y + 7.5, 4.5, 9, 0, 0, 6.283);
        g.fill();
        inkLine(g, arc(x, y + 7.5, 4.5, 9, 0, 6.4, 10), rnd, { w: 1, a: 0.7, passes: 1, jit: 0.3, step: 3 });
      }
    }
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i % 2 ? 'rgb(236,140,62)' : 'rgb(244,190,96)';
      g.globalAlpha = 0.4 + rnd() * 0.5;
      g.beginPath();
      g.arc(x1 - 22 - rnd() * 60, y1 - 34 - rnd() * 70 * rnd(), 1.2 + rnd() * 1.8, 0, 6.283);
      g.fill();
    }
    g.globalAlpha = 1;
  } else if (theme === 'letter') {
    rules(x0 + 4, x1 - 4, y0 + (y1 - y0) / 3, y1 - 20, (y1 - y0) / 3, ink, 0.13);
    const px = x1 - 46,
      py = y0 + 42;
    inkLine(g, arc(px, py, 25, 25, 0, 6.4, 22), rnd, { w: 1, a: 0.32, passes: 1, jit: 0.4, step: 4 });
    inkLine(g, arc(px, py, 19, 19, 0, 6.4, 18), rnd, { w: 0.8, a: 0.26, passes: 1, jit: 0.4, step: 4 });
    g.save();
    g.translate(px, py);
    g.rotate(-0.22);
    g.fillStyle = ink;
    g.globalAlpha = 0.36;
    g.font = '700 13px Gaegu, cursive';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SOHO', 0, -6);
    g.fillText('1854', 0, 7);
    g.restore();
    const sx = x1 - 40,
      sy = y1 - 38;
    g.fillStyle = red;
    g.beginPath();
    for (let a = 0; a < 6.283; a += 0.4) {
      const r = 17 + Math.sin(a * 3 + 1) * 2.2 + rnd() * 1.6;
      g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.strokeStyle = '#F8F6EF';
    g.globalAlpha = 0.6;
    g.lineWidth = 1.3;
    g.beginPath();
    g.arc(sx, sy, 10, 0, 6.283);
    g.moveTo(sx + 7, sy + 7);
    g.lineTo(sx + 13, sy + 13);
    g.stroke();
    g.globalAlpha = 1;
  } else if (theme === 'card') {
    g.strokeStyle = red;
    g.globalAlpha = 0.55;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(x0 + 3, y0 + 88);
    g.lineTo(x1 - 3, y0 + 87);
    g.stroke();
    g.globalAlpha = 1;
    rules(x0 + 3, x1 - 3, y0 + 119, y1 - 12, 31, '#3D6C96', 0.16);
    const pa = [x0 + 24, y0 + 16],
      pb = [x1 - 26, y0 + 14];
    g.strokeStyle = red;
    g.globalAlpha = 0.9;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(pa[0], pa[1]);
    g.quadraticCurveTo((pa[0] + pb[0]) / 2, y0 + 44, pb[0], pb[1]);
    g.stroke();
    g.globalAlpha = 1;
    for (const p of [pa, pb]) {
      g.fillStyle = 'rgba(30,32,44,.2)';
      g.beginPath();
      g.arc(p[0] + 2, p[1] + 3, 6, 0, 6.283);
      g.fill();
      g.fillStyle = red;
      g.beginPath();
      g.arc(p[0], p[1], 6, 0, 6.283);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)';
      g.beginPath();
      g.arc(p[0] - 2, p[1] - 2, 1.8, 0, 6.283);
      g.fill();
    }
  } else if (theme === 'genko') {
    g.strokeStyle = red;
    g.globalAlpha = 0.3;
    g.lineWidth = 1;
    g.beginPath();
    for (const cx of [x1 - 62, x1 - 36])
      for (let y = y0 + 16; y < y1 - 76; y += 24) {
        g.rect(cx, y, 22, 22);
      }
    g.stroke();
    g.globalAlpha = 1;
    const sx = x1 - 58,
      sy = y1 - 60;
    g.fillStyle = red;
    poly([sx, sy + 1, sx + 39, sy, sx + 40, sy + 40, sx + 1, sy + 39]);
    g.fill();
    g.strokeStyle = '#F8F6EF';
    g.lineWidth = 2.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.globalAlpha = 0.92;
    g.beginPath();
    g.moveTo(sx + 9, sy + 15);
    g.lineTo(sx + 26, sy + 13);
    g.quadraticCurveTo(sx + 31, sy + 22, sx + 23, sy + 33);
    g.moveTo(sx + 18, sy + 7);
    g.quadraticCurveTo(sx + 15, sy + 22, sx + 9, sy + 33);
    g.moveTo(sx + 30, sy + 9);
    g.lineTo(sx + 34, sy + 17);
    g.stroke();
    g.globalAlpha = 1;
  }
}
