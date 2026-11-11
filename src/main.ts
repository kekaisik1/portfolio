/**
 * Start-up: wire the parts together and draw the first frame.
 * The page shell (index.html) already holds every word; this adds the drawing and the ways of moving through it.
 */
import './styles/index.css';
import { goInside, initInside } from './inside/inside';
import { whenIdle } from './lib/dom';
import { goHash, holdHash, initHash } from './nav/hash';
import { initTravel } from './nav/travel';
import { initNote } from './note/form';
import { setupObjects } from './places/objects';
import { journey, lanternBtn, mqReduce, mqWide, root, track } from './world/dom';
import { lightLantern, loadLanterns, loadShared } from './world/lanterns';
import { layout, wordsAt } from './world/layout';
import { frame, reveal } from './world/loop';
import { requestDraw, setFrameHandler } from './world/scheduler';
import { makeGrain } from './world/sprites';
import { S } from './world/state';
import { initToday, loadToday } from './world/today';

/** resize settles for this long before the page is laid out again */
const RESIZE_SETTLE_MS = 180;

S.reduce = mqReduce.matches;
setFrameHandler(frame);

/* what is written inside each place stays in the page for screen readers, but its links are not Tab stops there:
   sighted keyboard users meet them inside the place, where they can be seen */
for (const a of track.querySelectorAll<HTMLAnchorElement>('.more a')) a.tabIndex = -1;

makeGrain();
setupObjects(goInside);
S.lanterns = loadLanterns();
lanternBtn.addEventListener('click', () => lightLantern());
initInside();
initTravel();
initHash();
initNote();
initToday();

/* nothing is drawn while the tab is hidden or the journey is off screen */
document.addEventListener('visibilitychange', () => {
  S.visible = !document.hidden;
  S.last = 0;
  if (S.visible) requestDraw();
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver((es) => {
    S.onscreen = es[0].isIntersecting;
    S.last = 0;
    if (S.onscreen) requestDraw();
  }).observe(journey);
}
window.addEventListener('scroll', requestDraw, { passive: true });
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    layout(false);
    requestDraw();
  }, RESIZE_SETTLE_MS);
});
mqWide.addEventListener('change', () => {
  layout(true);
  requestDraw();
});
mqReduce.addEventListener('change', () => {
  S.reduce = mqReduce.matches;
  S.intro = null;
  reveal();
  requestDraw();
});

/* the API is optional and never needed for the first screen: ask once the page is idle */
whenIdle(() => void loadToday(), 4000, 1500);
whenIdle(() => void loadShared(), 4000, 1500);

layout(true);

/* a fresh visit with a #link goes there; a reload or Back keeps the spot the browser remembered */
const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const hashed = (!navEntry || navEntry.type === 'navigate') && goHash();
if (hashed) holdHash();

if (!S.reduce && window.scrollY < 20) {
  /* the first screen draws itself; the words wait for it */
  S.intro = { t0: 0, y0: window.scrollY, skip: false };
  setTimeout(() => {
    if (S.intro || !root.classList.contains('ready')) reveal();
  }, 1400);
} else reveal();
requestDraw();

/* the signs on the places are lettered in the hand typeface: once it is here, they are drawn again */
void document.fonts.ready.then(() => {
  S.objs.forEach((o) => {
    o.view.ok = false;
    o.dirty = true;
  });
  requestDraw();
  if (wordsAt() === S.words) return;
  layout(true);
  if (hashed && Math.abs(window.scrollY - S.hashY) < 4) goHash();
  requestDraw();
});
