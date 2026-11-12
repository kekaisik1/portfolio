/**
 * The paper and its dissolves, from the noise fields: the stepped masks cut-outs and words dissolve through (made at
 * start-up), and the cold-press grain and torn paper edges (baked into PNGs by `npm run paint`).
 */
import { clamp, mulberry32 } from '../lib/math';
import { newCanvas, ctx2d } from '../lib/dom';
import { LV, thresholdOf } from '../journey/timing';
import { field, thresholdAlpha } from './noise';

/** the cut-out dissolve field: a 256 px tile */
export const MS = 256;
export const MASKF = field(
  MS,
  7,
  [
    [4, 0.42],
    [8, 0.26],
    [16, 0.16],
    [32, 0.08],
  ],
  0.16,
);
/** the words' dissolve field: smaller, finer blotches */
export const TS = 160;
const TEXTF = field(
  TS,
  21,
  [
    [4, 0.36],
    [8, 0.3],
    [20, 0.2],
  ],
  0.2,
);

function alphaCanvas(alpha: Uint8ClampedArray, size: number): HTMLCanvasElement {
  const c = newCanvas(size, size),
    g = ctx2d(c),
    im = g.createImageData(size, size),
    d = im.data;
  for (let i = 0; i < alpha.length; i++) {
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255;
    d[i * 4 + 3] = alpha[i];
  }
  g.putImageData(im, 0, 0);
  return c;
}

/** cut-outs: one mask tile per dissolve level (index 0..LV) */
export const CUT_MASKS: readonly HTMLCanvasElement[] = Array.from({ length: LV + 1 }, (_, L) =>
  alphaCanvas(thresholdAlpha(MASKF, thresholdOf(L), 0.06), MS),
);

/**
 * Words and labels: a CSS mask image per level, and the same with the complementary blotches. They are encoded
 * off the main thread after start-up ('' until then; the words step their opacity meanwhile).
 */
export const TEXT_MASKS: string[] = Array.from({ length: LV + 1 }, () => '');
export const TEXT_MASKS_INV: string[] = Array.from({ length: LV + 1 }, () => '');

const asUrl = (c: HTMLCanvasElement): Promise<string> =>
  new Promise((ok) => c.toBlob((b) => ok(b ? `url(${URL.createObjectURL(b)})` : '')));

/** Make the words' masks, one level per task so the page stays responsive. */
export async function makeTextMasks(): Promise<void> {
  for (let L = 1; L < LV; L++)
    for (const [out, invert] of [
      [TEXT_MASKS, false],
      [TEXT_MASKS_INV, true],
    ] as const)
      out[L] = await asUrl(alphaCanvas(thresholdAlpha(TEXTF, thresholdOf(L, 0.07), 0.07, invert), TS));
}

/** Cold-press grain: `strength` is how dark its deepest tooth is (0..255). */
function grainCanvas(strength: number): HTMLCanvasElement {
  const S = 256,
    F = field(
      S,
      3,
      [
        [64, 0.25],
        [128, 0.35],
      ],
      0.4,
    ),
    c = newCanvas(S, S),
    g = ctx2d(c),
    im = g.createImageData(S, S),
    d = im.data;
  for (let i = 0; i < F.length; i++) {
    const v = 255 - Math.pow(F[i], 2.2) * strength;
    d[i * 4] = v;
    d[i * 4 + 1] = v - strength / 24;
    d[i * 4 + 2] = v - strength / 6;
    d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c;
}

/**
 * A torn paper edge as a mask that repeats every `len` px along the tear and is ragged across `depth` px.
 * side: which way the paper lies ('r' = the paper is on the left of a vertical tear, 't' = below, 'b' = above).
 */
function tearCanvas(len: number, depth: number, amp: number, side: 'r' | 't' | 'b', seed: number): HTMLCanvasElement {
  const horiz = side !== 'r',
    cw = horiz ? len : depth,
    ch = horiz ? depth : len;
  const c = newCanvas(cw, ch),
    g = ctx2d(c),
    im = g.createImageData(cw, ch),
    d = im.data;
  /* a smooth ragged line that repeats exactly every `len` px: a handful of sines with falling amplitude */
  const rnd = mulberry32(seed),
    H: [number, number, number][] = [];
  let tot = 0;
  for (let k = 2; k <= 40; k++) {
    const a = Math.pow(k, -1.05) * (0.6 + rnd() * 0.8);
    H.push([k, a, rnd() * 6.283]);
    tot += a;
  }
  for (let i = 0; i < len; i++) {
    let v = 0;
    for (const [k, a, ph] of H) v += a * Math.sin((i / len) * 6.283 * k + ph);
    const e = depth * 0.16 + amp * (0.5 + ((0.5 * v) / tot) * 1.7) + (MASKF[(i % MS) * MS + (seed % MS)] - 0.5) * 3;
    for (let j = 0; j < depth; j++) {
      const fib = MASKF[((i * 5) % MS) * MS + ((j * 5) % MS)];
      const a = clamp((e - j) / 2.4 + 0.5, 0, 1) * (j > e - 6 ? 0.55 + fib * 0.45 : 1);
      const x = horiz ? i : j,
        y = side === 'r' ? i : side === 'b' ? j : depth - 1 - j;
      const p = (y * cw + x) * 4;
      d[p] = d[p + 1] = d[p + 2] = 0;
      d[p + 3] = a * 255;
    }
  }
  g.putImageData(im, 0, 0);
  return c;
}

/** The paper's textures, made by `npm run paint` into public/paint/<name>.png (see scripts/bake-page.ts). */
export const PAPER_TEXTURES: Readonly<Record<string, () => HTMLCanvasElement>> = {
  'grain-24': () => grainCanvas(24),
  'grain-12': () => grainCanvas(12),
  'tear-r': () => tearCanvas(512, 84, 54, 'r', 40),
  'tear-t': () => tearCanvas(512, 44, 30, 't', 90),
  'tear-b': () => tearCanvas(512, 30, 20, 'b', 150),
};

/** Put the grain and the torn edges where the CSS expects them (custom properties on the root). */
export function applyPaper(root: HTMLElement): void {
  const st = root.style,
    url = (name: string): string => `url("${import.meta.env.BASE_URL}paint/${name}.png")`;
  st.setProperty('--grain', url('grain-24'));
  st.setProperty('--grain-half', url('grain-12'));
  st.setProperty('--tear-r', url('tear-r'));
  st.setProperty('--tear-t', url('tear-t'));
  st.setProperty('--tear-b', url('tear-b'));
}
