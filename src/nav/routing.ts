/** The pure parts of getting about: what an address, a key or a history entry means. No DOM, so they are unit-tested. */

/**
 * Links from before the rebuild still land somewhere sensible: old project slugs and old section ids
 * map to the place that took them over.
 */
export const OLD_LINKS: Readonly<Record<string, string>> = {
  kana: 'kana-notebook',
  voice: 'front-desk',
  'voice-receptionist': 'front-desk',
  crm: 'front-desk',
  data: 'numbers-room',
  'data-assistant': 'numbers-room',
  'about-t': 'about',
};

/** The element id a location hash points at ('' if it cannot be read). */
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

/** Which stop an arrow key leads to: the next one, or the one you are between and have not reached. */
export function arrowStop(dir: 1 | -1, y: number, stops: readonly number[], cur: number): number {
  if (dir === 1) return y < stops[cur] - 40 ? cur : cur + 1;
  return y > stops[cur] + 40 ? cur : cur - 1;
}

/** The slug of the place a history entry was made inside of, if any. */
export function insideSlug(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('inside' in state)) return null;
  return typeof state.inside === 'string' ? state.inside : null;
}
