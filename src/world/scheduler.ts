/**
 * Asking for a frame. Kept apart from the loop itself so anything may ask (a hover, a lantern, an API answer)
 * without importing everything the loop draws.
 */
import { S } from './state';

let onFrame: FrameRequestCallback | null = null;

/** The loop registers itself here once, at start-up. */
export function setFrameHandler(fn: FrameRequestCallback): void {
  onFrame = fn;
}

/** Draw one frame soon (the loop keeps itself going from there unless motion is reduced or the page is hidden). */
export function requestDraw(): void {
  if (!S.raf && onFrame) S.raf = requestAnimationFrame(onFrame);
}
