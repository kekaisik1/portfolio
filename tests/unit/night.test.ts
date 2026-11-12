import { describe, expect, it } from 'vitest';
import { MAX_OWN, parseStored, skyPlace } from '../../src/night/lantern-math';
import { ago, nowLine, weatherLine } from '../../src/night/today-text';

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
});

describe('lanterns', () => {
  it('reads your lanterns from storage, keeping only well-formed ones and the last five', () => {
    const l = (x: number): { x: number; y: number; s: number } => ({ x, y: 0.2, s: 0.5 });
    const many = JSON.stringify([l(0.1), l(0.2), l(0.3), l(0.4), l(0.5), l(0.6), { x: 'a' }, l(7)]);

    expect(parseStored(many)).toHaveLength(MAX_OWN);
    expect(parseStored(many)[0].x).toBe(0.2);
  });

  it('treats missing, broken or odd storage as no lanterns', () => {
    expect(parseStored(null)).toEqual([]);
    expect(parseStored('{not json')).toEqual([]);
    expect(parseStored('{"x":1}')).toEqual([]);
  });

  it('hangs lanterns in the upper half of the sky it is given, small and faint, never stacked on one spot', () => {
    for (let i = 0; i < 40; i++) {
      const p = skyPlace({ x: (i * 0.37) % 1, y: (i * 0.53) % 1, s: 0.5 }, i, 1400, 600);

      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1400);
      expect(p.y).toBeLessThanOrEqual(300);
      expect(p.scale).toBeLessThan(0.5);
      expect(p.alpha).toBeLessThan(0.9);
    }
    const same = { x: 0.5, y: 0.5, s: 0.5 };

    expect(skyPlace(same, 1, 1, 1)).not.toEqual(skyPlace(same, 2, 1, 1));
  });
});
