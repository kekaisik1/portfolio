/** The layout questions (queries.ts), asked of this browser. Importing this needs a window: not for unit tests. */
import { NARROW_QUERY, REDUCE_QUERY, TALL_QUERY } from './queries';

export const narrow = window.matchMedia(NARROW_QUERY);
export const tall = window.matchMedia(TALL_QUERY);
export const reduce = window.matchMedia(REDUCE_QUERY);
