/** Showing one world's words, and folding the longer text away when the window is too short to hold it. */
import { narrow } from '../lib/media';

/** the least air between the words and the photo's edge before they count as not fitting */
const EDGE_PX = 12;

/**
 * Does this world's block fit its photo? If not, it becomes compact: the longer text is folded behind "Read"
 * (phones are always folded, by the stylesheet). One layout read, when a world is shown or the window changes.
 */
export function fitWords(world: HTMLElement): void {
  world.classList.remove('compact');
  if (narrow.matches || !world.querySelector('.more')) return;
  const block = world.querySelector('.block');
  if (!block) return;
  const outer = world.getBoundingClientRect();
  const inner = block.getBoundingClientRect();
  if (inner.top < outer.top + EDGE_PX || inner.bottom > outer.bottom - EDGE_PX) world.classList.add('compact');
}

/** Put world `i`'s words on screen and take the others off. */
export function showWords(worlds: readonly HTMLElement[], i: number, arrive: boolean): void {
  worlds.forEach((w, j) => {
    w.classList.toggle('on', j === i);
    w.classList.remove('in');
  });
  fitWords(worlds[i]);
  if (arrive) worlds[i].classList.add('in');
}
