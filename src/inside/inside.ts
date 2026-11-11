/**
 * Inside a place: the drawing grows until you are standing in it, and its own kind of paper tells you about it.
 * A modal dialog: Esc, the cross, a click outside the paper and the browser's Back all lead out again,
 * and focus returns to the place you came from.
 */
import { ctx2d, pick, pickAll } from '../lib/dom';
import { clamp } from '../lib/math';
import { PADB } from '../places/view';
import { ROOMS } from '../rooms';
import { roomShell } from '../rooms/shell';
import { byId } from '../lib/dom';
import { inside, noteDlg } from '../world/dom';
import { rubGrain } from '../world/draw/grain';
import { glow } from '../world/draw/pencil';
import { Sk, paint, pen } from '../world/draw/sketch';
import { PAPER, css, stop } from '../world/palette';
import { requestDraw } from '../world/scheduler';
import { S } from '../world/state';
import type { PlaceObj, SkOp } from '../world/types';
import { placeNow } from '../world/zones';
import { insideSlug } from '../nav/routing';
import { sheetArt } from './sheets';
import { pencilFrame, showVideo } from './video';

const inWrap = pick(inside, '.in-wrap'),
  inFog = pick(inside, '.in-fog'),
  inArt = pick(inside, '.in-art'),
  inCv = byId<HTMLCanvasElement>('in-cv'),
  inSheet = pick(inside, '.in-sheet'),
  inPaper = pick(inside, '.in-paper'),
  inBg = pick<HTMLCanvasElement>(inside, '.in-bg'),
  inT = byId('in-t'),
  inText = pick(inside, '.in-text'),
  inVid = pick(inside, '.in-vid'),
  inLink = pick(inside, '.in-link'),
  inX = pick(inside, '.in-x');

/** rooms are drawn on a 600 x 440 sheet with a 10 px margin */
const ROOM_W = 620,
  ROOM_H = 460;

let anims: Animation[] = [];
/** going in added a step to the history, so Back is the way out */
let pushed = false;
let sheetRaf = 0;
/** each room's strokes, built the first time you go in */
const roomParts = new Map<string, SkOp[]>();

function stopAnims(): void {
  anims.forEach((a) => a.cancel());
  anims = [];
}

/** The paper the words are written on, drawn to the size the words have made it. */
function drawSheet(): void {
  sheetRaf = 0;
  const o = S.inObj;
  if (!o) return;
  const w = inPaper.clientWidth,
    h = inPaper.clientHeight,
    d = S.dpr;
  if (!w || !h) return;
  inBg.width = Math.round(w * d);
  inBg.height = Math.round(h * d);
  const g = ctx2d(inBg);
  g.setTransform(d, 0, 0, d, 0, 0);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  sheetArt(ROOMS[o.p.slug].sheet, g, w, h);
}

/** The room: drawn once when you come in (and again on resize), to fit its side of the screen. */
export function fitInside(): void {
  const o = S.inObj;
  if (!o) return;
  const room = ROOMS[o.p.slug];
  const bw = inArt.clientWidth,
    bh = inArt.clientHeight,
    sc = Math.max(0.2, Math.min(bw / ROOM_W, bh / ROOM_H)),
    w = ROOM_W * sc,
    h = ROOM_H * sc,
    pr = sc > 1.5 ? Math.min(S.dpr, 1.5) : S.dpr;
  inCv.style.width = w + 'px';
  inCv.style.height = h + 'px';
  inCv.style.left = (bw - w) / 2 + 'px';
  inCv.style.top = (bh - h) / 2 + 'px';
  inCv.width = Math.max(1, Math.round(w * pr));
  inCv.height = Math.max(1, Math.round(h * pr));
  let parts = roomParts.get(o.p.slug);
  if (!parts) {
    /* the seed follows the kind of paper, so each room is the same on every visit */
    const s = Sk(900 + room.sheet.length * 31);
    roomShell(s, room);
    room.draw(s);
    parts = s.parts.base;
    roomParts.set(o.p.slug, parts);
  }
  const g = ctx2d(inCv),
    k = sc * pr;
  g.setTransform(k, 0, 0, k, 10 * k, 450 * k);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  pen.lw = clamp(1.25 / sc, 0.8, 1.8);
  paint(g, parts, o.pal);
  for (const [x, y, r, a] of room.glow || []) glow(g, x, y, r, o.pal.warm, a);
  pen.lw = 1;
  rubGrain(g, inCv);
  const fr = inVid.querySelector<HTMLElement>('.frame');
  if (fr) pencilFrame(fr);
  drawSheet();
}

/** Where the door is, as a point on the drawing: going in means walking at it until it fills your eyes. */
function doorOrigin(o: PlaceObj): string {
  const F = o.def.full,
    d = o.def.door || [0, -40],
    h = F[3] - F[1] + (S.wide ? 0 : PADB);
  return (
    (((d[0] - o.view.fx0) / o.view.fw) * 100).toFixed(1) +
    '% ' +
    (((d[1] * (o.def.sy || 1) - F[1]) / h) * 100).toFixed(1) +
    '%'
  );
}

/** Copy what is written inside the place (it lives in the page, under the place's name) onto the paper. */
function fillPaper(o: PlaceObj): void {
  inT.textContent = o.p.name;
  inText.textContent = '';
  inLink.textContent = '';
  const more = o.host.querySelector('.more');
  if (!more) return;
  for (const n of Array.from(more.children)) {
    const k = n.cloneNode(true) as Element;
    /* on the page these links are kept out of the Tab order (they are not visible there); here they are */
    for (const a of pickAll(k, 'a[tabindex]')) a.removeAttribute('tabindex');
    (k.classList.contains('live') ? inLink : inText).append(k);
  }
}

/** Go inside a place. `fromHistory` = the browser's Forward brought us here, so the address is already right. */
export function goInside(o: PlaceObj, fromHistory = false): void {
  if (inside.open) return;
  S.inObj = o;
  S.inClosing = false;
  S.inSettled = false;
  o.drawn = 1;
  o.going = true;
  fillPaper(o);
  showVideo(inVid, o.p, () => S.inObj === o);
  inPaper.className = 'in-paper t-' + ROOMS[o.p.slug].sheet;
  inFog.style.background = css(stop(PAPER, Math.min(2, placeNow())), 0.975);
  inside.showModal();
  inWrap.scrollTop = 0;
  inSheet.scrollTop = 0;
  fitInside();
  pushed = false;
  if (!fromHistory) {
    try {
      history.pushState({ inside: o.p.slug }, '', '#' + o.p.slug);
      pushed = true;
    } catch (err) {
      /* file:// or a sandbox refuses: Esc and the cross still work */
      if (!(err instanceof DOMException)) throw err;
    }
  }
  stopAnims();
  if (S.reduce) {
    S.inSettled = true;
    return;
  }
  const art = o.view.wrap;
  art.style.transformOrigin = doorOrigin(o);
  const walk = art.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(2.1)', opacity: 1, offset: 0.55 },
      { transform: 'scale(3.4)', opacity: 0 },
    ],
    { duration: 760, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' },
  );
  walk.onfinish = () => {
    S.inSettled = true;
  };
  anims = [
    walk,
    inFog.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 760, easing: 'ease-in' }),
    inArt.animate(
      [
        { opacity: 0, transform: 'scale(.86)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 620, delay: 520, easing: 'cubic-bezier(.15,.7,.2,1)', fill: 'backwards' },
    ),
    inSheet.animate(
      [
        { opacity: 0, transform: 'translateY(22px) rotate(.8deg)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 520, delay: 760, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' },
    ),
    inX.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 900, fill: 'backwards' }),
  ];
  requestDraw();
}

/**
 * Close the dialog. The browser hands focus back to the place's button as it closes; that must not be taken
 * for someone tabbing to it (which would snap the scroll to wherever the glide has got to).
 */
function shut(): void {
  S.suppress = true;
  inside.close();
}

/** Step back outside. `fromHistory` = the browser's Back is already doing it. */
export function leaveInside(fromHistory = false): void {
  if (!inside.open || S.inClosing) return;
  /* Back is the same door: if going in added a step to the history, leaving takes it away again */
  const state: unknown = history.state;
  if (!fromHistory && pushed && typeof state === 'object' && state !== null && 'inside' in state) {
    history.back();
    return;
  }
  S.inClosing = true;
  const v = inVid.querySelector('video');
  if (v) v.pause();
  if (S.reduce || !S.inObj) {
    shut();
    return;
  }
  stopAnims();
  const out = S.inObj.view.wrap.animate(
    [
      { transform: 'scale(3.4)', opacity: 0 },
      { transform: 'scale(1.6)', opacity: 1, offset: 0.5 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration: 520, easing: 'cubic-bezier(.2,.6,.3,1)' },
  );
  anims = [
    out,
    inFog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }),
    inArt.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'scale(.9)' },
      ],
      { duration: 200, fill: 'forwards' },
    ),
    inSheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }),
    inX.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }),
  ];
  out.onfinish = shut;
  requestDraw();
}

export function initInside(): void {
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (S.inObj && !sheetRaf) sheetRaf = requestAnimationFrame(drawSheet);
    }).observe(inPaper);
  }
  inside.addEventListener('cancel', (e) => {
    e.preventDefault();
    leaveInside();
  });
  inside.addEventListener('close', () => {
    stopAnims();
    inVid.textContent = '';
    const o = S.inObj;
    S.inObj = null;
    S.inClosing = false;
    S.inSettled = false;
    if (o) {
      o.dirty = true;
      /* focus goes back to the place you came from, without the page travelling anywhere */
      S.suppress = true;
      o.btn.focus({ preventScroll: true });
      setTimeout(() => {
        S.suppress = false;
      }, 60);
    }
    requestDraw();
  });
  inside.addEventListener('click', (e) => {
    if (e.target instanceof Element && !e.target.closest('.in-paper')) leaveInside();
  });
  /* Tab stays in the room */
  inside.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = pickAll(inside, 'button, a[href], video[controls]').filter((n) => n.getClientRects().length);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) {
      e.preventDefault();
      f[f.length - 1].focus();
    } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
      e.preventDefault();
      f[0].focus();
    }
  });
  /* the journey stays still behind the room; the room itself can still be read with the keys */
  inside.addEventListener('keydown', (e) => {
    if (!/^(PageUp|PageDown|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) return;
    if (e.target instanceof HTMLVideoElement) return;
    e.preventDefault();
    const box = S.wide ? inSheet : inWrap,
      d = /Down|End/.test(e.key) ? 1 : -1;
    box.scrollBy(0, d * (/Arrow/.test(e.key) ? 60 : box.clientHeight * 0.8));
  });
  /* Back from inside a place steps out of it (and Forward goes back in); the address changing must not move you along the track */
  window.addEventListener('popstate', (e) => {
    const slug = inside.open ? null : insideSlug(e.state);
    const o = slug ? S.objs.find((x) => x.p.slug === slug) : undefined;
    if (!inside.open && !o) return;
    S.skipHash = true;
    setTimeout(() => {
      S.skipHash = false;
    }, 150);
    if (inside.open) leaveInside(true);
    else if (o) goInside(o, true);
  });
  /* while a dialog is open the page behind it does not scroll (the dialog's own scrolling parts still do) */
  const holdScroll = (e: Event): void => {
    if (!inside.open && !noteDlg.open) return;
    for (let n = e.target instanceof Element ? e.target : null; n; n = n.parentElement) {
      if (n.matches('.reel-in, .in-sheet, .in-wrap') && n.scrollHeight > n.clientHeight + 1) return;
    }
    e.preventDefault();
  };
  window.addEventListener('wheel', holdScroll, { passive: false });
  window.addEventListener('touchmove', holdScroll, { passive: false });
}
