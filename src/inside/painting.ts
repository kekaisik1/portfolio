/**
 * The finished painting of a place, composed from the same pieces you walked past, full bleed behind the paper.
 * It blooms out of the thing you clicked through a radial paper-grain mask: the mask's steps are made once per
 * opening, and each frame of the bloom only draws the painting through the current step.
 */
import { clamp, easeOut } from '../lib/math';
import { ctx2d, newCanvas } from '../lib/dom';
import { sizeOf, type Kind } from '../paint/kinds';
import { MASKF, MS } from '../paint/masks';
import { bitmap, bitmapNow } from '../paint/raster';
import { anchorY } from '../journey/camera';
import { qualityOf } from '../journey/paint-order';
import { COMPOSE, layoutPainting, type Composition } from '../scene/compose';
import { CUTS, cutOfSlug } from '../scene/objects';
import { projectBySlug } from '../content/projects';

/** phones: the painting is the top half of the screen */
export const PHONE_BAND = 0.52;
/** steps of the bloom */
const BLOOM_LV = 24;
const BW = 192,
  BH = 120;

function kindsOf(c: Composition, focal: Kind, alts: readonly Kind[]): Kind[] {
  return [c.bg, focal, ...alts, ...c.far.map((i) => i[0]), ...c.mid.map((i) => i[0]), ...c.near.map((i) => i[0])];
}

function placeOf(slug: string): { c: Composition; focal: Kind; alts: Kind[] } | null {
  const p = projectBySlug(slug),
    cut = cutOfSlug(slug);
  if (!p || !cut) return null;
  /* the country's other places stand further back */
  const alts = CUTS.filter((o) => o.slug && o.slug !== slug && projectBySlug(o.slug)?.zone === p.zone).map((o) => o.k);
  return { c: COMPOSE[p.zone], focal: cut.k, alts };
}

/** Start fetching what a place's finished painting needs, so it is there by the time someone goes in. */
export function prepareInside(slug: string): void {
  const place = placeOf(slug);
  if (place) for (const kd of kindsOf(place.c, place.focal, place.alts)) void bitmap(kd, qualityOf(kd));
}

/**
 * Paint the finished painting of a place for a screen of w x h css px. `paperW` is how much of the left the
 * paper column covers on wide screens.
 */
export async function finishedPainting(
  slug: string,
  w: number,
  h: number,
  phone: boolean,
  paperW: number,
): Promise<HTMLCanvasElement> {
  const place = placeOf(slug);
  const k = Math.min(1.5, window.devicePixelRatio || 1),
    cv = newCanvas(Math.round(w * k), Math.round(h * k)),
    g = ctx2d(cv);
  g.scale(k, k);
  g.fillStyle = '#ECE9E0';
  g.fillRect(0, 0, w, h);
  if (!place) return cv;
  const { c, focal, alts } = place;
  await Promise.all(kindsOf(c, focal, alts).map((kd) => bitmap(kd, qualityOf(kd))));
  const f = layoutPainting(c, w, h, phone, paperW, PHONE_BAND);
  const draw = (kd: Kind, x: number, y: number, height: number): void => {
    const bm = bitmapNow(kd);
    if (!bm) return;
    const sz = sizeOf(kd),
      ph = height * f.s,
      pw = (ph * sz.w) / sz.h;
    g.drawImage(bm, f.dx + x * f.s - pw / 2, f.dy + y * f.s - ph * anchorY(kd), pw, ph);
  };
  g.save();
  g.beginPath();
  g.rect(0, 0, f.w, f.h);
  g.clip();
  /* the backdrop covers the painted area whatever its shape */
  const bg = bitmapNow(c.bg);
  if (bg) {
    const sc = Math.max(f.w / bg.width, f.h / bg.height);
    g.drawImage(bg, (f.w - bg.width * sc) / 2, f.h - bg.height * sc, bg.width * sc, bg.height * sc);
  }
  for (const [kd, x, y, hh] of c.far) draw(kd, x, y, hh);
  alts.forEach((kd, j) => {
    const a = c.alts[j];
    if (a) draw(kd, a[0], a[1], a[2]);
  });
  for (const [kd, x, y, hh] of c.mid) draw(kd, x, y, hh);
  draw(focal, c.F[0], c.F[1], c.F[2]);
  for (const [kd, x, y, hh] of c.near) draw(kd, x, y, hh);
  g.restore();
  return cv;
}

/** The bloom: a grain mask growing from (ox, oy) (shares of the screen), in BLOOM_LV steps. */
export function bloomMasks(ox: number, oy: number, aspect: number): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  for (let L = 0; L <= BLOOM_LV; L++) {
    const m = newCanvas(BW, BH),
      g = ctx2d(m),
      im = g.createImageData(BW, BH),
      d = im.data,
      p = easeOut(L / BLOOM_LV);
    for (let y = 0; y < BH; y++)
      for (let x = 0; x < BW; x++) {
        const dx = x / BW - ox,
          dy = (y / BH - oy) * aspect,
          dist = Math.sqrt(dx * dx + dy * dy) / 1.25,
          n = MASKF[((y * 3) % MS) * MS + ((x * 3) % MS)];
        d[(y * BW + x) * 4 + 3] = clamp((p * 1.12 - (dist * 0.78 + n * 0.3)) / 0.07 + 0.5, 0, 1) * 255;
      }
    g.putImageData(im, 0, 0);
    out.push(m);
  }
  return out;
}

/** Draw the painting onto the dialog's canvas through bloom step L of the masks (the last step: whole). */
export function drawBloom(
  target: HTMLCanvasElement,
  painting: HTMLCanvasElement,
  masks: readonly HTMLCanvasElement[],
  L: number,
): void {
  if (target.width !== painting.width || target.height !== painting.height) {
    target.width = painting.width;
    target.height = painting.height;
  }
  const g = ctx2d(target);
  g.globalCompositeOperation = 'copy';
  g.drawImage(painting, 0, 0);
  if (L < masks.length - 1) {
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(masks[Math.max(0, L)], 0, 0, target.width, target.height);
  }
  g.globalCompositeOperation = 'source-over';
}

export const BLOOM_STEPS = BLOOM_LV;
