import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { renderWorlds } from '../../src/content/render';
import { lookOf } from '../../src/worlds/looks';
import { MAX_BURST, MIN_HIT_PX, REACTIONS, reactionOf, reactionRect, type Reaction } from '../../src/worlds/reactions';
import { toysOf } from '../../src/worlds/toys';

const inPicture = (n: number): boolean => n > 0 && n < 1;

describe('the painting reacts', () => {
  it('in every place that is not a project, with a name a screen reader can say; every project is a toy instead', () => {
    const others = WORLDS.filter((w) => w.kind !== 'project');
    expect(Object.keys(REACTIONS).sort()).toEqual(others.map((w) => w.id).sort());
    for (const w of others) expect(w.react?.trim(), w.id).toMatch(/\S/);
    for (const w of WORLDS.filter((x) => x.kind === 'project')) {
      expect(w.react, w.id).toBeUndefined();
      expect(toysOf(w.id).length, w.id).toBeGreaterThan(0);
    }
    expect(reactionOf('nowhere')).toBeNull();
  });

  it('is built only from the plain effects, and stays small', () => {
    for (const [id, r] of Object.entries(REACTIONS)) {
      expect(r.flare ?? r.burst, `${id} does nothing`).toBeDefined();
      for (const n of [r.u, r.v]) expect(inPicture(n), id).toBe(true);
      expect(r.w * r.h, `${id}: the place to press is the object, not half the painting`).toBeLessThan(0.05);
      if (r.burst) {
        expect(r.burst.count, id).toBeLessThanOrEqual(MAX_BURST);
        expect(r.burst.at.every(inPicture), id).toBe(true);
      }
      if (r.flare) {
        expect(r.flare.size, id).toBeLessThanOrEqual(0.5);
        expect(r.flare.rgb, id).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
      }
    }
  });

  it('is pressed over the whole object, and never on less than 44 px', () => {
    const r: Reaction = { u: 0.5, v: 0.5, w: 0.1, h: 0.01 };
    const rect = reactionRect(r, lookOf('hello'), { width: 1440, height: 900 }, false);

    /* the painting is 1440x960 here, 30 px cut off at the top */
    expect(rect).not.toBeNull();
    if (!rect) return;
    expect(rect.right - rect.left).toBeCloseTo(96, 0);
    expect(rect.bottom - rect.top).toBe(MIN_HIT_PX);
    expect((rect.top + rect.bottom) / 2).toBeCloseTo(450, 0);
  });

  it('is cut back to the screen where the object runs off its edge, and left out when too little is left', () => {
    const edge: Reaction = { u: 0.98, v: 0.5, w: 0.2, h: 0.1 };
    const rect = reactionRect(edge, lookOf('hello'), { width: 1440, height: 900 }, false, 16);

    expect(rect?.right).toBe(1424);
    expect(rect && rect.right - rect.left).toBeGreaterThanOrEqual(MIN_HIT_PX);
    expect(
      reactionRect({ ...edge, u: 0.995, w: 0.01 }, lookOf('hello'), { width: 1440, height: 900 }, false, 16),
    ).toBeNull();
  });

  it('is left out where the object is cut off: the pen is outside the upright crop', () => {
    const pen: Reaction = { u: 0.95, v: 0.3, w: 0.05, h: 0.05 };

    expect(reactionRect(pen, lookOf('bookforge'), { width: 390, height: 844 }, true)).toBeNull();
    expect(reactionRect(pen, lookOf('bookforge'), { width: 1440, height: 900 }, false)).not.toBeNull();
  });

  it('renders as a real button with its name, hidden until it is placed, in every world that is not a toy', () => {
    const html = renderWorlds();

    /* the project places are toys (tests/unit/toys.test.ts): their things to press take the place of the one reaction */
    expect(html.match(/<button class="react" type="button" aria-label="[^"]+" hidden><\/button>/g)).toHaveLength(3);
    expect(html).toContain(
      '<div class="presses"><button class="react" type="button" aria-label="Poke the fire" hidden>',
    );
  });
});
