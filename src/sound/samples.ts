/** The raw material of every ambience: loops of noise and of small random clicks, computed once. Pure. */
import { seeded } from '../lib/random';
import type { NoiseColour } from './recipe';

/** Scale to a peak of `peak` and take out any offset, so a loop neither clips nor pushes the speaker one way. */
export function centred(samples: Float32Array, peak = 0.9): Float32Array {
  let mean = 0;
  for (const s of samples) mean += s;
  mean /= samples.length || 1;
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] -= mean;
    max = Math.max(max, Math.abs(samples[i]));
  }
  if (max > 0) for (let i = 0; i < samples.length; i++) samples[i] *= peak / max;
  return samples;
}

/**
 * Make a loop out of `length + fade` samples: the tail is blended into the head, so the loop point is silent.
 * Returns `length` samples.
 */
export function loopable(samples: Float32Array, fade: number): Float32Array {
  const length = samples.length - fade;
  const out = samples.slice(0, length);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    out[i] = samples[i] * Math.sqrt(t) + samples[length + i] * Math.sqrt(1 - t);
  }
  return out;
}

/** `length` samples of looping noise: white (flat), pink (softer highs) or brown (a low rumble). */
export function noiseSamples(colour: NoiseColour, length: number, seed: number): Float32Array {
  const rand = seeded(seed);
  const fade = Math.min(2048, length >> 2);
  const raw = new Float32Array(length + fade);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = rand() * 2 - 1;
    if (colour === 'white') raw[i] = white;
    else if (colour === 'pink') {
      /* Paul Kellet's economy filter */
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      raw[i] = b0 + b1 + b2 + white * 0.1848;
    } else {
      last = (last + 0.02 * white) / 1.02;
      raw[i] = last;
    }
  }
  return centred(loopable(raw, fade));
}

/** `length` samples of small random clicks, `density` a second on average, each a few milliseconds of fading noise. */
export function crackleSamples(length: number, rate: number, density: number, seed: number): Float32Array {
  const rand = seeded(seed);
  const out = new Float32Array(length);
  const clicks = Math.round((length / rate) * density);
  for (let c = 0; c < clicks; c++) {
    const start = Math.floor(rand() * length);
    const loud = rand() ** 2;
    const tau = (0.0004 + rand() * 0.003) * rate;
    const span = Math.min(length - start, Math.ceil(tau * 6));
    for (let j = 0; j < span; j++) out[start + j] += loud * (rand() * 2 - 1) * Math.exp(-j / tau);
  }
  return centred(out);
}

export interface Measure {
  /** root mean square: how loud it is on the whole */
  rms: number;
  /** the largest sample, either way: 1 would clip */
  peak: number;
  /** the mean: a healthy signal sits around zero */
  dc: number;
}

export function measure(samples: Float32Array): Measure {
  let sum = 0;
  let squares = 0;
  let peak = 0;
  for (const s of samples) {
    sum += s;
    squares += s * s;
    peak = Math.max(peak, Math.abs(s));
  }
  const n = samples.length || 1;
  return { rms: Math.sqrt(squares / n), peak, dc: sum / n };
}
