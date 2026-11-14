/**
 * The small things in a world's air, on one shared 2D canvas over the picture: snow carried off the summit, sparks,
 * blossom petals, dust in the light. (What moves inside the painting itself is src/living/.) The canvas is half
 * the stage's size, draws about thirty times a second from the page's one frame loop (src/lib/ticker.ts), and is
 * off the loop whenever its world has nothing in the air. It says whether it is drawing in data-live (on / off).
 * A press on something in the painting can add a short burst of particles from a point (src/worlds/reactions.ts):
 * they live a second or two in a small pool of their own, and the canvas leaves the loop again once they are gone.
 */
import { ctx2d } from '../lib/dom';
import type { Ticker } from '../lib/ticker';
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE, type Fit } from '../worlds/cover';
import type { Look } from '../worlds/looks';
import { MAX_BURST, type Burst } from '../worlds/reactions';
import { MAX_PARTICLES, type AmbientSpec, type Point } from './spec';

/** canvas pixels per CSS pixel */
const RES = 0.5;
/** seconds between drawings */
const FRAME = 0.03;
const TAU = Math.PI * 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** size in px */
  s: number;
  /** opacity */
  a: number;
  /** phase, for flicker and sway */
  ph: number;
  age: number;
  life: number;
}

export interface Ambient {
  /** Change to this world's air (null look or null spec = nothing in it). */
  set(look: Look | null): void;
  /** The stage changed size or the photo changed crop. */
  resize(): void;
  /** A short burst of particles from a point of the painting (a reaction to a press). */
  burst(b: Burst): void;
}

interface Spark extends Particle {
  style: Burst['style'];
  rgb: string;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

export function createAmbient(canvas: HTMLCanvasElement, opts: { upright: () => boolean; ticker: Ticker }): Ambient {
  const { ticker } = opts;
  const ctx = ctx2d(canvas);
  const parts: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    s: 1,
    a: 1,
    ph: 0,
    age: 0,
    life: 1,
  }));
  let W = 0;
  let H = 0;
  let fit: Fit = { left: 0, top: 0, width: 0, height: 0 };
  let look: Look | null = null;
  let spec: AmbientSpec | null = null;
  let live = 0;
  let t = 0;
  let due = 0;
  let stop: (() => void) | null = null;
  /** the bursts' own pool: the oldest is reused when it is full */
  const sparks: Spark[] = [];

  const sync = (): void => {
    canvas.dataset.live = stop !== null && ticker.running() ? 'on' : 'off';
  };
  ticker.watch(sync);
  sync();
  /** A point of the landscape photo, in stage pixels (through the upright crop when that is on screen). */
  const px = (p: Point): [number, number] => {
    const u = look && opts.upright() ? tallU(p[0], look.focus) : p[0];
    return [placeX(fit, u), placeY(fit, p[1])];
  };

  function measure(): void {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * RES));
    canvas.height = Math.max(1, Math.round(H * RES));
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    const upright = opts.upright();
    const size = upright ? TALL_SIZE : WIDE_SIZE;
    fit = coverFit(W, H, size.w / size.h, upright || !look ? 0.5 : look.x / 100);
  }

  /** Give a particle a new start. `first` = the world has just opened: scatter them as if it had been running. */
  function born(p: Particle, first: boolean): void {
    if (!spec) return;
    p.ph = rand(0, TAU);
    p.age = 0;
    switch (spec.kind) {
      case 'spindrift': {
        /* somewhere along the crest, between two of its points */
        const k = Math.min(spec.ridge.length - 2, Math.floor(rand(0, spec.ridge.length - 1)));
        const q = rand(0, 1);
        const [ax, ay] = px(spec.ridge[k]);
        const [bx, by] = px(spec.ridge[k + 1]);
        p.life = rand(1.6, 3.4);
        p.vx = rand(0.05, 0.13) * fit.height * (spec.wind ?? 1);
        p.vy = rand(-0.022, 0.006) * fit.height;
        p.s = rand(1, 2.2);
        p.a = rand(0.3, 0.8);
        p.age = first ? rand(0, p.life) : 0;
        p.x = ax + (bx - ax) * q + p.vx * p.age;
        p.y = ay + (by - ay) * q + p.vy * p.age + rand(-2, 2);
        break;
      }
      case 'petals': {
        /* born anywhere in the box when the world opens, then always at its top, drifting down and with the wind */
        const [x0, y0] = px([spec.box[0], spec.box[1]]);
        const [x1, y1] = px([spec.box[2], spec.box[3]]);
        p.x = rand(x0, x1);
        p.y = first ? rand(y0, y1) : y0 + rand(0, 0.15) * (y1 - y0);
        p.vx = rand(-16, -4);
        p.vy = rand(10, 26);
        p.s = rand(2, 3.6);
        p.a = rand(0.55, 0.9);
        p.life = rand(5, 11);
        p.age = first ? rand(0, p.life) : 0;
        break;
      }
      case 'embers': {
        const [ox, oy] = px(spec.at[Math.floor(rand(0, spec.at.length))]);
        p.life = rand(1.8, 4.6);
        p.vx = rand(-10, 10);
        p.vy = rand(-22, -64);
        p.s = rand(1, 2.4);
        p.age = first ? rand(0, p.life) : 0;
        p.x = ox + rand(-0.012, 0.012) * fit.height;
        p.y = oy + rand(-4, 6) + p.vy * p.age;
        break;
      }
      case 'motes': {
        const [x0, y0] = px([spec.box[0], spec.box[1]]);
        const [x1, y1] = px([spec.box[2], spec.box[3]]);
        const angle = rand(0, TAU);
        const speed = rand(3, 11);
        p.x = rand(x0, x1);
        p.y = rand(y0, y1);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed * 0.6;
        p.s = rand(1, 2.6);
        p.a = rand(0.14, 0.5);
        p.life = rand(6, 14);
        p.age = first ? rand(0, p.life) : 0;
        break;
      }
    }
  }

  /** A burst's particle: born near its point, moving the way its style says. */
  function spark(b: Burst): Spark {
    const [ox, oy] = px(b.at);
    const r = b.spread * fit.height;
    const p: Spark = {
      x: ox + rand(-r, r),
      y: oy + rand(-r, r) * 0.6,
      vx: 0,
      vy: 0,
      s: 1,
      a: 1,
      ph: rand(0, TAU),
      age: 0,
      life: 1,
      style: b.style,
      rgb: b.rgb,
    };
    switch (b.style) {
      case 'rise':
        p.vx = rand(-16, 16);
        p.vy = rand(-34, -80);
        p.s = rand(1.6, 3.4);
        p.life = rand(0.9, 1.9);
        break;
      case 'fall':
        p.vx = rand(-14, 4);
        p.vy = rand(14, 34);
        p.s = rand(2, 3.6);
        p.a = rand(0.6, 0.9);
        p.life = rand(1.6, 3);
        break;
      case 'drift':
        p.vx = (b.dir ?? 1) * rand(0.05, 0.12) * fit.height;
        p.vy = rand(-0.02, 0.006) * fit.height;
        p.s = rand(1.4, 2.6);
        p.a = rand(0.55, 0.95);
        p.life = rand(1, 2);
        break;
    }
    return p;
  }

  function drawSparks(dt: number): void {
    let n = 0;
    for (const p of sparks) {
      p.age += dt;
      if (p.age > p.life) continue;
      sparks[n++] = p;
      p.x += p.vx * dt + (p.style === 'fall' ? Math.sin(t * 1.3 + p.ph) * 14 * dt : 0);
      p.y += p.vy * dt;
      const q = p.age / p.life;
      const fade = Math.max(0, q < 0.15 ? q / 0.15 : 1 - (q - 0.15) / 0.85);
      ctx.fillStyle = `rgb(${p.rgb})`;
      ctx.globalAlpha = p.a * fade;
      if (p.style === 'drift') ctx.fillRect(p.x, p.y, p.s * 2.2, p.s);
      else if (p.style === 'fall')
        ctx.fillRect(p.x, p.y, p.s * 1.6 * (0.35 + 0.65 * Math.abs(Math.cos(t * 1.9 + p.ph))), p.s);
      else ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    sparks.length = n;
    ctx.globalAlpha = 1;
  }

  function draw(dt: number): void {
    ctx.clearRect(0, 0, W, H);
    if (sparks.length > 0) drawSparks(dt);
    if (!spec) return;
    switch (spec.kind) {
      case 'spindrift':
        ctx.fillStyle = '#fff';
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.age += dt;
          if (p.age > p.life) born(p, false);
          p.x += p.vx * dt;
          p.y += (p.vy + Math.sin(t * 1.7 + p.ph) * 9) * dt;
          /* thin at the crest, thickest just off it, gone downwind */
          const q = p.age / p.life;
          ctx.globalAlpha = p.a * Math.max(0, q < 0.12 ? q / 0.12 : 1 - (q - 0.12) / 0.88);
          ctx.fillRect(p.x, p.y, p.s * 2.2, p.s);
        }
        break;
      case 'petals':
        ctx.fillStyle = `rgb(${spec.rgb})`;
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.age += dt;
          if (p.age > p.life) born(p, false);
          /* a petal rocks from side to side as it falls, and turns: wide when flat, a sliver when edge-on */
          p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * 14) * dt;
          p.y += p.vy * dt;
          const q = p.age / p.life;
          const turn = 0.35 + 0.65 * Math.abs(Math.cos(t * 1.9 + p.ph));
          ctx.globalAlpha = p.a * Math.max(0, Math.min(1, q / 0.1, (1 - q) / 0.2));
          ctx.fillRect(p.x, p.y, p.s * 1.6 * turn, p.s);
        }
        break;
      case 'embers':
        ctx.fillStyle = `rgb(${spec.rgb})`;
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.age += dt;
          if (p.age > p.life) born(p, false);
          p.x += (p.vx + Math.sin(t * 2.2 + p.ph) * 12) * dt;
          p.y += p.vy * dt;
          const q = p.age / p.life;
          ctx.globalAlpha = Math.max(0, q < 0.15 ? q / 0.15 : 1 - (q - 0.15) / 0.85) * 0.9;
          ctx.fillRect(p.x, p.y, p.s, p.s);
        }
        break;
      case 'motes':
        ctx.fillStyle = `rgb(${spec.rgb})`;
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.age += dt;
          if (p.age > p.life) born(p, false);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          /* each mote fades in and out over its life, and twinkles a little */
          const q = p.age / p.life;
          ctx.globalAlpha = p.a * Math.sin(q * Math.PI) * (0.7 + 0.3 * Math.sin(t * 0.9 + p.ph));
          ctx.fillRect(p.x, p.y, p.s, p.s);
        }
        break;
    }
    ctx.globalAlpha = 1;
  }

  /** from the page's frame loop: draw only every FRAME seconds or so */
  function tick(dt: number): void {
    due += dt;
    if (due < FRAME) return;
    const step = Math.min(0.06, due);
    due = 0;
    t += step;
    draw(step);
    /* a world with nothing in its air leaves the loop again once its burst is over */
    if (live === 0 && sparks.length === 0) {
      stop?.();
      stop = null;
      sync();
    }
  }

  function restart(): void {
    stop?.();
    stop = null;
    sparks.length = 0;
    measure();
    ctx.clearRect(0, 0, W, H);
    live = spec && W > 0 ? Math.min(MAX_PARTICLES, spec.count) : 0;
    for (let i = 0; i < live; i++) born(parts[i], true);
    if (live > 0) stop = ticker.add(tick);
    sync();
  }

  measure();

  return {
    set(next) {
      look = next;
      spec = next ? next.ambient : null;
      restart();
    },
    resize: restart,
    burst(b) {
      if (W === 0) return;
      for (let i = 0; i < Math.min(b.count, MAX_BURST); i++) {
        if (sparks.length >= MAX_BURST) sparks.shift();
        sparks.push(spark(b));
      }
      if (!stop) stop = ticker.add(tick);
      sync();
    },
  };
}
