/** SVG path data from points. Pure, so the paintings are the same on every visit and can be unit-tested. */

/** A point (x, y). Arrays of plain numbers are accepted so paintings can build their lists with push(). */
export type Pt = readonly number[];
export type Pts = readonly Pt[];

/** one decimal: SVG strings stay short, and nothing visible is lost at the sizes the paintings are shown */
export const f1 = (v: number): number => Math.round(v * 10) / 10;
export const f3 = (v: number): number => Math.round(v * 1000) / 1000;

/** A smooth curve through the points (Catmull-Rom as cubic Béziers), closed by default. */
export function smoothPath(pts: Pts, closed = true): string {
  const n = pts.length;
  const get = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    d +=
      `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

/** A closed polygon. */
export const poly = (pts: Pts): string => 'M' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join('L') + 'Z';
/** An open polyline. */
export const line = (pts: Pts): string => 'M' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join('L');

/** The box [x0, y0, x1, y1] around every coordinate pair in some path data (control points included). */
export function bboxOf(d: string): [number, number, number, number] {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let a = Infinity,
    b = Infinity,
    c = -Infinity,
    e = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    a = Math.min(a, n[i]);
    c = Math.max(c, n[i]);
    b = Math.min(b, n[i + 1]);
    e = Math.max(e, n[i + 1]);
  }
  return [a, b, c, e];
}

/** A brush stroke that thins out from w0 to w1 along a polyline, as a closed shape. */
export function taper(pts: Pts, w0: number, w1: number): string {
  const L: number[][] = [],
    R: number[][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(pts.length - 1, i + 1)],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2,
      nx = (-dy / len) * w,
      ny = (dx / len) * w;
    L.push([pts[i][0] + nx, pts[i][1] + ny]);
    R.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  return smoothPath([...L, ...R.reverse()]);
}
