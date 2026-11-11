/** What a note may be. The limits are the API's (see its README); checking here saves a round trip. */

export const NOTE_LIMITS = { text: 600, name: 60, contact: 120 } as const;

export interface NoteInput {
  text: string;
  name: string;
  contact: string;
  /** the trap field: empty for people */
  website: string;
}
export type NoteProblem = 'empty' | 'tooLong';

/** Read a note from raw form values: everything trimmed except the trap, which is passed on as typed. */
export function readNote(get: (field: string) => unknown): NoteInput {
  const str = (field: string): string => {
    const v = get(field);
    return typeof v === 'string' ? v : '';
  };
  return {
    text: str('text').trim(),
    name: str('name').trim(),
    contact: str('contact').trim(),
    website: str('website'),
  };
}

/** null = fine to send. */
export function validateNote(n: NoteInput): NoteProblem | null {
  if (!n.text) return 'empty';
  if (n.text.length > NOTE_LIMITS.text || n.name.length > NOTE_LIMITS.name || n.contact.length > NOTE_LIMITS.contact)
    return 'tooLong';
  return null;
}
