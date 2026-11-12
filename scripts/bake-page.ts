/** Runs inside the browser for `npm run paint`: paints every kind once and hands back WebP files and fingerprints. */
import { viewOf } from '../src/journey/camera';
import { PAINT, type PaintKind } from '../src/paint/kinds';
import { paintHash } from '../src/paint/hash';
import { MAX_DPR, qualityFor } from '../src/paint/quality';
import { gridToHex } from '../src/paint/baked';
import { PAPER_TEXTURES } from '../src/paint/masks';
import { occupancy, rasterize } from '../src/paint/raster';

/** The screen the paintings are made for: the largest one they are shown big on. */
const BAKE_W = 1440,
  BAKE_H = 900,
  WEBP_QUALITY = 0.82;

export interface BakedFile {
  k: PaintKind;
  q: number;
  w: number;
  h: number;
  hash: string;
  occ: string;
  bb: [number, number, number, number];
  webp: string;
}

async function bakeAll(): Promise<BakedFile[]> {
  const rh = viewOf(BAKE_W, BAKE_H).R.h,
    out: BakedFile[] = [];
  for (const k of Object.keys(PAINT) as PaintKind[]) {
    const q = qualityFor(k, rh, MAX_DPR),
      c = await rasterize(k, q),
      o = occupancy(c);
    out.push({
      k,
      q,
      w: c.width,
      h: c.height,
      hash: paintHash(k, q),
      occ: gridToHex(o.grid),
      bb: [o.bb[0], o.bb[1], o.bb[2], o.bb[3]],
      webp: c.toDataURL('image/webp', WEBP_QUALITY),
    });
  }
  return out;
}

/** The paper's grain and torn edges, as PNG data URLs by name. */
const bakeTextures = (): Record<string, string> =>
  Object.fromEntries(Object.entries(PAPER_TEXTURES).map(([name, make]) => [name, make().toDataURL('image/png')]));

declare global {
  interface Window {
    bakeAll?: () => Promise<BakedFile[]>;
    bakeTextures?: () => Record<string, string>;
  }
}
window.bakeAll = bakeAll;
window.bakeTextures = bakeTextures;
