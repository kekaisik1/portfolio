/**
 * "Read": the longer text of a world in a sheet over its painting. Only the name and one line stand on the painting.
 * A real modal dialog: Esc, the Close button, a press outside or a swipe down close it, and focus goes back.
 */
import { WORLDS, rowNumber } from '../content/places';
import { byId, pick, pickAll } from '../lib/dom';
import { closeOnOutsidePress, closeOnSwipeDown } from './swipe';

export function initRead(onToggle: (open: boolean) => void): void {
  const dlg = byId<HTMLDialogElement>('read');
  const title = byId('read-t');
  const kicker = byId('read-k');
  const more = byId('read-more');
  const acts = byId('read-acts');

  function open(world: HTMLElement): void {
    const i = Number(world.dataset.i);
    const w = WORLDS[i];
    const source = world.querySelector('.more');
    if (!w || !source) return;
    kicker.textContent = `${rowNumber(i)} ${w.place}`;
    title.textContent = w.title;
    more.replaceChildren(...Array.from(source.children, (c) => c.cloneNode(true)));
    /* the world's own link comes along, so the sheet ends with what to do next */
    acts.replaceChildren(...pickAll(world, '.acts a').map((a) => a.cloneNode(true)));
    dlg.showModal();
    pick(dlg, '.sheet-body').scrollTop = 0;
    title.focus({ preventScroll: true });
    onToggle(true);
  }

  for (const b of pickAll<HTMLButtonElement>(document, '[data-read]'))
    b.addEventListener('click', () => {
      const world = b.closest<HTMLElement>('.world');
      if (world) open(world);
    });
  pick(dlg, '[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => onToggle(false));
  closeOnOutsidePress(dlg);
  closeOnSwipeDown(dlg, () => dlg.close());
}
