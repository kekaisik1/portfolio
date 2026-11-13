import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { NOISE_SIZE, tileNoise } from '../../src/living/noise';
import { MASK_H, MASK_W, byteVec, coverage, rasterScene, scenePoints, signedDistance } from '../../src/living/raster';
import { MAX_LIGHTS, type Region, type Scene } from '../../src/living/scene';
import { SCENES, isStill, sceneOf } from '../../src/living/scenes';
import { FRAGMENT } from '../../src/living/shader';
import { lookOf } from '../../src/worlds/looks';

const IDS = WORLDS.map((w) => w.id);
const SQUARE: Region = {
  shape: {
    kind: 'poly',
    points: [
      [0.2, 0.2],
      [0.6, 0.2],
      [0.6, 0.8],
      [0.2, 0.8],
    ],
  },
  feather: 0.05,
};
/** the byte of channel `ch` at a point of the landscape photo */
const at = (tex: Uint8Array, u: number, v: number, ch: number): number =>
  tex[(Math.floor(v * MASK_H) * MASK_W + Math.floor(u * MASK_W)) * 4 + ch];

describe('what moves in each world', () => {
  it('has a scene for every world and none left over', () => {
    expect(Object.keys(SCENES).sort()).toEqual([...IDS].sort());
    expect(() => sceneOf('nowhere')).toThrow(/No scene/);
  });

  it('moves something in every place: inside the painting, or in its air', () => {
    for (const id of IDS) expect(!isStill(sceneOf(id)) || lookOf(id).ambient !== null, id).toBe(true);
    expect(isStill({})).toBe(true);
    expect(
      isStill({ lights: [{ at: [0.5, 0.5], radius: 0.1, amount: 0.1, speed: 1, seed: 0, kind: 'breathe' }] }),
    ).toBe(false);
  });

  it('carries only running water: the waterfall, nothing pushed by wind', () => {
    const flowing = IDS.filter((id) => sceneOf(id).flow);

    expect(flowing).toEqual(['bookforge']);
    for (const id of flowing) expect(sceneOf(id).flow?.cycle, id).toBeGreaterThan(1);
  });

  it('keeps every move small and slow: quiet beats busy', () => {
    for (const id of IDS) {
      const s = sceneOf(id);

      /* a flow carries a pixel at most 4% of the photo per cycle */
      for (const f of s.flow?.regions ?? []) expect(Math.hypot(...f.dir), id).toBeLessThanOrEqual(0.04);
      for (const l of s.lights ?? []) {
        expect(l.amount, id).toBeLessThanOrEqual(0.25);
        expect(l.radius, id).toBeGreaterThan(0);
      }
      expect(s.lights?.length ?? 0, id).toBeLessThanOrEqual(MAX_LIGHTS);
      /* shimmer is a ripple, not a drag: under 0.3% of the photo's width */
      if (s.shimmer) expect(s.shimmer.size, id).toBeLessThanOrEqual(0.003);
    }
    expect(FRAGMENT).toContain(`uLightA[${MAX_LIGHTS}]`);
  });

  it('names only points on or just off the photograph', () => {
    for (const id of IDS)
      for (const [u, v] of scenePoints(sceneOf(id))) {
        expect(u, id).toBeGreaterThanOrEqual(-0.11);
        expect(u, id).toBeLessThanOrEqual(1.11);
        expect(v, id).toBeGreaterThanOrEqual(-0.11);
        expect(v, id).toBeLessThanOrEqual(1.11);
      }
  });
});

describe('a region of a photograph', () => {
  it('measures distance to its edge in photo heights: positive inside, negative outside', () => {
    expect(signedDistance(SQUARE.shape, 0.4, 0.5)).toBeCloseTo(0.3, 6);
    expect(signedDistance(SQUARE.shape, 0.4, 0.25)).toBeCloseTo(0.05, 6);
    expect(signedDistance(SQUARE.shape, 0.1, 0.5)).toBeCloseTo(-0.15, 6);
    expect(signedDistance({ kind: 'ellipse', at: [0.5, 0.5], rx: 0.2, ry: 0.2 }, 0.5, 0.5)).toBeCloseTo(0.2, 6);
    expect(signedDistance({ kind: 'ellipse', at: [0.5, 0.5], rx: 0.2, ry: 0.2 }, 0.5, 0.75)).toBeLessThan(0);
  });

  it('is full inside, nothing outside, and fades inwards from its edge: it never leaks past the shape', () => {
    expect(coverage(SQUARE, 0.4, 0.5)).toBe(1);
    expect(coverage(SQUARE, 0.19, 0.5)).toBe(0);
    expect(coverage(SQUARE, 0.7, 0.5)).toBe(0);
    const near = coverage(SQUARE, 0.21, 0.5);
    const further = coverage(SQUARE, 0.225, 0.5);
    expect(near).toBeGreaterThan(0);
    expect(further).toBeGreaterThan(near);
    expect(further).toBeLessThan(1);
  });

  it('leaves a cut-out thing still, with a soft edge around it', () => {
    const withRock: Region = { ...SQUARE, minus: [{ kind: 'ellipse', at: [0.4, 0.5], rx: 0.05, ry: 0.05 }] };

    expect(coverage(withRock, 0.4, 0.5)).toBe(0);
    expect(coverage(withRock, 0.42, 0.5)).toBe(0);
    expect(coverage(withRock, 0.445, 0.5)).toBeGreaterThan(0);
    expect(coverage(withRock, 0.445, 0.5)).toBeLessThan(1);
    expect(coverage(withRock, 0.55, 0.3)).toBe(1);
  });

  it('can be weaker at one end than the other', () => {
    const ramped: Region = { ...SQUARE, ramp: { from: [0.4, 0.2], to: [0.4, 0.8], a: 0.25, b: 1 } };

    expect(coverage(ramped, 0.4, 0.5)).toBeCloseTo(0.625, 6);
    expect(coverage(ramped, 0.4, 0.7)).toBeGreaterThan(coverage(ramped, 0.4, 0.3));
  });
});

describe('the mask texture', () => {
  const scene: Scene = {
    flow: { cycle: 10, regions: [{ ...SQUARE, dir: [0.03, -0.015] }] },
    shimmer: {
      regions: [{ shape: { kind: 'ellipse', at: [0.85, 0.5], rx: 0.1, ry: 0.1 }, feather: 0.03, amount: 0.5 }],
      size: 0.002,
      speed: 0.05,
    },
    stars: [{ ...SQUARE, amount: 1 }],
  };
  const mask = rasterScene(scene);

  it('is one RGBA texture of the mask size', () => {
    expect(mask.data).toHaveLength(MASK_W * MASK_H * 4);
  });

  it('stores exactly no movement wherever nothing moves, so the still photo is untouched there', () => {
    for (const ch of [0, 1]) expect(byteVec(at(mask.data, 0.9, 0.1, ch))).toBe(0);
    expect(at(mask.data, 0.9, 0.1, 2)).toBe(0);
    expect(at(mask.data, 0.9, 0.1, 3)).toBe(0);
    expect(
      rasterScene({})
        .data.filter((_, i) => i % 4 < 2)
        .every((b) => byteVec(b) === 0),
    ).toBe(true);
  });

  it('stores a flow as a share of the largest one, with its direction', () => {
    expect(mask.flowScale).toBeCloseTo(0.03, 6);
    expect(byteVec(at(mask.data, 0.4, 0.5, 0)) * mask.flowScale).toBeCloseTo(0.03, 3);
    expect(byteVec(at(mask.data, 0.4, 0.5, 1)) * mask.flowScale).toBeCloseTo(-0.015, 3);
  });

  it('stores stars and shimmer as amounts', () => {
    expect(at(mask.data, 0.4, 0.5, 2)).toBe(255);
    expect(at(mask.data, 0.4, 0.5, 3)).toBe(0);
    expect(at(mask.data, 0.85, 0.5, 3)).toBe(128);
    expect(at(mask.data, 0.85, 0.5, 2)).toBe(0);
  });

  it('rasterises every real scene without a stray value', () => {
    for (const id of IDS) {
      const m = rasterScene(sceneOf(id));

      expect(Number.isFinite(m.flowScale), id).toBe(true);
      /* outside the waterfall the open book's painting is never carried along */
      if (id === 'bookforge') expect(byteVec(at(m.data, 0.2, 0.2, 0))).toBe(0);
    }
  });
});

describe('the noise tile', () => {
  const tile = tileNoise();

  it('is a square RGBA tile, the same every time', () => {
    expect(tile).toHaveLength(NOISE_SIZE * NOISE_SIZE * 4);
    expect(tileNoise()).toEqual(tile);
  });

  it('repeats without a seam: the last column runs on into the first', () => {
    let across = 0;
    let within = 0;
    for (let y = 0; y < NOISE_SIZE; y++) {
      const row = y * NOISE_SIZE * 4;
      across += Math.abs(tile[row] - tile[row + (NOISE_SIZE - 1) * 4]);
      within += Math.abs(tile[row + 40 * 4] - tile[row + 41 * 4]);
    }

    expect(across / NOISE_SIZE).toBeLessThan((within / NOISE_SIZE) * 3 + 3);
  });

  it('uses most of its range in every channel', () => {
    for (let ch = 0; ch < 4; ch++) {
      const values = Array.from({ length: NOISE_SIZE * NOISE_SIZE }, (_, i) => tile[i * 4 + ch]);

      expect(Math.max(...values) - Math.min(...values), `channel ${ch}`).toBeGreaterThan(120);
    }
  });
});
