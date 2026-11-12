/**
 * Laying the journey out for this screen: the scene box, the walk's length, the words' mask alignment, the sizes
 * of labels and where they go, the horizon's word positions. Runs at start, on resize and when the typefaces
 * arrive: this is where layout is read, so that frames never have to.
 */
import { labelSpan } from './timing';
import { scrollOf, LAST, STOPS } from '../scene/stops';
import { TS } from '../paint/masks';
import { occupancyOf } from '../paint/raster';
import { newBox, placementOf, presence, project, viewOf, type Box } from './camera';
import { horizon, hlinks, labelEls, lanternTag, track, veilDay, veilNight, wordsEls } from './dom';
import { planLabel, type Obstacle } from './labels';
import { S } from './state';
import { resetTextLevel } from './text';
import { W, cutOfSlug } from './world';

/** the words' masks are shown at this size (px), and aligned to the screen so neighbours' blotches interlock */
const TEXT_MASK_PX = Math.round(TS * 1.2);
/** the horizon band: labels stay above it */
const BAND = 72;

const boxes = new Map<string, Box>();
const tmpPlace = { x: 0, y: 0, h: 0 };

/** Measure the clear paper behind the words of stop i (when the walk settles there). */
export function updateVeil(i: number): void {
  const w = wordsEls[i];
  if (!w) return;
  const r = w.getBoundingClientRect(),
    v = S.view;
  for (const el of [veilDay, veilNight]) {
    const st = el.style;
    if (v.phone)
      st.setProperty(
        '--vb',
        Math.min(v.H * 0.9, Math.max(v.H * 0.3, r.top + Math.max(r.height, w.scrollHeight))) + 'px',
      );
    else {
      st.setProperty('--vx', r.left + r.width * 0.45 + 'px');
      st.setProperty('--vy', r.top + r.height / 2 + 'px');
      st.setProperty('--vw', r.width * 0.95 + 'px');
      st.setProperty('--vh', Math.max(v.H * 0.3, r.height * 0.9) + 'px');
    }
  }
}

/** The key a label's spot is kept under: one per stop it speaks at (the first place's label also greets you). */
export const spotKey = (slug: string, stop: number): string => `${slug}@${stop}`;

/** Where each place's label goes on this screen, at every stop it shows at (once the paintings in view are in). */
export function planLabels(): void {
  const v = S.view;
  for (const [slug] of labelEls) {
    const self = cutOfSlug(slug),
      size = W.labelSize.get(slug);
    if (!self || !size || !occupancyOf(self.def.k)) continue;
    const [s0, s1] = labelSpan(slug);
    for (let st = s0; st <= s1; st++) {
      if (W.spots.has(spotKey(slug, st))) continue;
      const inView = W.cuts.filter((c) => presence(c.def, st) > 0.3);
      if (inView.some((c) => !occupancyOf(c.def.k))) continue;
      const obstacles: Obstacle[] = [];
      let me: Obstacle | null = null;
      for (const c of inView) {
        let b = boxes.get(c.id);
        if (!b) boxes.set(c.id, (b = newBox()));
        if (!project(c.def, placementOf(c.def, v.phone, tmpPlace), c.size, st, 0, v, b)) continue;
        const occ = occupancyOf(c.def.k);
        if (!occ) continue;
        const o: Obstacle = { box: { ...b }, occ, weight: c.def.far ? 0.5 : 3 };
        if (c === self) me = o;
        else obstacles.push(o);
      }
      if (!me) continue;
      const r = wordsEls[st].getBoundingClientRect();
      const spot = planLabel(me, obstacles, size.w, size.h, {
        W: v.W,
        H: v.H,
        top: 56,
        bottom: v.H - BAND,
        edge: v.phone ? 4 : 44,
        words: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
      });
      if (spot) W.spots.set(spotKey(slug, st), spot);
    }
  }
}

/** Lay everything out again for the current screen. */
export function layout(): void {
  const W0 = window.innerWidth,
    H0 = window.innerHeight;
  S.view = viewOf(W0, H0);
  track.style.height = scrollOf(LAST) + H0 + 'px';
  /* align every words column's mask to one grid on the screen */
  wordsEls.forEach((w) => {
    const r = w.getBoundingClientRect(),
      mx = -(((r.left % TEXT_MASK_PX) + TEXT_MASK_PX) % TEXT_MASK_PX),
      my = -(((r.top % TEXT_MASK_PX) + TEXT_MASK_PX) % TEXT_MASK_PX);
    w.style.setProperty('--mpos', `${mx.toFixed(0)}px ${my.toFixed(0)}px`);
    resetTextLevel(w);
  });
  /* labels: measured with their words showing (the hover line takes the same room) */
  for (const [slug, lb] of labelEls) {
    W.labelSize.set(slug, { w: lb.offsetWidth || 220, h: lb.offsetHeight || 60 });
  }
  W.tagSize = { w: lanternTag.offsetWidth || 200, h: lanternTag.offsetHeight || 80 };
  W.spots.clear();
  planLabels();
  const ol = horizon.querySelector('ol');
  if (ol) {
    const base = ol.getBoundingClientRect().left;
    W.hx = hlinks.map((a) => {
      const r = a.getBoundingClientRect();
      return r.left - base + r.width / 2 - 3;
    });
  }
  updateVeil(Math.max(0, Math.min(STOPS.length - 1, Math.round(S.target))));
}
