/** Pencil grain: rub a little out of everything that has just been drawn, so no line is solid. */
import { S } from '../state';
import type { G } from '../types';

export function rubGrain(g: G, c: HTMLCanvasElement, amount = 0.3): void {
  if (!S.grain) return;
  const pattern = g.createPattern(S.grain, 'repeat');
  if (!pattern) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = amount;
  g.fillStyle = pattern;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
}
