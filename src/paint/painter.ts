/**
 * The painter: builds one SVG of overlapping watercolour washes. Every wash goes through the same filter stack
 * (ragged displaced edge, hue drift, blooms, granulation, a pooled dark rim and dry-brush gaps), which is what
 * makes code-drawn shapes read as paint. Pure: it only builds a string, so it runs anywhere and is unit-tested;
 * raster.ts turns the string into pixels once.
 */
import { mulberry32, type Rnd } from '../lib/math';
import { bboxOf, f1, f3, line, poly, smoothPath } from './svg';

/** One shape in a wash: path data, and optionally its own fill, stroke width or opacity. */
export interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  op?: number;
}
export type ShapeIn = string | Shape;

/** A gradient stop: offset, colour, optional opacity. */
export type GradStop = readonly [number, string, number?];

/** How one wash behaves on the paper. Every field has a sensible default. */
export interface WashOpts {
  fill?: string;
  stroke?: string;
  sw?: number;
  op?: number;
  blend?: 'multiply' | 'normal' | 'screen';
  /** edge raggedness: noise frequency and displacement */
  freq?: number;
  freqXY?: string;
  disp?: number;
  oct?: number;
  rimBlur?: number;
  /** blur the shape before the rest: a wet-in-wet edge */
  wet?: number;
  /** hue drift across the wash, in degrees */
  hue?: number;
  /** lighter blooms where the water pushed pigment away, and their colour (on dark paper: darker) */
  bloom?: number;
  bloomColor?: readonly [number, number, number];
  bloomFreq?: number;
  /** pigment settling into the paper's tooth */
  gran?: number;
  granDark?: number;
  granFreq?: number;
  /** pigment pooled where the wash dried */
  rim?: number;
  /** dry brush: paper showing through, by default only near the edge */
  fleck?: number;
  fleckFreq?: string;
  fleckEdge?: boolean;
  /** soft(): blur radius */
  blur?: number;
}

/** The little painted patch an object stands on. */
export interface GroundOpts {
  colors?: readonly string[];
  shadow?: number;
  shLen?: number;
  tufts?: number | false;
  tuftH?: number;
}

const shapeOf = (s: ShapeIn): Shape => (typeof s === 'string' ? { d: s } : s);

export class Painter {
  readonly w: number;
  readonly h: number;
  readonly r: Rnd;
  private readonly defs: string[] = [];
  private readonly body: string[] = [];
  private n = 0;

  constructor(w: number, h: number, seed: number) {
    this.w = w;
    this.h = h;
    this.r = mulberry32(seed);
  }

  rand(a = 0, b = 1): number {
    return a + (b - a) * this.r();
  }

  /** A wobbly closed blob around (cx, cy). */
  blob(cx: number, cy: number, rx: number, ry: number, j = 0.22, n = 12, rot = 0): string {
    const pts: number[][] = [],
      ph = this.rand(0, 6.3),
      ph2 = this.rand(0, 6.3);
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2,
        k = 1 + this.rand(-1, 1) * j * 0.6 + Math.sin(a * 2 + ph) * j * 0.5 + Math.sin(a * 5 + ph2) * j * 0.25;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smoothPath(pts);
  }

  private stops(stops: readonly GradStop[]): string {
    return stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] ?? 1}"/>`).join('');
  }

  grad(stops: readonly GradStop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1): string {
    const id = 'g' + this.n++;
    this.defs.push(
      `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${this.stops(stops)}</linearGradient>`,
    );
    return `url(#${id})`;
  }

  rgrad(stops: readonly GradStop[], cx = 0.5, cy = 0.5, r = 0.5): string {
    const id = 'g' + this.n++;
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${this.stops(stops)}</radialGradient>`);
    return `url(#${id})`;
  }

  /** One wash filter, sized to the shapes it paints (a filter region the size of the canvas would be much slower). */
  private filter(o: WashOpts, bb: readonly number[]): string {
    const id = 'f' + this.n++,
      s = 1 + Math.floor(this.r() * 900);
    const fr = o.freq ?? 0.032,
      ds = o.disp ?? 13,
      oct = o.oct ?? 4,
      rb = o.rimBlur ?? 4.5;
    const pad = ds + rb * 3 + 8;
    const x = bb[0] - pad,
      y = bb[1] - pad,
      w = bb[2] - bb[0] + pad * 2,
      h = bb[3] - bb[1] + pad * 2;
    let p = `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" color-interpolation-filters="sRGB">`;
    p += `<feTurbulence type="fractalNoise" baseFrequency="${o.freqXY ?? fr}" numOctaves="${oct}" seed="${s}" result="n"/>`;
    p += `<feDisplacementMap in="SourceGraphic" in2="n" scale="${ds}" xChannelSelector="R" yChannelSelector="G" result="sh0"/>`;
    let sh = 'sh0';
    if (o.wet) {
      p += `<feGaussianBlur in="sh0" stdDeviation="${o.wet}" result="shw"/>`;
      sh = 'shw';
    }
    const m = [sh];
    const hue = o.hue ?? 16;
    if (hue) {
      /* pigment drifting warmer or cooler across one wash */
      p += `<feTurbulence type="fractalNoise" baseFrequency="${f3(fr * 0.7)}" numOctaves="2" seed="${s + 13}" result="hn"/>`;
      p += `<feColorMatrix in="hn" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 5 0 0 -2.35" result="hA"/>`;
      p += `<feColorMatrix in="${sh}" type="hueRotate" values="${hue}" result="hr"/>`;
      p += `<feComposite in="hr" in2="hA" operator="in" result="hv"/>`;
      m.push('hv');
    }
    const bloom = o.bloom ?? 0.28;
    if (bloom > 0) {
      const bc = o.bloomColor ?? [1, 1, 1];
      p += `<feTurbulence type="fractalNoise" baseFrequency="${f3(o.bloomFreq ?? fr * 0.55)}" numOctaves="3" seed="${s + 11}" result="lo"/>`;
      p += `<feColorMatrix in="lo" type="matrix" values="0 0 0 0 ${bc[0]} 0 0 0 0 ${bc[1]} 0 0 0 0 ${bc[2]} 0 0 ${f3(bloom * 4.5)} 0 ${f3(-bloom * 2.15)}" result="loA"/>`;
      p += `<feComposite in="loA" in2="${sh}" operator="in" result="veil"/>`;
      m.push('veil');
    }
    const gran = o.gran ?? 0.34;
    if (gran > 0) {
      /* pigment settling into the paper: soft mottled clumps, not specks */
      const dk = o.granDark ?? 0.72;
      p += `<feTurbulence type="fractalNoise" baseFrequency="${o.granFreq ?? 0.38}" numOctaves="3" seed="${s + 3}" result="g"/>`;
      p += `<feColorMatrix in="g" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${f3(gran * 4.2)} 0 0 0 ${f3(-gran * 2.05)}" result="gA"/>`;
      p += `<feComposite in="${sh}" in2="gA" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="g1"/>`;
      p += `<feColorMatrix in="g1" type="matrix" values="${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 ${dk} 0 0 0 0 0 1 0" result="gr"/>`;
      m.push('gr');
    }
    const rim = o.rim ?? 0.6;
    p += `<feGaussianBlur in="${sh}" stdDeviation="${rb}" result="b2"/>`;
    p += `<feComposite in="${sh}" in2="b2" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" result="e2"/>`;
    if (rim > 0) {
      /* pigment pooled where the wash dried: a wide soft band, and a crisp line at the very edge */
      p += `<feColorMatrix in="e2" type="matrix" values=".7 0 0 0 0 0 .7 0 0 0 0 0 .74 0 0 0 0 0 ${f3(rim * 1.5)} 0" result="ew"/>`;
      m.push('ew');
      if (!o.wet) {
        p += `<feGaussianBlur in="${sh}" stdDeviation="1.1" result="b1"/>`;
        p += `<feComposite in="${sh}" in2="b1" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0" result="e1"/>`;
        p += `<feColorMatrix in="e1" type="matrix" values=".5 0 0 0 0 0 .5 0 0 0 0 0 .55 0 0 0 0 0 ${f3(rim * 3.4)} 0" result="en"/>`;
        m.push('en');
      }
    }
    p += `<feMerge result="mg">${m.map((k) => `<feMergeNode in="${k}"/>`).join('')}</feMerge>`;
    const fl = o.fleck ?? 0.22;
    if (fl > 0) {
      /* dry brush: paper showing through, mostly where the brush ran out at the edges */
      p += `<feTurbulence type="fractalNoise" baseFrequency="${o.fleckFreq ?? '0.05 0.11'}" numOctaves="3" seed="${s + 5}" result="fl"/>`;
      p += `<feColorMatrix in="fl" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 18 0 0 0 ${f3(-18 * (0.69 - fl * 0.14))}" result="flA"/>`;
      if (o.fleckEdge !== false) {
        p += `<feColorMatrix in="e2" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 0" result="eM"/>`;
        p += `<feComposite in="flA" in2="eM" operator="in" result="flE"/>`;
        p += `<feComposite in="mg" in2="flE" operator="out"/>`;
      } else p += `<feComposite in="mg" in2="flA" operator="out"/>`;
    }
    this.defs.push(p + '</filter>');
    return id;
  }

  private shapeEl(si: ShapeIn, o: WashOpts): string {
    const s = shapeOf(si);
    const op = s.op !== undefined ? ` opacity="${s.op}"` : '';
    if (s.stroke || o.stroke)
      return `<path d="${s.d}" fill="none" stroke="${s.stroke ?? o.stroke}" stroke-width="${s.sw ?? o.sw ?? 3}" stroke-linecap="round" stroke-linejoin="round"${op}/>`;
    return `<path d="${s.d}" fill="${s.fill ?? o.fill}"${op}/>`;
  }

  private bbox(shapes: readonly ShapeIn[], o: WashOpts): number[] {
    let a = Infinity,
      b = Infinity,
      c = -Infinity,
      e = -Infinity;
    for (const si of shapes) {
      const s = shapeOf(si),
        bb = bboxOf(s.d),
        sw = s.sw ?? o.sw ?? 0;
      a = Math.min(a, bb[0] - sw);
      b = Math.min(b, bb[1] - sw);
      c = Math.max(c, bb[2] + sw);
      e = Math.max(e, bb[3] + sw);
    }
    return [Math.max(-20, a), Math.max(-20, b), Math.min(this.w + 20, c), Math.min(this.h + 20, e)];
  }

  private group(filterId: string, op: number, blend: string, inner: string): void {
    this.body.push(`<g filter="url(#${filterId})" opacity="${op}" style="mix-blend-mode:${blend}">${inner}</g>`);
  }

  /** A watercolour wash over some shapes. */
  wash(shapes: readonly ShapeIn[], o: WashOpts = {}): void {
    if (!shapes.length) return;
    const id = this.filter(o, this.bbox(shapes, o));
    this.group(id, o.op ?? 0.8, o.blend ?? 'multiply', shapes.map((s) => this.shapeEl(s, o)).join(''));
  }

  /** A white body later washes sit on (snow, felt, sails), so the object hides what is behind it. */
  under(shapes: readonly ShapeIn[], o: WashOpts = {}): void {
    const bb = this.bbox(shapes, o),
      id = 'u' + this.n++,
      ds = o.disp ?? 10,
      pad = ds + 6,
      s = 1 + Math.floor(this.r() * 900);
    this.defs.push(
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f1(bb[0] - pad)}" y="${f1(bb[1] - pad)}" width="${f1(bb[2] - bb[0] + pad * 2)}" height="${f1(bb[3] - bb[1] + pad * 2)}"><feTurbulence type="fractalNoise" baseFrequency="${o.freq ?? 0.03}" numOctaves="3" seed="${s}"/><feDisplacementMap in="SourceGraphic" scale="${ds}" xChannelSelector="R" yChannelSelector="G"/></filter>`,
    );
    this.body.push(
      `<g filter="url(#${id})">${shapes.map((sh) => this.shapeEl(sh, { fill: o.fill ?? '#F5F3EC' })).join('')}</g>`,
    );
  }

  /** Blurred: cast shadows, glows, mist, light pooling on the ground. */
  soft(shapes: readonly ShapeIn[], o: WashOpts = {}): void {
    const bb = this.bbox(shapes, o),
      id = 's' + this.n++,
      bl = o.blur ?? 7,
      pad = bl * 3 + 16,
      s = 1 + Math.floor(this.r() * 900);
    this.defs.push(
      `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f1(bb[0] - pad)}" y="${f1(bb[1] - pad)}" width="${f1(bb[2] - bb[0] + pad * 2)}" height="${f1(bb[3] - bb[1] + pad * 2)}"><feTurbulence type="fractalNoise" baseFrequency="${o.freq ?? 0.04}" numOctaves="2" seed="${s}"/><feDisplacementMap in="SourceGraphic" scale="${o.disp ?? 14}" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="${bl}"/></filter>`,
    );
    this.group(
      id,
      o.op ?? 0.3,
      o.blend ?? 'multiply',
      shapes.map((sh) => this.shapeEl(sh, { fill: o.fill ?? '#7C8389' })).join(''),
    );
  }

  /** The little painted patch an object stands on, and its soft grey cast shadow (the sun is on the left). */
  ground(cx: number, cy: number, rx: number, ry: number, o: GroundOpts = {}): void {
    const c = o.colors ?? ['#A7B67E', '#C9B87E', '#7F9A5E'];
    const sh = o.shadow ?? 1,
      len = o.shLen ?? 1.25;
    if (sh) {
      this.soft(
        [
          poly([
            [cx - rx * 0.25, cy - ry * 0.2],
            [cx + rx * len, cy + ry * 0.05],
            [cx + rx * len * 0.95, cy + ry * 0.9],
            [cx - rx * 0.1, cy + ry * 0.8],
          ]),
        ],
        { op: 0.3 * sh, blur: 8, fill: '#6F767D' },
      );
      this.soft([this.blob(cx + rx * 0.15, cy + ry * 0.2, rx * 0.55, ry * 0.55, 0.2, 10)], {
        op: 0.26 * sh,
        blur: 5,
        fill: '#5E656C',
      });
    }
    const top: number[][] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      top.push([
        cx - rx + t * rx * 2,
        cy - ry * 0.55 * Math.sin(t * Math.PI) * this.rand(0.6, 1.2) - this.rand(0, ry * 0.3),
      ]);
    }
    const bot: number[][] = [];
    for (let i = 14; i >= 0; i--) {
      const t = i / 14;
      bot.push([cx - rx + t * rx * 2 + this.rand(-6, 6), cy + ry * 0.7 * Math.sin(t * Math.PI) + this.rand(-2, 3)]);
    }
    this.wash(
      [
        {
          d: smoothPath([...top, ...bot]),
          fill: this.grad(
            [
              [0, c[0]],
              [0.6, c[1]],
              [1, c[1], 0.6],
            ],
            0,
            0,
            1,
            0.3,
          ),
        },
      ],
      { op: 0.62, disp: 16, freq: 0.04, fleck: 0.35, fleckFreq: '0.03 0.2', rim: 0.5 },
    );
    this.wash(
      [
        this.blob(cx - rx * 0.15, cy - ry * 0.05, rx * 0.55, ry * 0.5, 0.3, 12),
        this.blob(cx + rx * 0.45, cy + ry * 0.1, rx * 0.3, ry * 0.35, 0.3, 10),
      ],
      { fill: c[2], op: 0.45, disp: 12, gran: 0.5, rim: 0.7 },
    );
    if (o.tufts !== false) {
      const st: Shape[] = [];
      for (let i = 0; i < (o.tufts ?? 14); i++) {
        const x = cx + this.rand(-rx * 0.85, rx * 0.85),
          y = cy + this.rand(-ry * 0.2, ry * 0.4),
          h = this.rand(6, 16) * (o.tuftH ?? 1);
        st.push({
          d: line([
            [x, y],
            [x + this.rand(-3, 4), y - h],
          ]),
          sw: this.rand(1.4, 2.6),
        });
      }
      this.wash(st, { stroke: c[3] ?? '#5F7442', op: 0.5, disp: 3, freq: 0.08, rim: 0, gran: 0.2, bloom: 0 });
    }
  }

  /** How many filter and gradient definitions the painting has made (for tests and budgets). */
  get size(): number {
    return this.n;
  }

  /** The finished SVG, drawn at q times its own size. */
  svg(q: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(this.w * q)}" height="${Math.round(this.h * q)}" viewBox="0 0 ${this.w} ${this.h}"><defs>${this.defs.join('')}</defs>${this.body.join('')}</svg>`;
  }
}
