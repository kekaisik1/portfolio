/**
 * Inside a place: the pieces you walked past give way to the finished painting of the whole place, full bleed,
 * with its words, video and link on a sheet of paper. A modal dialog: Esc, "Back outside" and the browser's Back
 * all lead out again, and focus returns to the label you came from.
 */
import { projectBySlug } from '../content/projects';
import { byId, pick, pickAll } from '../lib/dom';
import { clamp, easeOut } from '../lib/math';
import { inside, labelEls, noteDlg, root } from '../journey/dom';
import { requestFrame } from '../journey/frame';
import { S } from '../journey/state';
import { setTextLevel } from '../journey/text';
import { LV } from '../journey/timing';
import { cutOfSlug } from '../journey/world';
import { addressOf, replaceAddress } from '../nav/address';
import { insideSlug } from '../nav/routing';
import { focusQuietly, goTo } from '../nav/travel';
import { STOPS, stopOfSlug } from '../scene/stops';
import { BLOOM_STEPS, bloomMasks, drawBloom, finishedPainting } from './painting';
import { showVideo } from './video';

const paintCv = byId<HTMLCanvasElement>('in-paint'),
  sheet = pick(inside, '.in-sheet'),
  band = pick(inside, '.in-band'),
  scroller = pick(inside, '.in-scroll'),
  title = byId('in-t'),
  text = pick(inside, '.in-text'),
  vid = pick(inside, '.in-vid'),
  linkBox = pick(inside, '.in-link'),
  back = byId<HTMLButtonElement>('back');

const BLOOM_IN_MS = 780,
  BLOOM_OUT_MS = 520,
  SHEET_IN_MS = 700,
  SHEET_DELAY_MS = 380,
  SHEET_OUT_MS = 260;
/** resize settles for this long before the painting is made again */
const RESIZE_SETTLE_MS = 160;

/** going in added a step to the history, so Back is the way out */
let pushed = false;
/** each opening gets a number: late work from an earlier one is dropped */
let token = 0;
let anim = 0;

const phone = (): boolean => S.view.phone;
/** how much of the left the paper covers on wide screens (the sheet's own width) */
const paperWidth = (): number => (phone() ? 0 : sheet.getBoundingClientRect().width);

/** Copy what is written inside the place (it lives in the page, in the stop) onto the paper. */
function fillPaper(slug: string): void {
  const p = projectBySlug(slug);
  title.textContent = p ? p.name : '';
  text.textContent = '';
  linkBox.textContent = '';
  const more = document.getElementById(slug)?.querySelector('.more');
  if (!more) return;
  for (const n of Array.from(more.children)) {
    const k = n.cloneNode(true) as Element;
    /* on the page these links are kept out of the Tab order (they are not visible there); here they are */
    for (const a of pickAll(k, 'a[tabindex]')) a.removeAttribute('tabindex');
    (k.classList.contains('live') ? linkBox : text).append(k);
  }
}

/** Tween the paper (and the Back band) from one dissolve level to another. */
function sheetTo(from: number, to: number, dur: number, delay: number, done?: () => void): void {
  cancelAnimationFrame(anim);
  if (S.reduce) {
    setTextLevel(sheet, to * LV);
    setTextLevel(band, to * LV);
    done?.();
    return;
  }
  const t0 = performance.now() + delay;
  const step = (now: number): void => {
    const t = clamp((now - t0) / dur, 0, 1),
      L = Math.round((from + (to - from) * t) * LV);
    setTextLevel(sheet, L);
    setTextLevel(band, L);
    if (t < 1) anim = requestAnimationFrame(step);
    else done?.();
  };
  anim = requestAnimationFrame(step);
}

let painting: HTMLCanvasElement | null = null;
let masks: HTMLCanvasElement[] = [];
let bloomRaf = 0;

/** Run the bloom forwards (dir 1, opening) or backwards. */
function bloom(dir: 1 | -1, dur: number, done: () => void): void {
  cancelAnimationFrame(bloomRaf);
  const pt = painting;
  if (!pt || S.reduce || !masks.length) {
    if (pt && dir > 0) drawBloom(paintCv, pt, masks.length ? masks : [pt], BLOOM_STEPS);
    paintCv.style.opacity = dir > 0 ? '1' : '0';
    done();
    return;
  }
  paintCv.style.opacity = '1';
  const t0 = performance.now();
  let last = -1;
  const step = (now: number): void => {
    const t = clamp((now - t0) / dur, 0, 1),
      p = dir > 0 ? easeOut(t) : 1 - easeOut(t),
      L = Math.round(p * BLOOM_STEPS);
    if (L !== last) {
      drawBloom(paintCv, pt, masks, L);
      last = L;
    }
    if (t < 1) bloomRaf = requestAnimationFrame(step);
    else done();
  };
  bloomRaf = requestAnimationFrame(step);
}

/** Make (or remake, after a resize) the painting for the screen as it is now. */
async function paint(slug: string, my: number): Promise<boolean> {
  const p = await finishedPainting(slug, window.innerWidth, window.innerHeight, phone(), paperWidth());
  if (my !== token) return false;
  painting = p;
  return true;
}

/** Go inside a place. `fromHistory` = the browser's Forward brought us here, so the address is already right. */
export async function goInside(slug: string, fromHistory = false): Promise<void> {
  if (inside.open || !projectBySlug(slug)) return;
  const my = ++token;
  S.inSlug = slug;
  S.inClosing = false;
  const i = stopOfSlug(slug);
  if (Math.round(S.target) !== i) {
    goTo(i);
    S.s = i;
  }
  fillPaper(slug);
  const p = projectBySlug(slug);
  if (p) showVideo(vid, p, () => S.inSlug === slug && my === token);
  setTextLevel(sheet, 0);
  setTextLevel(band, 0);
  paintCv.style.opacity = '0';
  root.classList.add('is-open');
  inside.showModal();
  focusQuietly(title);
  scroller.scrollTop = 0;
  /* arriving by Forward, the step is already in the history: leaving must take it away too */
  pushed = fromHistory;
  if (!fromHistory) {
    try {
      history.pushState({ inside: slug }, '', '#' + slug);
      pushed = true;
    } catch (err) {
      /* file:// or a sandbox refuses: Esc and Back outside still work */
      if (!(err instanceof DOMException)) throw err;
    }
  }
  S.openTo = 1;
  requestFrame();
  /* the bloom starts from the thing you clicked */
  const c = cutOfSlug(slug),
    v = S.view;
  const ox = c?.onScreen ? clamp((c.box.left + c.box.w * 0.5) / v.W, 0, 1) : 0.62,
    oy = c?.onScreen ? clamp((c.box.top + c.box.h * 0.6) / v.H, 0, 1) : 0.6;
  masks = S.reduce ? [] : bloomMasks(ox, oy, v.H / v.W);
  if (!(await paint(slug, my))) return;
  bloom(1, BLOOM_IN_MS, () => undefined);
  sheetTo(0, 1, SHEET_IN_MS, SHEET_DELAY_MS);
}

/** Close the dialog (the close handler puts everything back). */
function shut(): void {
  S.suppress = true;
  inside.close();
}

/** Step back outside. `fromHistory` = the browser's Back is already doing it. */
export function leaveInside(fromHistory = false): void {
  if (!inside.open || S.inClosing) return;
  /* Back is the same door: if going in added a step to the history, leaving takes it away again */
  const state: unknown = history.state;
  if (!fromHistory && pushed && insideSlug(state) !== null) {
    history.back();
    return;
  }
  S.inClosing = true;
  vid.querySelector('video')?.pause();
  token++;
  if (S.reduce) {
    shut();
    return;
  }
  sheetTo(1, 0, SHEET_OUT_MS, 0);
  bloom(-1, BLOOM_OUT_MS, shut);
}

let resizeTimer = 0;

export function initInside(): void {
  back.addEventListener('click', () => leaveInside());
  for (const [slug, lb] of labelEls) lb.addEventListener('click', () => void goInside(slug));
  inside.addEventListener('cancel', (e) => {
    e.preventDefault();
    leaveInside();
  });
  inside.addEventListener('close', () => {
    cancelAnimationFrame(bloomRaf);
    cancelAnimationFrame(anim);
    vid.textContent = '';
    const slug = S.inSlug;
    S.inSlug = '';
    S.inClosing = false;
    S.openTo = 0;
    painting = null;
    masks = [];
    root.classList.remove('is-open');
    if (!pushed) {
      const st = STOPS[stopOfSlug(slug)];
      if (st) replaceAddress(addressOf(st.country));
    }
    /* focus goes back to the label you came from, without the page travelling anywhere */
    const lb = labelEls.get(slug);
    if (lb) focusQuietly(lb);
    else S.suppress = false;
    requestFrame();
  });
  /* Tab stays inside */
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
  /* the journey stays still behind; the paper itself can still be read with the keys */
  inside.addEventListener('keydown', (e) => {
    if (!/^(PageUp|PageDown|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) return;
    if (e.target instanceof HTMLVideoElement) return;
    e.preventDefault();
    const d = /Down|End/.test(e.key) ? 1 : -1;
    scroller.scrollBy(0, d * (/Arrow/.test(e.key) ? 60 : scroller.clientHeight * 0.8));
  });
  /* Back from inside a place steps out of it, and Forward goes back in */
  window.addEventListener('popstate', (e) => {
    const slug = insideSlug(e.state);
    if (!inside.open && !slug) return;
    S.skipHash = true;
    setTimeout(() => {
      S.skipHash = false;
    }, 150);
    if (!inside.open) {
      if (slug) void goInside(slug, true);
      return;
    }
    if (S.inClosing && slug) {
      /* Forward while closing: finish the close now, then step back in once the dialog has let go */
      inside.addEventListener(
        'close',
        () => {
          if (insideSlug(history.state) === slug) void goInside(slug, true);
        },
        { once: true },
      );
      cancelAnimationFrame(bloomRaf);
      shut();
      return;
    }
    leaveInside(true);
  });
  /* while a dialog is open the page behind it does not scroll (the dialog's own scrolling parts still do) */
  const holdScroll = (e: Event): void => {
    if (!inside.open && !noteDlg.open) return;
    for (let n = e.target instanceof Element ? e.target : null; n; n = n.parentElement) {
      if (n.matches('.in-scroll, .note-sheet') && n.scrollHeight > n.clientHeight + 1) return;
    }
    e.preventDefault();
  };
  window.addEventListener('wheel', holdScroll, { passive: false });
  window.addEventListener('touchmove', holdScroll, { passive: false });
  window.addEventListener('resize', () => {
    if (!inside.open) return;
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const slug = S.inSlug,
        my = token;
      if (!slug) return;
      void paint(slug, my).then((ok) => {
        if (ok && painting) drawBloom(paintCv, painting, [painting], 1);
      });
    }, RESIZE_SETTLE_MS);
  });
}
