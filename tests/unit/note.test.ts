import { describe, expect, it } from 'vitest';
import { NOTE_IDLE, nextNoteState, noteView, type NoteState } from '../../src/note/machine';
import { NOTE_LIMITS, readNote, validateNote } from '../../src/note/validate';

const input = (over: Partial<ReturnType<typeof readNote>> = {}): ReturnType<typeof readNote> => ({
  text: 'hello',
  name: '',
  contact: '',
  website: '',
  ...over,
});
const SENDING: NoteState = { kind: 'sending' };

describe('note validation', () => {
  it('requires a note', () => {
    expect(validateNote(input({ text: '' }))).toBe('empty');
  });

  it('treats a note of only spaces as empty once read from the form', () => {
    const note = readNote((f) => ({ text: '   \n ', name: ' Ada ', contact: '', website: '' })[f]);

    expect(note.name).toBe('Ada');
    expect(validateNote(note)).toBe('empty');
  });

  it('accepts a note of exactly 600 characters and rejects 601', () => {
    expect(validateNote(input({ text: 'a'.repeat(NOTE_LIMITS.text) }))).toBeNull();
    expect(validateNote(input({ text: 'a'.repeat(NOTE_LIMITS.text + 1) }))).toBe('tooLong');
  });

  it('rejects a name or contact that is too long', () => {
    expect(validateNote(input({ name: 'n'.repeat(61) }))).toBe('tooLong');
    expect(validateNote(input({ contact: 'c'.repeat(121) }))).toBe('tooLong');
  });

  it('reads missing or non-text fields as empty and passes the trap on untouched', () => {
    const note = readNote((f) => (f === 'website' ? ' bot ' : f === 'text' ? 'hi' : null));

    expect(note).toEqual({ text: 'hi', name: '', contact: '', website: ' bot ' });
  });
});

describe('note state machine', () => {
  it('goes from idle to sending on a valid submit', () => {
    expect(nextNoteState(NOTE_IDLE, { type: 'submit', problem: null })).toEqual(SENDING);
  });

  it('goes to invalid on an empty or too-long submit, and back to idle on edit', () => {
    const invalid = nextNoteState(NOTE_IDLE, { type: 'submit', problem: 'empty' });

    expect(invalid).toEqual({ kind: 'invalid', problem: 'empty' });
    expect(nextNoteState(invalid, { type: 'edit' })).toEqual(NOTE_IDLE);
    expect(nextNoteState(NOTE_IDLE, { type: 'submit', problem: 'tooLong' })).toEqual({
      kind: 'invalid',
      problem: 'tooLong',
    });
  });

  it('ignores a second submit while sending', () => {
    expect(nextNoteState(SENDING, { type: 'submit', problem: null })).toBe(SENDING);
  });

  it('is sent when the API accepts the note', () => {
    expect(nextNoteState(SENDING, { type: 'result', result: { ok: true, data: { ok: true } } })).toEqual({
      kind: 'sent',
    });
  });

  it('fails as unreachable when there is no API, no network, a timeout or a server error', () => {
    for (const result of [
      { ok: false, reason: 'disabled' },
      { ok: false, reason: 'network' },
      { ok: false, reason: 'timeout' },
      { ok: false, reason: 'invalid' },
      { ok: false, reason: 'http', status: 500 },
    ] as const) {
      expect(nextNoteState(SENDING, { type: 'result', result })).toEqual({ kind: 'failed', why: 'unreachable' });
    }
  });

  it('tells rate limiting and an over-long note apart from other failures', () => {
    expect(nextNoteState(SENDING, { type: 'result', result: { ok: false, reason: 'http', status: 429 } })).toEqual({
      kind: 'failed',
      why: 'rateLimited',
    });
    expect(nextNoteState(SENDING, { type: 'result', result: { ok: false, reason: 'http', status: 422 } })).toEqual({
      kind: 'failed',
      why: 'tooLong',
    });
  });

  it('ignores a late result when nothing is being sent', () => {
    expect(nextNoteState(NOTE_IDLE, { type: 'result', result: { ok: true, data: { ok: true } } })).toBe(NOTE_IDLE);
  });

  it('starts fresh when the dialog is opened again', () => {
    expect(nextNoteState({ kind: 'sent' }, { type: 'open' })).toEqual(NOTE_IDLE);
    expect(nextNoteState({ kind: 'failed', why: 'unreachable' }, { type: 'open' })).toEqual(NOTE_IDLE);
  });

  it('stays sending when the dialog is reopened mid-send, so a second note cannot go out', () => {
    const sending = { kind: 'sending' } as const;

    const next = nextNoteState(sending, { type: 'open' });

    expect(next).toBe(sending);
  });
});

describe('what the note form shows', () => {
  it('says to write something when the note is empty, and marks the field', () => {
    expect(noteView({ kind: 'invalid', problem: 'empty' })).toMatchObject({
      message: 'Write something first.',
      invalid: true,
    });
  });

  it('offers the email address when the note did not go through', () => {
    expect(noteView({ kind: 'failed', why: 'unreachable' })).toMatchObject({
      message: "It didn't go through. Write me instead: ",
      offerEmail: true,
      invalid: false,
    });
  });

  it('is busy while sending and done once sent, with nothing to complain about', () => {
    expect(noteView(SENDING)).toMatchObject({ busy: true, done: false, message: '' });
    expect(noteView({ kind: 'sent' })).toMatchObject({ busy: false, done: true, message: '' });
  });
});
