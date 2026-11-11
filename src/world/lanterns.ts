/**
 * Lanterns: light one on the night beach and it stays up there with the stars.
 * Your own are kept in this browser; with the API they are also everyone's, with a count beside the one on the sand.
 */
import { api } from '../api';
import type { LanternDto } from '../api/schemas';
import { MESSAGES } from '../content/site';
import { clamp, makeNoise } from '../lib/math';
import { aboutEl, lanternBtn, lanternN, sections, track } from './dom';
import { glow } from './draw/pencil';
import { requestDraw } from './scheduler';
import { S } from './state';
import type { G, Lantern } from './types';
import { heightFor, placeAt } from './zones';

const STORAGE_KEY = 'kaisar.lanterns.v1';
/** how many of your own are kept */
const MAX_OWN = 5;
/** how many of everyone's are shown */
const MAX_SHARED = 80;

const stored = (fx: number, fy: number, fs: number): Lantern => ({
  fx,
  fy,
  fs,
  t0: -1,
  x0: 0,
  y0: 0,
  s0: 0,
  ph: 0,
  note: false,
  far: 1,
});
const round4 = (v: number): number => +v.toFixed(4);
const toDto = (l: Lantern): LanternDto => ({ x: round4(l.fx), y: round4(l.fy), s: round4(l.fs) });
const key = (x: number, y: number): string => x.toFixed(4) + ',' + y.toFixed(4);
const isSaved = (l: unknown): l is LanternDto =>
  typeof l === 'object' &&
  l !== null &&
  (['x', 'y', 's'] as const).every((k) => {
    const v = (l as Record<string, unknown>)[k];
    return typeof v === 'number' && isFinite(v) && v >= -1 && v <= 2;
  });

/** Your own lanterns from earlier visits. No storage, or something odd in it, means none. */
export function loadLanterns(): Lantern[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    /* storage is blocked (private mode, a sandbox): lanterns last for this visit only */
    if (err instanceof DOMException) return [];
    throw err;
  }
  let saved: unknown;
  try {
    saved = JSON.parse(raw || '[]');
  } catch (err) {
    if (err instanceof SyntaxError) return [];
    throw err;
  }
  if (!Array.isArray(saved)) return [];
  return saved
    .filter(isSaved)
    .slice(-MAX_OWN)
    .map((l) => stored(l.x, l.y, l.s));
}

function saveLanterns(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(S.lanterns.map(toDto)));
  } catch (err) {
    /* no storage (or it is full): the lantern stays for this visit */
    if (!(err instanceof DOMException)) throw err;
  }
}

export function setLanternCount(n: number): void {
  if (!isFinite(n) || n < 0) return;
  lanternN.textContent = MESSAGES.lanterns(n);
}

/** Everyone else's lanterns: smaller and further off than your own, spread a little so they don't stack. */
export async function loadShared(): Promise<void> {
  const r = await api.getLanterns();
  /* offline, no API, or the API is asleep: your own lanterns still work */
  if (!r.ok) return;
  const mine = new Set(S.lanterns.map((l) => key(l.fx, l.fy)));
  S.shared = r.data.lanterns
    .filter((l) => !mine.has(key(l.x, l.y)))
    .slice(-MAX_SHARED)
    .map((l, i) => ({
      ...stored(l.x + (((i * 0.7548) % 1) - 0.5) * 0.34, clamp(l.y + (((i * 0.5698) % 1) - 0.5) * 0.1, 0.05, 0.4), l.s),
      ph: (i * 2.399) % 6.283,
      far: 0.42 + ((i * 0.618) % 1) * 0.3,
    }));
  setLanternCount(r.data.count);
  requestDraw();
}

async function shareLantern(l: Lantern): Promise<void> {
  const r = await api.postLantern(toDto(l));
  /* on any failure it still hangs in this browser */
  if (r.ok) setLanternCount(r.data.count);
}

/** wide: stand the lantern button on the sand a little before the last words */
export function placeLantern(): void {
  if (!S.wide) {
    lanternBtn.style.left = lanternBtn.style.top = lanternN.style.left = lanternN.style.top = '';
    return;
  }
  const tr = track.getBoundingClientRect(),
    secL = sections[3].getBoundingClientRect().left - tr.left;
  const x = aboutEl.getBoundingClientRect().left - tr.left - Math.min(210, S.vw * 0.15),
    noise = makeNoise(37),
    ground = heightFor('near', noise, x, placeAt(x, S.T), S.H);
  lanternBtn.style.left = x - secL - 24 + 'px';
  lanternBtn.style.top = ground - 40 + 'px';
  lanternN.style.left = x - secL - 60 + 'px';
  lanternN.style.top = ground + 10 + 'px';
}

/**
 * Let a lantern go: from the one on the sand, or (note = true) from a note that was just sent; that one goes higher and bursts.
 */
export function lightLantern(from: HTMLElement = lanternBtn, note = false): void {
  const q = from.getBoundingClientRect(),
    rnd = Math.random;
  const x0 = q.left + q.width / 2,
    y0 = q.top + q.height * 0.55;
  const fx = clamp(x0 / S.vw + (rnd() - 0.4) * 0.28, 0.06, 0.94),
    fy = note ? 0.06 + rnd() * 0.1 : 0.07 + rnd() * 0.26;
  const l: Lantern = {
    fx,
    fy,
    fs: S.s / Math.max(1, S.sMax),
    t0: S.reduce ? -1 : S.time,
    x0,
    y0,
    s0: S.s,
    ph: rnd() * 6.283,
    note,
    far: 1,
  };
  S.lanterns.push(l);
  while (S.lanterns.length > MAX_OWN) S.lanterns.shift();
  saveLanterns();
  void shareLantern(l);
  requestDraw();
}

function drawLantern(c: G, l: Lantern, s: number, t: number): void {
  const endX = l.fx * S.vw + l.fs * S.sMax * 0.06 - S.s * 0.06,
    endY = l.fy * S.H,
    far = l.far;
  let x = endX,
    y = endY,
    sway = Math.sin(t * 0.9 + l.ph) * 0.06;
  if (l.t0 >= 0) {
    const p = clamp((t - l.t0) / 7, 0, 1),
      e = 1 - Math.pow(1 - p, 2.2);
    const sx = l.x0 - (s - l.s0) * 0.06;
    x = sx + (endX - sx) * e + Math.sin(t * 1.3 + l.ph) * 7 * (1 - e);
    y = l.y0 + (endY - l.y0) * e;
    sway = Math.sin(t * 1.6 + l.ph) * 0.16 * (1 - e) + sway * e;
    if (p >= 1) {
      l.t0 = -1;
      if (l.note) l.burst = t;
    }
  }
  if (l.burst !== undefined) {
    /* it reaches the sky and lets go of its sparks */
    const b = (t - l.burst) / 2.8;
    if (b >= 1) l.burst = undefined;
    else {
      const eo = 1 - Math.pow(1 - b, 3);
      glow(c, x, y, 60 + 220 * eo, '255,206,130', 0.55 * (1 - b));
      c.fillStyle = 'rgb(255,220,150)';
      for (let j = 0; j < 44; j++) {
        const a = (j / 44) * 6.283 + l.ph,
          d = 18 + (j % 3) * 16 + eo * (90 + (j % 5) * 38);
        c.globalAlpha = (1 - b) * (j % 2 ? 0.95 : 0.6);
        c.beginPath();
        c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9 + eo * eo * 30, (2.2 + (j % 3)) * (1 - b * 0.7), 0, 6.283);
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  if (x < -40 || x > S.vw + 40) return;
  const k = clamp(1 - (y / S.H - 0.1) * 0.35, 0.72, 1.05) * far;
  glow(c, x, y, 30 * k, '255,190,112', far < 1 ? 0.22 : 0.32);
  c.save();
  c.translate(x, y);
  c.rotate(S.reduce ? 0 : sway);
  c.scale(k, k);
  c.globalAlpha = far < 1 ? 0.6 + far * 0.4 : 1;
  c.fillStyle = 'rgba(244,170,92,.95)';
  c.beginPath();
  c.moveTo(-5.6, -7);
  c.bezierCurveTo(-8.4, -2.5, -8.2, 3.5, -5.2, 7.6);
  c.lineTo(5.2, 7.6);
  c.bezierCurveTo(8.2, 3.5, 8.4, -2.5, 5.6, -7);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,232,170,.95)';
  c.beginPath();
  c.ellipse(0, 1.5, 2.6, 4, 0, 0, 6.283);
  c.fill();
  c.strokeStyle = 'rgba(232,230,240,.75)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-6, -7.2);
  c.lineTo(6.2, -7.4);
  c.moveTo(-5.4, 7.8);
  c.lineTo(5.6, 7.6);
  c.moveTo(-6.3, 1);
  c.quadraticCurveTo(0, 2.2, 6.4, 0.8);
  c.stroke();
  c.restore();
}

/** Everyone's lanterns first (further off), then your own. */
export function drawLanterns(c: G, s: number, t: number): void {
  for (const l of S.shared) drawLantern(c, l, s, t);
  for (const l of S.lanterns) drawLantern(c, l, s, t);
}
