/**
 * The page's layout questions, as media queries. The same text is written in src/styles/narrow.css and in the
 * first photo's <source> (a unit test keeps them in step):
 * narrow = phones and upright tablets: the photo is the whole screen and the board is a sheet;
 * tall = the upright crop of each photo is the one on screen.
 */
export const NARROW_QUERY = '(max-width: 820px), (max-width: 1100px) and (orientation: portrait)';
export const TALL_QUERY = '(max-width: 1100px) and (orientation: portrait)';
export const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
