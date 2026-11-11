/**
 * The horizon: a pencil line along the bottom, a mark for each place, and you, walking along.
 * Also where the page's own state follows the journey: the address, and day or night for the chrome.
 */
import { byId, pick, pickAll } from '../lib/dom';
import { clamp, mulberry32 } from '../lib/math';
import { root, sections, track } from '../world/dom';
import { S } from '../world/state';
import { currentPlace, nearStop } from '../world/zones';

const nav = byId('horizon');
const navWrap = pick(nav, '.wrap');
const navSvg = pick<SVGSVGElement>(nav, 'svg');
const line1 = pick<SVGPathElement>(navSvg, '.ln1');
const line2 = pick<SVGPathElement>(navSvg, '.ln2');
const ticks = pick<SVGGElement>(navSvg, '.ticks');
const youG = pick<SVGGElement>(nav, '.you-g');
/** the links along the line: one per place, then the end */
export const placeLinks = pickAll<HTMLAnchorElement>(nav, '.place');

const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag: string, attrs: Record<string, string>): SVGElement {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

/** Draw the line and put a mark where each stop falls along it. */
export function buildNav(): void {
  const w = navWrap.clientWidth;
  S.navW = w;
  navSvg.setAttribute('viewBox', `0 0 ${w} 20`);
  const r = mulberry32(8);
  const ly = (x: number): number => 10 + Math.sin(x * 0.013) * 1.4 + Math.sin(x * 0.047 + 1) * 0.6;
  S.navLineY = ly;
  let d1 = '',
    d2 = '';
  for (let x = -4; x <= w + 6; x += 10)
    d1 += (d1 ? 'L' : 'M') + x.toFixed(1) + ' ' + (ly(x) + (r() - 0.5) * 0.6).toFixed(2);
  for (let x = -2; x <= w + 3; x += 13)
    d2 += (d2 ? 'L' : 'M') + x.toFixed(1) + ' ' + (ly(x) + 0.9 + (r() - 0.5) * 0.8).toFixed(2);
  line1.setAttribute('d', d1);
  line2.setAttribute('d', d2);
  ticks.textContent = '';
  placeLinks.forEach((a, k) => {
    const i = k + 1,
      x = clamp((S.stops[i] / S.maxScroll) * w, 3, w - 3),
      y = ly(x),
      o = S.objs[k];
    a.style.left = x.toFixed(1) + 'px';
    const X = (dx: number): string => (x + dx).toFixed(1),
      Y = (dy: number): string => (y + dy).toFixed(1);
    /* work: a post on the line. play: a small flag. the end: a ring, for the moon */
    const d = !o
      ? `M${X(4)} ${Y(-8)}a4 4 0 1 1 -.1 0`
      : o.p.group === 'work'
        ? `M${X(0)} ${Y(1)}L${X(0.5)} ${Y(-8)}M${X(-3)} ${Y(-6)}L${X(3.6)} ${Y(-6.4)}`
        : `M${X(0)} ${Y(1)}L${X(0.4)} ${Y(-9)}L${X(6)} ${Y(-6.6)}L${X(0.4)} ${Y(-4.6)}`;
    ticks.appendChild(svgEl('path', { class: 'tick', d }));
  });
}

/** Every frame: move the track and the walker, and keep the address, the current mark and day/night in step. */
export function applyDom(): void {
  if (S.wide) {
    const tf = `translate3d(${(-S.s).toFixed(2)}px,0,0)`;
    if (tf !== S.lastTrack) {
      track.style.transform = tf;
      S.lastTrack = tf;
    }
  }
  const at = S.wide ? S.s : window.scrollY;
  const x = clamp(at / S.maxScroll, 0, 1) * S.navW + S.nudge,
    walked = at * 0.03 + S.nudge * 0.3;
  const y = (S.navLineY ? S.navLineY(x) : 10) - 7 - Math.abs(Math.sin(walked)) * 2.2;
  const key = x.toFixed(1) + ',' + y.toFixed(1);
  if (key !== S.lastDot) {
    youG.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    S.lastDot = key;
  }
  const st = nearStop(at);
  if (st !== S.lastStop) {
    placeLinks.forEach((a, k) => {
      if (k + 1 === st) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    S.lastStop = st;
  }
  const p = currentPlace();
  if (p !== S.lastPlace) {
    /* the address follows you, so a copied link opens where you were standing */
    if (S.lastPlace !== -1 && !S.inObj) replaceAddress(p ? '#' + sections[p].id : location.pathname + location.search);
    S.lastPlace = p;
  }
  const sky = S.D.ind > 0.5 ? 'night' : 'day';
  if (sky !== S.sky) {
    root.dataset.sky = sky;
    S.sky = sky;
  }
}

/** Change the address without adding a step to the history. Where that is not allowed the address just stays put. */
export function replaceAddress(url: string): void {
  try {
    history.replaceState(null, '', url);
  } catch (err) {
    /* file:// or a sandboxed frame refuses with a SecurityError */
    if (!(err instanceof DOMException)) throw err;
  }
}
