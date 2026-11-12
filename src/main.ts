/**
 * Start-up: wire the parts together. The page shell (index.html) already holds every word, on bare paper;
 * this adds the paintings, which soak in nearest first, and the ways of moving through them.
 */
import './styles/index.css';
import { goInside, initInside } from './inside/inside';
import { prepareInside } from './inside/painting';
import { whenIdle } from './lib/dom';
import { makeCuts, removeLife, addLife } from './journey/cuts';
import { journey, mqReduce, root } from './journey/dom';
import { bindLabels, requestFrame, setOnSettle } from './journey/frame';
import { layout, updateVeil } from './journey/layout';
import { paintAll } from './journey/paint-order';
import { S } from './journey/state';
import { W } from './journey/world';
import { addressOf, replaceAddress } from './nav/address';
import { goHash, initHash } from './nav/hash';
import { initTravel } from './nav/travel';
import { initLanterns, loadShared } from './night/lanterns';
import { loadToday } from './night/today';
import { initNote } from './note/form';
import { applyPaper, makeTextMasks } from './paint/masks';
import { STOPS, atScroll } from './scene/stops';

/** resize settles for this long before the page is laid out again */
const RESIZE_SETTLE_MS = 160;

S.reduce = mqReduce.matches;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* what is written inside each place stays in the page for screen readers, but its links are not Tab stops there:
   sighted keyboard users meet them inside the place, where they can be seen */
for (const a of journey.querySelectorAll<HTMLAnchorElement>('.more a')) a.tabIndex = -1;

applyPaper(root);
W.cuts = makeCuts((slug) => void goInside(slug));
bindLabels();
initInside();
initTravel();
initHash();
initNote();
initLanterns();

/* the address follows the country you are in (but the first arrival keeps the link it came with) */
let settled = false;
setOnSettle((i) => {
  updateVeil(i);
  const slug = STOPS[i].slug;
  if (slug) prepareInside(slug);
  const c = STOPS[i].country;
  if (settled && c !== S.country && !S.inSlug) replaceAddress(addressOf(c));
  S.country = c;
  settled = true;
});

window.addEventListener('scroll', requestFrame, { passive: true });
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    layout();
    requestFrame();
  }, RESIZE_SETTLE_MS);
});
mqReduce.addEventListener('change', () => {
  S.reduce = mqReduce.matches;
  for (const c of W.cuts) {
    if (S.reduce) removeLife(c);
    else addLife(c, false);
  }
  requestFrame();
});
document.addEventListener('visibilitychange', () => {
  S.last = 0;
  if (!document.hidden) requestFrame();
});

layout();
root.classList.add('ready-nav');
/* a fresh visit with a #link goes there; a reload keeps the spot */
if (!goHash()) S.s = S.target = atScroll(window.scrollY);
requestFrame();
void paintAll();
void makeTextMasks();

/* the typefaces change the size of words and labels: lay out again once they are here */
void document.fonts.ready.then(() => {
  layout();
  requestFrame();
});

/* the API is optional and never needed for the first screen: ask once the page is idle */
whenIdle(() => void loadToday(), 4000, 1500);
whenIdle(() => void loadShared(), 4000, 1500);
