/**
 * The cut-outs on the page: one element per piece of the landscape, holding a canvas with its painting drawn
 * through the paper-grain mask of its current dissolve level. The canvas is redrawn only when the level changes;
 * every frame in between only moves the element (transform) and fogs it (opacity).
 */
import { ctx2d, newCanvas } from '../lib/dom';
import { clamp } from '../lib/math';
import { sizeOf } from '../paint/kinds';
import { CUT_MASKS } from '../paint/masks';
import { bitmapNow } from '../paint/raster';
import { CUTS, cutId, type CutDef, type Placement } from '../scene/objects';
import { stopOfSlug } from '../scene/stops';
import { newBox, type Box } from './camera';
import { nightScene, sceneEl } from './dom';
import { LV } from './timing';

export interface Cut {
  def: CutDef;
  id: string;
  size: { w: number; h: number };
  el: HTMLDivElement;
  cv: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  /** the stop of the place it stands for (-1 = none) */
  st: number;
  /** current dissolve level drawn (-1 = needs drawing) */
  L: number;
  /** when its painting arrived (ms), 0 = not yet */
  readyAt: number;
  /** presence this frame (0..1), after soaking in and a place opening */
  a: number;
  visible: boolean;
  /** where it is on screen this frame (valid when `onScreen`) */
  box: Box;
  onScreen: boolean;
  place: Placement;
  /** an offset into the mask tile, so pieces don't dissolve in the same pattern */
  mx: number;
  my: number;
  lastTf: string;
  lastFog: string;
  lifeOn: boolean;
}

/** Make the elements for every cut-out. `onOpen` is called with a place's slug when its object is clicked. */
export function makeCuts(onOpen: (slug: string) => void): Cut[] {
  return CUTS.map((def, i) => {
    const size = sizeOf(def.k),
      el = document.createElement('div');
    el.className = 'cut';
    el.dataset.kind = def.k;
    el.style.width = size.w + 'px';
    el.style.height = size.h + 'px';
    el.style.zIndex = def.far
      ? String(100 - Math.round(def.z0 * 10))
      : String(1000 - Math.round((def.z0 + def.stop) * 30));
    const cv = newCanvas(1, 1);
    el.append(cv);
    (def.night ? nightScene : sceneEl).append(el);
    const slug = def.slug;
    if (slug) {
      el.classList.add('hit');
      el.dataset.slug = slug;
      el.addEventListener('click', () => onOpen(slug));
    }
    return {
      def,
      id: cutId(def),
      size,
      el,
      cv,
      g: ctx2d(cv),
      st: slug ? stopOfSlug(slug) : -1,
      L: -1,
      readyAt: 0,
      a: 0,
      visible: false,
      box: newBox(),
      onScreen: false,
      place: { x: def.x, y: def.y, h: def.h },
      mx: (i * 71) % 200,
      my: (i * 37) % 200,
      lastTf: '',
      lastFog: '',
      lifeOn: false,
    };
  });
}

const patterns: (CanvasPattern | null)[] = [];

/** Draw a cut-out's painting at dissolve level L (LV = whole). */
export function drawLevel(c: Cut, L: number): void {
  const bm = bitmapNow(c.def.k);
  if (!bm) return;
  const cv = c.cv,
    g = c.g;
  if (cv.width !== bm.width || cv.height !== bm.height) {
    cv.width = bm.width;
    cv.height = bm.height;
  }
  g.globalCompositeOperation = 'copy';
  g.drawImage(bm, 0, 0);
  if (L < LV) {
    g.globalCompositeOperation = 'destination-in';
    let pat = patterns[L];
    if (!pat) pat = patterns[L] = g.createPattern(CUT_MASKS[L], 'repeat');
    if (pat) {
      const k = clamp(Math.max(cv.width, cv.height) / 520, 1, 3.2);
      pat.setTransform(new DOMMatrix([k, 0, 0, k, -c.mx * k, -c.my * k]));
      g.fillStyle = pat;
      g.fillRect(0, 0, cv.width, cv.height);
    }
  }
  g.globalCompositeOperation = 'source-over';
}

/** Small life (smoke, a bobbing boat, gulls, flickering lanterns): CSS animations, never with reduced motion. */
export function addLife(c: Cut, reduced: boolean): void {
  const life = c.def.life;
  if (!life || reduced || c.lifeOn) return;
  if (life === 'smoke') {
    const sm = bitmapNow('smoke'),
      at = c.def.lifeAt ?? [0, 0];
    if (!sm) return;
    for (let k = 0; k < 2; k++) {
      const p = newCanvas(sm.width, sm.height);
      ctx2d(p).drawImage(sm, 0, 0);
      p.className = 'life smoke';
      p.style.left = at[0] + 'px';
      p.style.top = at[1] + 'px';
      p.style.animationDelay = k * 3.5 + 's';
      c.el.append(p);
    }
  } else c.cv.classList.add('life-' + life);
  c.lifeOn = true;
}

/** Take the small life away again (reduced motion switched on). */
export function removeLife(c: Cut): void {
  if (!c.lifeOn) return;
  c.el.querySelectorAll('.smoke').forEach((n) => n.remove());
  c.cv.className = '';
  c.lifeOn = false;
}
