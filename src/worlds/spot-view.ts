/**
 * Putting a world's spot on its object (src/worlds/spots.ts says where, in the painting's coordinates). Placed when a
 * world arrives and when the window changes. Where the spot is shown the world's separate "Watch" button is not
 * (one way in); where the object is cut off, or the spot would stand on the words, the switches or the tag, the spot
 * is not shown and the Watch button stays.
 */
import { WORLDS } from '../content/places';
import { byId, pick } from '../lib/dom';
import { lookOf } from './looks';
import { crowds, spotOf, spotPoint, within, type Rect } from './spots';

/** the least room around a spot: it also drifts a little with the painting's slow push-in */
const GAP_PX = 16;

export interface SpotView {
  /** Place world `i`'s spot (if it has one) for the window as it is now. */
  layout(i: number): void;
}

export function initSpots(worlds: readonly HTMLElement[], lens: HTMLElement, upright: () => boolean): SpotView {
  const avoid = [byId('switches'), pick(document, '.brand'), byId('bar')];

  function hide(world: HTMLElement, button: HTMLElement): void {
    button.hidden = true;
    world.classList.remove('spotted');
  }

  function layout(i: number): void {
    const world = worlds[i];
    const button = world.querySelector<HTMLElement>('.spot');
    const spot = spotOf(WORLDS[i].id);
    if (!button || !spot) return;
    hide(world, button);
    const at = spotPoint(spot, lookOf(WORLDS[i].id), { width: lens.clientWidth, height: lens.clientHeight }, upright());
    if (!at) return;
    button.style.setProperty('--sx', `${at.x}px`);
    button.style.setProperty('--sy', `${at.y}px`);
    /* shown first, so the words are measured without the Watch button they lose */
    world.classList.add('spotted');
    button.hidden = false;
    const r = button.getBoundingClientRect();
    const screen: Rect = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    const others = [world.querySelector('.block'), ...avoid].filter((el): el is HTMLElement => el !== null);
    const crowded = others.some((el) => crowds(r, el.getBoundingClientRect(), GAP_PX));
    if (crowded || !within(r, screen, GAP_PX / 2)) hide(world, button);
  }

  return { layout };
}
