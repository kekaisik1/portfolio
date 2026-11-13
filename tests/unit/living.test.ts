import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { NOISE_SIZE, tileNoise } from '../../src/living/noise';
import { MASK_H, MASK_W, byteVec, coverage, rasterScene, scenePoints, signedDistance } from '../../src/living/raster';
import { MAX_LIGHTS, type Region, type Scene } from '../../src/living/scene';
import { SCENES, sceneOf } from '../../src/living/scenes';
import { FRAGMENT } from '../../src/living/shader';

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

  it('moves something in every place', () => {
    for (const id of IDS) {
      const s = sceneOf(id);
      const moving =
        (s.flow?.length ?? 0) +
        (s.sway?.regions.length ?? 0) +
        (s.mist?.regions.length ?? 0) +
        (s.shimmer?.regions.length ?? 0) +
        (s.stars?.length ?? 0) +
        (s.lights?.length ?? 0) +
        (s.beam ? 1 : 0);

      expect(moving, id).toBeGreaterThan(0);
      expect(s.cycle, id).toBeGreaterThan(1);
    }
  });

  it('keeps every move small and slow: quiet beats busy', () => {
    for (const id of IDS) {
      const s = sceneOf(id);

      /* a flow carries a pixel at most 4% of the photo per cycle; a sway rocks it by under 1% */
      for (const f of s.flow ?? []) expect(Math.hypot(...f.dir), id).toBeLessThanOrEqual(0.04);
      for (const r of s.sway?.regions ?? []) expect(Math.hypot(...r.dir), id).toBeLessThan(0.01);
      for (const l of s.lights ?? []) {
        expect(l.amount, id).toBeLessThanOrEqual(0.25);
        expect(l.radius, id).toBeGreaterThan(0);
      }
      expect(s.lights?.length ?? 0, id).toBeLessThanOrEqual(MAX_LIGHTS);
      if (s.shimmer) expect(s.shimmer.size, id).toBeLessThan(0.006);
      for (const m of s.mist?.regions ?? []) expect(m.amount, id).toBeLessThanOrEqual(0.6);
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

describe('the mask textures', () => {
  const scene: Scene = {
    cycle: 10,
    flow: [{ ...SQUARE, dir: [0.03, -0.015] }],
    sway: {
      regions: [{ shape: { kind: 'ellipse', at: [0.85, 0.5], rx: 0.1, ry: 0.1 }, feather: 0.03, dir: [0.004, 0] }],
      rate: 1,
      wave: [4, 2],
    },
    mist: { regions: [{ ...SQUARE, amount: 0.5 }], rgb: [1, 1, 1], drift: [0.01, 0], scale: 1 },
    stars: [{ ...SQUARE, amount: 1 }],
  };
  const masks = rasterScene(scene);

  it('are two RGBA textures of the mask size', () => {
    expect(masks.a).toHaveLength(MASK_W * MASK_H * 4);
    expect(masks.b).toHaveLength(MASK_W * MASK_H * 4);
  });

  it('store exactly no movement wherever nothing moves, so the still photo is untouched there', () => {
    for (const ch of [0, 1]) {
      expect(byteVec(at(masks.a, 0.9, 0.1, ch))).toBe(0);
      expect(byteVec(at(masks.b, 0.1, 0.1, ch))).toBe(0);
    }
    expect(at(masks.a, 0.9, 0.1, 2)).toBe(0);
    expect(at(masks.a, 0.9, 0.1, 3)).toBe(0);
    expect(at(masks.b, 0.9, 0.9, 2)).toBe(0);
    expect(
      rasterScene({ cycle: 10 })
        .a.filter((_, i) => i % 4 < 2)
        .every((b) => byteVec(b) === 0),
    ).toBe(true);
  });

  it('store a flow as a share of the largest one, with its direction', () => {
    expect(masks.flowScale).toBeCloseTo(0.03, 6);
    expect(byteVec(at(masks.a, 0.4, 0.5, 0)) * masks.flowScale).toBeCloseTo(0.03, 3);
    expect(byteVec(at(masks.a, 0.4, 0.5, 1)) * masks.flowScale).toBeCloseTo(-0.015, 3);
    expect(masks.swayScale).toBeCloseTo(0.004, 6);
    expect(byteVec(at(masks.b, 0.85, 0.5, 0))).toBe(1);
  });

  it('store mist, shimmer and stars as amounts', () => {
    expect(at(masks.a, 0.4, 0.5, 2)).toBe(128);
    expect(at(masks.a, 0.4, 0.5, 3)).toBe(0);
    expect(at(masks.b, 0.4, 0.5, 2)).toBe(255);
  });

  it('rasterise every real scene without a stray value', () => {
    for (const id of IDS) {
      const m = rasterScene(sceneOf(id));

      expect(Number.isFinite(m.flowScale) && Number.isFinite(m.swayScale), id).toBe(true);
      /* the top-right corner of the summit's sky is still */
      if (id === 'hello') expect(byteVec(at(m.a, 0.95, 0.05, 0))).toBe(0);
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
