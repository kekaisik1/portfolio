/**
 * The opening shot. The page opens on the summit alone (the `opening` class is set before first paint, in
 * index.html); the first step anywhere ends it: the board slides in (or, on a phone, the bar rises) while the cut
 * closes, and when the cut lands the stage takes its place beside the board, hidden by the slats. Keyboard and
 * screen-reader users reach the board at once: it is in the tab order all along, and focus entering it is a step.
 * Coming back to the summit later keeps the board: the opening is only the first impression.
 */
import { byId } from '../lib/dom';
import type { Travel } from '../travel/travel';

export function initOpening(travel: Travel): void {
  const root = document.documentElement;
  if (!root.classList.contains('opening')) return;
  let open = true;

  travel.onDepart((_to, from) => {
    if (open && from !== null) root.classList.add('departing');
  });
  travel.onLanding((_to, from) => {
    if (!open || from === null) return;
    open = false;
    root.classList.remove('opening', 'departing');
  });

  /* Tab reaches the board (or the phone's bar) while it is still off screen: that is a first step too */
  const step = (): void => {
    if (open) travel.go(1);
  };
  byId('board').addEventListener('focusin', step);
  byId('bar').addEventListener('focusin', step);
}
