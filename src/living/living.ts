/**
 * The living photo: one WebGL canvas over the photographs that makes the place on screen move (cloud, water, mist,
 * light), using that world's scene (scenes.ts). It lines up with the <img> to the pixel (cover.ts), is transparent
 * wherever nothing moves, and starts each world from the exact still, so a cut never jumps. The GPU does the work:
 * a frame here is a few uniforms and one draw call. Without WebGL 2 the photographs simply stay still.
 */
import { WORLDS } from '../content/places';
import type { Ticker } from '../lib/ticker';
import { coverFit, tallCropX, TALL_SIZE, WIDE_SIZE } from '../worlds/cover';
import { lookOf } from '../worlds/looks';
import type { Photos } from '../worlds/photos';
import { NOISE_SIZE, tileNoise } from './noise';
import { MASK_H, MASK_W, rasterScene, type Masks } from './raster';
import { MAX_LIGHTS, type Scene } from './scene';
import { sceneOf } from './scenes';
import { FRAGMENT, VERTEX } from './shader';

/** the canvas never has more pixels than this, nor more than MAX_DPR per CSS pixel */
const MAX_PIXELS = 1_300_000;
const MAX_DPR = 1.5;
/** how long a world takes to come alive after it lands, in seconds */
const RAMP = 1.6;
/** photographs kept on the GPU: the one on screen and the two before it */
const KEPT = 3;
const TALL_FILE = /-m\.webp(\?|$)/;

const UNIFORMS = [
  'uCover',
  'uPhoto',
  'uMaskA',
  'uMaskB',
  'uNoise',
  'uLand',
  'uTime',
  'uAmp',
  'uCycle',
  'uScale',
  'uSway',
  'uMist',
  'uMistRgb',
  'uShimmer',
  'uLightN',
  'uLightA',
  'uLightB',
  'uBeamA',
  'uBeamB',
] as const;
type UniformName = (typeof UNIFORMS)[number];

export interface Living {
  /** World `i` has landed: start moving its photograph (from the exact still). */
  show(i: number): void;
  /** The stage changed size, or the photo changed crop. */
  resize(): void;
  /** Motion is switched off (stills only: nothing is fetched, nothing is drawn) or on again. */
  enable(on: boolean): void;
}

interface Picture {
  tex: WebGLTexture;
  /** is it the upright crop */
  tall: boolean;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL gave no shader object: the living photo cannot start.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(`The living photo's shader did not compile: ${gl.getShaderInfoLog(shader) ?? 'no log'}`);
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('WebGL gave no program object: the living photo cannot start.');
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.bindAttribLocation(program, 0, 'aPos');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(`The living photo's shader did not link: ${gl.getProgramInfoLog(program) ?? 'no log'}`);
  return program;
}

/** Texture units: the photograph, the two masks of its scene, the noise tile. */
const UNIT = { photo: 0, maskA: 1, maskB: 2, noise: 3 } as const;

/** A small texture from bytes, left bound to `unit`. */
function dataTexture(
  gl: WebGL2RenderingContext,
  unit: number,
  w: number,
  h: number,
  data: Uint8Array,
  repeat: boolean,
): WebGLTexture {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

const STILL: Living = { show: () => undefined, resize: () => undefined, enable: () => undefined };

interface LivingParts {
  photos: Photos;
  ticker: Ticker;
  /** is the upright crop of the photos the one on screen */
  upright: () => boolean;
}

export function createLiving(canvas: HTMLCanvasElement, parts: LivingParts): Living {
  canvas.dataset.live = 'off';
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  return gl ? run(canvas, gl, parts) : STILL;
}

function run(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, opts: LivingParts): Living {
  const { photos, ticker } = opts;

  const program = link(gl);
  gl.useProgram(program);
  const at = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<
    UniformName,
    WebGLUniformLocation | null
  >;
  /* one triangle that covers the whole canvas */
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.uniform1i(at.uPhoto, UNIT.photo);
  gl.uniform1i(at.uMaskA, UNIT.maskA);
  gl.uniform1i(at.uMaskB, UNIT.maskB);
  gl.uniform1i(at.uNoise, UNIT.noise);
  dataTexture(gl, UNIT.noise, NOISE_SIZE, NOISE_SIZE, tileNoise(), true);

  const pictures = new Map<string, Picture>();
  const masks = new Map<string, { masks: Masks; a: WebGLTexture; b: WebGLTexture }>();
  let world = -1;
  let scene: Scene | null = null;
  let picture: Picture | null = null;
  let amp = 0;
  let time = 0;
  let asked = 0;
  let stop: (() => void) | null = null;
  let lost = false;
  let enabled = true;

  const sync = (): void => {
    canvas.dataset.live = stop !== null && ticker.running() ? 'on' : 'off';
  };
  ticker.watch(sync);

  function halt(): void {
    stop?.();
    stop = null;
    picture = null;
    if (!lost) gl.clear(gl.COLOR_BUFFER_BIT);
    sync();
  }

  function measure(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1 || !picture) return;
    const k = Math.min(Math.min(window.devicePixelRatio || 1, MAX_DPR), Math.sqrt(MAX_PIXELS / (w * h)));
    const pw = Math.max(1, Math.round(w * k));
    const ph = Math.max(1, Math.round(h * k));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    gl.viewport(0, 0, pw, ph);
    const look = lookOf(WORLDS[world].id);
    const size = picture.tall ? TALL_SIZE : WIDE_SIZE;
    const fit = coverFit(w, h, size.w / size.h, picture.tall ? 0.5 : look.x / 100);
    gl.uniform4f(at.uCover, w / fit.width, -fit.left / fit.width, h / fit.height, -fit.top / fit.height);
    if (picture.tall) gl.uniform2f(at.uLand, tallCropX(look.focus) / WIDE_SIZE.w, TALL_SIZE.w / WIDE_SIZE.w);
    else gl.uniform2f(at.uLand, 0, 1);
  }

  function useScene(id: string, s: Scene): void {
    let m = masks.get(id);
    if (!m) {
      const made = rasterScene(s);
      m = {
        masks: made,
        a: dataTexture(gl, UNIT.maskA, MASK_W, MASK_H, made.a, false),
        b: dataTexture(gl, UNIT.maskB, MASK_W, MASK_H, made.b, false),
      };
      masks.set(id, m);
    }
    gl.activeTexture(gl.TEXTURE0 + UNIT.maskA);
    gl.bindTexture(gl.TEXTURE_2D, m.a);
    gl.activeTexture(gl.TEXTURE0 + UNIT.maskB);
    gl.bindTexture(gl.TEXTURE_2D, m.b);
    gl.uniform1f(at.uCycle, s.cycle);
    gl.uniform2f(at.uScale, m.masks.flowScale, m.masks.swayScale);
    gl.uniform3f(at.uSway, s.sway?.rate ?? 0, s.sway?.wave[0] ?? 0, s.sway?.wave[1] ?? 0);
    gl.uniform3f(at.uMist, s.mist?.drift[0] ?? 0, s.mist?.drift[1] ?? 0, s.mist?.scale ?? 1);
    gl.uniform3f(at.uMistRgb, ...(s.mist?.rgb ?? [0, 0, 0]));
    gl.uniform2f(at.uShimmer, s.shimmer?.size ?? 0, s.shimmer?.speed ?? 0);
    const lights = (s.lights ?? []).slice(0, MAX_LIGHTS);
    const la = new Float32Array(MAX_LIGHTS * 4);
    const lb = new Float32Array(MAX_LIGHTS * 4);
    lights.forEach((l, i) => {
      la.set([l.at[0], l.at[1], l.radius, l.amount], i * 4);
      lb.set([l.speed, l.seed, l.kind === 'breathe' ? 1 : 0, 0], i * 4);
    });
    gl.uniform1i(at.uLightN, lights.length);
    gl.uniform4fv(at.uLightA, la);
    gl.uniform4fv(at.uLightB, lb);
    const beam = s.beam;
    if (beam) {
      const dx = (beam.to[0] - beam.at[0]) * (WIDE_SIZE.w / WIDE_SIZE.h);
      const dy = beam.to[1] - beam.at[1];
      const len = Math.hypot(dx, dy);
      gl.uniform4f(at.uBeamA, beam.at[0], beam.at[1], dx / len, dy / len);
      gl.uniform4f(at.uBeamB, len, beam.spread, beam.period, beam.dim);
    } else gl.uniform4f(at.uBeamB, 0, 0, 1, 0);
  }

  /** The photograph of world `i` as a texture: the very picture the <img> on screen shows. */
  async function pictureOf(i: number): Promise<Picture | null> {
    const frame = photos.mount(i);
    if (!(await frame.ready)) return null;
    /* after a change of crop (a phone turned) the <img> is loading a different file: wait for that one */
    const decoded = await frame.img.decode().then(
      () => true,
      (err: unknown) => {
        if (err instanceof DOMException) return false;
        throw err;
      },
    );
    if (!decoded) return null;
    const tall = TALL_FILE.test(frame.img.currentSrc);
    const key = `${i}:${tall ? 'm' : 'w'}`;
    const kept = pictures.get(key);
    if (kept) {
      /* used again: it is the newest now */
      pictures.delete(key);
      pictures.set(key, kept);
      return kept;
    }
    const bitmap = await createImageBitmap(frame.img, {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    }).catch((err: unknown) => {
      /* the photo was taken out of the page, or changed crop, while it was being read: the world stays still */
      if (err instanceof DOMException) return null;
      throw err;
    });
    if (!bitmap || lost) return null;
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + UNIT.photo);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    bitmap.close();
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const made = { tex, tall };
    pictures.set(key, made);
    for (const [old, p] of pictures) {
      if (pictures.size <= KEPT) break;
      gl.deleteTexture(p.tex);
      pictures.delete(old);
    }
    return made;
  }

  function draw(dt: number): void {
    time += dt;
    amp = Math.min(1, amp + dt / RAMP);
    gl.uniform1f(at.uTime, time);
    gl.uniform1f(at.uAmp, amp * amp * (3 - 2 * amp));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  async function begin(i: number): Promise<void> {
    const mine = ++asked;
    const found = await pictureOf(i);
    if (mine !== asked || lost || !found) return;
    halt();
    const id = WORLDS[i].id;
    world = i;
    scene = sceneOf(id);
    picture = found;
    amp = 0;
    gl.activeTexture(gl.TEXTURE0 + UNIT.photo);
    gl.bindTexture(gl.TEXTURE_2D, found.tex);
    useScene(id, scene);
    measure();
    gl.uniform1f(at.uAmp, 0);
    gl.uniform1f(at.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    stop = ticker.add(draw);
    sync();
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    /* the GPU took the context back: the photographs stay as they are, still */
    e.preventDefault();
    lost = true;
    asked++;
    halt();
  });

  return {
    show(i) {
      if (lost) return;
      world = i;
      /* the still is in front now; whatever was moving belongs to the world just left */
      asked++;
      halt();
      if (enabled) void begin(i);
    },
    enable(on) {
      if (lost || on === enabled) return;
      enabled = on;
      asked++;
      halt();
      if (on && world >= 0) void begin(world);
    },
    resize() {
      if (lost || !enabled || world < 0) return;
      /* a different crop may be on screen now (a phone turned): fetch the picture again if so */
      if (picture && picture.tall !== opts.upright()) {
        halt();
        void begin(world);
      } else if (picture) measure();
      else void begin(world);
    },
  };
}
