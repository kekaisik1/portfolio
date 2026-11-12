/** The address bar follows the walk: the country you are in, so a copied link opens where you were standing. */

/** Change the address without adding a step to the history. Where that is not allowed the address just stays put. */
export function replaceAddress(url: string): void {
  try {
    history.replaceState(null, '', url);
  } catch (err) {
    /* file:// or a sandboxed frame refuses with a SecurityError */
    if (!(err instanceof DOMException)) throw err;
  }
}

/** The address for a country: the mountains are the start, so they have none. */
export const addressOf = (country: string): string =>
  country === 'mountains' ? location.pathname + location.search : '#' + country;
