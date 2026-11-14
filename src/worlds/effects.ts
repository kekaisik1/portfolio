/**
 * The plain effects a press can play in the layer that pushes in with the painting: a soft light (flare) and a
 * shooting line (streak). Elements animated with opacity and transform only, played once and then gone. Used by
 * the reactions of the places that are not projects (react-view.ts: the flare) and by the toys (toy-view.ts: the
 * archer's arrow).
 */
import { WORLDS } from '../content/places';
import { lookOf } from './looks';
import { pictureLength, type Flare } from './reactions';
import { picturePoint } from './picture';

const FLARE_MS = 1500;
const STREAK_MS = 900;

export interface Effects {
  flare(layer: HTMLElement, i: number, f: Flare): void;
  streak(layer: HTMLElement, i: number, from: readonly [number, number], to: readonly [number, number]): void;
}

export function createEffects(box: () => { width: number; height: number }, upright: () => boolean): Effects {
  /** an element of the layer, played once and then gone */
  function play(layer: HTMLElement, el: HTMLElement, keys: Keyframe[], ms: number): void {
    layer.prepend(el);
    const a = el.animate(keys, { duration: ms, easing: 'ease-out' });
    a.addEventListener('finish', () => el.remove(), { once: true });
    a.addEventListener('cancel', () => el.remove(), { once: true });
  }

  function flare(layer: HTMLElement, i: number, f: Flare): void {
    const look = lookOf(WORLDS[i].id);
    const at = picturePoint({ u: f.at[0], v: f.at[1] }, look, box(), upright());
    if (!at) return;
    const size = pictureLength(f.size, look, box(), upright());
    const el = document.createElement('span');
    el.className = 'flare';
    el.style.cssText = `--fx:${at.x}px;--fy:${at.y}px;--fs:${size}px;--frgb:${f.rgb.replaceAll(',', ' ')}`;
    const keys: Keyframe[] = [
      { opacity: 0, transform: 'scale(0.7)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.25 },
      { opacity: 0, transform: 'scale(1.12)' },
    ];
    play(layer, el, keys, FLARE_MS);
  }

  function streak(layer: HTMLElement, i: number, from: readonly [number, number], to: readonly [number, number]): void {
    const look = lookOf(WORLDS[i].id);
    const a = picturePoint({ u: from[0], v: from[1] }, look, box(), upright());
    const b = picturePoint({ u: to[0], v: to[1] }, look, box(), upright());
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

  return { flare, streak };
}
