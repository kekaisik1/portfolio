/**
 * Layout: measure the page, decide how far the journey runs and where each country, place and dusk falls,
 * and (re)generate the drawing when the size has really changed.
 */
import { fitInside } from '../inside/inside';
import { clamp } from '../lib/math';
import { applyDom, buildNav } from '../nav/horizon';
import { finishObjects, placeWide, sizeSpots } from '../places/objects';
import { aboutEl, canvas, journey, moonSpot, mqWide, root, sections, stage, track, writeWrap } from './dom';
import { measureHaze } from './haze';
import { placeLantern } from './lanterns';
import { DEFS, genLayer } from './layers';
import { genMoving, makeSprites } from './sprites';
import { hz, nc, skyc } from './sheets';
import { S, TILE } from './state';
import { schedulePump } from './tiles';
import { duskNow, readTarget, sAtY } from './zones';

/* where the words ended up. If the typefaces arrive and none of this has moved, the drawing made for it is still right. */
export function wordsAt(): string {
  const tr = track.getBoundingClientRect();
  let sig = track.scrollWidth + 'x' + root.scrollHeight;
  for (const el of track.querySelectorAll('.hero-text, .cap, .block, .hero-text > *, .block > *')) {
    const q = el.getBoundingClientRect();
    sig +=
      '|' +
      (q.left - tr.left).toFixed(1) +
      ',' +
      (q.top - tr.top).toFixed(1) +
      ',' +
      q.width.toFixed(1) +
      ',' +
      q.height.toFixed(1);
  }
  return sig;
}
/** most device pixels per CSS pixel the animated scene is drawn at */
const SCENE_MAX_DPR = 1.5;

export function layout(force: boolean): void {
  const vw = document.documentElement.clientWidth,
    vh = window.innerHeight;
  const wide = mqWide.matches;
  const prevW = S.vw,
    prevWide = S.wide;
  S.wide = wide;
  root.classList.toggle('wide', wide);
  root.style.setProperty('--vw', vw + 'px');
  root.style.setProperty('--H', vh + 'px');
  S.vw = vw;
  S.vh = vh;
  if (!wide) journey.style.height = '';
  track.style.transform = '';
  S.lastTrack = '';
  /* the moving scene is drawn at no more than 1.5 device pixels per pixel: its cached strips are no sharper than that,
     and on a phone or a retina screen the extra pixels cost every frame; still drawings (the rooms) stay sharp */
  S.sharp = Math.min(window.devicePixelRatio || 1, 2);
  S.dpr = Math.min(S.sharp, SCENE_MAX_DPR);
  S.ps = S.dpr >= 1.5 ? 1.5 : 1;
  sizeSpots();
  const H = wide ? vh : Math.max(vh, canvas.clientHeight || vh);
  const regen = force || !S.built || prevW !== vw || prevWide !== wide || Math.abs(H - S.H) > (wide ? 0 : 160);
  if (regen) S.H = H;
  S.R = clamp(S.H * 0.05, 30, 48);
  const last = S.objs[S.objs.length - 1];

  if (wide) {
    const trackW = track.scrollWidth;
    const tr = track.getBoundingClientRect();
    S.B = [0].concat(sections.slice(1).map((sec) => sec.getBoundingClientRect().left - tr.left));
    S.T = clamp(vw * 0.45, 360, 720);
    /* the journey ends with the last words and "write me" framed together */
    const wr = writeWrap.getBoundingClientRect().right - tr.left,
      al = aboutEl.getBoundingClientRect().left - tr.left;
    let end = Math.min((al + wr) / 2 - vw / 2, al - 64);
    end = Math.max(end, Math.min(wr + 40 - vw, al - 24));
    S.sMax = Math.max(1, Math.min(end, Math.max(trackW, wr + 40) - vw));
    journey.style.setProperty('--journey-h', S.sMax + vh + 'px');
    S.END = S.sMax + vw;
    const mr = moonSpot.getBoundingClientRect();
    S.moonT = mr.left - tr.left + mr.width / 2;
    S.moonY = mr.top - stage.getBoundingClientRect().top + mr.height / 2;
    placeWide();
    /* the dusk happens between the last place and the night's first words, with nothing else on screen */
    const tA = last ? last.x + last.def.full[2] * last.sc : S.B[3],
      tN = al;
    const i0 = tA + 12,
      i1 = Math.max(i0 + 240, tN - vw - 12);
    S.dusk = { w0: i0 - vw * 0.85, w1: i0, i0, i1, deep: vw * 0.9 };
    S.sNight = i0;
    S.fireT = tN - vw * 0.22;
    S.targets = sections.map((_sec, i) => (i === 3 ? S.sMax : i ? clamp(S.B[i] - vw * 0.2, 0, S.sMax) : 0));
    S.stops = [0].concat(
      S.objs.map((o) => clamp(o.x + ((o.def.hit[0] + o.def.hit[2]) / 2) * o.sc - vw / 2, 0, S.sMax)),
      [S.sMax],
    );
    S.maxScroll = S.sMax;
  } else {
    /* long segments, so the far hills (slow parallax) don't reach the next place's colours too early */
    const seg = Math.max(vw * 5, 1700);
    S.B = [0, seg, seg * 2, seg * 3];
    S.T = seg * 0.3;
    S.sMax = seg * 3.85;
    S.END = S.sMax + vw;
    const maxY = Math.max(1, document.documentElement.scrollHeight - vh);
    const tops = sections.map((sec) => sec.getBoundingClientRect().top + window.scrollY);
    const knots = [[0, 0]];
    /* the country changes only while the gap of pure scenery at a stretch's start is on screen */
    for (let i = 1; i < 4; i++) {
      for (const [y, sv] of [
        [tops[i] - vh * 0.45, S.B[i] - S.T / 2 - vw / 2],
        [tops[i] + vh * 0.2, S.B[i] + S.T / 2 - vw / 2],
      ]) {
        const lastK = knots[knots.length - 1];
        if (y > lastK[0] + 1 && sv > lastK[1] && y < maxY - 1) knots.push([y, sv]);
      }
    }
    knots.push([maxY, S.sMax]);
    S.knots = knots;
    S.moonT = S.sMax + vw * 0.68;
    S.moonY = S.H * 0.15;
    const yA = last ? last.host.getBoundingClientRect().bottom + window.scrollY : tops[3],
      yN = aboutEl.getBoundingClientRect().top + window.scrollY;
    const i0 = yA + 12,
      i1 = Math.max(i0 + 200, yN - vh - 12);
    S.dusk = { w0: i0 - vh * 0.9, w1: i0, i0, i1, deep: vh * 0.9 };
    S.sNight = sAtY(i0);
    S.fireT = null;
    S.avoid = [];
    S.plats = [];
    S.lines = [];
    S.yurtX = S.treeX = S.sheepX = S.popX = S.bridgeX = null;
    S.targets = tops.map((y, i) => (i === 3 ? clamp(yN - vh * 0.25, 0, maxY) : i ? clamp(y + vh * 0.2, 0, maxY) : 0));
    /* each stop sets the place in the middle of the screen, name and all */
    S.stops = [0].concat(
      S.objs.map((o) => {
        const r = o.host.getBoundingClientRect();
        return clamp(r.top + window.scrollY - Math.max(vh * 0.05, (vh - r.height) * 0.42), 0, maxY);
      }),
      [maxY],
    );
    S.maxScroll = maxY;
  }
  S.sunU = vw * 0.62 + (S.wide ? (S.dusk.w0 + S.dusk.w1) / 2 : sAtY((S.dusk.w0 + S.dusk.w1) / 2)) * 0.2;
  canvas.width = Math.round(vw * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);
  hz.width = canvas.width;
  hz.height = canvas.height;
  nc.width = canvas.width;
  nc.height = canvas.height;
  skyc.width = canvas.width;
  skyc.height = canvas.height;
  S.skyKey = S.hazeKey = '';
  if (regen) {
    S.gen++;
    S.introStrokes = [];
    makeSprites();
    S.layers = DEFS.map((d) => genLayer(d, false));
    S.nlayers = DEFS.map((d) => genLayer(d, true));
    S.nlayers.forEach((L) => {
      L.from = Math.max(0, Math.floor(((S.sNight - 200) * L.f) / TILE));
    });
    genMoving();
    S.built = true;
    schedulePump();
  }
  finishObjects();
  measureHaze();
  placeLantern();
  buildNav();
  S.target = readTarget();
  S.s = S.target;
  S.lastDot = '';
  duskNow();
  applyDom();
  if (S.inObj) fitInside();
  S.words = wordsAt();
}
