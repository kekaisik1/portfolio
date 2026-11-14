/**
 * The painting reacts (src/worlds/reactions.ts says what and where). Each world's one reacting object is an invisible
 * button the size of the object, placed with the same cover maths as the spots and hidden where it would stand on
 * the words, the switches, the tag or a spot. A press plays its effects once: a flare and a shooting star are
 * elements animated with opacity and transform only, in the layer that pushes in with the painting; a burst is
 * drawn by the canvas of things in the air (src/ambient/). With the motion switched off there is nothing to press.
 */
import type { Ambient } from '../ambient/ambient';
import { WORLDS } from '../content/places';
import { byId, pick } from '../lib/dom';
import { lookOf } from './looks';
import { pictureLength, reactionOf, reactionRect, type Flare } from './reactions';
import { crowds, spotPoint, within, type Rect } from './spots';

/** the least room around a reacting object */
const GAP_PX = 8;
const FLARE_MS = 1500;
const FLICKER_MS = 1300;
const STREAK_MS = 900;

export interface ReactParts {
  ambient: Ambient;
  /** may things move: the motion switch is on and the device keeps up */
  motion(): boolean;
  /** the spots of world `i` on screen now: a reacting object never stands on one */
  spotsShown(i: number): HTMLElement[];
}

export interface ReactView {
  /** Place world `i`'s reacting object for the window as it is now. */
  layout(i: number): void;
}

export function initReactions(
  worlds: readonly HTMLElement[],
  lens: HTMLElement,
  upright: () => boolean,
  parts: ReactParts,
): ReactView {
  const avoid = [byId('switches'), pick(document, '.brand'), byId('bar')];
  const box = (): { width: number; height: number } => ({ width: lens.clientWidth, height: lens.clientHeight });

  /** an element of the layer, played once and then gone */
  function play(layer: HTMLElement, el: HTMLElement, keys: Keyframe[], ms: number): void {
    layer.prepend(el);
    const a = el.animate(keys, { duration: ms, easing: 'ease-out' });
    a.addEventListener('finish', () => el.remove(), { once: true });
    a.addEventListener('cancel', () => el.remove(), { once: true });
  }

  function flare(layer: HTMLElement, i: number, f: Flare): void {
    const look = lookOf(WORLDS[i].id);
    const at = spotPoint({ u: f.at[0], v: f.at[1] }, look, box(), upright());
    if (!at) return;
    const size = pictureLength(f.size, look, box(), upright());
    const el = document.createElement('span');
    el.className = 'flare';
    el.style.cssText = `--fx:${at.x}px;--fy:${at.y}px;--fs:${size}px;--frgb:${f.rgb.replaceAll(',', ' ')}`;
    const keys: Keyframe[] = f.flicker
      ? [0, 0.85, 0.2, 0.9, 0.35, 1, 0.6, 0].map((opacity) => ({ opacity, transform: 'scale(1)' }))
      : [
          { opacity: 0, transform: 'scale(0.7)' },
          { opacity: 1, transform: 'scale(1)', offset: 0.25 },
          { opacity: 0, transform: 'scale(1.12)' },
        ];
    play(layer, el, keys, f.flicker ? FLICKER_MS : FLARE_MS);
  }

  function streak(layer: HTMLElement, i: number, from: readonly [number, number], to: readonly [number, number]): void {
    const look = lookOf(WORLDS[i].id);
    const a = spotPoint({ u: from[0], v: from[1] }, look, box(), upright());
    const b = spotPoint({ u: to[0], v: to[1] }, look, box(), upright());
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.hypot(dx, dy);
    const el = document.createElement('span');
    el.className = 'streak';
    el.style.cssText = `--fx:${a.x}px;--fy:${a.y}px;--len:${length * 0.3}px`;
    const along = (k: number, scale: number): string =>
      `translate(${dx * k}px, ${dy * k}px) rotate(${angle}rad) scaleX(${scale})`;
    play(
      layer,
      el,
      [
        { opacity: 0, transform: along(0, 0.2) },
        { opacity: 1, transform: along(0.3, 1), offset: 0.3 },
        { opacity: 0, transform: along(0.75, 0.6) },
      ],
      STREAK_MS,
    );
  }

  function fire(i: number): void {
    const r = reactionOf(WORLDS[i].id);
    const layer = worlds[i].querySelector<HTMLElement>('.spots');
    if (!r || !layer || !parts.motion()) return;
    if (r.flare) flare(layer, i, r.flare);
    if (r.streak) streak(layer, i, r.streak.from, r.streak.to);
    if (r.burst) parts.ambient.burst(r.burst);
  }

  function layout(i: number): void {
    const button = worlds[i].querySelector<HTMLElement>('.react');
    const r = reactionOf(WORLDS[i].id);
    if (!button || !r) return;
    button.hidden = true;
    if (!parts.motion()) return;
    const rect = reactionRect(r, lookOf(WORLDS[i].id), box(), upright(), GAP_PX * 2);
    if (!rect) return;
    button.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.right - rect.left}px;height:${rect.bottom - rect.top}px`;
    /* shown, then measured where it really is (the layer may be pushed in), and taken away if it crowds anything */
    button.hidden = false;
    const real = button.getBoundingClientRect();
    const screen: Rect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const others = [worlds[i].querySelector('.block'), ...avoid, ...parts.spotsShown(i)].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (!within(real, screen, GAP_PX) || others.some((el) => crowds(real, el.getBoundingClientRect(), GAP_PX)))
      button.hidden = true;
  }

  worlds.forEach((w, i) => w.querySelector('.react')?.addEventListener('click', () => fire(i)));

  return { layout };
}
