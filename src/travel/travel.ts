/**
 * Travel: going from one world to another. The board changes at once; the next photo is decoded if it is not
 * already (400 ms at most, then its blurred stand-in is used); the cut closes over the old world; the new world's
 * words are on screen the moment it lands. A second request while one is under way waits its turn, and only the
 * last one asked for is kept.
 */
import { LAST, WORLDS } from '../content/places';
import { MESSAGES } from '../content/site';
import { nextFrame, wait } from '../lib/dom';
import { clamp } from '../lib/math';
import { narrow, reduce } from '../lib/media';
import { replaceAddress } from '../nav/address';
import { hashOfWorld } from '../nav/routing';
import { runCut, type Cut } from '../worlds/cut';
import type { Photos } from '../worlds/photos';
import { showWords } from '../worlds/words';

/** how long a cut waits for a photo that is still decoding before using its blurred stand-in */
export const DECODE_WAIT_MS = 400;
/** the photo's slow push-in after arriving */
const PUSH_MS = 20000;
const PUSH_SCALE = 1.06;
/** the other neighbour is fetched a little later, so it never competes with the photo just asked for */
const NEIGHBOUR_MS = 300;

export interface GoOptions {
  /** take keyboard focus to the world's name */
  focus?: boolean;
}

export interface Travel {
  current(): number;
  /** where travel is headed: the row asked for last, if one is still on its way */
  heading(): number;
  go(to: number, opts?: GoOptions): void;
  /** Hold the slow push-in where it is (motion switched off), or let it go on from there. */
  holdPush(hold: boolean): void;
  step(dir: 1 | -1): void;
  /** the board should change now: travel to `to` has begun (from = null on the first screen) */
  onDepart(fn: (to: number, from: number | null) => void): void;
  /** world `to` is about to be put on screen (the cut has closed): the last moment to change what is under the slats */
  onLanding(fn: (to: number, from: number | null) => void): void;
  /** world `i` is on screen */
  onArrive(fn: (i: number) => void): void;
  /** Stand in a world without travelling there: the first screen. */
  start(i: number): void;
}

export interface TravelParts {
  photos: Photos;
  /** the element the photos and the canvas sit in: it carries the push-in */
  lens: HTMLElement;
  /** the layer the slats are put in */
  cutLayer: HTMLElement;
  /** every world's words, in board order */
  worlds: readonly HTMLElement[];
  /** the aria-live line that says where you have arrived */
  where: HTMLElement;
  /** false when the photo must not push in: motion is switched off, or the device cannot keep up */
  smooth: () => boolean;
}

export function createTravel(parts: TravelParts): Travel {
  const { photos, lens, cutLayer, worlds, where } = parts;
  const departFns: ((to: number, from: number | null) => void)[] = [];
  const landingFns: ((to: number, from: number | null) => void)[] = [];
  const arriveFns: ((i: number) => void)[] = [];
  let cur = 0;
  let busy = false;
  let pending: { to: number; opts: GoOptions } | null = null;
  let activeCut: Cut | null = null;
  let push: Animation[] = [];

  const neighbours = (i: number): number[] => [i - 1, i, i + 1].filter((n) => n >= 0 && n <= LAST);

  /* the photo pushes in, and the world's spot with it, so the spot stays on its object (the same box and origin) */
  function pushIn(i: number): void {
    for (const a of push) a.cancel();
    push = [];
    if (reduce.matches || !parts.smooth()) return;
    const spots = worlds[i].querySelector<HTMLElement>('.spots');
    push = [lens, ...(spots ? [spots] : [])].map((el) =>
      el.animate([{ transform: 'scale(1)' }, { transform: `scale(${PUSH_SCALE})` }], {
        duration: PUSH_MS,
        easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)',
        fill: 'forwards',
      }),
    );
  }

  function focusName(i: number): void {
    const name = worlds[i].querySelector<HTMLElement>('[tabindex="-1"]');
    name?.focus({ preventScroll: true });
  }

  function land(to: number, from: number | null, focus: boolean): void {
    for (const fn of landingFns) fn(to, from);
    photos.show(to);
    showWords(worlds, to, !reduce.matches);
    pushIn(to);
    if (focus) focusName(to);
    for (const fn of arriveFns) fn(to);
  }

  async function travel(to: number, opts: GoOptions): Promise<void> {
    busy = true;
    const from = cur;
    const dir = to > from ? 1 : -1;
    cur = to;
    const w = WORLDS[to];
    for (const fn of departFns) fn(to, from);
    replaceAddress(hashOfWorld(to, w.id));
    where.textContent = MESSAGES.arrived(w.place, w.title);
    /* focus inside the world being left would be lost when its words go: it moves to the new world's name */
    const focus = opts.focus === true || worlds[from].contains(document.activeElement);

    photos.prune([from, to]);
    const target = photos.mount(to);
    await Promise.race([target.ready, wait(DECODE_WAIT_MS)]);

    if (!reduce.matches) {
      /* on a wide screen the slats always sweep from the left; on a phone they follow the direction */
      activeCut = runCut(cutLayer, target, narrow.matches && dir < 0);
      await activeCut.done;
    }
    land(to, from, focus);
    if (activeCut) {
      const cut = activeCut;
      activeCut = null;
      /* two frames, so the real photo is painted under the slats before they go */
      await nextFrame();
      await nextFrame();
      cut.remove();
    }

    /* keep previous / current / next, decoded ahead: the one in the direction of travel first */
    photos.prune(neighbours(to));
    const ahead = to + dir;
    if (ahead >= 0 && ahead <= LAST) photos.mount(ahead);
    window.setTimeout(() => {
      if (cur === to && !busy) neighbours(to).forEach((n) => photos.mount(n));
    }, NEIGHBOUR_MS);

    busy = false;
    if (pending) {
      const next = pending;
      pending = null;
      if (next.to !== cur) void travel(next.to, next.opts);
      else if (next.opts.focus) focusName(cur);
    }
  }

  const heading = (): number => (pending ? pending.to : cur);

  function go(target: number, opts: GoOptions = {}): void {
    const to = clamp(target, 0, LAST);
    if (busy) {
      pending = { to, opts };
      activeCut?.finish();
      return;
    }
    if (to === cur) {
      if (opts.focus) focusName(cur);
      return;
    }
    void travel(to, opts);
  }

  return {
    current: () => cur,
    heading,
    go,
    step: (dir) => go(heading() + dir),
    holdPush(hold) {
      for (const a of push) {
        if (hold) a.pause();
        else if (a.playState === 'paused') a.play();
      }
    },
    onDepart(fn) {
      departFns.push(fn);
    },
    onLanding(fn) {
      landingFns.push(fn);
    },
    onArrive(fn) {
      arriveFns.push(fn);
    },
    start(i) {
      cur = clamp(i, 0, LAST);
      const w = WORLDS[cur];
      photos.prune([cur]);
      photos.mount(cur);
      for (const fn of departFns) fn(cur, null);
      if (cur > 0) where.textContent = MESSAGES.arrived(w.place, w.title);
      land(cur, null, false);
      neighbours(cur).forEach((n) => photos.mount(n));
    },
  };
}
