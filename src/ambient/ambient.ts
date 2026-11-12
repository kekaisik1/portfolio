/**
 * The one small living detail of each world, on a single shared canvas: spindrift on the summit, the phone's glow,
 * motes in lamp-light, embers, fog, rain. The canvas is half the stage's size at most (never more than one pixel
 * per CSS pixel), draws about thirty times a second, and its loop stops whenever there is nothing to draw: a still
 * world, a hidden tab, reduced motion, or something covering the photo. It is the page's only frame loop; the
 * canvas says whether it is running in data-live (on / off), which the smoke suite reads.
 */
import { ctx2d } from '../lib/dom';
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE, type Fit } from '../worlds/cover';
import type { Look } from '../worlds/looks';
import { MAX_PARTICLES, type AmbientSpec, type Point } from './spec';

/** canvas pixels per CSS pixel */
const RES = 0.5;
const FRAME_MS = 30;
const TAU = Math.PI * 2;
/** a device that cannot keep up loses the detail instead of stuttering: this many late frames out of WINDOW */
const WINDOW = 90;
const TOO_MANY_LATE = 40;
const LATE_MS = 34;

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
  /** Change the detail to this world's (null look or null spec = a still place). */
  set(look: Look | null): void;
  /** Stop while something covers the photo (the video, a sheet), and start again after. */
  pause(on: boolean): void;
  /** The stage changed size or the photo changed crop. */
  resize(): void;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

export function createAmbient(
  canvas: HTMLCanvasElement,
  opts: { upright: () => boolean; reduced: () => boolean; onTooSlow: () => void },
): Ambient {
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
  let raf = 0;
  let last = 0;
  let prev = 0;
  let t = 0;
  let seen = 0;
  let late = 0;
  let halted = false;
  let gaveUp = false;
  let fogSprite: HTMLCanvasElement | null = null;

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

  function fog(rgb: string): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = ctx2d(c);
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(0.55, `rgba(${rgb},0.45)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return c;
  }

  /** Give a particle a new start. `first` = the world has just opened: scatter them as if it had been running. */
  function born(p: Particle, first: boolean): void {
    if (!spec) return;
    p.ph = rand(0, TAU);
    p.age = 0;
    switch (spec.kind) {
      case 'drift':
        p.x = first ? rand(0, W) : -10;
        p.y = rand(H * 0.05, H * 0.8);
        p.vx = rand(70, 170);
        p.vy = rand(-8, 22);
        p.s = rand(1, 2.4);
        p.a = rand(0.25, 0.75);
        break;
      case 'rain':
        p.x = rand(0, W + 60);
        p.y = first ? rand(-H, H) : rand(-80, -10);
        p.vy = rand(900, 1350);
        p.vx = -p.vy * 0.07;
        p.s = rand(14, 28);
        p.a = rand(0.12, 0.3);
        break;
      case 'embers': {
        const [ox, oy] = px(spec.at);
        p.life = rand(1.8, 4.6);
        p.vx = rand(-10, 10);
        p.vy = rand(-22, -64);
        p.s = rand(1, 2.4);
        p.age = first ? rand(0, p.life) : 0;
        p.x = ox + rand(-0.03, 0.03) * fit.height;
        p.y = oy + rand(-8, 10) + p.vy * p.age;
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
      case 'fog':
        p.s = rand(0.7, 1.1) * H;
        p.x = first ? rand(-p.s, W) : -p.s;
        p.y = rand(0.25, 0.75) * H - p.s / 2;
        p.vx = rand(5, 12);
        p.a = rand(0.6, 1);
        break;
      case 'glow':
        break;
    }
  }

  function draw(dt: number): void {
    if (!spec) return;
    ctx.clearRect(0, 0, W, H);
    switch (spec.kind) {
      case 'drift':
        ctx.fillStyle = '#fff';
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.x += p.vx * dt;
          p.y += (p.vy + Math.sin(t * 1.7 + p.ph) * 14) * dt;
          if (p.x > W + 10) born(p, false);
          ctx.globalAlpha = p.a;
          ctx.fillRect(p.x, p.y, p.s * 2.2, p.s);
        }
        break;
      case 'rain':
        ctx.strokeStyle = '#dce6f2';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > H + 30) born(p, false);
          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.vx / p.vy) * p.s, p.y - p.s);
          ctx.stroke();
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
      case 'fog':
        if (!fogSprite) fogSprite = fog(spec.rgb);
        for (let i = 0; i < live; i++) {
          const p = parts[i];
          p.x += p.vx * dt;
          if (p.x > W) born(p, false);
          ctx.globalAlpha = spec.alpha * p.a;
          ctx.drawImage(fogSprite, p.x, p.y, p.s * 1.6, p.s);
        }
        break;
      case 'glow': {
        const [x, y] = px(spec.at);
        const r = spec.radius * fit.height;
        const alpha = spec.low + (spec.high - spec.low) * (0.5 + 0.5 * Math.sin((t * TAU) / spec.period));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${spec.rgb},${alpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${spec.rgb},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        break;
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now: number): void {
    raf = 0;
    if (halted || gaveUp || !spec) return;
    if (prev) {
      seen++;
      if (now - prev > LATE_MS) late++;
      if (seen >= WINDOW) {
        if (late > TOO_MANY_LATE) {
          gaveUp = true;
          canvas.dataset.live = 'off';
          ctx.clearRect(0, 0, W, H);
          opts.onTooSlow();
          return;
        }
        seen = late = 0;
      }
    }
    prev = now;
    if (now - last >= FRAME_MS) {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      t += dt;
      draw(dt);
    }
    raf = requestAnimationFrame(frame);
  }

  function start(): void {
    if (raf || halted || gaveUp || !spec || opts.reduced() || document.hidden) return;
    last = performance.now();
    prev = 0;
    raf = requestAnimationFrame(frame);
    canvas.dataset.live = 'on';
  }
  function stop(): void {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    canvas.dataset.live = 'off';
  }
  function populate(): void {
    live = 0;
    if (!spec) return;
    live = spec.kind === 'glow' ? 0 : Math.min(MAX_PARTICLES, spec.count);
    for (let i = 0; i < live; i++) born(parts[i], true);
  }

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  measure();

  return {
    set(next) {
      stop();
      look = next;
      spec = next ? next.ambient : null;
      fogSprite = null;
      measure();
      ctx.clearRect(0, 0, W, H);
      if (!spec || opts.reduced()) return;
      populate();
      start();
    },
    pause(on) {
      halted = on;
      if (on) {
        stop();
        ctx.clearRect(0, 0, W, H);
      } else start();
    },
    resize() {
      measure();
      ctx.clearRect(0, 0, W, H);
      if (!spec || opts.reduced()) {
        stop();
        return;
      }
      populate();
      start();
    },
  };
}
