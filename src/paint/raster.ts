/**
 * Paintings to pixels, once each. The SVG a Painter builds is decoded as an image and drawn into a canvas; wide far
 * layers then melt into the paper at their ends, and a coarse occupancy grid is kept for placing labels on clear
 * paper. Rasterising has to happen here on the main thread: SVG filters can only be rendered by an <img>, which
 * workers do not have (createImageBitmap refuses SVG there), and some paintings take a few hundred milliseconds.
 * So the site ships them baked: `npm run paint` paints every kind once in a real browser and writes
 * public/paint/<kind>.webp and src/paint/baked.json. The page decodes those (off the main thread) and only paints
 * live what has no baked file, which happens in development right after a painter changes.
 */
import { clamp, mulberry32 } from '../lib/math';
import { ctx2d, newCanvas } from '../lib/dom';
import { OG, type Occupancy } from '../journey/labels';
import { PAINT, STARS, type EdgeFade, type Kind } from './kinds';
import { MASKF, MS } from './masks';
import { BAKED_KINDS, hexToOccupancy, type Baked } from './baked';
import { svgOf } from './svg-of';

const bakedUrl = (k: Kind, b: Baked): string => `${import.meta.env.BASE_URL}paint/${k}.webp?v=${b.hash}`;

/** Stars are tiny points: drawn straight onto a canvas. */
function paintStars(q: number): HTMLCanvasElement {
  const { w, h } = STARS,
    c = newCanvas(Math.round(w * q), Math.round(h * q)),
    g = ctx2d(c),
    r = mulberry32(5);
  g.scale(q, q);
  for (let i = 0; i < 260; i++) {
    const x = r() * w,
      y = Math.pow(r(), 1.3) * h,
      s = 0.5 + Math.pow(r(), 3) * 1.8,
      a = 0.35 + r() * 0.6;
    if (s > 1.4) {
      const gr = g.createRadialGradient(x, y, 0, x, y, s * 5);
      gr.addColorStop(0, `rgba(241,231,200,${a * 0.35})`);
      gr.addColorStop(1, 'rgba(241,231,200,0)');
      g.fillStyle = gr;
      g.fillRect(x - s * 5, y - s * 5, s * 10, s * 10);
    }
    g.fillStyle = `rgba(241,231,200,${a})`;
    g.beginPath();
    g.arc(x, y, s, 0, 6.283);
    g.fill();
  }
  return c;
}

/** Wide far layers melt into the paper fog at their ends instead of stopping at the canvas edge. */
function edgeFade(c: HTMLCanvasElement, fd: EdgeFade): void {
  const mw = 240,
    mh = Math.max(24, Math.round((mw * c.height) / c.width)),
    m = newCanvas(mw, mh),
    g = ctx2d(m),
    im = g.createImageData(mw, mh);
  for (let y = 0; y < mh; y++)
    for (let x = 0; x < mw; x++) {
      const u = Math.min(x / mw / fd.x, (mw - x) / mw / fd.x, fd.b ? (mh - y) / mh / fd.b : 9);
      const n = MASKF[(y % MS) * MS + (x % MS)] * 0.65 + MASKF[((y * 3) % MS) * MS + ((x * 3) % MS)] * 0.35;
      im.data[(y * mw + x) * 4 + 3] = clamp((u + (n - 0.5) * (fd.n ?? 0.9) - 0.28) / 0.3, 0, 1) * 255;
    }
  g.putImageData(im, 0, 0);
  const cg = ctx2d(c);
  cg.globalCompositeOperation = 'destination-in';
  cg.drawImage(m, 0, 0, c.width, c.height);
  cg.globalCompositeOperation = 'source-over';
}

/**
 * Which grid cells of a painting have paint in them, and the box around them. Reading a big canvas back from the
 * GPU is slow, so baked paintings carry theirs (baked.json); this measures live ones and is used by the baking.
 */
export function occupancy(c: HTMLCanvasElement | HTMLImageElement): Occupancy {
  const m = newCanvas(OG, OG),
    g = m.getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('This browser gave no 2D canvas context, so the painting cannot be measured.');
  g.drawImage(c, 0, 0, OG, OG);
  const d = g.getImageData(0, 0, OG, OG).data,
    grid = new Uint8Array(OG * OG);
  let x0 = OG,
    y0 = OG,
    x1 = 0,
    y1 = 0;
  for (let i = 0; i < OG * OG; i++)
    if (d[i * 4 + 3] > 34) {
      grid[i] = 1;
      const x = i % OG,
        y = (i / OG) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x + 1);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y + 1);
    }
  return { grid, bb: [x0 / OG, y0 / OG, x1 / OG, y1 / OG] };
}

/** A baked painting, decoded into a canvas of its baked size, and where it has paint. */
async function loadBaked(k: Kind, b: Baked): Promise<[HTMLCanvasElement, Occupancy]> {
  const img = new Image();
  img.src = bakedUrl(k, b);
  await img.decode();
  const occ = hexToOccupancy(b.occ, b.bb, OG * OG),
    c = newCanvas(img.naturalWidth, img.naturalHeight);
  ctx2d(c).drawImage(img, 0, 0);
  return [c, occ];
}

/** Paint a kind live from its SVG (the baking script uses this too). */
export async function rasterize(k: Kind, q: number): Promise<HTMLCanvasElement> {
  if (k === 'stars') return paintStars(q);
  const def = PAINT[k];
  const url = URL.createObjectURL(new Blob([svgOf(k, q)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = newCanvas(Math.max(1, Math.round(def.w * q)), Math.max(1, Math.round(def.h * q)));
    ctx2d(c).drawImage(img, 0, 0, c.width, c.height);
    if ('fade' in def && def.fade) edgeFade(c, def.fade);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const BITMAPS = new Map<Kind, HTMLCanvasElement>();
const OCC = new Map<Kind, Occupancy>();
const pending = new Map<Kind, Promise<HTMLCanvasElement>>();

/** A painting's pixels, painted the first time they are asked for (at q times its size) and kept. */
export function bitmap(k: Kind, q: number): Promise<HTMLCanvasElement> {
  const ready = BITMAPS.get(k);
  if (ready) return Promise.resolve(ready);
  let p = pending.get(k);
  if (!p) {
    const b = BAKED_KINDS[k];
    const live = (): Promise<[HTMLCanvasElement, Occupancy]> =>
      rasterize(k, q).then((c): [HTMLCanvasElement, Occupancy] => [c, occupancy(c)]);
    const made = b
      ? loadBaked(k, b).catch((err: unknown) => {
          /* a missing or broken file: paint it here instead */
          if (err instanceof Error) return live();
          throw err;
        })
      : live();
    p = made.then(([c, occ]) => {
      OCC.set(k, occ);
      BITMAPS.set(k, c);
      return c;
    });
    pending.set(k, p);
  }
  return p;
}

export const bitmapNow = (k: Kind): HTMLCanvasElement | undefined => BITMAPS.get(k);
export const occupancyOf = (k: Kind): Occupancy | undefined => OCC.get(k);
