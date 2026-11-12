import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { viewOf } from '../../src/journey/camera';
import { fnv1a, paintHash } from '../../src/paint/hash';
import { MAX_DPR, qualityFor } from '../../src/paint/quality';
import { BAKED_KINDS, gridToHex, hexToOccupancy } from '../../src/paint/baked';
import { clamp, easeOut, mulberry32, smooth, sstep } from '../../src/lib/math';
import { PAINT, isKind, sizeOf, type PaintKind } from '../../src/paint/kinds';
import { field, thresholdAlpha, valueNoise } from '../../src/paint/noise';
import { Painter } from '../../src/paint/painter';
import { bboxOf, line, poly, smoothPath, taper } from '../../src/paint/svg';
import { COMPOSE, STAGE, itemBox, layoutPainting } from '../../src/scene/compose';

describe('small maths', () => {
  it('eases and clamps', () => {
    expect([smooth(-1), smooth(0.5), smooth(2)]).toEqual([0, 0.5, 1]);
    expect(sstep(2, 4, 3)).toBe(0.5);
    expect(easeOut(1)).toBe(1);
    expect(clamp(5, 0, 3)).toBe(3);
  });

  it('paints the same on every visit from the same seed', () => {
    const a = mulberry32(42),
      b = mulberry32(42);

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('noise for the grain and the dissolves', () => {
  it('makes smooth value noise in 0..1 that wraps at the tile edge', () => {
    const n = valueNoise(32, 4, mulberry32(1));

    for (const v of n) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of n) expect(v).toBeLessThanOrEqual(1);
  });

  it('equalises a field, so a threshold moving evenly uncovers paper evenly', () => {
    const f = field(64, 7, [
      [4, 0.5],
      [8, 0.3],
    ]);
    const below = (t: number): number => f.filter((v) => v <= t).length / f.length;

    expect(below(0.25)).toBeCloseTo(0.25, 1);
    expect(below(0.5)).toBeCloseTo(0.5, 1);
    expect(below(0.75)).toBeCloseTo(0.75, 1);
  });

  it('uncovers complementary blotches when inverted, so two dissolves at once never print on the same spot', () => {
    const f = field(64, 9, [[4, 1]]);
    const a = thresholdAlpha(f, 0.4, 0.001),
      b = thresholdAlpha(f, 0.4, 0.001, true);
    let both = 0;
    for (let i = 0; i < f.length; i++) if (a[i] > 128 && b[i] > 128) both++;

    expect(both).toBe(0);
    expect(a.some((v) => v > 128)).toBe(true);
    expect(b.some((v) => v > 128)).toBe(true);
  });

  it('shows nothing below the first threshold and everything above the last', () => {
    const f = field(32, 3, [[4, 1]]);

    expect(Math.max(...thresholdAlpha(f, -0.1, 0.05))).toBe(0);
    expect(Math.min(...thresholdAlpha(f, 1.1, 0.05))).toBe(255);
  });
});

describe('svg paths', () => {
  it('draws polygons and lines', () => {
    expect(
      poly([
        [0, 0],
        [10, 0],
        [10, 10],
      ]),
    ).toBe('M0,0L10,0L10,10Z');
    expect(
      line([
        [0, 0],
        [1.26, 2],
      ]),
    ).toBe('M0,0L1.3,2');
  });

  it('draws a smooth closed curve through every point', () => {
    const d = smoothPath([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);

    expect(d.startsWith('M0,0C')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(4);
  });

  it('measures the box of some path data', () => {
    expect(bboxOf('M-5,2L10,20L3,-4Z')).toEqual([-5, -4, 10, 20]);
  });

  it('tapers a stroke from one width to another', () => {
    const [x0, , x1] = bboxOf(
      taper(
        [
          [0, 0],
          [0, 100],
        ],
        20,
        2,
      ),
    );

    expect(x1 - x0).toBeGreaterThan(15);
    expect(x1 - x0).toBeLessThan(30);
  });
});

describe('the painter', () => {
  it('builds a wash with its whole filter stack: ragged edge, granulation, pooled rim, dry brush', () => {
    const P = new Painter(100, 100, 1);
    P.wash([P.blob(50, 50, 30, 20)], { fill: '#5F8A78', gran: 0.5, rim: 0.7, fleck: 0.3 });
    const svg = P.svg(1);

    expect(svg).toContain('feDisplacementMap');
    expect(svg).toContain('operator="arithmetic"');
    expect(svg).toContain('result="gr"');
    expect(svg).toContain('result="ew"');
    expect(svg).toContain('operator="out"');
    expect(svg).toContain('fill="#5F8A78"');
  });

  it('paints every painting the same way twice', () => {
    for (const k of ['hut', 'lanterns', 'dusk'] as const) {
      const a = new Painter(PAINT[k].w, PAINT[k].h, PAINT[k].seed),
        b = new Painter(PAINT[k].w, PAINT[k].h, PAINT[k].seed);
      PAINT[k].paint(a);
      PAINT[k].paint(b);

      expect(a.svg(1)).toBe(b.svg(1));
    }
  });

  it('sizes the svg by the quality asked for, keeping its own coordinates', () => {
    const svg = new Painter(200, 100, 1).svg(0.5);

    expect(svg).toContain('width="100" height="50" viewBox="0 0 200 100"');
  });

  it('paints every kind without throwing, within a sane number of washes', () => {
    for (const [k, def] of Object.entries(PAINT)) {
      const P = new Painter(def.w, def.h, def.seed);
      def.paint(P);

      expect(P.size, k).toBeGreaterThan(0);
      expect(P.size, k).toBeLessThan(200);
    }
  });

  it('knows every kind by name, stars included', () => {
    expect(isKind('stars')).toBe(true);
    expect(isKind('hut')).toBe(true);
    expect(isKind('constructor')).toBe(false);
    expect(sizeOf('stars')).toEqual({ w: 1400, h: 600 });
  });
});

describe('the finished paintings', () => {
  for (const [zone, c] of Object.entries(COMPOSE)) {
    it(`stands the ${zone}'s object clear of the paper on wide screens`, () => {
      const W = 1440,
        H = 900,
        paper = 480,
        f = layoutPainting(c, W, H, false, paper, 0.52),
        b = itemBox(f, c.F[0], c.F[1], c.F[2], { w: 610, h: 440 });

      expect(b.left).toBeGreaterThan(paper + 60);
      expect(b.left + b.w).toBeLessThan(W);
      expect(b.top).toBeGreaterThan(0);
      expect(b.top + b.h * 0.92).toBeLessThanOrEqual(H);
    });

    it(`fits the ${zone}'s object inside the painted band on phones`, () => {
      const W = 390,
        H = 844,
        f = layoutPainting(c, W, H, true, 0, 0.52),
        b = itemBox(f, c.F[0], c.F[1], c.F[2], { w: 470, h: 500 });

      expect(f.h).toBeCloseTo(H * 0.52, 6);
      expect(b.top).toBeGreaterThan(0);
      expect(b.top + b.h * 0.92).toBeLessThanOrEqual(f.h);
      expect(b.left).toBeGreaterThan(0);
      expect(b.left + b.w).toBeLessThan(W);
    });
  }

  it('composes on one stage size', () => {
    expect(STAGE).toEqual({ w: 1600, h: 1000 });
  });
});

describe('the baked paintings', () => {
  const dir = resolve(import.meta.dirname, '../../public/paint');

  it('exist for every kind, as WebP files of the recorded size', () => {
    for (const k of Object.keys(PAINT) as PaintKind[]) {
      const b = BAKED_KINDS[k];
      expect(b, `${k} has no baked painting: run npm run paint`).toBeDefined();
      expect(existsSync(resolve(dir, `${k}.webp`)), `public/paint/${k}.webp is missing: run npm run paint`).toBe(true);
    }
  });

  it('match the painters as they are now (else run npm run paint)', () => {
    const rh = viewOf(1440, 900).R.h;
    for (const k of Object.keys(PAINT) as PaintKind[]) {
      const q = qualityFor(k, rh, MAX_DPR);
      expect(BAKED_KINDS[k]?.hash, `${k} changed since it was baked: run npm run paint`).toBe(paintHash(k, q));
    }
  });

  it('include the paper grain and torn edges the CSS asks for', () => {
    for (const name of ['grain-24', 'grain-12', 'tear-r', 'tear-t', 'tear-b'])
      expect(existsSync(resolve(dir, `${name}.png`)), `public/paint/${name}.png is missing: run npm run paint`).toBe(
        true,
      );
  });

  it('fingerprints strings stably', () => {
    expect(fnv1a('')).toBe('811c9dc5');
    expect(fnv1a('a')).toBe('e40c292c');
  });
});

describe('baked occupancy grids', () => {
  it('round-trip through hex', () => {
    const grid = new Uint8Array(40 * 40).map((_, i) => (i % 3 === 0 || i % 7 === 0 ? 1 : 0));
    const back = hexToOccupancy(gridToHex(grid), [0.1, 0.2, 0.9, 1], grid.length);

    expect([...back.grid]).toEqual([...grid]);
    expect(back.bb).toEqual([0.1, 0.2, 0.9, 1]);
  });
});
