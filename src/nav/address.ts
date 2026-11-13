/** The address bar follows the travel: the world you are in, so a copied link opens where you were standing. */

/** Change the address without adding a step to the history. Where that is not allowed the address just stays put. */
export function replaceAddress(hash: string): void {
  try {
    history.replaceState(null, '', hash || location.pathname + location.search);
  } catch (err) {
    /* file:// or a sandboxed frame refuses with a SecurityError */
    if (!(err instanceof DOMException)) throw err;
  }
}
