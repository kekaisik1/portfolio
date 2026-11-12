/**
 * Getting about: the arrow keys from stop to stop, the horizon's country words, the skip link and "Scroll to walk
 * in", and following keyboard focus: tabbing to anything in a stop walks there.
 */
import { pick, pickAll } from '../lib/dom';
import { COUNTRY_START, LAST, STOPS, nearest, scrollOf } from '../scene/stops';
import type { ZoneId } from '../content/types';
import { hlinks, inside, labelEls, noteDlg, stopEls, wordsEls } from '../journey/dom';
import { requestFrame } from '../journey/frame';
import { S } from '../journey/state';
import { arrowStop } from './routing';

const SCROLLS = STOPS.map((_, i) => scrollOf(i));

/** What keyboard focus goes to at a stop: the place's label, or the stop's words. */
function focusTarget(i: number): HTMLElement | null {
  const slug = STOPS[i].slug;
  if (slug) return labelEls.get(slug) ?? null;
  const w = wordsEls[i];
  if (!w) return null;
  if (!w.hasAttribute('tabindex')) w.tabIndex = -1;
  return w;
}

/** Move focus without the page treating it as someone tabbing there. */
export function focusQuietly(el: HTMLElement): void {
  S.suppress = true;
  el.focus({ preventScroll: true });
  setTimeout(() => {
    S.suppress = false;
  }, 60);
}

/** Walk to stop i, optionally taking keyboard focus along. */
export function goTo(i: number, focus = false): void {
  i = Math.max(0, Math.min(LAST, i));
  window.scrollTo({ top: SCROLLS[i], behavior: 'instant' });
  /* reduced motion has no glide: the frame lands at once */
  if (S.reduce) S.s = i;
  requestFrame();
  if (!focus) return;
  const el = focusTarget(i);
  if (el) focusQuietly(el);
}

export function initTravel(): void {
  hlinks.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(COUNTRY_START[(a.dataset.country ?? 'mountains') as ZoneId], true);
    }),
  );
  pick(document, '.skip').addEventListener('click', (e) => {
    e.preventDefault();
    goTo(1, true);
  });
  for (const b of pickAll<HTMLElement>(document, '[data-go]'))
    b.addEventListener('click', () => goTo(Number(b.dataset.go), true));

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || inside.open || noteDlg.open) return;
    const tag = e.target instanceof Element ? e.target.tagName : '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown',
      back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    if (!fwd && !back) return;
    e.preventDefault();
    const y = window.scrollY;
    goTo(arrowStop(fwd ? 1 : -1, y, SCROLLS, nearest(y / SCROLLS[1])));
  });

  /* Tab to anything in a stop: walk there */
  stopEls.forEach((a, i) =>
    a.addEventListener('focusin', () => {
      if (S.suppress || nearest(S.target) === i) return;
      goTo(i);
    }),
  );
}
