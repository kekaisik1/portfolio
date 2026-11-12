/**
 * Lanterns: light one by the string of lanterns in the night and it hangs there with the others.
 * Your own are kept in this browser (at most five, between the painted ones); with the API they are also
 * everyone's: other people's float far off among the stars, and the count says how many have been lit.
 */
import { api } from '../api';
import type { LanternDto } from '../api/schemas';
import { MESSAGES } from '../content/site';
import { ctx2d, newCanvas } from '../lib/dom';
import { sizeOf } from '../paint/kinds';
import { PAINTED_LANTERNS, sagAt } from '../paint/kinds/night';
import { bitmap } from '../paint/raster';
import { lanternBtn, lanternN } from '../journey/dom';
import { requestFrame } from '../journey/frame';
import { S } from '../journey/state';
import { cutById } from '../journey/world';
import { MAX_OWN, MAX_SHARED, parseStored, skyPlace, slotOf } from './lantern-math';

const STORAGE_KEY = 'kaisar.lanterns.v1';

let own: LanternDto[] = [];

/** Your own lanterns from earlier visits. No storage, or something odd in it, means none. */
export function loadLanterns(): LanternDto[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    /* storage is blocked (private mode, a sandbox): lanterns last for this visit only */
    if (err instanceof DOMException) return [];
    throw err;
  }
  return parseStored(raw);
}

function saveLanterns(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(own));
  } catch (err) {
    /* no storage (or it is full): the lantern stays for this visit */
    if (!(err instanceof DOMException)) throw err;
  }
}

function setLanternCount(n: number): void {
  if (!isFinite(n) || n < 0) return;
  lanternN.textContent = MESSAGES.lanterns(n);
}

/** One painted lantern as its own little canvas, in a cut-out's coordinates (painting units). */
async function lanternEl(x: number, y: number, scale: number, cls: string): Promise<HTMLCanvasElement> {
  const bm = await bitmap('lantern', 1.2),
    { w, h } = sizeOf('lantern'),
    c = newCanvas(bm.width, bm.height);
  ctx2d(c).drawImage(bm, 0, 0);
  c.className = cls;
  c.style.left = x - (w * scale) / 2 + 'px';
  c.style.top = y + 'px';
  c.style.width = w * scale + 'px';
  c.style.height = h * scale + 'px';
  return c;
}

/** Hang your own lanterns on the string, in the order they were lit. */
async function hangOwn(rising: boolean): Promise<void> {
  const cut = cutById('lanterns');
  if (!cut) return;
  const els = Array.from(cut.el.querySelectorAll('.lit'));
  for (let i = 0; i < own.length; i++) {
    if (els[i]) continue;
    const x = slotOf(i, PAINTED_LANTERNS),
      el = await lanternEl(x, sagAt(x), 1, rising && i === own.length - 1 && !S.reduce ? 'lit rise' : 'lit');
    cut.el.append(el);
  }
  els.slice(own.length).forEach((e) => e.remove());
  requestFrame();
}

/** Everyone else's lanterns, far off among the stars. */
export async function loadShared(): Promise<void> {
  const r = await api.getLanterns();
  /* offline, no API, or the API is asleep: your own lanterns still work */
  if (!r.ok) return;
  setLanternCount(r.data.count);
  const stars = cutById('stars');
  if (!stars) return;
  const { w, h } = sizeOf('stars');
  for (const [i, l] of r.data.lanterns.slice(-MAX_SHARED).entries()) {
    const p = skyPlace(l, i, w, h);
    const el = await lanternEl(p.x, p.y, p.scale, 'far-lantern');
    el.style.opacity = p.alpha.toFixed(2);
    stars.el.append(el);
  }
  requestFrame();
}

async function shareLantern(l: LanternDto): Promise<void> {
  const r = await api.postLantern(l);
  /* on any failure it still hangs in this browser */
  if (r.ok) setLanternCount(r.data.count);
}

/** Light a lantern: it rises onto the string (from the button, or from a note that was just sent). */
export function lightLantern(): void {
  const l: LanternDto = { x: Math.random(), y: Math.random() * 0.4, s: 0.5 + Math.random() * 0.5 };
  own.push(l);
  if (own.length > MAX_OWN) {
    own.shift();
    cutById('lanterns')
      ?.el.querySelectorAll('.lit')
      .forEach((e) => e.remove());
  }
  saveLanterns();
  void shareLantern(l);
  void hangOwn(true);
}

export function initLanterns(): void {
  own = loadLanterns();
  lanternBtn.addEventListener('click', () => lightLantern());
  if (own.length) void hangOwn(false);
}
