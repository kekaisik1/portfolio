/**
 * The opening shot. The page opens on the summit with almost no interface (the `opening` class is set before first
 * paint, in index.html): the tag that opens the board is not shown yet. The first step anywhere ends it: the tag
 * (on a phone, the bar) comes in while the cut closes. Nothing changes shape: every place fills the window like the
 * summit. Keyboard and screen-reader users reach the tag at once: it is in the tab order all along, and focus
 * reaching it is a step. Coming back to the summit later keeps the tag: the opening is only the first impression.
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

  /* Tab reaches the tag (or the phone's bar) while it is still not shown: that is a first step too */
  byId('bar').addEventListener('focusin', () => {
    if (open) travel.go(1);
  });
}
