/** One play of a try: the right machine for its copy, holding its state between presses. DOM-free. */
import type { TryCopy } from '../content/types';
import { callMachine } from './call';
import { fightMachine } from './fight';
import { kanaMachine } from './kana';
import { pickMachine } from './pick';
import type { TryMachine, TryView } from './view';

export interface TryRun {
  view(): TryView;
  /** Press a choice (or `next`); returns what it looks like now. */
  press(id: string): TryView;
}

function running<S>(m: TryMachine<S>): TryRun {
  let state = m.start();
  return {
    view: () => m.view(state),
    press(id) {
      state = m.press(state, id);
      return m.view(state);
    },
  };
}

/** Start a try from the beginning. `rand` is the dice (seeded in tests). */
export function startTry(copy: TryCopy, rand: () => number): TryRun {
  switch (copy.kind) {
    case 'kana':
      return running(kanaMachine(copy));
    case 'fight':
      return running(fightMachine(copy, rand));
    case 'call':
      return running(callMachine(copy));
    case 'pick':
      return running(pickMachine(copy));
  }
}
