/**
 * What every room has: four walls, a floor, perhaps a window, and the furniture several of them share.
 * Rooms are drawn on a 600 x 440 sheet, floor line at y = -70, the far wall above it, a table across the front.
 */
import { arc, box } from '../world/draw/pencil';
import type { RoomDef, Sketch } from '../world/types';

export function roomShell(s: Sketch, o: RoomDef): void {
  s.poly(box(0, -440, 600, 372), { fill: o.wall || 'fill', w: 1.5, r: 6 });
  s.fill(box(0, -70, 600, 70), o.floor || 'wash', 0.9, 4);
  s.line([0, -70, 600, -70.5], { w: 1.3 });
  const fl = [];
  for (let x = -200; x <= 800; x += 62) fl.push(300 + (x - 300) * 0.6, -69, x, 0);
  s.segs(fl, { w: 0.7, a: 0.3 });
  s.hatch(470, -436, 596, -74, 9, { a: 0.16 }).hatch(4, -436, 596, -420, 6, { a: 0.22, k: 0.4 });
  if (o.win) {
    const [x, y, w, h] = o.win;
    s.fill(box(x, y, w, h), 'sky', 1, 3);
    s.rect(x, y, w, h, { w: 1.4 });
    s.segs([x + w / 2, y, x + w / 2, y + h, x, y + h * 0.45, x + w, y + h * 0.45], { w: 1, a: 0.7 });
    s.poly([x - 8, y + h, x + w + 8, y + h, x + w + 5, y + h + 8, x - 5, y + h + 8], { fill: 'paper', w: 1, r: 2 });
    s.line(arc(x + w * 0.2, y, w * 0.2, h * 0.8, 0, Math.PI * 0.5, 6), { w: 0.8, passes: 1, a: 0.5 }).line(
      arc(x + w * 0.8, y, w * 0.2, h * 0.8, Math.PI * 0.5, Math.PI, 6),
      { w: 0.8, passes: 1, a: 0.5 },
    );
  }
}
export const table = (s: Sketch, x0 = 30, x1 = 570, y = -104): void => {
  s.poly([x0, y, x1, y, x1 + 16, y + 16, x0 - 16, y + 16], { fill: 'wash', w: 1.4, r: 2 });
  s.poly(box(x0 - 14, y + 16, x1 - x0 + 28, 9), { fill: 'dark', fa: 0.7, w: 1.1, r: 1.5 });
  s.segs(
    [
      x0 + 4,
      y + 25,
      x0 + 2,
      -4,
      x1 - 4,
      y + 25,
      x1 - 2,
      -4,
      x0 + 16,
      y + 25,
      x0 + 15,
      -30,
      x1 - 16,
      y + 25,
      x1 - 15,
      -30,
    ],
    { w: 1.6, a: 0.75 },
  );
  s.hatch(x0, y + 26, x1, y + 40, 7, { a: 0.2, k: 0.4 });
};
export const spines = (
  s: Sketch,
  x0: number,
  x1: number,
  y: number,
  h: number,
  cols = ['wash', 'blue', 'dark', 'fill', 'gold', 'red'],
): void => {
  const R = s.rnd;
  for (let x = x0; x < x1 - 6;) {
    const w = 7 + R() * 9,
      hh = h * (0.7 + R() * 0.3);
    if (R() < 0.88) {
      s.fill(box(x, y - hh, w, hh), cols[(R() * cols.length) | 0], 0.8, 1);
      s.rect(x, y - hh, w, hh, { w: 0.8, passes: 1, jit: 0.3 });
    }
    x += w + 0.5;
  }
};
