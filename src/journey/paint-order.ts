/**
 * Painting the journey, nearest first: the pieces of the stop on screen, then outwards, one painting per task so
 * scrolling stays responsive; then the dusk. The extra pieces a place's finished painting needs are fetched when
 * you arrive at that place (inside/painting.ts). Each piece soaks in as soon as its painting is ready.
 */
import { clamp } from '../lib/math';
import { ctx2d } from '../lib/dom';
import type { Kind } from '../paint/kinds';
import { qualityFor } from '../paint/quality';
import { bitmap } from '../paint/raster';
import { addLife, type Cut } from './cuts';
import { duskCv, root } from './dom';
import { requestFrame } from './frame';
import { planLabels } from './layout';
import { S } from './state';
import { W } from './world';

/** How finely to paint a kind on this screen (the baked paintings were made for the largest screens). */
export const qualityOf = (k: Kind): number => qualityFor(k, S.view.R.h, window.devicePixelRatio || 1);

const yieldTask = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** The dusk band at the top of the rising night: painted once, shown stretched to the screen's width. */
async function paintDusk(): Promise<void> {
  const bm = await bitmap('dusk', 0.6);
  duskCv.width = bm.width;
  duskCv.height = bm.height;
  ctx2d(duskCv).drawImage(bm, 0, 0);
}

export async function paintAll(): Promise<void> {
  const s0 = S.target;
  const order: Cut[] = W.cuts.slice().sort((a, b) => {
    const da = Math.abs(clamp(s0, a.def.from, a.def.to) - s0),
      db = Math.abs(clamp(s0, b.def.from, b.def.to) - s0);
    return da - db || b.def.z0 - a.def.z0;
  });
  let first = true;
  for (const c of order) {
    await bitmap(c.def.k, qualityOf(c.def.k));
    if (c.def.life === 'smoke') await bitmap('smoke', 1);
    c.readyAt = performance.now();
    c.L = -1;
    addLife(c, S.reduce);
    planLabels();
    requestFrame();
    /* the first screen is painted once its own pieces are in: the page says so (tests wait for it) */
    if (first && Math.abs(clamp(s0, c.def.from, c.def.to) - s0) > 0.5) {
      first = false;
      root.classList.add('ready');
      /* the dusk next, so a quick walk to the sea already finds it */
      await paintDusk();
    }
    await yieldTask();
  }
  root.classList.add('ready');
  if (first) await paintDusk();
}
