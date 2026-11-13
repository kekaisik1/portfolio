import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import {
  FADE_S,
  MASTER_GAIN,
  RECIPES,
  chance,
  eventTime,
  eventsBetween,
  recipeOf,
  swellGains,
  type EventLayer,
} from '../../src/sound/recipe';
import { centred, crackleSamples, loopable, measure, noiseSamples } from '../../src/sound/samples';
import { MOTION_KEY, SOUND_KEY, motionAtStart, parsePref, soundAtStart } from '../../src/switches/prefs';

const IDS = WORLDS.map((w) => w.id);
const RING: EventLayer = { kind: 'event', voice: 'ring', every: 20, jitter: 3, first: 5, gain: 0.05 };

describe('what each place sounds like', () => {
  it('has a recipe for every world and none left over', () => {
    expect(Object.keys(RECIPES).sort()).toEqual([...IDS].sort());
    expect(() => recipeOf('nowhere')).toThrow(/No sound/);
  });

  it('gives every place something that sounds all the time, and keeps every ingredient in range', () => {
    for (const id of IDS) {
      const recipe = recipeOf(id);

      expect(
        recipe.some((l) => l.kind === 'noise' || l.kind === 'crackle'),
        id,
      ).toBe(true);
      for (const layer of recipe) {
        expect(layer.gain, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeLessThanOrEqual(1);
        if (layer.kind === 'noise' || layer.kind === 'tone' || layer.kind === 'crackle') {
          expect(layer.freq, id).toBeGreaterThanOrEqual(30);
          expect(layer.freq, id).toBeLessThanOrEqual(9000);
        }
        if ((layer.kind === 'noise' || layer.kind === 'tone') && layer.swell) {
          expect(layer.swell.depth, id).toBeGreaterThan(0);
          expect(layer.swell.depth, id).toBeLessThanOrEqual(1);
          /* a swell is slow: nothing here pumps */
          expect(layer.swell.rate, id).toBeLessThan(1);
        }
        if (layer.kind === 'event') {
          expect(layer.every, id).toBeGreaterThan(layer.jitter);
          expect(layer.first, id).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('puts the ingredients of the brief in the right places', () => {
    const voices = (id: string): string[] =>
      recipeOf(id).flatMap((l) => (l.kind === 'event' ? [l.voice] : l.kind === 'crackle' ? ['crackle'] : []));

    expect(voices('front-desk')).toEqual(['ring']);
    expect(voices('lowl')).toEqual(['bird']);
    expect(voices('emberquill')).toEqual(['crackle', 'drip']);
    expect(voices('history-lens').sort()).toEqual(['bell', 'drip']);
    expect(voices('bookforge')).toEqual(['crackle', 'bird']);
    expect(voices('kana-notebook').sort()).toEqual(['bell', 'drip']);
    expect(voices('contact')).toEqual(['crackle']);
    expect(recipeOf('numbers-room').some((l) => l.kind === 'tone' && l.freq < 80)).toBe(true);
    const ring = recipeOf('front-desk').find((l) => l.kind === 'event');
    expect(ring?.kind === 'event' && ring.every).toBe(20);
  });

  it('is ambience: a low master gain and a short crossfade', () => {
    expect(MASTER_GAIN).toBeGreaterThan(0);
    expect(MASTER_GAIN).toBeLessThanOrEqual(0.4);
    expect(FADE_S).toBeCloseTo(0.4, 6);
  });
});

describe('things that happen now and then', () => {
  it('come round about every `every` seconds, never earlier than the jitter allows', () => {
    for (let k = 0; k < 50; k++) {
      const t = eventTime(RING, k, 9);

      expect(Math.abs(t - (5 + k * 20))).toBeLessThanOrEqual(3);
    }
  });

  it('are the same for the same seed and different for another', () => {
    expect(eventTime(RING, 4, 9)).toBe(eventTime(RING, 4, 9));
    expect(eventTime(RING, 4, 9)).not.toBe(eventTime(RING, 4, 10));
    expect(chance(1, 2)).toBeGreaterThanOrEqual(0);
    expect(chance(1, 2)).toBeLessThan(1);
  });

  it('are each scheduled exactly once, however the time is cut into windows', () => {
    const whole = eventsBetween(RING, 0, 300, 9).map((e) => e.k);
    const pieces: number[] = [];
    for (let from = 0; from < 300; from += 0.7)
      pieces.push(...eventsBetween(RING, from, from + 0.7, 9).map((e) => e.k));

    expect(whole).toHaveLength(15);
    expect(pieces.sort((a, b) => a - b)).toEqual(whole);
  });

  it('never fall outside the window asked for', () => {
    for (const { at } of eventsBetween(RING, 40, 90, 3)) {
      expect(at).toBeGreaterThanOrEqual(40);
      expect(at).toBeLessThan(90);
    }
  });
});

describe('a swell', () => {
  it('moves a layer between its gain and a share of it', () => {
    const { base, swing } = swellGains(0.8, { rate: 0.1, depth: 0.75 });

    expect(base + swing).toBeCloseTo(0.8, 9);
    expect(base - swing).toBeCloseTo(0.2, 9);
    expect(swellGains(0.5, undefined)).toEqual({ base: 0.5, swing: 0 });
  });
});

describe('the raw loops', () => {
  const RATE = 8000;

  it('are centred on zero and never clip, in every colour', () => {
    for (const colour of ['white', 'pink', 'brown'] as const) {
      const m = measure(noiseSamples(colour, RATE * 2, 5));

      expect(Math.abs(m.dc), colour).toBeLessThan(1e-4);
      expect(m.peak, colour).toBeLessThanOrEqual(0.9001);
      expect(m.rms, colour).toBeGreaterThan(0.05);
    }
  });

  it('get darker from white to pink to brown', () => {
    /* how much a sample differs from the next: high for hiss, low for rumble */
    const rough = (s: Float32Array): number => {
      let d = 0;
      for (let i = 1; i < s.length; i++) d += Math.abs(s[i] - s[i - 1]);
      return d / s.length / measure(s).rms;
    };

    const [white, pink, brown] = (['white', 'pink', 'brown'] as const).map((c) => rough(noiseSamples(c, RATE * 2, 5)));
    expect(white).toBeGreaterThan(pink);
    expect(pink).toBeGreaterThan(brown);
  });

  it('loop without a click: the end runs on into the beginning', () => {
    const ramp = Float32Array.from({ length: 1200 }, (_, i) => i / 1200);

    const loop = loopable(ramp, 200);

    expect(loop).toHaveLength(1000);
    /* the sample after the last one is the first: it must be close to where the ramp was heading */
    expect(Math.abs(loop[0] - 1000 / 1200)).toBeLessThan(0.01);
    expect(loop[500]).toBeCloseTo(500 / 1200, 6);
  });

  it('are the same every time for the same seed', () => {
    expect(noiseSamples('pink', 4000, 3)).toEqual(noiseSamples('pink', 4000, 3));
    expect(noiseSamples('pink', 4000, 3)).not.toEqual(noiseSamples('pink', 4000, 4));
  });

  it('make crackle out of sparse clicks: mostly silence, denser when asked', () => {
    const quietShare = (s: Float32Array): number => s.filter((x) => Math.abs(x) < 0.01).length / s.length;

    const sparse = crackleSamples(RATE * 4, RATE, 6, 1);
    const dense = crackleSamples(RATE * 4, RATE, 60, 1);

    expect(quietShare(sparse)).toBeGreaterThan(0.8);
    expect(quietShare(dense)).toBeLessThan(quietShare(sparse));
    expect(measure(sparse).peak).toBeLessThanOrEqual(0.9001);
    expect(Math.abs(measure(dense).dc)).toBeLessThan(1e-4);
  });

  it('measures loudness, peak and offset', () => {
    const m = measure(Float32Array.from([0.5, -0.5, 0.5, -0.5]));

    expect(m.rms).toBeCloseTo(0.5, 9);
    expect(m.peak).toBe(0.5);
    expect(m.dc).toBe(0);
    expect(measure(centred(Float32Array.from([1, 3]), 0.5)).peak).toBeCloseTo(0.5, 6);
  });
});

describe('the choices the corner switches keep', () => {
  it('reads only its own two words', () => {
    expect(parsePref('on')).toBe(true);
    expect(parsePref('off')).toBe(false);
    expect(parsePref(null)).toBeNull();
    expect(parsePref('true')).toBeNull();
    expect(MOTION_KEY).not.toBe(SOUND_KEY);
  });

  it('starts motion on, unless the visitor asks for less motion or chose otherwise', () => {
    expect(motionAtStart(null, false)).toBe(true);
    expect(motionAtStart(null, true)).toBe(false);
    expect(motionAtStart(true, true)).toBe(true);
    expect(motionAtStart(false, false)).toBe(false);
  });

  it('starts sound off, unless it was left on', () => {
    expect(soundAtStart(null)).toBe(false);
    expect(soundAtStart(true)).toBe(true);
    expect(soundAtStart(false)).toBe(false);
  });
});
