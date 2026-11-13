/**
 * The cut between worlds: slats of the next photo close over the current one, sweeping from the board's edge, each
 * in three hard steps. A slat is scaled across and its photo is scaled back by the inverse, so at every step the
 * picture inside is exactly where the real photo will be. Only transforms move; the whole thing is 300 ms.
 */
import type { Frame } from './photos';
import { SLAT_MS, slatPlan } from './slats';

export interface Cut {
  /** settles when every slat is closed */
  done: Promise<void>;
  /** close everything now (someone is already travelling on) */
  finish(): void;
  /** take the slats away: call once the real photo is showing underneath */
  remove(): void;
}

const HOLD = 'steps(1, end)';
/** a slat closes in thirds; its photo is stretched by the inverse so it does not move */
const SLAT_FRAMES: Keyframe[] = [
  { transform: 'scaleX(0.3334)', easing: HOLD, offset: 0 },
  { transform: 'scaleX(0.6667)', easing: HOLD, offset: 1 / 3 },
  { transform: 'scaleX(1)', easing: HOLD, offset: 2 / 3 },
  { transform: 'scaleX(1)', offset: 1 },
];
const PHOTO_FRAMES: Keyframe[] = [
  { transform: 'scaleX(3)', easing: HOLD, offset: 0 },
  { transform: 'scaleX(1.5)', easing: HOLD, offset: 1 / 3 },
  { transform: 'scaleX(1)', easing: HOLD, offset: 2 / 3 },
  { transform: 'scaleX(1)', offset: 1 },
];

let turn = 0;

/**
 * Close slats over `layer`. With a frame they carry its photo (or its blurred stand-in, if it is not decoded yet);
 * without one they are plain board colour (the video player opens behind them).
 */
export function runCut(layer: HTMLElement, frame: Frame | null, fromRight = false): Cut {
  const width = layer.clientWidth;
  const box = document.createElement('div');
  const anims: Animation[] = [];
  const decoded = frame !== null && frame.el.classList.contains('ld');
  for (const s of slatPlan(width, turn++, fromRight)) {
    const slat = document.createElement('div');
    slat.className = fromRight ? 'slat rev' : 'slat';
    slat.style.left = `${s.x}px`;
    slat.style.width = `${s.w}px`;
    const timing: KeyframeAnimationOptions = { duration: SLAT_MS, delay: s.delay, fill: 'forwards' };
    anims.push(slat.animate(SLAT_FRAMES, timing));
    if (frame) {
      const inner = document.createElement('div');
      inner.className = 'slat-in';
      inner.style.cssText = frame.el.style.cssText;
      inner.style.width = `${width}px`;
      inner.style.left = `${-s.x}px`;
      /* the photo stretches about the slat's own closing edge, in the photo's coordinates */
      inner.style.transformOrigin = `${fromRight ? s.x + s.w : s.x}px 50%`;
      if (decoded) {
        const copy = new Image();
        copy.alt = '';
        copy.decoding = 'sync';
        copy.src = frame.img.currentSrc || frame.img.src;
        inner.append(copy);
      }
      inner.animate(PHOTO_FRAMES, timing);
      slat.append(inner);
    }
    box.append(slat);
  }
  layer.append(box);
  const done = Promise.all(
    anims.map((a) =>
      a.finished.then(
        () => undefined,
        /* a cancelled animation (the slats were removed early) rejects with an AbortError: nothing to do */
        () => undefined,
      ),
    ),
  ).then(() => undefined);
  return {
    done,
    finish() {
      for (const a of box.getAnimations({ subtree: true })) a.finish();
    },
    remove() {
      box.remove();
    },
  };
}
