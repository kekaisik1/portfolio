/**
 * The plainest try: pick something, then see what it meant. Three ways of playing it (`mode` in the copy):
 * once (History Lens: one choice, what followed, and what is in the record), find (BookForge: press the line an
 * editor would stop at; the others say they are fine), any (the finance bot and LOWL: every choice shows its own
 * answer, as often as you like). Pure.
 */
import { MESSAGES } from '../content/site';
import type { PickOption, PickTry } from '../content/types';
import type { Block, Choice, TryMachine, TryView } from './view';

export interface PickState {
  /** the choice whose answer is showing (once, any), or the one found (find) */
  picked: string | null;
  /** find: the choices pressed that were fine */
  fine: readonly string[];
  /** find: the last press was one of the fine ones */
  wasFine: string | null;
}

export function pickMachine(copy: PickTry): TryMachine<PickState> {
  const optionOf = (id: string | null): PickOption | undefined => copy.options.find((o) => o.id === id);
  const done = (s: PickState): boolean => s.picked !== null;

  function choiceOf(s: PickState, o: PickOption): Choice {
    const c: Choice = { id: o.id, label: o.label };
    if (copy.mode === 'any') return { ...c, pressed: o.id === s.picked };
    if (copy.mode === 'once') {
      if (s.picked === null) return c;
      return { ...c, disabled: true, ...(o.id === s.picked ? { mark: MESSAGES.marks.chosen } : {}) };
    }
    if (o.id === s.picked) return { ...c, disabled: true, mark: MESSAGES.marks.found };
    if (s.fine.includes(o.id)) return { ...c, disabled: true, mark: MESSAGES.marks.fine };
    return s.picked === null ? c : { ...c, disabled: true };
  }

  return {
    start: () => ({ picked: null, fine: [], wasFine: null }),

    press(s, id) {
      const o = optionOf(id);
      if (!o) return s;
      if (copy.mode === 'any') return { ...s, picked: id };
      if (s.picked !== null) return s;
      if (copy.mode === 'once' || o.target) return { ...s, picked: id, wasFine: null };
      return s.fine.includes(id) ? s : { ...s, fine: [...s.fine, id], wasFine: id };
    },

    view(s): TryView {
      const o = optionOf(s.picked);
      /* once chosen, the scene has done its work: the question and the choice stay, the rest makes room */
      const settled = copy.mode === 'once' && o !== undefined;
      const blocks: Block[] = settled ? [] : copy.intro.map((l) => ({ kind: 'text', ...l }));
      blocks.push({ kind: 'text', text: copy.ask, strong: true });
      const after: Block[] = [];
      const said: string[] = [];
      if (s.wasFine !== null && copy.fine) {
        after.push({ kind: 'text', text: copy.fine });
        said.push(copy.fine);
      }
      if (o) {
        for (const l of o.result) {
          after.push({ kind: 'text', ...l });
          said.push(l.tag ? `${l.tag}: ${l.text}` : l.text);
        }
        if (o.meter)
          after.push({ kind: 'meter', ...o.meter, text: `${Math.round((o.meter.value / o.meter.max) * 100)}%` });
        if (copy.end) {
          after.push({ kind: 'text', ...copy.end, quiet: copy.end.tag === undefined });
          said.push(copy.end.tag ? `${copy.end.tag}: ${copy.end.text}` : copy.end.text);
        }
      }
      const options = settled ? copy.options.filter((opt) => opt.id === s.picked) : copy.options;
      const link = o?.link ?? (done(s) ? copy.link : undefined);
      return {
        step: copy.step ?? '',
        blocks,
        choices: options.map((opt) => choiceOf(s, opt)),
        after,
        said: said.join(' '),
        done: done(s),
        ...(link ? { link } : {}),
      };
    },
  };
}
