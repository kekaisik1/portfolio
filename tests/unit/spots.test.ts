import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { projectBySlug } from '../../src/content/projects';
import { renderProject } from '../../src/content/render';
import { lookOf } from '../../src/worlds/looks';
import { crowds, SPOTS, spotOf, spotPoint, within, type Spot } from '../../src/worlds/spots';

const KANA = WORLDS.findIndex((w) => w.id === 'kana-notebook');
const EMBER = WORLDS.findIndex((w) => w.id === 'emberquill');
const videos = { 'kana-notebook': { src: 'kana-notebook.mp4', seconds: 44 }, emberquill: { src: 'emberquill.mp4' } };

describe('the spots in the paintings', () => {
  it('stand only in worlds with a look, a label in the content and a video to open', () => {
    expect(Object.keys(SPOTS).sort()).toEqual(['emberquill', 'kana-notebook']);
    for (const [id, spot] of Object.entries(SPOTS)) {
      expect(() => lookOf(id), id).not.toThrow();
      expect(projectBySlug(id)?.spot, id).toMatch(/\S/);
      expect(spot.opens, id).toBe('video');
      expect(existsSync(`public/videos/${id}.mp4`), id).toBe(true);
      for (const n of [spot.u, spot.v]) {
        expect(n, id).toBeGreaterThan(0);
        expect(n, id).toBeLessThan(1);
      }
    }
    expect(spotOf('hello')).toBeNull();
  });

  it('lands on the object in the landscape painting: the lantern right of the Kyoto street at 1440x900', () => {
    /* 1440x900 is wider than 3:2: the painting is 1440x960, 30 px cut off at the top and the bottom */
    const at = spotPoint(SPOTS['kana-notebook'], lookOf('kana-notebook'), { width: 1440, height: 900 }, false);

    expect(at?.x).toBeCloseTo(1260, 0);
    expect(at?.y).toBeCloseTo(0.42 * 960 - 30, 0);
  });

  it("follows the painting's own position across a window narrower than 3:2", () => {
    const spot: Spot = { u: 0.5, v: 0.5, side: 'right', opens: 'video' };
    const look = { ...lookOf('emberquill'), x: 0 };

    /* 1000x900: the painting is 1350 wide, held at its left edge */
    expect(spotPoint(spot, look, { width: 1000, height: 900 }, false)).toEqual({ x: 675, y: 450 });
    /* held at its right edge, the middle moves left by the 350 px cut off */
    expect(spotPoint(spot, { ...look, x: 100 }, { width: 1000, height: 900 }, false)).toEqual({ x: 325, y: 450 });
    /* off the left edge: not shown */
    expect(spotPoint({ ...spot, u: 0.9 }, look, { width: 1000, height: 900 }, false)).toBeNull();
  });

  it('maps into the upright crop on a phone, and is cut off where the crop leaves the object out', () => {
    const phone = { width: 390, height: 844 };

    const die = spotPoint(SPOTS.emberquill, lookOf('emberquill'), phone, true);
    expect(die).not.toBeNull();
    expect(die?.y).toBeCloseTo(0.84 * 844, 0);
    expect(die?.x).toBeGreaterThan(0);
    expect(die?.x).toBeLessThan(phone.width / 2);
    /* the Kyoto lantern stands just past the right edge of the upright crop: the Watch button is the way in */
    expect(spotPoint(SPOTS['kana-notebook'], lookOf('kana-notebook'), phone, true)).toBeNull();
  });

  it('knows when a spot crowds the words or leaves the screen', () => {
    const words = { left: 50, top: 600, right: 500, bottom: 820 };

    expect(crowds({ left: 480, top: 700, right: 600, bottom: 744 }, words)).toBe(true);
    expect(crowds({ left: 510, top: 700, right: 600, bottom: 744 }, words)).toBe(false);
    expect(crowds({ left: 510, top: 700, right: 600, bottom: 744 }, words, 16)).toBe(true);
    expect(within({ left: 10, top: 10, right: 50, bottom: 54 }, { left: 0, top: 0, right: 390, bottom: 844 }, 8)).toBe(
      true,
    );
    expect(within({ left: 4, top: 10, right: 50, bottom: 54 }, { left: 0, top: 0, right: 390, bottom: 844 }, 8)).toBe(
      false,
    );
  });

  it('renders as a real button that opens the video, named like the Watch button, hidden until it is placed', () => {
    const html = renderProject(WORLDS[KANA], KANA, videos);

    expect(html).toContain(
      '<button class="spot left" type="button" data-video="kana-notebook" aria-haspopup="dialog" ' +
        'aria-label="Watch the Kana Notebook video, 0:44" hidden>',
    );
    expect(html).toContain(
      '<span class="spot-l" aria-hidden="true">watch the app <span class="len">0:44</span></span>',
    );
    /* the Watch button stays in the words, for where the spot cannot be shown */
    expect(html).toContain('class="btn watch"');
    expect(renderProject(WORLDS[EMBER], EMBER, videos)).toContain('aria-label="Watch the Emberquill video,"');
    /* no video, no spot */
    expect(renderProject(WORLDS[KANA], KANA, {})).not.toContain('class="spot');
  });
});
