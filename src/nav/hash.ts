/**
 * Links to a country (#sea) or to one place (#emberquill) open there. The browser's own jump can't be trusted:
 * wide, the track moves sideways under a sticky stage; narrow, the drawings change the page's length after load.
 */
import { clamp } from '../lib/math';
import { sections, track } from '../world/dom';
import { requestDraw } from '../world/scheduler';
import { S } from '../world/state';
import { duskNow, readTarget } from '../world/zones';
import { applyDom, replaceAddress } from './horizon';
import { hashTarget } from './routing';

/** Travel to whatever the address points at. Returns false when it points at nothing on the journey. */
export function goHash(): boolean {
  const id = hashTarget(location.hash);
  const el = id ? document.getElementById(id) : null;
  if (!el || !track.contains(el)) return false;
  const si = sections.indexOf(el),
    pi = S.objs.findIndex((o) => o.host === el);
  let y;
  if (si >= 0) y = S.targets[si];
  else if (pi >= 0) y = S.stops[pi + 1];
  else if (S.wide) {
    const host = el.closest('.block, .hero-text') || el,
      r = host.getBoundingClientRect(),
      tr = track.getBoundingClientRect();
    y = clamp(r.left - tr.left + r.width / 2 - S.vw / 2, 0, S.sMax);
  } else y = clamp(el.getBoundingClientRect().top + window.scrollY - S.vh * 0.12, 0, S.maxScroll);
  window.scrollTo(0, y);
  S.hashY = window.scrollY;
  S.target = S.s = readTarget();
  S.lastPlace = -1;
  duskNow();
  applyDom();
  requestDraw();
  return true;
}

/**
 * Around the moment the page finishes loading the browser retries its own jump to the #link, and on the sideways track
 * that walks off towards the end. Hold the spot until it has given up, or until you move.
 */
export function holdHash(): void {
  const moves = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
  const want = location.hash;
  let holding = true;
  const hold = (): void => {
    if (!holding) return;
    if (Math.abs(window.scrollY - S.hashY) > 4) {
      /* by now the address may already name the place it was dragged to: put the link back first */
      if (location.hash !== want) replaceAddress(want);
      goHash();
    }
    requestAnimationFrame(hold);
  };
  const letGo = (): void => {
    holding = false;
    moves.forEach((m) => window.removeEventListener(m, letGo));
  };
  moves.forEach((m) => window.addEventListener(m, letGo, { passive: true }));
  window.addEventListener('load', () => setTimeout(letGo, 3000), { once: true });
  requestAnimationFrame(hold);
}

export function initHash(): void {
  window.addEventListener('hashchange', () => {
    if (S.skipHash) {
      S.skipHash = false;
      return;
    }
    goHash();
  });
}
