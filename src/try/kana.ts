/** Kana Notebook's try: three hiragana cards, a reading to pick for each, and how many were right. Pure. */
import { MESSAGES } from '../content/site';
import type { KanaTry } from '../content/types';
import type { Block, Choice, TryMachine, TryView } from './view';

export interface KanaState {
  /** which card is up, from 0 */
  card: number;
  /** the reading picked for it, or null while it is still a question */
  picked: string | null;
  right: number;
}

export const NEXT_CARD = 'next-card';

export function kanaMachine(copy: KanaTry): TryMachine<KanaState> {
  const last = copy.cards.length - 1;
  const done = (s: KanaState): boolean => s.card === last && s.picked !== null;

  return {
    start: () => ({ card: 0, picked: null, right: 0 }),

    press(s, id) {
      const card = copy.cards[s.card];
      if (s.picked === null && card.choices.includes(id))
        return { ...s, picked: id, right: s.right + (id === card.romaji ? 1 : 0) };
      if (id === NEXT_CARD && s.picked !== null && s.card < last) return { ...s, card: s.card + 1, picked: null };
      return s;
    },

    view(s): TryView {
      const card = copy.cards[s.card];
      const of = copy.cards.length;
      const blocks: Block[] = [{ kind: 'glyph', text: card.kana, label: copy.cardLabel(s.card + 1) }];
      let said = '';
      let choices: Choice[];
      if (s.picked === null) {
        choices = card.choices.map((r) => ({ id: r, label: r }));
        if (s.card > 0) said = copy.cardLabel(s.card + 1);
      } else {
        const verdict = (s.picked === card.romaji ? copy.right : copy.wrong)(card.kana, card.romaji);
        /* under the card and over its readings: the card grows upwards, so the readings stay where they were */
        blocks.push({ kind: 'text', text: verdict, strong: true });
        said = verdict;
        choices = card.choices.map((r) => {
          const mark = r === card.romaji ? MESSAGES.marks.right : r === s.picked ? MESSAGES.marks.wrong : undefined;
          return { id: r, label: r, disabled: true, ...(mark ? { mark } : {}) };
        });
        if (s.card < last) choices.push({ id: NEXT_CARD, label: copy.next });
      }
      if (done(s)) {
        const score = copy.score(s.right, of);
        blocks.push({ kind: 'text', text: `${score} ${copy.end}` });
        said = `${said} ${score}`;
      }
      return {
        step: copy.step(s.card + 1, of),
        blocks,
        choices,
        after: [],
        said,
        done: done(s),
        ...(done(s) && copy.link ? { link: copy.link } : {}),
      };
    },
  };
}
