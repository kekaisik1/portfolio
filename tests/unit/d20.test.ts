import { describe, expect, it } from 'vitest';
import { apply, CORNERS, FACES, frameOf, mul, poseAt, restOf, turn, type Mat3, type Vec3 } from '../../src/worlds/d20';

const len = (v: Vec3): number => Math.hypot(v[0], v[1], v[2]);
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a rotation keeps lengths and right angles: its rows are unit and at right angles to each other */
function isRotation(m: Mat3): void {
  for (const r of m) expect(len(r)).toBeCloseTo(1, 6);
  expect(dot(m[0], m[1])).toBeCloseTo(0, 6);
  expect(dot(m[0], m[2])).toBeCloseTo(0, 6);
  expect(dot(m[1], m[2])).toBeCloseTo(0, 6);
}

describe('the twenty-sided die', () => {
  it('is an icosahedron: twelve corners on the unit sphere, twenty faces, five at every corner, all edges alike', () => {
    expect(CORNERS).toHaveLength(12);
    expect(FACES).toHaveLength(20);
    for (const c of CORNERS) expect(len(c)).toBeCloseTo(1, 9);
    for (let i = 0; i < 12; i++)
      expect(
        FACES.filter((f) => f.includes(i)),
        String(i),
      ).toHaveLength(5);
    const edges = FACES.flatMap(([a, b, c]) => [
      [a, b],
      [b, c],
      [c, a],
    ]).map(([a, b]) =>
      len([CORNERS[a][0] - CORNERS[b][0], CORNERS[a][1] - CORNERS[b][1], CORNERS[a][2] - CORNERS[b][2]]),
    );
    for (const e of edges) expect(e).toBeCloseTo(edges[0], 9);
    /* every face looks a different way */
    const outs = FACES.map((_, k) =>
      frameOf(k)
        .out.map((n) => n.toFixed(4))
        .join(),
    );
    expect(new Set(outs).size).toBe(20);
  });

  it('lies at rest with the thrown number turned to the viewer and its figure upright, for every number', () => {
    for (let n = 1; n <= 20; n++) {
      const m = restOf(n);
      isRotation(m);
      const f = frameOf(n - 1);
      const out = apply(m, f.out);
      const up = apply(m, f.up);
      const right = apply(m, f.right);
      /* towards the viewer (z), tipped back a little; no other face is turned to the viewer more */
      expect(out[2], String(n)).toBeGreaterThan(0.85);
      for (let k = 0; k < 20; k++) if (k !== n - 1) expect(apply(m, frameOf(k).out)[2]).toBeLessThan(out[2]);
      expect(up[1]).toBeGreaterThan(0.85);
      expect(right[0]).toBeCloseTo(1, 6);
    }
  });

  it('turns about an axis and back again', () => {
    const axis: Vec3 = [0, 0, 1];
    const quarter = turn(axis, Math.PI / 2);

    isRotation(quarter);
    const v = apply(quarter, [1, 0, 0]);
    expect(v[0]).toBeCloseTo(0, 9);
    expect(v[1]).toBeCloseTo(1, 9);
    const back = apply(mul(turn(axis, -Math.PI / 2), quarter), [0.3, -0.2, 0.9]);
    expect(back[0]).toBeCloseTo(0.3, 9);
    expect(back[1]).toBeCloseTo(-0.2, 9);
    expect(back[2]).toBeCloseTo(0.9, 9);
  });

  it('starts on the ground, goes up once high and comes down, and is exactly at rest at the end', () => {
    const start = poseAt(0, 7, 2);
    const mid = poseAt(0.25, 7, 2);
    const end = poseAt(1, 7, 2);

    expect(start.height).toBe(0);
    expect(mid.height).toBeGreaterThan(0.8);
    expect(end.height).toBe(0);
    isRotation(mid.turn);
    const rest = restOf(7);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) expect(end.turn[r][c]).toBeCloseTo(rest[r][c], 9);
    /* it is still for the last part of the throw, so the number can be read before anything else happens */
    const nearly = poseAt(0.9, 7, 2);
    expect(nearly.height).toBe(0);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) expect(nearly.turn[r][c]).toBeCloseTo(rest[r][c], 9);
    /* and it never goes below the ground or turns backwards into the rest */
    for (let t = 0; t <= 1; t += 0.05) expect(poseAt(t, 7, 2).height).toBeGreaterThanOrEqual(0);
  });
});
