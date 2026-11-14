/**
 * The painting as a toy (src/worlds/toys.ts says what answers a press, and how). Each toy is an invisible button the
 * size of its object, placed with the painting's own cover maths and left out where it would stand on the words, the
 * switches or the tag. A press fades a piece of the painting's second state in over the painting, throws the die,
 * and plays the plain effects (effects.ts, src/ambient/). Pieces are images in the layer that pushes in with the
 * painting, moved with opacity and transform only. With the motion switched off there is nothing to press.
 */
import type { Ambient } from '../ambient/ambient';
import { WORLDS } from '../content/places';
import { TOY_SAYS } from '../content/toys';
import { byId, pick } from '../lib/dom';
import type { Ticker } from '../lib/ticker';
import { drawDie, drawnAt, poseAt } from './d20';
import type { Effects } from './effects';
import { lookOf } from './looks';
import { reactionRect } from './reactions';
import { crowds, within, type Rect } from './spots';
import {
  numberFor,
  outcomeOf,
  pictureRect,
  pieceUrl,
  roundOf,
  swapFrames,
  toysOf,
  type Piece,
  type Throw,
  type Toy,
} from './toys';

const GAP_PX = 8;
const OUTCOME_AFTER_MS = 600;

export interface ToyParts {
  ambient: Ambient;
  effects: Effects;
  /** may things move: the motion switch is on and the device keeps up */
  motion(): boolean;
  /** a number in 0..1 */
  random(): number;
  /** the page's one frame loop: the die is drawn from it while it is in the air */
  ticker: Ticker;
}

export interface ToyView {
  /** Place world `i`'s toys, and whatever of its second state is showing, for the window as it is now. */
  layout(i: number): void;
  /** World `i` is the one on screen now. */
  arrive(i: number): void;
}

export function initToys(
  worlds: readonly HTMLElement[],
  lens: HTMLElement,
  upright: () => boolean,
  parts: ToyParts,
): ToyView {
  const avoid = [byId('switches'), pick(document, '.brand'), byId('bar')];
  const box = (): { width: number; height: number } => ({ width: lens.clientWidth, height: lens.clientHeight });
  /** the pieces on the painting now, with where each belongs */
  const shown = new Map<HTMLImageElement, Piece>();
  /** toys in the middle of something, by world and id */
  const busy = new Set<string>();
  /** pieces left in (the open chest), by world and toy id */
  const kept = new Map<string, HTMLImageElement>();
  const timers = new Set<number>();
  /** what is left of each die's round of outcomes, and the one it showed last */
  const rounds = new Map<string, number[]>();
  const lastOutcome = new Map<string, number>();
  let current = -1;

  const layerOf = (i: number): HTMLElement | null => worlds[i].querySelector<HTMLElement>('.spots');
  /** where the pieces lie: inside the lens, so they are the painting's own layer and never shift against it */
  const states = byId('states');
  const later = (ms: number, run: () => void): void => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      run();
    }, ms);
    timers.add(t);
  };

  /** Lay a rectangle of the painting over its own place: a piece, or the die's canvas. */
  function place(el: HTMLElement, r: { u: number; v: number; w: number; h: number }, i: number): void {
    const at = pictureRect(r, lookOf(WORLDS[i].id), box(), upright());
    el.style.cssText = `left:${at.left}px;top:${at.top}px;width:${at.right - at.left}px;height:${at.bottom - at.top}px`;
  }

  /** A piece of the second state, laid over its own place on the painting, not yet seen. */
  function lay(i: number, piece: Piece): HTMLImageElement {
    const img = new Image();
    img.className = 'piece';
    img.alt = '';
    img.decoding = 'async';
    img.src = pieceUrl(WORLDS[i].id, piece.file);
    place(img, piece, i);
    shown.set(img, piece);
    states.append(img);
    return img;
  }
  function lift(img: HTMLImageElement): void {
    shown.delete(img);
    img.remove();
  }

  function swap(i: number, toy: Toy, key: string): void {
    const s = toy.swap;
    if (!s) return;
    const was = kept.get(key);
    if (was) {
      /* pressed again: what was left in goes away */
      kept.delete(key);
      const out = was.animate([{ opacity: 1 }, { opacity: 0 }], { duration: s.fall, easing: 'ease-in' });
      out.addEventListener('finish', () => lift(was), { once: true });
      return;
    }
    const img = lay(i, s.piece);
    busy.add(key);
    void img.decode().then(
      () => {
        if (!img.isConnected) return;
        if (s.stays) {
          img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: s.rise, easing: 'ease-out', fill: 'forwards' });
          kept.set(key, img);
          busy.delete(key);
          return;
        }
        const { frames, ms } = swapFrames(s);
        const a = img.animate(frames, { duration: ms, easing: 'ease-in-out' });
        const done = (): void => {
          busy.delete(key);
          lift(img);
        };
        a.addEventListener('finish', done, { once: true });
        a.addEventListener('cancel', done, { once: true });
      },
      () => {
        /* the piece did not load: the painting stays as it is */
        busy.delete(key);
        lift(img);
      },
    );
  }

  /**
   * The die is thrown: the painted one gives way to a real twenty-sided die (d20.ts) on a small canvas over its
   * place, which tumbles, lands on the thrown number and lies there showing it; what the number is sets the next
   * thing off; then the painting's own die is back.
   */
  function toss(i: number, t: Throw, key: string): void {
    const layer = layerOf(i);
    if (!layer) return;
    busy.add(key);
    const ledge = lay(i, t.ledge);
    const canvas = document.createElement('canvas');
    canvas.className = 'piece d20';
    place(canvas, t.room, i);
    states.append(canvas);
    /* the outcomes come round in turn (shuffled), and the number is one that outcome can show */
    let round = rounds.get(key) ?? [];
    if (!round.length) round = roundOf(t.outcomes.length, parts.random, lastOutcome.get(key) ?? null);
    const which = round.shift() ?? 0;
    rounds.set(key, round);
    lastOutcome.set(key, which);
    const n = numberFor(t, which, parts.random());
    /* what this number will set off is fetched while the die is in the air, so it is there when the die lands */
    for (const id of outcomeOf(t, n)) {
      const file = toysOf(WORLDS[i].id).find((x) => x.id === id)?.swap?.piece.file;
      if (file) new Image().src = pieceUrl(WORLDS[i].id, file);
    }
    let stop: (() => void) | null = null;
    const over = (): void => {
      stop?.();
      stop = null;
      canvas.remove();
      lift(ledge);
      busy.delete(key);
    };
    /* the paint the die is made of; if it does not load the die is plain */
    const paint = new Image();
    paint.src = pieceUrl(WORLDS[i].id, t.paint);
    const painted = paint.decode().then(
      () => paint,
      () => null,
    );
    void Promise.all([ledge.decode(), painted]).then(([, swatch]) => {
      const ctx = canvas.getContext('2d');
      if (!canvas.isConnected || !ctx) return over();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      /* a picture height, in the canvas's own pixels */
      const unit = canvas.height / t.room.h;
      const cx = ((t.at[0] - t.room.u) / t.room.w) * canvas.width;
      const ground = (t.at[1] - t.room.v) * unit;
      const r = t.radius * unit;
      ledge.style.opacity = '1';
      canvas.style.opacity = '1';
      let ms = 0;
      let told = false;
      let last = -1;
      const draw = (dt: number): void => {
        ms += dt * 1000;
        /* drawn twelve times a second, like something hand-made, not smoothly: the painting is not smooth either */
        const now = Math.min(t.ms, drawnAt(ms));
        if (now === last && ms < t.ms) return;
        last = now;
        const pose = poseAt((ms >= t.ms ? t.ms : now) / t.ms, n, t.turns);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        /* its shadow on the ledge: smaller and fainter the higher it is */
        ctx.fillStyle = `rgb(38 28 46 / ${0.3 - 0.16 * pose.height})`;
        ctx.beginPath();
        ctx.ellipse(cx, ground + r * 0.86, r * (0.95 - 0.3 * pose.height), r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        drawDie(ctx, pose.turn, cx, ground - pose.height * t.lift * unit, r, swatch);
        if (ms >= t.ms && !told) {
          told = true;
          stop?.();
          stop = null;
          landed();
        }
      };
      const landed = (): void => {
        if (current !== i) return over();
        const say = layer.querySelector<HTMLElement>('.toy-say');
        if (say) say.textContent = TOY_SAYS.rolled(n, t.sides);
        canvas.dataset.rolled = String(n);
        later(OUTCOME_AFTER_MS, () => outcomeOf(t, n).forEach((id) => press(i, id, true)));
        later(t.rest, () => {
          /* the painting's own die comes back under the real one as it fades */
          const out = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out' });
          ledge.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out' });
          out.addEventListener('finish', over, { once: true });
          out.addEventListener('cancel', over, { once: true });
        });
      };
      stop = parts.ticker.add(draw);
    }, over);
  }

  /** `quiet`: set off by the die, not pressed: something already left in (the open chest) is not taken away. */
  function press(i: number, id: string, quiet = false): void {
    const toy = toysOf(WORLDS[i].id).find((t) => t.id === id);
    const layer = layerOf(i);
    const key = `${i}:${id}`;
    if (!toy || !layer || current !== i || !parts.motion() || busy.has(key)) return;
    const closing = kept.has(key);
    if (closing && quiet) return;
    if (toy.swap) swap(i, toy, key);
    if (toy.throw) toss(i, toy.throw, key);
    if (closing) return;
    if (toy.flare) parts.effects.flare(layer, i, toy.flare);
    if (toy.streak) parts.effects.streak(layer, i, toy.streak.from, toy.streak.to);
    toy.bursts?.forEach((b) => parts.ambient.burst(b));
    if (toy.then) {
      const next = toy.then.toy;
      later(toy.then.after, () => press(i, next));
    }
  }

  function layout(i: number): void {
    const toys = toysOf(WORLDS[i].id);
    if (!toys.length) return;
    const look = lookOf(WORLDS[i].id);
    const screen: Rect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const others = [worlds[i].querySelector('.block'), ...avoid].filter((el): el is HTMLElement => el !== null);
    for (const button of worlds[i].querySelectorAll<HTMLElement>('.toy')) {
      const toy = toys.find((t) => t.id === button.dataset.toy);
      button.hidden = true;
      if (!toy || toy.unseen || !parts.motion()) continue;
      const rect = reactionRect({ ...toy, w: toy.w * (3 / 2) }, look, box(), upright(), GAP_PX);
      if (!rect) continue;
      button.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.right - rect.left}px;height:${rect.bottom - rect.top}px`;
      button.hidden = false;
      const real = button.getBoundingClientRect();
      if (!within(real, screen, GAP_PX / 2) || others.some((el) => crowds(real, el.getBoundingClientRect(), GAP_PX)))
        button.hidden = true;
    }
    for (const [img, piece] of shown) place(img, piece, i);
  }

  function arrive(i: number): void {
    /* whatever the last place was in the middle of is over */
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    for (const img of [...shown.keys()]) lift(img);
    states.replaceChildren();
    kept.clear();
    busy.clear();
    current = i;
    layout(i);
  }

  worlds.forEach((w, i) =>
    w
      .querySelectorAll<HTMLElement>('.toy')
      .forEach((b) => b.addEventListener('click', () => press(i, b.dataset.toy ?? ''))),
  );

  return { layout, arrive };
}
