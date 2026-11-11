/** Getting about: the marks on the horizon, the arrow keys, the skip link, and following keyboard focus along the track. */
import { byId, pick } from '../lib/dom';
import { clamp } from '../lib/math';
import { inside, noteDlg, sections, stage, track } from '../world/dom';
import { requestDraw } from '../world/scheduler';
import { S } from '../world/state';
import { duskNow, nearStop, readTarget } from '../world/zones';
import { applyDom, placeLinks } from './horizon';
import { arrowStop } from './routing';

/** Go to stop i (0 = the first screen, then the places, then the end), optionally taking keyboard focus along. */
export function goTo(i: number, focus: boolean): void {
  i = clamp(i, 0, S.stops.length - 1);
  /* wide: jump the scroll position; the scene glides there on its own */
  window.scrollTo({ top: S.stops[i], behavior: S.wide || S.reduce ? 'auto' : 'smooth' });
  requestDraw();
  if (!focus) return;
  const o = S.objs[i - 1];
  const el: HTMLElement | null = o ? o.btn : i ? byId('write') : sections[0].querySelector('h1');
  if (!el) return;
  S.suppress = true;
  if (!i) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  setTimeout(() => {
    S.suppress = false;
  }, 50);
}

export function initTravel(): void {
  placeLinks.forEach((a, k) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(k + 1, true);
    }),
  );
  pick(document, '.skip').addEventListener('click', (e) => {
    e.preventDefault();
    goTo(1, true);
  });

  document.addEventListener('keydown', (e) => {
    if (!S.wide || e.altKey || e.ctrlKey || e.metaKey || inside.open || noteDlg.open) return;
    const tag = e.target instanceof Element ? e.target.tagName : '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const y = readTarget();
      goTo(arrowStop(e.key === 'ArrowRight' ? 1 : -1, y, S.stops, nearStop(y)), false);
    }
  });

  /* Tab to something inside the track: travel to it.
     The scene snaps (no glide) so the focused thing is fully in view */
  track.addEventListener('focusin', (e) => {
    if (!S.wide || S.suppress || !(e.target instanceof Element)) return;
    const host = e.target.closest('.obj, .lantern-btn') || e.target.closest('.block, .hero-text') || e.target;
    const r = host.getBoundingClientRect(),
      tr = track.getBoundingClientRect();
    const x = r.left - tr.left,
      w = r.width,
      now = S.s;
    const inView = x - now >= 24 && x + w - now <= S.vw - 24;
    if (inView && Math.abs(S.target - S.s) < 1) return;
    window.scrollTo(0, inView ? now : clamp(x + w / 2 - S.vw / 2, 0, S.sMax));
    S.target = S.s = clamp(window.scrollY, 0, S.sMax);
    duskNow();
    applyDom();
    requestDraw();
  });

  /* the stage must never scroll by itself (focus can try to): the track is moved with a transform */
  stage.addEventListener('scroll', () => {
    if (stage.scrollLeft || stage.scrollTop) {
      stage.scrollLeft = 0;
      stage.scrollTop = 0;
    }
  });
}
