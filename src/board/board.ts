/**
 * The board: one row per world. The current row carries the signal bar, its status word cycles and locks, and it is
 * the board's one Tab stop (the arrow keys travel, and focus follows). On phones the board is a sheet raised from
 * the bottom bar, which says where you are.
 */
import { WORLDS, rowNumber } from '../content/places';
import { MESSAGES } from '../content/site';
import { byId, pickAll } from '../lib/dom';
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
  let open = false;
  let intro = true;

  function endIntro(): void {
    if (!intro) return;
    intro = false;
    board.classList.remove('intro');
  }
  window.setTimeout(endIntro, INTRO_MS);

  /** On phones the lowered board must not be reachable; raised, the world and the switches behind it must not be. */
  function sync(): void {
    if (!narrow.matches && open) {
      open = false;
      board.classList.remove('open');
      veil.hidden = true;
      bar.setAttribute('aria-expanded', 'false');
      onSheet(false);
    }
    board.inert = narrow.matches && !open;
    main.inert = open;
    switches.inert = open;
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
      /* from the raised index focus goes back to the bar; from the board it goes to the world's name */
      const fromSheet = open;
      closeSheet(true);
      travel.go(i, { focus: !fromSheet });
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
  narrow.addEventListener('change', sync);
  sync();

  return { endIntro };
}
