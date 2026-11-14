/**
 * The Front Desk's try: an example call, its lines appearing one after another once you pick up, ending with the
 * booking it made. The panel presses `next` by itself while `auto` is set; the machine only counts lines. Pure.
 */
import type { CallTry } from '../content/types';
import { NEXT, type Block, type TryMachine, type TryView } from './view';

export interface CallState {
  /** null: not picked up yet; then how many of the lines are showing (one more than the lines: the booking) */
  shown: number | null;
}

export const PICK_UP = 'pick-up';

export function callMachine(copy: CallTry): TryMachine<CallState> {
  const all = copy.lines.length + 1;

  return {
    start: () => ({ shown: null }),

    press(s, id) {
      if (s.shown === null) return id === PICK_UP ? { shown: 0 } : s;
      if (id === NEXT && s.shown < all) return { shown: s.shown + 1 };
      return s;
    },

    view(s): TryView {
      const blocks: Block[] = [{ kind: 'text', text: copy.mark, quiet: true }];
      if (s.shown === null)
        return { step: '', blocks, choices: [{ id: PICK_UP, label: copy.pickUp }], after: [], said: '', done: false };
      const lines = copy.lines.slice(0, s.shown);
      for (const l of lines) blocks.push({ kind: 'text', who: l.who, text: l.text });
      const done = s.shown >= all;
      if (done) {
        blocks.push({ kind: 'text', text: copy.booked, strong: true });
        blocks.push({ kind: 'text', text: copy.end });
      }
      const newest = lines.at(-1);
      const said = done ? `${copy.booked} ${copy.end}` : newest ? `${newest.who}: ${newest.text}` : '';
      return { step: '', blocks, choices: [], after: [], said, done, auto: !done };
    },
  };
}
