/**
 * The page's one frame loop. The living photo and the particles both draw from it; it runs only while there is
 * something to draw and nothing holds it: a hidden tab, something covering the photo, motion switched off. A device
 * that keeps dropping frames loses the motion altogether instead of stuttering.
 */

/** a device that cannot keep up: this many late frames out of WINDOW */
const WINDOW = 90;
const TOO_MANY_LATE = 40;
const LATE_MS = 34;
/** the longest step a drawing is ever asked to make, in seconds (after a pause or a long frame) */
const MAX_STEP = 0.05;

export interface Ticker {
  /** Draw on every frame; `dt` is seconds since the last one. Returns the way to stop. */
  add(draw: (dt: number) => void): () => void;
  /** Stop the loop for a reason (and start it again when every reason is gone). */
  hold(reason: string, on: boolean): void;
  running(): boolean;
  /** Hear whenever the loop starts or stops. */
  watch(fn: (running: boolean) => void): void;
}

export function createTicker(opts: { onTooSlow: () => void }): Ticker {
  const draws = new Set<(dt: number) => void>();
  const holds = new Set<string>();
  const watchers: ((running: boolean) => void)[] = [];
  let raf = 0;
  let prev = 0;
  let seen = 0;
  let late = 0;

  const tell = (): void => watchers.forEach((fn) => fn(raf !== 0));

  function frame(now: number): void {
    if (prev) {
      const ms = now - prev;
      seen++;
      if (ms > LATE_MS) late++;
      if (seen >= WINDOW) {
        if (late > TOO_MANY_LATE) {
          raf = 0;
          holds.add('slow');
          tell();
          opts.onTooSlow();
          return;
        }
        seen = late = 0;
      }
      const dt = Math.min(MAX_STEP, ms / 1000);
      for (const draw of draws) draw(dt);
    }
    prev = now;
    raf = requestAnimationFrame(frame);
  }

  function sync(): void {
    const should = draws.size > 0 && holds.size === 0 && !document.hidden;
    if (should && !raf) {
      prev = 0;
      raf = requestAnimationFrame(frame);
      tell();
    } else if (!should && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      tell();
    }
  }

  document.addEventListener('visibilitychange', sync);

  return {
    add(draw) {
      draws.add(draw);
      sync();
      return () => {
        draws.delete(draw);
        sync();
      };
    },
    hold(reason, on) {
      if (on) holds.add(reason);
      else if (reason !== 'slow') holds.delete(reason);
      sync();
    },
    running: () => raf !== 0,
    watch(fn) {
      watchers.push(fn);
    },
  };
}
