/**
 * Putting a world's spots on their objects (src/worlds/spots.ts says where, in the painting's coordinates). Placed
 * when a world arrives and when the window changes. Where a spot is shown, the button in the words that opens the
 * same thing (Watch, Try it) is not (one way in); where its object is cut off, or the spot would stand on the words,
 * the switches, the tag or the world's other spot, the spot is not shown and that button stays.
 */
import { WORLDS } from '../content/places';
import { byId, pick, pickAll } from '../lib/dom';
import { lookOf } from './looks';
import { crowds, spotsOf, spotPoint, within, type Rect } from './spots';

/** the least room around a spot: it also drifts a little with the painting's slow push-in */
const GAP_PX = 16;
/** how many times the words are measured again after a spot gives its button back (the words may grow) */
const SETTLE_ROUNDS = 3;

export interface SpotView {
  /** Place world `i`'s spots (if it has any) for the window as it is now. */
  layout(i: number): void;
  /** The spots of world `i` that are on screen now. */
  shown(i: number): HTMLElement[];
}

/** what a spot opens, as the class its world carries while it is shown: spotted-video, spotted-try */
const opensOf = (button: HTMLElement): string => (button.dataset.video !== undefined ? 'video' : 'try');

export function initSpots(worlds: readonly HTMLElement[], lens: HTMLElement, upright: () => boolean): SpotView {
  const avoid = [byId('switches'), pick(document, '.brand'), byId('bar')];

  function hide(world: HTMLElement, button: HTMLElement): void {
    button.hidden = true;
    world.classList.remove(`spotted-${opensOf(button)}`);
  }

  function layout(i: number): void {
    const world = worlds[i];
    const buttons = pickAll<HTMLElement>(world, '.spot');
    const spots = spotsOf(WORLDS[i].id);
    if (buttons.length === 0) return;
    for (const b of buttons) hide(world, b);
    const look = lookOf(WORLDS[i].id);
    const box = { width: lens.clientWidth, height: lens.clientHeight };
    const placed: HTMLElement[] = [];
    for (const button of buttons) {
      const spot = spots.at(Number(button.dataset.k));
      const at = spot ? spotPoint(spot, look, box, upright()) : null;
      if (!at) continue;
      button.style.setProperty('--sx', `${at.x}px`);
      button.style.setProperty('--sy', `${at.y}px`);
      /* shown first, so the words are measured without the button they lose */
      world.classList.add(`spotted-${opensOf(button)}`);
      button.hidden = false;
      placed.push(button);
    }
    const screen: Rect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    /* a spot that has to go gives its button back to the words, which can then reach another spot: look again */
    for (let round = 0; round < SETTLE_ROUNDS; round++) {
      let changed = false;
      const kept: HTMLElement[] = [];
      for (const button of placed) {
        if (button.hidden) continue;
        const r = button.getBoundingClientRect();
        const others = [world.querySelector('.block'), ...avoid, ...kept].filter(
          (el): el is HTMLElement => el instanceof HTMLElement,
        );
        const crowded = others.some((el) => crowds(r, el.getBoundingClientRect(), GAP_PX));
        if (crowded || !within(r, screen, GAP_PX / 2)) {
          hide(world, button);
          changed = true;
        } else kept.push(button);
      }
      if (!changed) break;
    }
  }

  return {
    layout,
    shown: (i) => pickAll<HTMLElement>(worlds[i], '.spot').filter((b) => !b.hidden),
  };
}
