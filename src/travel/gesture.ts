/** What a key, a turn of the wheel or a swipe means: one step per gesture, never a free scroll. Pure. */
import { clamp } from '../lib/math';

/** Which row a key leads to from row `cur`, or null when the key is not a travel key. */
export function keyTarget(key: string, cur: number, last: number): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'PageDown':
    case 'j':
      return clamp(cur + 1, 0, last);
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'PageUp':
    case 'k':
      return clamp(cur - 1, 0, last);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
}

/** a pause this long in wheel events means a new gesture */
const WHEEL_GAP_MS = 160;
/** a long, hard spin may step again after this long */
const WHEEL_REPEAT_MS = 700;
const WHEEL_REPEAT_DELTA = 60;
const WHEEL_MIN_DELTA = 4;

export interface WheelGate {
  lastWheel: number;
  lastStep: number;
}
export const newWheelGate = (): WheelGate => ({ lastWheel: -Infinity, lastStep: -Infinity });

/**
 * One step per wheel gesture: a trackpad fling sends dozens of events, and only the first of a burst counts.
 * Returns the step to take (0 = none) and remembers the event in `gate`.
 */
export function wheelStep(gate: WheelGate, now: number, deltaY: number, deltaX: number): -1 | 0 | 1 {
  const fresh = now - gate.lastWheel > WHEEL_GAP_MS;
  gate.lastWheel = now;
  if (Math.abs(deltaY) < WHEEL_MIN_DELTA || Math.abs(deltaY) < Math.abs(deltaX)) return 0;
  const again = now - gate.lastStep > WHEEL_REPEAT_MS && Math.abs(deltaY) >= WHEEL_REPEAT_DELTA;
  if (!fresh && !again) return 0;
  gate.lastStep = now;
  return deltaY > 0 ? 1 : -1;
}

/** a swipe shorter than this is a tap that slipped */
export const SWIPE_MIN_PX = 48;

/** A finger moved by (dx, dy): up = the next world, down = the previous, sideways or short = nothing. */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dy) < SWIPE_MIN_PX || Math.abs(dy) < Math.abs(dx) * 1.2) return 0;
  return dy < 0 ? 1 : -1;
}
