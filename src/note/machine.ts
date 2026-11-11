/** The note form's states, as a pure state machine: the form (form.ts) only shows what this says. */
import type { ApiResult } from '../api/client';
import { MESSAGES } from '../content/site';
import type { NoteProblem } from './validate';

export type NoteFailure = 'unreachable' | 'rateLimited' | 'tooLong';
export type NoteState =
  | { kind: 'idle' }
  | { kind: 'invalid'; problem: NoteProblem }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'failed'; why: NoteFailure };

export type NoteEvent =
  | { type: 'open' }
  | { type: 'edit' }
  /** the visitor pressed send; `problem` is what validation found */
  | { type: 'submit'; problem: NoteProblem | null }
  /** the API answered (or could not) */
  | { type: 'result'; result: ApiResult<{ ok: boolean }> };

export const NOTE_IDLE: NoteState = { kind: 'idle' };

function failure(result: ApiResult<{ ok: boolean }>): NoteFailure | null {
  if (result.ok) return result.data.ok ? null : 'unreachable';
  if (result.reason === 'http' && result.status === 429) return 'rateLimited';
  if (result.reason === 'http' && result.status === 422) return 'tooLong';
  /* no API, no network, a timeout, a server error, an answer we cannot read: all the same to the visitor */
  return 'unreachable';
}

export function nextNoteState(state: NoteState, event: NoteEvent): NoteState {
  switch (event.type) {
    case 'open':
      /* reopening mid-send must not free the button: a second note would go out and the first answer would land on it */
      return state.kind === 'sending' ? state : NOTE_IDLE;
    case 'edit':
      /* typing clears a complaint, but never interrupts a send or un-sends a note */
      return state.kind === 'invalid' || state.kind === 'failed' ? NOTE_IDLE : state;
    case 'submit':
      if (state.kind === 'sending' || state.kind === 'sent') return state;
      return event.problem ? { kind: 'invalid', problem: event.problem } : { kind: 'sending' };
    case 'result': {
      if (state.kind !== 'sending') return state;
      const why = failure(event.result);
      return why ? { kind: 'failed', why } : { kind: 'sent' };
    }
  }
}

export interface NoteView {
  /** the line under the form ('' = nothing to say) */
  message: string;
  /** mark the note field as invalid */
  invalid: boolean;
  /** the message ends with the email address, as a link */
  offerEmail: boolean;
  busy: boolean;
  done: boolean;
}

/** What the form should show in a given state. */
export function noteView(state: NoteState): NoteView {
  const base: NoteView = { message: '', invalid: false, offerEmail: false, busy: false, done: false };
  switch (state.kind) {
    case 'idle':
      return base;
    case 'sending':
      return { ...base, busy: true };
    case 'sent':
      return { ...base, done: true };
    case 'invalid':
      return {
        ...base,
        invalid: true,
        message: state.problem === 'empty' ? MESSAGES.note.empty : MESSAGES.note.tooLong,
      };
    case 'failed':
      if (state.why === 'rateLimited') return { ...base, message: MESSAGES.note.rateLimited };
      if (state.why === 'tooLong') return { ...base, invalid: true, message: MESSAGES.note.tooLong };
      return { ...base, message: MESSAGES.note.failed, offerEmail: true };
  }
}
