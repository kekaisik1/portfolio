/**
 * Life: every place gives off its own small thing, and the more work its project has had, the more of it there is
 * and the further it spreads. The numbers are real commit counts (all time, this week, today) from the API;
 * with no numbers each place gets a little. A big day of work makes its thing bloom across the screen.
 */
import { clamp, hsh } from '../lib/math';
import { INK, css } from './palette';
import { S } from './state';
import { PADB } from '../places/view';
import type { G, LifeKind, LifeSpec, PlaceObj } from './types';

/** one place's emission this frame: where from, how much, how fast, how big */
interface Emit {
  ex: number;
  ey: number;
  t: number;
  ink: string;
  sd: number;
  R: number;
  n: number;
  sp: number;
  boost: number;
  z: number;
}

const forcedGrow = (/[?&]grow=(big|small)\b/.exec(location.search) || [])[1] || '';
export function vigour(slug: string): { g: number; v: number; bloom: boolean } {
  if (forcedGrow) return forcedGrow === 'big' ? { g: 1, v: 1, bloom: true } : { g: 0.1, v: 0, bloom: false };
  const d = S.growth[slug];
  if (!d) return { g: 0.22, v: 0, bloom: false };
  return {
    g: clamp(Math.log10(1 + d.total) / 3, 0.1, 1),
    v: clamp(d.week / 40, 0, 1),
    bloom: d.day >= 12 || d.week >= 50,
  };
}
const KANA = '\u3042\u304B\u3055\u305F\u306A\u306F\u307E\u3084\u3089\u308F',
  DIGITS = '0123456789%+';
/* things that drift up and away from where they start */
function lifeRise(
  c: G,
  e: Emit,
  draw: (x: number, y: number, i: number, p: number, r1: number, r2: number) => void,
): void {
  for (let i = 0; i < e.n; i++) {
    const r1 = hsh(i, 1, e.sd),
      r2 = hsh(i, 2, e.sd),
      r3 = hsh(i, 3, e.sd);
    const p = (e.t * e.sp * (0.6 + 0.8 * r1) + r2) % 1;
    const x = e.ex + (r3 - 0.5) * e.R * 1.4 * (0.25 + p) + Math.sin(p * 7 + r1 * 6.283) * 7,
      y = e.ey - p * e.R * (0.55 + 0.6 * r1);
    c.globalAlpha = Math.min(1, Math.sin(p * Math.PI) * e.boost);
    draw(x, y, i, p, r1, r2);
  }
}
const LIFEKIND: Record<LifeKind, (c: G, e: Emit) => void> = {
  ember(c, e) {
    lifeRise(c, e, (x, y, i, p, r1, r2) => {
      c.fillStyle = i % 3 ? 'rgb(236,140,62)' : 'rgb(244,190,96)';
      c.beginPath();
      c.arc(x, y, (1.4 + 2.4 * r2 * (1 - p * 0.5)) * e.z, 0, 6.283);
      c.fill();
      if (i % 5 === 0) {
        const a = e.t * 0.8 + i,
          z = (5 + 3 * r1) * e.z;
        c.strokeStyle = e.ink;
        c.lineWidth = 1;
        c.beginPath();
        for (let k = 0; k < 4; k++) {
          const q = a + k * 2.094;
          c[k ? 'lineTo' : 'moveTo'](x + Math.cos(q) * z, y + Math.sin(q) * z);
        }
        c.stroke();
      }
    });
  },
  ticket(c, e) {
    c.strokeStyle = e.ink;
    c.lineWidth = 1;
    lifeRise(c, e, (x, y, _i, p, r1) => {
      c.save();
      c.translate(x, y);
      c.rotate(r1 * 6 + p * 1.6);
      c.scale(e.z, e.z);
      c.strokeRect(-5, -3.5, 10, 7);
      c.beginPath();
      c.moveTo(-3, -1);
      c.lineTo(3, -1);
      c.moveTo(-3, 1.2);
      c.lineTo(1, 1.2);
      c.stroke();
      c.restore();
    });
  },
  digit(c, e) {
    c.fillStyle = e.ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    lifeRise(c, e, (x, y, i, _p, _r1, r2) => {
      c.font = `400 ${Math.round((13 + 7 * r2) * e.z)}px Gaegu, cursive`;
      c.fillText(DIGITS[i % DIGITS.length], x, y);
    });
  },
  /* petals come down across the roof instead of going up */
  petal(c, e) {
    for (let i = 0; i < e.n; i++) {
      const r1 = hsh(i, 1, e.sd),
        r2 = hsh(i, 2, e.sd),
        r3 = hsh(i, 3, e.sd);
      const p = (e.t * e.sp * (0.5 + 0.6 * r1) + r2) % 1;
      const x = e.ex + (r3 - 0.5) * e.R * 2 + p * e.R * 0.35 + Math.sin(p * 9 + r1 * 6.283) * 9,
        y = e.ey - e.R * 0.55 + p * e.R * 1.25;
      c.globalAlpha = Math.min(1, Math.sin(p * Math.PI) * e.boost);
      if (i % 7 === 3) {
        c.fillStyle = e.ink;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `400 ${Math.round((14 + 7 * r2) * e.z)}px serif`;
        c.globalAlpha *= 0.6;
        c.fillText(KANA[i % KANA.length], x, y);
        continue;
      }
      c.fillStyle = i % 2 ? 'rgb(226,150,164)' : 'rgb(238,184,190)';
      c.beginPath();
      c.ellipse(x, y, 3.8 * e.z, 2.1 * e.z, r1 * 6 + p * 8, 0, 6.283);
      c.fill();
    }
  },
  /* pages circle the light like birds */
  page(c, e) {
    c.strokeStyle = e.ink;
    c.fillStyle = '#FBFAF6';
    c.lineWidth = 1;
    for (let i = 0; i < e.n; i++) {
      const r1 = hsh(i, 1, e.sd),
        r2 = hsh(i, 2, e.sd),
        r3 = hsh(i, 3, e.sd);
      const a = r1 * 6.283 + e.t * e.sp * 5 * (0.5 + r2) * (i % 2 ? 1 : -1),
        rad = e.R * (0.22 + 0.78 * r3);
      const x = e.ex + Math.cos(a) * rad,
        y = e.ey + Math.sin(a) * rad * 0.42 - e.R * 0.12,
        fl = Math.sin(e.t * 5 + i * 1.7) * 3.2 * e.z,
        z = (4.5 + 3 * r2) * e.z;
      c.globalAlpha = Math.min(1, (0.5 + 0.4 * r1) * e.boost);
      c.beginPath();
      c.moveTo(x - z, y - fl);
      c.lineTo(x, y + 1.5);
      c.lineTo(x + z, y - fl);
      c.lineTo(x, y - 1);
      c.closePath();
      c.fill();
      c.stroke();
    }
  },
  /* the phone: rings going out, like a call */
  ring(c, e) {
    c.strokeStyle = e.ink;
    c.lineWidth = 1.2;
    const k = Math.max(3, Math.round(e.n / 6));
    for (let i = 0; i < k; i++) {
      const p = (e.t * e.sp * 2.4 + i / k) % 1,
        rr = 14 + p * e.R;
      c.globalAlpha = Math.min(1, (1 - p) * 0.7 * e.boost);
      c.beginPath();
      c.arc(e.ex, e.ey, rr, -0.95, -0.2);
      c.stroke();
      c.beginPath();
      c.arc(e.ex, e.ey, rr, Math.PI + 0.2, Math.PI + 0.95);
      c.stroke();
    }
  },
  /* the wash: soap bubbles over the roof */
  bubble(c, e) {
    c.strokeStyle = e.ink;
    c.lineWidth = 1;
    lifeRise(c, e, (x, y, _i, _p, _r1, r2) => {
      const z = (3 + 5 * r2) * e.z;
      c.globalAlpha *= 0.7;
      c.beginPath();
      c.arc(x, y, z, 0, 6.283);
      c.stroke();
      c.beginPath();
      c.arc(x, y, z * 0.6, 3.6, 4.6);
      c.stroke();
    });
  },
};
/* refilled for each place each frame: nothing is allocated while drawing */
const emit: Emit = { ex: 0, ey: 0, t: 0, ink: '', sd: 0, R: 0, n: 0, sp: 0, boost: 0, z: 0 };

/**
 * Where a place's life comes from, on screen. The anchor is given as a fraction of the place's box
 * (wide: the part you can press; narrow: the middle of the scene on its strip of ground) and worked out from
 * where the place stands, so no layout is read while drawing.
 */
function lifeOrigin(o: PlaceObj, L: LifeSpec, out: Emit): void {
  const d = o.def,
    h = d.hit,
    F = d.full;
  if (S.wide) {
    out.ex = o.x + (h[0] + L.ax * (h[2] - h[0])) * o.sc - S.s;
    out.ey = o.base + (h[1] + L.ay * (h[3] - h[1])) * o.sc;
    return;
  }
  const c0 = d.core ? d.core[0] : F[0],
    cw = d.core ? d.core[1] - d.core[0] : F[2] - F[0];
  out.ex = o.left + (c0 + (L.nax ?? L.ax) * cw - o.view.fx0) * o.sc;
  out.ey = o.top - window.scrollY + (L.nay ?? L.ay) * (F[3] - F[1] + PADB) * o.sc;
}

export function drawLife(c: G): void {
  const t = S.time,
    ink = css(INK[0]),
    k = clamp(S.vw / 900, 0.62, 1);
  for (const o of S.objs) {
    if (!o.vis || o.drawn < 1 || o === S.inObj) continue;
    const L = o.def.life;
    if (!L) continue;
    const V = vigour(o.p.slug);
    lifeOrigin(o, L, emit);
    emit.t = t;
    emit.ink = ink;
    emit.sd = o.p.slug.length * 7.31;
    emit.R = (90 + 330 * V.g) * (V.bloom ? 1.8 : 1) * k;
    emit.n = Math.min(180, Math.round((10 + 62 * V.g) * (V.bloom ? 2.2 : 1) * (L.n || 1)));
    emit.sp = 0.07 + 0.07 * V.v;
    /* narrow: it drifts behind the words, so quieter */
    emit.boost = (1 + 0.3 * V.v + 0.3 * clamp(o.hot, 0, 1)) * (S.wide ? 1 : 0.7) * (L.b || 1);
    emit.z = (1.25 + 0.5 * V.g) * (V.bloom ? 1.25 : 1);
    LIFEKIND[L.kind](c, emit);
  }
  c.globalAlpha = 1;
}
