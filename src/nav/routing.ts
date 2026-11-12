/** The pure parts of getting about: what an address means. No DOM, so it is unit-tested. */
import { indexOfWorld } from '../content/places';

/**
 * Links from before still land somewhere sensible: old project slugs, old section ids and the old site's four
 * countries map to the world that took them over.
 */
export const OLD_LINKS: Readonly<Record<string, string>> = {
  kana: 'kana-notebook',
  voice: 'front-desk',
  'voice-receptionist': 'front-desk',
  crm: 'front-desk',
  data: 'numbers-room',
  'data-assistant': 'numbers-room',
  'about-t': 'about',
  mountains: 'hello',
  steppe: 'lowl',
  sea: 'history-lens',
  night: 'about',
  write: 'contact',
  note: 'contact',
};

/** The world id a location hash points at ('' if it cannot be read). */
export function hashTarget(hash: string): string {
  let id: string;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ''));
  } catch (err) {
    /* a malformed %-escape */
    if (err instanceof URIError) return '';
    throw err;
  }
  return Object.hasOwn(OLD_LINKS, id) ? OLD_LINKS[id] : id;
}

/** Which row of the board an address points at, or -1 when it points at nothing here. */
export const worldOfHash = (hash: string): number => indexOfWorld(hashTarget(hash));

/** The address of a world: the summit is the start, so it has none. */
export const hashOfWorld = (i: number, id: string): string => (i === 0 ? '' : `#${id}`);
