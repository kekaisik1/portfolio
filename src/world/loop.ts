/**
 * The frame loop: ease the scene towards the scroll position, then draw what changed.
 */
import { applyDom } from '../nav/horizon';
import { updateObjs } from '../places/objects';
import { root } from './dom';
import { drawScene } from './scene';
import { S } from './state';
import { duskNow, readTarget } from './zones';

export function frame(now: number): void {
  S.raf = 0;
  if (!S.visible || !S.onscreen) return;
  const dt = S.last ? Math.min(0.05, (now - S.last) / 1000) : 0;
  S.last = now;
  if (!S.reduce) S.time += dt;
  S.target = readTarget();
  if (S.reduce) S.s = S.target;
  else {
    S.s += (S.target - S.s) * (1 - Math.pow(0.0012, dt));
    if (Math.abs(S.target - S.s) < 0.05) S.s = S.target;
  }
  const sy = window.scrollY;
  if (Math.abs(S.target - S.s) > 0.5 || Math.abs(sy - S.lastY) > 1) S.lastMove = S.time;
  S.nudge = 0;
  if (!S.reduce && S.s < 4) {
    const idle = S.time - S.lastMove - 3.5;
    if (idle > 0) {
      const ph = (idle % 6) / 6;
      if (ph < 0.3) S.nudge = Math.sin((ph / 0.3) * Math.PI) * 10;
    }
  }
  S.lastY = sy;
  if (S.intro && S.intro.skip === false && Math.abs(window.scrollY - S.intro.y0) > 40) {
    S.intro.t0 = Math.min(S.intro.t0, S.time - 2.6);
    S.intro.skip = true;
    reveal();
  }
  duskNow();
  applyDom();
  /* once you are inside a place the landscape is behind fog: it is not drawn again until you come out */
  if (!(S.inObj && S.inSettled && !S.inClosing)) drawScene();
  updateObjs(dt);
  if (!S.reduce) S.raf = requestAnimationFrame(frame);
}
export function reveal(): void {
  root.classList.add('ready');
  setTimeout(() => root.classList.add('ready-nav'), S.reduce ? 0 : 900);
}
