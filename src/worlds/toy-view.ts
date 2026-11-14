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
import type { Effects } from './effects';
import { lookOf } from './looks';
import { reactionRect } from './reactions';
import { crowds, within, type Rect } from './spots';
import { outcomeOf, pictureRect, pieceUrl, rollOf, swapFrames, toysOf, type Piece, type Throw, type Toy } from './toys';

const GAP_PX = 8;
const ROLL_SHOWN_MS = 2800;
const OUTCOME_AFTER_MS = 600;

export interface ToyParts {
  ambient: Ambient;
  effects: Effects;
  /** may things move: the motion switch is on and the device keeps up */
  motion(): boolean;
  /** a number in 0..1 */
  random(): number;
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

  function put(img: HTMLImageElement, piece: Piece, i: number): void {
    const r = pictureRect(piece, lookOf(WORLDS[i].id), box(), upright());
    img.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.right - r.left}px;height:${r.bottom - r.top}px`;
  }

  /** A piece of the second state, laid over its own place on the painting, not yet seen. */
  function lay(i: number, piece: Piece): HTMLImageElement {
    const img = new Image();
    img.className = 'piece';
    img.alt = '';
    img.decoding = 'async';
    img.src = pieceUrl(WORLDS[i].id, piece.file);
    put(img, piece, i);
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

  function toss(i: number, t: Throw, key: string): void {
    const layer = layerOf(i);
    if (!layer) return;
    busy.add(key);
    const die = lay(i, t.die);
    const ledge = lay(i, t.ledge);
    die.classList.add('die');
    const n = rollOf(parts.random(), t.sides);
    void Promise.all([die.decode(), ledge.decode()]).then(
      () => {
        if (!die.isConnected) return;
        ledge.style.opacity = '1';
        die.style.opacity = '1';
        const up = t.lift * (ledge.height / t.ledge.h);
        const full = t.turns * 360;
        const a = die.animate(
          [
            { transform: 'translate(0, 0) rotate(0deg)', easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
            {
              transform: `translate(${-up * 0.12}px, ${-up}px) rotate(${full * 0.55}deg)`,
              offset: 0.46,
              easing: 'cubic-bezier(0.6, 0, 0.9, 0.5)',
            },
            { transform: `translate(0, 0) rotate(${full}deg)`, offset: 0.8, easing: 'ease-out' },
            { transform: `translate(0, ${-up * 0.07}px) rotate(${full}deg)`, offset: 0.9, easing: 'ease-in' },
            { transform: `translate(0, 0) rotate(${full}deg)` },
          ],
          { duration: t.ms },
        );
        const landed = (): void => {
          lift(die);
          lift(ledge);
          busy.delete(key);
          if (current !== i) return;
          /* the number it shows, over the die, and said aloud */
          const top = pictureRect(t.die, lookOf(WORLDS[i].id), box(), upright());
          const chip = document.createElement('span');
          chip.className = n === t.sides ? 'roll crit' : 'roll';
          chip.textContent = String(n);
          chip.style.cssText = `left:${(top.left + top.right) / 2}px;top:${top.top}px`;
          layer.append(chip);
          const say = layer.querySelector<HTMLElement>('.toy-say');
          if (say) say.textContent = TOY_SAYS.rolled(n, t.sides);
          const shownFor = chip.animate(
            [
              { opacity: 0, transform: 'translate(-50%, -110%) scale(1)' },
              { opacity: 1, transform: 'translate(-50%, -130%) scale(1)', offset: 0.12 },
              { opacity: 1, transform: 'translate(-50%, -130%) scale(1)', offset: 0.8 },
              { opacity: 0, transform: 'translate(-50%, -130%) scale(1)' },
            ],
            { duration: ROLL_SHOWN_MS, easing: 'ease-out' },
          );
          shownFor.addEventListener('finish', () => chip.remove(), { once: true });
          later(OUTCOME_AFTER_MS, () => outcomeOf(t, n).forEach((id) => press(i, id, true)));
        };
        a.addEventListener('finish', landed, { once: true });
        a.addEventListener('cancel', landed, { once: true });
      },
      () => {
        busy.delete(key);
        lift(die);
        lift(ledge);
      },
    );
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
    for (const [img, piece] of shown) put(img, piece, i);
  }

  function arrive(i: number): void {
    /* whatever the last place was in the middle of is over */
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    for (const img of [...shown.keys()]) lift(img);
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
