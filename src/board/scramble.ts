/** The board's small flourish: a word's characters cycle for a moment, then lock. Fixed-width, so nothing shifts. */

const GLYPHS = 'ABCDEFGHKLMNPRSTUVXYZ0123456789';
export const SCRAMBLE_MS = 240;
const TICK_MS = 40;

/**
 * The word as it reads `progress` (0..1) of the way through: characters lock from the left, spaces stay spaces.
 * `pick` chooses the stand-in glyph for a position (random on the page, fixed in tests).
 */
export function scrambled(final: string, progress: number, pick: (i: number) => string): string {
  if (progress >= 1) return final;
  let out = '';
  for (let i = 0; i < final.length; i++) {
    const ch = final[i];
    out += i < progress * final.length || ch === ' ' ? ch : pick(i);
  }
  return out;
}

const timers = new WeakMap<HTMLElement, number>();

/** Is this element still cycling? (the clock leaves it alone until it locks) */
export const scrambling = (el: HTMLElement): boolean => timers.has(el);

/** Write `text` into `el`, cycling its characters first unless `instant`. */
export function scramble(el: HTMLElement, text: string, instant: boolean): void {
  const running = timers.get(el);
  if (running !== undefined) {
    clearInterval(running);
    timers.delete(el);
  }
  if (instant) {
    el.textContent = text;
    return;
  }
  const t0 = performance.now();
  const tick = (): void => {
    const p = (performance.now() - t0) / SCRAMBLE_MS;
    el.textContent = scrambled(text, p, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    if (p < 1) return;
    clearInterval(timers.get(el));
    timers.delete(el);
  };
  timers.set(el, window.setInterval(tick, TICK_MS));
  tick();
}
