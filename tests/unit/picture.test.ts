import { describe, expect, it } from 'vitest';
import { lookOf } from '../../src/worlds/looks';
import { crowds, picturePoint, within } from '../../src/worlds/picture';

describe('where a point of the painting lands on screen', () => {
  it('lands on the object in the landscape painting: the cat asleep on the veranda in Kyoto at 1440x900', () => {
    /* 1440x900 is wider than 3:2: the painting is 1440x960, 30 px cut off at the top and the bottom */
    const at = picturePoint({ u: 0.75, v: 0.39 }, lookOf('kana-notebook'), { width: 1440, height: 900 }, false);

    expect(at?.x).toBeCloseTo(1080, 0);
    expect(at?.y).toBeCloseTo(0.39 * 960 - 30, 0);
  });

  it("follows the painting's own position across a window narrower than 3:2", () => {
    const point = { u: 0.5, v: 0.5 };
    const look = { ...lookOf('emberquill'), x: 0 };

    /* 1000x900: the painting is 1350 wide, held at its left edge */
    expect(picturePoint(point, look, { width: 1000, height: 900 }, false)).toEqual({ x: 675, y: 450 });
    /* held at its right edge, the middle moves left by the 350 px cut off */
    expect(picturePoint(point, { ...look, x: 100 }, { width: 1000, height: 900 }, false)).toEqual({ x: 325, y: 450 });
    /* off the left edge: not shown */
    expect(picturePoint({ ...point, u: 0.9 }, look, { width: 1000, height: 900 }, false)).toBeNull();
  });

  it('maps into the upright crop on a phone, and is cut off where the crop leaves the object out', () => {
    const phone = { width: 390, height: 844 };

    /* the party on the ledge, left of the middle of the cave mouth's upright crop */
    const party = picturePoint({ u: 0.4, v: 0.78 }, lookOf('emberquill'), phone, true);
    expect(party).not.toBeNull();
    expect(party?.y).toBeCloseTo(0.78 * 844, 0);
    expect(party?.x).toBeGreaterThan(0);
    expect(party?.x).toBeLessThan(phone.width / 2);
    /* the shoji at Kyoto's right edge is past the right edge of the upright crop */
    expect(picturePoint({ u: 0.95, v: 0.3 }, lookOf('kana-notebook'), phone, true)).toBeNull();
  });

  it('knows when something crowds the words or leaves the screen', () => {
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
});
