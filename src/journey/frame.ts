/**
 * One frame of the journey. Reads the scroll position (never layout), moves the camera a little towards it, and
 * writes transforms and opacities; a canvas or a mask is only redrawn when a dissolve level changes. The loop runs
 * while something is moving and stops when everything has settled; scrolling, resizing or opening a place wakes it.
 */
import { MESSAGES } from '../content/site';
import { clamp, easeOut, sstep } from '../lib/math';
import { nearest, STOPS, COUNTRY_START, LAST, atScroll } from '../scene/stops';
import { bandFade, fogOf, nightAt, placementOf, presence, project } from './camera';
import { drawLevel, type Cut } from './cuts';
import { spotKey } from './layout';
import { hdot, hlinks, labelEls, lanternTag, nightSky, root, veilDay, veilNight, where, wordsEls } from './dom';
import { S } from './state';
import { setTextLevel } from './text';
import { LV, horizonDot, invertedAt, labelAlpha, labelSpan, levelOf, wordAlpha } from './timing';
import { W, cutById } from './world';

/** how long a painting takes to soak in once it has arrived (ms) */
const SOAK_MS = 1200;
/** the greeting's words soak in over this long */
const INTRO_MS = 900;
/** opening a place: everything outside drifts away over this long */
const OPEN_MS = 500;
/** camera smoothing per 60 Hz frame */
const EASE = 0.085;

const COUNTRY_STARTS = [COUNTRY_START.mountains, COUNTRY_START.steppe, COUNTRY_START.sea, COUNTRY_START.night];

interface BoundLabel {
  slug: string;
  el: HTMLButtonElement;
  cut: Cut;
  span: readonly [number, number];
}
let labels: BoundLabel[] = [];
/** Pair each label with its object, once the cut-outs exist. */
export function bindLabels(): void {
  labels = [];
  for (const [slug, el] of labelEls) {
    const cut = W.cuts.find((c) => c.def.slug === slug);
    if (cut) labels.push({ slug, el, cut, span: labelSpan(slug) });
  }
}
/** where the lantern button stands on the string-of-lanterns painting (shares of its box) */
const TAG_AT = { fx: 0.05, fy: 0.9 };

let onSettle: (i: number) => void = () => undefined;
/** Called once the walk comes to rest at a stop (the veil behind its words is measured then). */
export const setOnSettle = (fn: (i: number) => void): void => {
  onSettle = fn;
};

const styleCache = new WeakMap<HTMLElement, string>();
/** Write a style property only when it changes. */
function put(el: HTMLElement, prop: 'transform' | 'opacity', v: string): void {
  const k = prop + v;
  if (styleCache.get(el) === k) return;
  styleCache.set(el, k);
  el.style[prop] = v;
}

function announce(i: number): void {
  const st = STOPS[i];
  where.textContent = i === 0 ? '' : MESSAGES.arrived(st.country, st.say);
}

/** Place a label-like element beside a box, kept on screen and out of the top line and horizon band. */
function placeBeside(el: HTMLElement, bx: number, by: number, w: number, h: number): void {
  const v = S.view,
    inset = v.phone ? 8 : EDGE,
    x = Math.round(clamp(bx, inset, v.W - w - inset)),
    y = Math.round(clamp(by, 56, v.H - h - 72));
  put(el, 'transform', `translate3d(${x}px,${y}px,0)`);
}

/** on wide screens labels keep this far from the sides */
const EDGE = 48;

let busy = false;

export function frame(now: number): void {
  S.queued = false;
  const dt = S.last ? Math.min(64, now - S.last) : 16.67;
  S.last = now;
  busy = false;
  const v = S.view;

  S.target = atScroll(window.scrollY);
  if (S.reduce) S.s = Math.round(S.target);
  else {
    S.s += (S.target - S.s) * (1 - Math.pow(1 - EASE, dt / 16.67));
    if (Math.abs(S.target - S.s) < 0.0004) S.s = S.target;
    else busy = true;
  }
  const s = S.s;
  if (S.introAt < 0) S.introAt = now;
  const intro = S.reduce ? 1 : clamp((now - S.introAt) / INTRO_MS, 0, 1);
  if (intro < 1) busy = true;
  if (S.open !== S.openTo) {
    const d = (S.reduce ? 1 : dt / OPEN_MS) * Math.sign(S.openTo - S.open);
    S.open = clamp(S.open + d, 0, 1);
    if (Math.abs(S.open - S.openTo) < 0.01) S.open = S.openTo;
    busy = true;
  }
  const op = easeOut(S.open);

  /* the night rises from the horizon as a wash: its wet warm edge first, deep blue behind */
  const night = nightAt(s);
  put(nightSky, 'transform', `translate3d(0,${Math.round(v.H * (1 - 2 * night))}px,0)`);
  const isNight = night > 0.5;
  if (root.classList.contains('night') !== isNight) root.classList.toggle('night', isNight);
  /* the top line turns light only once the dusk band has risen past it: on the warm band it stays ink */
  const topNight = night > 0.78;
  if (root.classList.contains('night-top') !== topNight) root.classList.toggle('night-top', topNight);
  /* the day's paper glow behind the words leaves before the night is half up: on the dark wash it would read as a
     grey blot. The night's own glow comes in behind it. */
  put(veilDay, 'opacity', (1 - sstep(0.05, 0.4, night)).toFixed(2));
  put(veilNight, 'opacity', sstep(0.3, 0.9, night).toFixed(2));

  for (const c of W.cuts) {
    let a = presence(c.def, s);
    const soak = c.readyAt ? (S.reduce ? 1 : clamp((now - c.readyAt) / SOAK_MS, 0, 1)) : 0;
    if (c.readyAt && soak < 1) busy = true;
    c.onScreen = a > 0 && project(c.def, placementOf(c.def, v.phone, c.place), c.size, s, op, v, c.box);
    if (!c.onScreen) a = 0;
    else if (!c.def.far) a *= bandFade(c.box.sy, v.R.y + c.place.y * v.R.h, v.H);
    a *= soak * (1 - op);
    c.a = a;
    const L = c.readyAt ? levelOf(a, S.reduce) : 0;
    if (L === 0) {
      if (c.visible) {
        c.el.style.visibility = 'hidden';
        c.visible = false;
      }
      c.L = 0;
      continue;
    }
    if (!c.visible) {
      c.el.style.visibility = 'visible';
      c.visible = true;
    }
    if (L !== c.L) {
      drawLevel(c, L);
      c.L = L;
    }
    const b = c.box,
      tf = `translate3d(${b.left.toFixed(1)}px,${b.top.toFixed(1)}px,0) scale(${b.k.toFixed(4)})`;
    if (tf !== c.lastTf) {
      c.el.style.transform = tf;
      c.lastTf = tf;
    }
    const fog = fogOf(c.def, b.z).toFixed(2);
    if (fog !== c.lastFog) {
      c.el.style.opacity = fog;
      c.lastFog = fog;
    }
  }

  /* words: the next stop's arrive while the last ones leave, in complementary blotches */
  for (let i = 0; i < wordsEls.length; i++) {
    let a = wordAlpha(i, s) * (1 - op);
    if (i === 0) a *= intro;
    setTextLevel(wordsEls[i], levelOf(a, S.reduce), invertedAt(i));
  }

  /* labels: the current place's, beside its object, travelling with it */
  const focused = document.activeElement;
  for (const { slug, el: lb, cut: c, span } of labels) {
    /* day labels leave before the night wash reaches them */
    let a = c.onScreen ? clamp(c.a * 1.6 - 0.3, 0, 1) * labelAlpha(span, s) * (1 - sstep(0.15, 0.35, night)) : 0;
    if (lb === focused && c.onScreen) a = Math.max(a, 1 - op);
    setTextLevel(lb, levelOf(a, S.reduce));
    if (!c.onScreen || a <= 0) continue;
    const sz = W.labelSize.get(slug) ?? { w: 220, h: 60 },
      sp = W.spots.get(spotKey(slug, clamp(nearest(s), span[0], span[1]))),
      b = c.box;
    if (sp) placeBeside(lb, b.left + sp.fx * b.w, b.top + sp.fy * b.h, sz.w, sz.h);
    else placeBeside(lb, b.left + b.w * 0.8, b.top + b.h * 0.2, sz.w, sz.h);
  }

  /* the lantern button stands on the ground under the string of lanterns */
  const lc = cutById('lanterns');
  if (lc) {
    const a = lc.onScreen ? clamp(lc.a * 1.4 - 0.2, 0, 1) * wordAlpha(LAST, s) : 0;
    setTextLevel(lanternTag, lanternTag.contains(focused) && lc.onScreen ? LV : levelOf(a, S.reduce));
    if (lc.onScreen) {
      const b = lc.box;
      placeBeside(lanternTag, b.left + TAG_AT.fx * b.w, b.top + TAG_AT.fy * b.h, W.tagSize.w, W.tagSize.h);
    }
  }

  /* the horizon: the dot walks along the countries' words */
  if (W.hx.length) {
    put(hdot, 'transform', `translateX(${horizonDot(s, W.hx, COUNTRY_STARTS).toFixed(1)}px)`);
    const country = STOPS[nearest(s)].country;
    for (const a of hlinks) {
      const cur = a.dataset.country === country;
      if ((a.getAttribute('aria-current') === 'location') !== cur) {
        if (cur) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    }
  }

  const rs = Math.round(S.target);
  if (rs !== S.shown && Math.abs(S.target - S.s) < 0.02) {
    S.shown = rs;
    announce(rs);
    onSettle(rs);
  }
  if (busy) requestFrame();
}

/** Ask for a frame (at most one is ever queued). */
export function requestFrame(): void {
  if (S.queued) return;
  S.queued = true;
  requestAnimationFrame(frame);
}
