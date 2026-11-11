import { describe, expect, it } from 'vitest';
import { clamp, mulberry32, smooth } from '../../src/lib/math';
import { PHONE_MIN_CORE_SHARE, phoneScale } from '../../src/places/size';
import { dens, soft } from '../../src/world/draw/pencil';
import { css, hex, mix, stop, wt } from '../../src/world/palette';
import { ago, forcedWeather, nowLine, weatherLine } from '../../src/world/today-text';
import {
  duskAt,
  layerToTrack,
  nearestStop,
  placeCoord,
  trackAtScroll,
  trackToLayer,
  zoneIndex,
} from '../../src/world/zones';

describe('progress along the journey', () => {
  const B = [0, 1000, 2000, 3000];
  const T = 400;

  it('is 0 in the mountains and 3 well into the night', () => {
    expect(placeCoord(0, B, T)).toBe(0);
    expect(placeCoord(5000, B, T)).toBe(3);
  });

  it('is halfway between two countries exactly at the border', () => {
    expect(placeCoord(1000, B, T)).toBeCloseTo(0.5, 6);
    expect(placeCoord(2000, B, T)).toBeCloseTo(1.5, 6);
  });

  it('only changes inside the blend around a border', () => {
    expect(placeCoord(799, B, T)).toBe(0);
    expect(placeCoord(1201, B, T)).toBe(1);
  });

  it('never goes backwards as you travel', () => {
    let last = -1;
    for (let t = -200; t < 4000; t += 37) {
      const P = placeCoord(t, B, T);
      expect(P).toBeGreaterThanOrEqual(last);
      last = P;
    }
  });

  it('names the zone a place coordinate belongs to', () => {
    expect([0.2, 0.6, 1.49, 2.5, 9].map(zoneIndex)).toEqual([0, 1, 1, 3, 3]);
  });
});

describe('narrow layout: page scroll to track position', () => {
  const knots = [
    [0, 0],
    [1000, 500],
    [1500, 2500],
    [4000, 3000],
  ];

  it('clamps before the first knot and after the last', () => {
    expect(trackAtScroll(-50, knots)).toBe(0);
    expect(trackAtScroll(9999, knots)).toBe(3000);
  });

  it('interpolates linearly between knots', () => {
    expect(trackAtScroll(500, knots)).toBe(250);
    expect(trackAtScroll(1250, knots)).toBe(1500);
  });
});

describe('time of day', () => {
  const dusk = { w0: 1000, w1: 2000, i0: 2000, i1: 3000, deep: 500 };
  const at = (v: number): { w: number; ind: number; deep: number } => duskAt(v, dusk, { w: 0, ind: 0, deep: 0 });

  it('is full day before the sun starts down', () => {
    expect(at(500)).toEqual({ w: 0, ind: 0, deep: 0 });
  });

  it('warms the sky first, then brings the night down, then deepens it', () => {
    expect(at(1500)).toEqual({ w: 0.5, ind: 0, deep: 0 });
    expect(at(2500)).toEqual({ w: 1, ind: 0.5, deep: 0 });
    expect(at(3250)).toEqual({ w: 1, ind: 1, deep: 0.5 });
  });

  it('is full night past the end', () => {
    expect(at(99999)).toEqual({ w: 1, ind: 1, deep: 1 });
  });

  it('writes into the object it is given, so frames allocate nothing', () => {
    const out = { w: 0, ind: 0, deep: 0 };

    expect(duskAt(2500, dusk, out)).toBe(out);
  });
});

describe('stops and parallax', () => {
  it('finds the nearest stop', () => {
    const stops = [0, 800, 2000, 5000];

    expect(nearestStop(stops, 300)).toBe(0);
    expect(nearestStop(stops, 1500)).toBe(2);
    expect(nearestStop(stops, 99999)).toBe(3);
  });

  it('converts between track and layer coordinates and back', () => {
    const u = trackToLayer(3000, 0.5, 1440);

    expect(u).toBe(1860);
    expect(layerToTrack(u, 0.5, 1440)).toBe(3000);
    expect(trackToLayer(720, 0.2, 1440)).toBe(720);
  });
});

describe('colour along the journey', () => {
  const stops = ['#000000', '#646464', '#C8C8C8', '#FFFFFF'].map(hex);

  it('blends between stops and clamps outside them', () => {
    expect(css(stop(stops, 0.5))).toBe('rgba(50,50,50,1)');
    expect(css(stop(stops, -3))).toBe('rgba(0,0,0,1)');
    expect(css(stop(stops, 7), 0.5)).toBe('rgba(255,255,255,0.5)');
  });

  it('weights a country fully in its middle and not at all a country away', () => {
    expect(wt(1, 1)).toBe(1);
    expect(wt(1.25, 1)).toBe(0.75);
    expect(wt(2.4, 1)).toBe(0);
  });

  it('mixes two colours', () => {
    expect(mix([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });
});

describe('pencil helpers', () => {
  it('draws the same line on every visit from the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);

    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('eases with smoothstep and clamps', () => {
    expect([smooth(-1), smooth(0.5), smooth(2)]).toEqual([0, 0.5, 1]);
    expect(clamp(5, 0, 3)).toBe(3);
  });

  it('adds points along a line so it can wobble', () => {
    expect(dens([0, 0, 10, 0], 5)).toEqual([0, 0, 5, 0, 10, 0]);
  });

  it('takes the corners off a closed shape but leaves lines and tiny radii alone', () => {
    const square = [0, 0, 10, 0, 10, 10, 0, 10];

    expect(soft(square, 2)).toHaveLength(24);
    expect(soft(square, 0)).toBe(square);
    expect(soft([0, 0, 10, 0], 2)).toEqual([0, 0, 10, 0]);
  });
});

describe('how big a place stands on a phone', () => {
  it('stands between a third and just over half the screen tall on a 390 x 844 phone', () => {
    for (const [coreW, hitH] of [
      [558, 398],
      [606, 428],
      [624, 378],
      [576, 330],
    ]) {
      const share = (phoneScale(390, 844, coreW, hitH) * hitH) / 844;

      expect(share, `core ${coreW}, height ${hitH}`).toBeGreaterThanOrEqual(0.36);
      expect(share).toBeLessThanOrEqual(0.55);
    }
  });

  it('never shrinks below fitting the middle of the scene to the width', () => {
    expect(phoneScale(576, 390, 558, 398)).toBeCloseTo(576 / 558, 6);
  });

  it('never crops the middle of the scene past its limit', () => {
    expect(phoneScale(320, 2000, 600, 300)).toBeCloseTo(320 / 600 / PHONE_MIN_CORE_SHARE, 6);
  });
});

describe('the two lines from the API', () => {
  const now = Date.parse('2026-11-11T12:00:00Z');

  it('says how long ago in plain words', () => {
    expect(ago('2026-11-11T11:30:00Z', now)).toBe('just now');
    expect(ago('2026-11-11T07:00:00Z', now)).toBe('5 hours ago');
    expect(ago('2026-11-10T08:00:00Z', now)).toBe('yesterday');
    expect(ago('2026-11-06T12:00:00Z', now)).toBe('5 days ago');
  });

  it('says nothing for a time in the future, unreadable, or older than two weeks', () => {
    expect(ago('2026-11-12T12:00:00Z', now)).toBeNull();
    expect(ago('not a date', now)).toBeNull();
    expect(ago('2026-10-01T12:00:00Z', now)).toBeNull();
    expect(nowLine({ label: 'Emberquill', at: '2026-10-01T12:00:00Z' }, now)).toBeNull();
  });

  it('writes the weather line with a real minus sign', () => {
    expect(weatherLine({ place: 'Astana', temp: -11.6, kind: 'snow' })).toBe('−12° and snowing in Astana right now.');
    expect(weatherLine({ place: 'Astana', temp: 3.2, kind: 'cloud' })).toBe('3° and grey in Astana right now.');
  });

  it('writes the last-seen line', () => {
    expect(nowLine({ label: 'Emberquill', at: '2026-11-10T08:00:00Z' }, now)).toBe(
      'last seen working on Emberquill, yesterday.',
    );
  });

  it('reads a forced weather from the address', () => {
    expect(forcedWeather('?weather=snow')).toBe('snow');
    expect(forcedWeather('?a=1&weather=rain')).toBe('rain');
    expect(forcedWeather('?weather=hail')).toBe('');
    expect(forcedWeather('')).toBe('');
  });
});
