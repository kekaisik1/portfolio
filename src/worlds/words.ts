/** Showing one world's words. The longer text always waits behind "Read" (src/sheet/read.ts), so nothing is measured. */

/** Put world `i`'s words on screen and take the others off. */
export function showWords(worlds: readonly HTMLElement[], i: number, arrive: boolean): void {
  worlds.forEach((w, j) => {
    w.classList.toggle('on', j === i);
    w.classList.remove('in');
  });
  if (arrive) worlds[i].classList.add('in');
}
