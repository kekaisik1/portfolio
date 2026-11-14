/**
 * The painting reacts (src/worlds/reactions.ts says what and where), in the places that are not projects. Each one's
 * reacting object is an invisible button the size of the object, placed with the painting's cover maths and hidden
 * where it would stand on the words, the switches or the tag. A press plays its effects once: a flare is an element
 * animated with opacity and transform only, in the layer that pushes in with the painting; a burst is drawn by the
 * canvas of things in the air (src/ambient/). With the motion switched off there is nothing to press.
 */
import type { Ambient } from '../ambient/ambient';
import { WORLDS } from '../content/places';
import { byId, pick } from '../lib/dom';
import { lookOf } from './looks';
import type { Effects } from './effects';
import { reactionOf, reactionRect } from './reactions';
import { crowds, within, type Rect } from './picture';

/** the least room around a reacting object */
const GAP_PX = 8;

export interface ReactParts {
  ambient: Ambient;
  effects: Effects;
  /** may things move: the motion switch is on and the device keeps up */
  motion(): boolean;
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

  function fire(i: number): void {
    const r = reactionOf(WORLDS[i].id);
    const layer = worlds[i].querySelector<HTMLElement>('.presses');
    if (!r || !layer || !parts.motion()) return;
    if (r.flare) parts.effects.flare(layer, i, r.flare);
    if (r.burst) parts.ambient.burst(r.burst);
  }

  function layout(i: number): void {
    const button = worlds[i].querySelector<HTMLElement>('.react:not(.toy)');
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
    const others = [worlds[i].querySelector('.block'), ...avoid].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (!within(real, screen, GAP_PX) || others.some((el) => crowds(real, el.getBoundingClientRect(), GAP_PX)))
      button.hidden = true;
  }

  worlds.forEach((w, i) => w.querySelector('.react:not(.toy)')?.addEventListener('click', () => fire(i)));

  return { layout };
}
