/**
 * Lanterns: light one by the campfire and it rises from the fire into the sky and stays there. Your own are kept in
 * this browser (at most five); with the API they are also everyone's: other people's hang fainter and further off,
 * and the count says how many have been lit. Without the API nothing is sent and the count is your own.
 */
import { api } from '../api';
import type { LanternDto } from '../api/schemas';
import { MESSAGES } from '../content/site';
import { byId } from '../lib/dom';
import { reduce, tall } from '../lib/media';
import { coverFit, placeX, placeY, tallU, TALL_SIZE, WIDE_SIZE, type Fit } from '../worlds/cover';
import { lookOf } from '../worlds/looks';
import { MAX_OWN, MAX_SHARED, parseStored, skyPlace } from './lantern-math';

const STORAGE_KEY = 'kaisar.lanterns.v1';
/** the world the lanterns belong to, and its fire and sky in the landscape photo (0..1 each way) */
const WORLD = 'contact';
const FIRE: readonly [number, number] = [0.63, 0.6];
/** the sky the lanterns hang in: wide screens have the Milky Way's half; upright phones the band above the horizon */
const SKY_WIDE = { u0: 0.4, u1: 0.99, v0: 0.05, v: 0.85 } as const;
const SKY_TALL = { u0: 0.42, u1: 0.84, v0: 0.4, v: 0.26 } as const;

export interface Lanterns {
  /** Light one: from the button, or from a note that was just sent. */
  light(): void;
  /** The campfire has come on screen or gone: lanterns are only drawn there. */
  show(on: boolean): void;
  /** The stage changed size. */
  layout(): void;
}

function loadOwn(): LanternDto[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    /* storage is blocked (private mode, a sandbox): lanterns last for this visit only */
    if (err instanceof DOMException) return [];
    throw err;
  }
  return parseStored(raw);
}

function saveOwn(own: readonly LanternDto[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(own));
  } catch (err) {
    /* no storage (or it is full): the lantern stays for this visit */
    if (!(err instanceof DOMException)) throw err;
  }
}

export function initLanterns(): Lanterns {
  const layer = byId('lanterns');
  const countLine = byId('lantern-n');
  const button = byId<HTMLButtonElement>('lantern');
  const look = lookOf(WORLD);
  let own = loadOwn();
  let shared: LanternDto[] = [];
  let total: number | null = null;
  let visible = false;
  /** the lantern lit a moment ago rises from the fire; the rest simply hang */
  let rising = false;

  function fit(): { fit: Fit; upright: boolean } {
    const upright = tall.matches;
    const size = upright ? TALL_SIZE : WIDE_SIZE;
    return {
      upright,
      fit: coverFit(layer.clientWidth, layer.clientHeight, size.w / size.h, upright ? 0.5 : look.x / 100),
    };
  }

  function setCount(): void {
    countLine.textContent = MESSAGES.lanterns(total ?? own.length);
  }

  function dot(cls: string, x: number, y: number, scale: number, alpha: number): HTMLElement {
    const el = document.createElement('span');
    el.className = cls;
    el.style.setProperty('--lx', `${x.toFixed(1)}px`);
    el.style.setProperty('--ly', `${y.toFixed(1)}px`);
    el.style.setProperty('--ls', scale.toFixed(2));
    el.style.opacity = alpha.toFixed(2);
    return el;
  }

  function draw(): void {
    if (!visible) return;
    const { fit: f, upright } = fit();
    const sky = upright ? SKY_TALL : SKY_WIDE;
    const u = (v: number): number => (upright ? tallU(v, look.focus) : v);
    /* skyPlace works in a box w wide and h high (it keeps to the upper half): here, the sky's share of the photo */
    const place = (l: LanternDto, i: number): { x: number; y: number; scale: number; alpha: number } => {
      const p = skyPlace(l, i, 1, sky.v);
      return {
        x: placeX(f, u(sky.u0 + p.x * (sky.u1 - sky.u0))),
        y: placeY(f, sky.v0 + p.y),
        scale: p.scale,
        alpha: p.alpha,
      };
    };
    const dots: HTMLElement[] = [];
    shared.forEach((l, i) => {
      const p = place(l, i);
      dots.push(dot('far-lantern', p.x, p.y, 0.6 + p.scale, p.alpha * 0.8));
    });
    own.forEach((l, i) => {
      const p = place(l, i + 3);
      const el = dot('lit', p.x, p.y, 0.8 + p.scale, 1);
      if (rising && i === own.length - 1 && !reduce.matches) {
        el.classList.add('rise');
        el.style.setProperty('--fx', `${placeX(f, u(FIRE[0])).toFixed(1)}px`);
        el.style.setProperty('--fy', `${placeY(f, FIRE[1]).toFixed(1)}px`);
      }
      dots.push(el);
    });
    rising = false;
    layer.replaceChildren(...dots);
  }

  async function loadShared(): Promise<void> {
    const r = await api.getLanterns();
    /* offline, no API, or the API is asleep: your own lanterns still work */
    if (!r.ok) return;
    total = r.data.count;
    shared = r.data.lanterns.slice(-MAX_SHARED);
    setCount();
    draw();
  }

  async function share(l: LanternDto): Promise<void> {
    const r = await api.postLantern(l);
    /* on any failure it still hangs in this browser */
    if (!r.ok) return;
    total = r.data.count;
    setCount();
  }

  function light(): void {
    const l: LanternDto = { x: Math.random(), y: Math.random() * 0.4, s: 0.5 + Math.random() * 0.5 };
    own = [...own, l].slice(-MAX_OWN);
    saveOwn(own);
    if (total !== null) total += 1;
    rising = true;
    setCount();
    draw();
    void share(l);
  }

  button.addEventListener('click', light);
  setCount();
  void loadShared();

  return {
    light,
    show(on) {
      visible = on;
      layer.hidden = !on;
      if (on) draw();
      else layer.replaceChildren();
    },
    layout: draw,
  };
}
