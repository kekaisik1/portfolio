/** The ways to travel: the wheel, the keys, a swipe on a phone, #links, the skip link and the hint under the greeting. */
import { LAST } from '../content/places';
import { pick, pickAll } from '../lib/dom';
import { worldOfHash } from '../nav/routing';
import { keyTarget, newWheelGate, swipeStep, wheelStep } from './gesture';
import type { Travel } from './travel';

/** things that use a vertical gesture themselves until they reach their edge: the board's rows, a sheet's text */
const SCROLLERS = '.rows, .sheet-body';
/** where a swipe is not travel */
const NO_SWIPE = '.board, .bar, .veil, dialog';

/** Can the scrollable thing under `target` still move in this direction? Then the gesture is its, not ours. */
function scrollerUses(target: EventTarget | null, dy: number): boolean {
  const el = target instanceof Element ? target.closest<HTMLElement>(SCROLLERS) : null;
  if (!el || el.scrollHeight - el.clientHeight < 2) return false;
  if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  return el.scrollTop > 0;
}

const modalOpen = (): boolean => document.querySelector('dialog[open]') !== null;

export function initInput(travel: Travel, onFirstInput: () => void): void {
  const gate = newWheelGate();
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || modalOpen()) return;
      if (scrollerUses(e.target, e.deltaY)) return;
      const d = wheelStep(gate, performance.now(), e.deltaY, e.deltaX);
      if (d) travel.step(d);
    },
    { passive: true },
  );

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || modalOpen()) return;
    const tag = e.target instanceof Element ? e.target.tagName : '';
    if (/^(INPUT|TEXTAREA|SELECT|VIDEO)$/.test(tag)) return;
    const to = keyTarget(e.key, travel.heading(), LAST);
    if (to === null) return;
    e.preventDefault();
    travel.go(to);
  });

  let start: { x: number; y: number; target: EventTarget | null; down: boolean; up: boolean } | null = null;
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1 || modalOpen()) {
        start = null;
        return;
      }
      const t = e.touches[0];
      /* decided at the start of the gesture: may the thing under the finger scroll instead? */
      start = {
        x: t.clientX,
        y: t.clientY,
        target: e.target,
        down: scrollerUses(e.target, 1),
        up: scrollerUses(e.target, -1),
      };
    },
    { passive: true },
  );
  window.addEventListener(
    'touchend',
    (e) => {
      const s = start;
      start = null;
      if (!s || e.changedTouches.length < 1) return;
      const t = e.changedTouches[0];
      const d = swipeStep(t.clientX - s.x, t.clientY - s.y);
      if (!d) return;
      if (s.target instanceof Element && s.target.closest(NO_SWIPE)) return;
      if (d > 0 ? s.down : s.up) return;
      travel.step(d);
    },
    { passive: true },
  );

  window.addEventListener('hashchange', () => {
    const i = worldOfHash(location.hash);
    if (i >= 0 && i !== travel.current()) travel.go(i);
  });

  pick(document, '.skip').addEventListener('click', (e) => {
    e.preventDefault();
    travel.go(1, { focus: true });
  });
  pick(document, '.mark').addEventListener('click', (e) => {
    e.preventDefault();
    travel.go(0, { focus: true });
  });
  for (const b of pickAll<HTMLElement>(document, '[data-go]'))
    b.addEventListener('click', () => travel.go(Number(b.dataset.go), { focus: true }));

  for (const type of ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const)
    window.addEventListener(type, onFirstInput, { once: true, passive: true });
}
