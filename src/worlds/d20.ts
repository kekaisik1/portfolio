/**
 * A twenty-sided die that really rolls: an icosahedron with a number on every face, tumbling in three dimensions,
 * slowing, and coming to rest with the thrown number facing you. Drawn on a small 2D canvas (twenty flat faces at
 * most ten of which face the viewer: far too little for WebGL). Everything but `drawDie` is pure maths, so it is
 * unit-tested.
 *
 * Axes: x to the right, y up, z towards the viewer.
 */
export type Vec3 = readonly [number, number, number];
/** a rotation, as its three rows */
export type Mat3 = readonly [Vec3, Vec3, Vec3];

const PHI = (1 + Math.sqrt(5)) / 2;

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const apply = (m: Mat3, v: Vec3): Vec3 => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
export const mul = (a: Mat3, b: Mat3): Mat3 => {
  const col = (k: 0 | 1 | 2): Vec3 => [b[0][k], b[1][k], b[2][k]];
  const row = (r: Vec3): Vec3 => [dot(r, col(0)), dot(r, col(1)), dot(r, col(2))];
  return [row(a[0]), row(a[1]), row(a[2])];
};

/** A turn of `angle` radians about a unit axis. */
export function turn(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}

/** The twelve corners, on the unit sphere. */
export const CORNERS: readonly Vec3[] = (
  [
    [-1, PHI, 0],
    [1, PHI, 0],
    [-1, -PHI, 0],
    [1, -PHI, 0],
    [0, -1, PHI],
    [0, 1, PHI],
    [0, -1, -PHI],
    [0, 1, -PHI],
    [PHI, 0, -1],
    [PHI, 0, 1],
    [-PHI, 0, -1],
    [-PHI, 0, 1],
  ] as const
).map(norm);

/** The twenty faces, as corners; face `k` carries the number `k + 1`. */
export const FACES: readonly (readonly [number, number, number])[] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

export interface FaceFrame {
  /** the middle of the face */
  mid: Vec3;
  /** out of the die */
  out: Vec3;
  /** the way its number stands: up, and to the right */
  up: Vec3;
  right: Vec3;
}

/** Where a face is and how its number stands on it. */
export function frameOf(k: number): FaceFrame {
  const [a, b, c] = FACES[k].map((i) => CORNERS[i]);
  const mid: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  const out = norm(mid);
  const up = norm(sub(a, mid));
  return { mid, out, up, right: cross(up, out) };
}

/** how the die lies at rest: the thrown face turned to the viewer, tipped back a little, as seen from above */
const REST_OUT: Vec3 = norm([0, 0.2, 0.98]);
const REST_UP: Vec3 = norm(cross(REST_OUT, [1, 0, 0]));
const REST_RIGHT: Vec3 = [1, 0, 0];

/** The die at rest with the number `n` (1..20) facing the viewer, its figure upright. */
export function restOf(n: number): Mat3 {
  const f = frameOf(n - 1);
  /* the rotation that takes the face's own right, up and out to where they lie at rest */
  const pick = (k: 0 | 1 | 2): Vec3 => [
    REST_RIGHT[k] * f.right[0] + REST_UP[k] * f.up[0] + REST_OUT[k] * f.out[0],
    REST_RIGHT[k] * f.right[1] + REST_UP[k] * f.up[1] + REST_OUT[k] * f.out[1],
    REST_RIGHT[k] * f.right[2] + REST_UP[k] * f.up[2] + REST_OUT[k] * f.out[2],
  ];
  return [pick(0), pick(1), pick(2)];
}

/** the axis it tumbles about: mostly rolling towards the viewer, a little askew */
const TUMBLE: Vec3 = norm([1, 0.28, 0.16]);
/** how far through the throw the die has stopped turning and bouncing */
const SETTLED = 0.86;

export interface Pose {
  turn: Mat3;
  /** how high off the ground, 0..1 of the throw's height */
  height: number;
}

/**
 * The die at `t` (0..1) of a throw that ends on `n`: it turns `turns` times in all, ever more slowly, hops once
 * high and twice low, and is exactly at rest from SETTLED on.
 */
export function poseAt(t: number, n: number, turns: number): Pose {
  const s = Math.min(1, Math.max(0, t) / SETTLED);
  const left = (1 - s) * (1 - s);
  const hop = (from: number, to: number, high: number): number => {
    if (s <= from || s >= to) return 0;
    const p = (s - from) / (to - from);
    return high * 4 * p * (1 - p);
  };
  return {
    turn: mul(turn(TUMBLE, -left * turns * 2 * Math.PI), restOf(n)),
    height: hop(0, 0.56, 1) + hop(0.56, 0.82, 0.24) + hop(0.82, 1, 0.07),
  };
}

/** where the light comes from in the painting: above, a little to the right, in front */
const LIGHT: Vec3 = norm([0.4, 0.75, 0.52]);
const DARK = [112, 26, 34] as const;
const LIT = [236, 96, 62] as const;

const mix = (a: readonly number[], b: readonly number[], k: number): string =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(' ')})`;

/** how many times a second the thrown die is redrawn: like the painting, it is hand-made, not smooth */
export const DRAWN_PER_SECOND = 12;

/** The moment a drawing made `ms` into a throw shows: the start of its twelfth of a second. */
export const drawnAt = (ms: number): number => Math.floor((ms * DRAWN_PER_SECOND) / 1000) * (1000 / DRAWN_PER_SECOND);

/**
 * Draw the die: middle at (cx, cy) in canvas pixels, `r` its radius. Only the faces turned to the viewer are drawn
 * (it is convex, so they never overlap); a number is drawn on a face once it is turned far enough to be read.
 *
 * It is painted, not rendered: every face is filled with `paint`, a patch of the painted die's own brushwork that
 * lies on the face and turns with it (a different part of the patch for each face), then glazed lighter or darker
 * by how it meets the light, with a loose pale line along its edges like the painting's. Without `paint` (it did
 * not load) the faces are plain colour.
 */
export function drawDie(
  ctx: CanvasRenderingContext2D,
  m: Mat3,
  cx: number,
  cy: number,
  r: number,
  paint: CanvasImageSource | null = null,
): void {
  const at = (v: Vec3): [number, number] => [cx + v[0] * r, cy - v[1] * r];
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < FACES.length; k++) {
    const f = frameOf(k);
    const out = apply(m, f.out);
    if (out[2] <= 0.02) continue;
    const pts = FACES[k].map((i) => at(apply(m, CORNERS[i])));
    const lit = Math.max(0, dot(out, LIGHT));
    const mid = at(apply(m, f.mid));
    const right = apply(m, f.right);
    const up = apply(m, f.up);
    const outline = (): void => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
    };
    outline();
    if (paint) {
      ctx.save();
      ctx.clip();
      /* the face's own right and down, flattened onto the canvas: what is drawn now lies on the face */
      ctx.transform(right[0], -right[1], -up[0], up[1], mid[0], mid[1]);
      ctx.rotate(k * 2.4);
      const size = r * 2.1;
      ctx.drawImage(paint, -size / 2 + ((k % 5) - 2) * r * 0.06, -size / 2 + ((k % 3) - 1) * r * 0.08, size, size);
      ctx.restore();
      /* a glaze: warm light on the faces that meet it, the painting's violet shadow on those that turn away */
      outline();
      ctx.fillStyle = lit > 0.5 ? `rgb(255 206 160 / ${(lit - 0.5) * 0.7})` : `rgb(74 16 58 / ${(0.5 - lit) * 0.6})`;
      ctx.fill();
    } else {
      ctx.fillStyle = mix(DARK, LIT, Math.min(1, lit / 0.72));
      ctx.fill();
    }
    /* the edge: a pale line, then a thinner darker one beside it, as a brush leaves them */
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.strokeStyle = `rgb(255 222 200 / ${0.22 + 0.38 * lit})`;
    ctx.stroke();
    ctx.lineWidth = Math.max(0.75, r * 0.011);
    ctx.strokeStyle = 'rgb(92 20 40 / 0.35)';
    ctx.stroke();
    if (out[2] < 0.3) continue;
    ctx.save();
    ctx.transform(right[0], -right[1], -up[0], up[1], mid[0], mid[1]);
    ctx.font = `800 ${r * 0.4}px "Schibsted Grotesk", system-ui, sans-serif`;
    const seen = Math.min(1, (out[2] - 0.3) / 0.35);
    /* the figure: dark paint under cream paint, a little off, so it reads as brushed on */
    ctx.fillStyle = `rgb(84 14 30 / ${0.55 * seen})`;
    ctx.fillText(String(k + 1), r * 0.018, r * 0.062);
    ctx.fillStyle = `rgb(255 240 222 / ${0.92 * seen})`;
    ctx.fillText(String(k + 1), 0, r * 0.04);
    ctx.restore();
  }
}
