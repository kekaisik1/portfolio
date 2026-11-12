/** Leave a note: a slip of paper that goes to Kaisar (through the API; with no API it says so and gives the email). */
import { api } from '../api';
import { MESSAGES, SITE } from '../content/site';
import { byId, pick } from '../lib/dom';
import { noteDlg } from '../journey/dom';
import { S } from '../journey/state';
import { lightLantern } from '../night/lanterns';
import { NOTE_IDLE, nextNoteState, noteView, type NoteEvent, type NoteState } from './machine';
import { readNote, validateNote } from './validate';

/** with no API nothing is sent; a short pause keeps the button from flickering before it says so */
const NO_API_PAUSE_MS = 500;
/** after a note is sent: how long the thank-you shows before the dialog steps aside for the lantern */
const THANKS_MS = 1100;

export function initNote(): void {
  const open = byId<HTMLButtonElement>('note-open'),
    form = byId<HTMLFormElement>('note-form'),
    done = byId('note-done'),
    text = byId<HTMLTextAreaElement>('note-text'),
    msg = byId('note-msg'),
    send = pick<HTMLButtonElement>(form, '.note-send');
  let state: NoteState = NOTE_IDLE;
  /* read through a function: dispatch() changes it behind the type checker's back */
  const kind = (): NoteState['kind'] => state.kind;

  function show(): void {
    const v = noteView(state);
    msg.textContent = v.message;
    if (v.offerEmail) {
      const a = document.createElement('a');
      a.href = 'mailto:' + SITE.contact.email;
      a.textContent = SITE.contact.email;
      msg.append(a);
    }
    if (v.invalid) text.setAttribute('aria-invalid', 'true');
    else text.removeAttribute('aria-invalid');
    send.disabled = v.busy;
    send.textContent = v.busy ? MESSAGES.note.sending : MESSAGES.note.send;
    form.hidden = v.done;
    done.hidden = !v.done;
  }
  function dispatch(event: NoteEvent): void {
    const next = nextNoteState(state, event);
    if (next === state) return;
    state = next;
    show();
  }

  open.addEventListener('click', () => {
    dispatch({ type: 'open' });
    show();
    noteDlg.showModal();
    text.focus();
  });
  pick(noteDlg, '.note-x').addEventListener('click', () => noteDlg.close());
  noteDlg.addEventListener('click', (e) => {
    if (e.target === noteDlg) noteDlg.close();
  });
  text.addEventListener('input', () => dispatch({ type: 'edit' }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (kind() === 'sending') return;
    const f = new FormData(form);
    const note = readNote((field) => f.get(field));
    dispatch({ type: 'submit', problem: validateNote(note) });
    if (kind() !== 'sending') {
      text.focus();
      return;
    }
    void (async () => {
      if (!api.enabled) await new Promise((r) => setTimeout(r, NO_API_PAUSE_MS));
      dispatch({ type: 'result', result: await api.postNote(note) });
      if (kind() !== 'sent') return;
      form.reset();
      done.focus();
      /* the note goes up as a lantern: step out of the way so it can be seen */
      if (S.reduce) lightLantern();
      else
        setTimeout(() => {
          if (noteDlg.open) noteDlg.close();
          lightLantern();
        }, THANKS_MS);
    })();
  });
}
