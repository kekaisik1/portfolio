/**
 * The board: one row per world. The current row carries the signal bar, its status word cycles and locks, and it is
 * the board's one Tab stop (the arrow keys travel, and focus follows). It is kept in a drawer: on a wide screen it
 * slides in from the left when the tag in the top corner is pressed, on phones it is a sheet raised from the bottom
 * bar. The tag and the bar are one button, which says where you are. Closed, the board cannot be reached.
 */
import { WORLDS, rowNumber } from '../content/places';
import { MESSAGES } from '../content/site';
import { byId, pick, pickAll } from '../lib/dom';
import { narrow, reduce } from '../lib/media';
import { closeOnSwipeDown } from '../sheet/swipe';
import type { Travel } from '../travel/travel';
import { scramble } from './scramble';

export interface Board {
  /** Stop the rows typing in: someone is already using the page. */
  endIntro(): void;
}

/** how long the rows take to type in on the first screen */
const INTRO_MS = 520;

export function initBoard(travel: Travel, onSheet: (open: boolean) => void): Board {
  const board = byId('board');
  const rowsEl = byId('rows');
  const rows = pickAll<HTMLAnchorElement>(rowsEl, '.row');
  const bar = byId<HTMLButtonElement>('bar');
  const veil = byId('veil');
  const barN = byId('bar-n');
  const barPl = byId('bar-pl');
  const barPj = byId('bar-pj');
  const barSt = byId('bar-st');
  const main = byId('main');
  const switches = byId('switches');
  const mark = pick(document, '.brand .mark');
  let open = false;
  let intro = true;

  function endIntro(): void {
    if (!intro) return;
    intro = false;
    board.classList.remove('intro');
  }
  window.setTimeout(endIntro, INTRO_MS);

  /** The closed board must not be reachable; open, the world, the switches and the name behind it must not be. */
  function sync(): void {
    board.inert = !open;
    main.inert = open;
    switches.inert = open;
    mark.inert = open;
  }
  function openSheet(): void {
    endIntro();
    open = true;
    board.classList.add('open');
    veil.hidden = false;
    bar.setAttribute('aria-expanded', 'true');
    sync();
    const row = rows[travel.current()];
    row.scrollIntoView({ block: 'center' });
    row.focus({ preventScroll: true });
    onSheet(true);
  }
  function closeSheet(refocus: boolean): void {
    if (!open) return;
    open = false;
    board.classList.remove('open');
    veil.hidden = true;
    bar.setAttribute('aria-expanded', 'false');
    sync();
    if (refocus) bar.focus({ preventScroll: true });
    onSheet(false);
  }

  travel.onDepart((to, from) => {
    const w = WORLDS[to];
    const n = rowNumber(to);
    const hadFocus = rowsEl.contains(document.activeElement);
    rows.forEach((r, j) => {
      if (j === to) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
      r.tabIndex = j === to ? 0 : -1;
    });
    if (hadFocus) rows[to].focus({ preventScroll: true });
    const quiet = reduce.matches || intro || from === null;
    for (const st of pickAll(rows[to], '.st')) scramble(st, w.status, quiet);
    barN.textContent = n;
    barPl.textContent = w.place;
    barPj.textContent = w.title;
    barSt.className = `st ${w.tone}`;
    scramble(barSt, w.status, quiet);
    bar.setAttribute('aria-label', MESSAGES.barLabel(n, w.place, w.title));
    if (rowsEl.scrollHeight > rowsEl.clientHeight) rows[to].scrollIntoView({ block: 'nearest' });
  });

  rows.forEach((row, i) =>
    row.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      /* on a phone focus goes back to the bar; on a wide screen it goes on to the new world's name */
      const toName = !narrow.matches;
      closeSheet(!toName);
      travel.go(i, { focus: toName });
    }),
  );
  bar.addEventListener('click', () => (open ? closeSheet(true) : openSheet()));
  veil.addEventListener('click', () => closeSheet(true));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    closeSheet(true);
  });
  closeOnSwipeDown(board, () => closeSheet(true));
  sync();

  return { endIntro };
}
