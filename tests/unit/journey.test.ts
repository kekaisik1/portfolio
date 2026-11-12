import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../../src/content/projects';
import {
  BAND,
  bandFade,
  camX,
  newBox,
  nightAt,
  placementOf,
  presence,
  project,
  viewOf,
  type Box,
  isNarrow,
} from '../../src/journey/camera';
import { OG, coverage, planLabel, type Obstacle } from '../../src/journey/labels';
import {
  LV,
  horizonDot,
  invertedAt,
  labelAlpha,
  labelSpan,
  levelOf,
  thresholdOf,
  wordAlpha,
  WORDLESS_OK,
} from '../../src/journey/timing';
import { sizeOf } from '../../src/paint/kinds';
import { CUTS, cutOfSlug, type CutDef } from '../../src/scene/objects';
import { COUNTRY_START, LAST, N, STEP, STOPS, atScroll, countryAt, scrollOf, stopOfSlug } from '../../src/scene/stops';

const DESKTOP = viewOf(1440, 900);
const PHONE = viewOf(390, 844);

function boxAt(c: CutDef, s: number, v = DESKTOP): Box | null {
  const b = newBox();
  return project(c, placementOf(c, v.phone, { x: 0, y: 0, h: 0 }), sizeOf(c.k), s, 0, v, b) ? b : null;
}

describe('the stops of the walk', () => {
  it('greets, walks past the seven places in order, then about and contact', () => {
    expect(N).toBe(10);
    expect(STOPS[0].kind).toBe('hello');
    expect(STOPS.slice(1, 8).map((s) => s.slug)).toEqual(PROJECTS.map((p) => p.slug));
    expect(STOPS.slice(8).map((s) => s.id)).toEqual(['about', 'contact']);
  });

  it('starts each country at its first stop', () => {
    expect(COUNTRY_START).toEqual({ mountains: 0, steppe: 3, sea: 5, night: 8 });
    expect([0, 2.4, 3.6, 7.49, 7.5, 9].map(countryAt)).toEqual([
      'mountains',
      'mountains',
      'steppe',
      'sea',
      'night',
      'night',
    ]);
  });

  it('turns scroll into a place on the walk and back, clamped at both ends', () => {
    expect(scrollOf(3)).toBe(3 * STEP);
    expect(atScroll(scrollOf(5))).toBe(5);
    expect(atScroll(-100)).toBe(0);
    expect(atScroll(1e6)).toBe(LAST);
  });
});

describe('the camera', () => {
  it('puts a piece at its own placement when you stand at its stop', () => {
    const hut = cutOfSlug('front-desk');
    expect(hut).toBeDefined();
    if (!hut) return;
    const b = boxAt(hut, hut.stop);
    expect(b).not.toBeNull();
    if (!b) return;

    expect(b.sx).toBeCloseTo(DESKTOP.R.x + hut.x * DESKTOP.R.w, 6);
    expect(b.sy).toBeCloseTo(DESKTOP.R.y + hut.y * DESKTOP.R.h, 6);
    expect(b.h).toBeCloseTo(hut.h * DESKTOP.R.h, 6);
  });

  it('grows near pieces fast as you walk past and far ones slowly', () => {
    const near = CUTS.find((c) => c.k === 'hut'),
      far = CUTS.find((c) => c.k === 'peaks');
    if (!near || !far) throw new Error('missing pieces');
    const grow = (c: CutDef): number => (boxAt(c, c.stop + 0.4)?.k ?? 0) / (boxAt(c, c.stop)?.k ?? 1);

    expect(grow(near)).toBeGreaterThan(1.3);
    expect(grow(far)).toBeLessThan(1.1);
  });

  it('drops a piece once the camera has walked through it', () => {
    const rock = CUTS.find((c) => c.k === 'rock');
    if (!rock) throw new Error('no rock');

    expect(boxAt(rock, rock.stop + rock.z0)).toBeNull();
  });

  it('drifts sideways a little, never more than 5% of the scene', () => {
    for (let s = 0; s <= LAST; s += 0.25) expect(Math.abs(camX(s))).toBeLessThanOrEqual(0.045);
  });

  it('soaks a piece in before its stretch and dries it away after', () => {
    const hut = cutOfSlug('lowl');
    if (!hut) throw new Error('no shed');

    expect(presence(hut, hut.from - 0.6)).toBe(0);
    expect(presence(hut, (hut.from + hut.to) / 2)).toBe(1);
    expect(presence(hut, hut.to + 0.6)).toBe(0);
  });

  it('only shows the night pieces once the night has come', () => {
    const moon = CUTS.find((c) => c.k === 'moon');
    if (!moon) throw new Error('no moon');

    expect(nightAt(5)).toBe(0);
    expect(nightAt(8)).toBe(1);
    expect(presence(moon, 7.3)).toBe(0);
    expect(presence(moon, 8)).toBe(1);
  });

  it('dries near pieces away as they slide into the horizon band, but not framing pieces at rest', () => {
    const H = 900;

    expect(bandFade(500, 500, H)).toBe(1);
    expect(bandFade(H - BAND + 60, 500, H)).toBe(0);
    /* a spruce resting low on the screen is fine where it rests */
    expect(bandFade(H - 40, H - 40, H)).toBe(1);
  });

  it('keeps the place objects clear of the horizon band at their stops, on every screen', () => {
    for (const v of [DESKTOP, viewOf(1024, 768), viewOf(768, 1024), PHONE, viewOf(320, 640)])
      for (const c of CUTS.filter((x) => x.slug)) {
        const b = boxAt(c, c.stop, v);
        expect(b, c.k).not.toBeNull();
        if (b) expect(b.sy, `${c.k} at ${v.W}x${v.H}`).toBeLessThan(v.H - BAND);
      }
  });

  it('lays phones out with the scene under the words', () => {
    expect(PHONE.phone).toBe(true);
    expect(DESKTOP.phone).toBe(false);
    expect(PHONE.R.y).toBeGreaterThan(PHONE.H * 0.2);
    expect(DESKTOP.R.x).toBeGreaterThan(DESKTOP.W * 0.3);
  });
});

describe('words along the walk', () => {
  it("shows a stop's words fully at the stop and not at all a stop away", () => {
    expect(wordAlpha(3, 3)).toBe(1);
    expect(wordAlpha(3, 4)).toBe(0);
    expect(wordAlpha(3, 2)).toBe(0);
  });

  it('is never wordless, except a moment while the dusk passes and between the two night stops', () => {
    for (let s = 0; s <= LAST; s += 0.01) {
      if (WORDLESS_OK.some(([a, b]) => s > a && s < b)) continue;
      let most = 0;
      for (let i = 0; i < N; i++) most = Math.max(most, wordAlpha(i, s));
      expect(most, `at ${s.toFixed(2)}`).toBeGreaterThan(0.3);
    }
    /* and those moments are short: under a third of a stop each (the dusk itself is what that frame shows) */
    for (const [a, b] of WORDLESS_OK) expect(b - a).toBeLessThan(0.3);
  });

  it('never has two stops at full strength: neighbours together never pass a whole', () => {
    for (let s = 0; s <= LAST; s += 0.01)
      for (let i = 0; i < N - 1; i++) expect(wordAlpha(i, s) + wordAlpha(i + 1, s)).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('gives neighbours opposite halves of the dissolve, so their blotches interlock', () => {
    for (let i = 0; i < N - 1; i++) expect(invertedAt(i)).not.toBe(invertedAt(i + 1));
  });

  it('keeps the night words off the dusk: about only arrives once the night is half up', () => {
    const about = stopOfSlug('kana-notebook') + 1;
    for (let s = about - 1; s < about; s += 0.01) if (wordAlpha(about, s) > 0) expect(nightAt(s)).toBeGreaterThan(0.45);
  });

  it('never lets about and contact share their column', () => {
    const about = stopOfSlug('kana-notebook') + 1;
    for (let s = about; s <= about + 1; s += 0.01)
      expect(Math.min(wordAlpha(about, s), wordAlpha(about + 1, s)), `at ${s.toFixed(2)}`).toBe(0);
  });
});

describe('labels and dissolves', () => {
  it('speaks for the first place on the greeting too, and for every other place only at its stop', () => {
    expect(labelSpan('front-desk')).toEqual([0, 1]);
    expect(labelSpan('lowl')).toEqual([3, 3]);
    expect(labelAlpha([0, 1], 0.5)).toBe(1);
    expect(labelAlpha([3, 3], 4)).toBe(0);
  });

  it('dissolves in LV steps, and with reduced motion is either there or not', () => {
    expect(levelOf(0, false)).toBe(0);
    expect(levelOf(0.5, false)).toBe(LV / 2);
    expect(levelOf(2, false)).toBe(LV);
    expect([0.2, 0.49, 0.51, 1].map((a) => levelOf(a, true))).toEqual([0, 0, LV, LV]);
  });

  it('starts and ends each dissolve a little past the field, so the first and last steps are clean', () => {
    expect(thresholdOf(0)).toBeLessThan(0);
    expect(thresholdOf(LV)).toBeGreaterThan(1);
  });

  it('walks the horizon dot along the country words', () => {
    const hx = [10, 110, 210, 310],
      starts = [0, 3, 5, 8];

    expect(horizonDot(0, hx, starts)).toBe(10);
    expect(horizonDot(1.5, hx, starts)).toBe(60);
    expect(horizonDot(3, hx, starts)).toBe(110);
    expect(horizonDot(8, hx, starts)).toBe(310);
    expect(horizonDot(9, hx, starts)).toBe(324);
  });
});

describe('which screens get the narrow layout', () => {
  it('is phones, and tablets held upright', () => {
    expect([isNarrow(320, 640), isNarrow(390, 844), isNarrow(768, 1024), isNarrow(820, 1180)]).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  it('is not laptops, landscape tablets or a big upright monitor', () => {
    expect([isNarrow(1440, 900), isNarrow(1024, 768), isNarrow(1180, 820), isNarrow(1200, 1920)]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('label placement', () => {
  const full = (): Uint8Array => new Uint8Array(OG * OG).fill(1);
  const box = (left: number, top: number, w: number, h: number): Box => ({ left, top, w, h, sx: 0, sy: 0, k: 1, z: 1 });
  const space = {
    W: 1440,
    H: 900,
    top: 56,
    bottom: 824,
    edge: 4,
    words: { left: 100, top: 300, right: 460, bottom: 560 },
  };

  it('counts the painted area a rectangle covers', () => {
    const o: Obstacle = { box: box(0, 0, 400, 400), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 1 };

    expect(coverage(o, [0, 0, 100, 100])).toBeCloseTo(110 * 110, -2);
    expect(coverage(o, [500, 500, 600, 600])).toBe(0);
  });

  it('puts the label beside its object on clear paper, not over the words or off screen', () => {
    const self: Obstacle = { box: box(800, 300, 300, 300), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 3 };
    const spot = planLabel(self, [], 200, 60, space);
    expect(spot).not.toBeNull();
    if (!spot) return;
    const x = 800 + spot.fx * 300,
      y = 300 + spot.fy * 300;

    /* beside, not on top of the object */
    expect(x + 200 <= 800 || x >= 1100 || y + 60 <= 300 || y >= 600).toBe(true);
    expect(x).toBeGreaterThan(0);
    expect(x + 200).toBeLessThan(1440);
    expect(y + 60).toBeLessThan(824);
  });

  it('avoids another painted piece when there is room elsewhere', () => {
    const self: Obstacle = { box: box(800, 300, 300, 300), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 3 };
    const right: Obstacle = { box: box(1100, 200, 340, 500), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 1.4 };
    const spot = planLabel(self, [right], 200, 60, space);
    expect(spot).not.toBeNull();
    if (!spot) return;

    expect(800 + spot.fx * 300).toBeLessThan(1100);
  });

  it('steps off a small figure even when that means standing a little further away', () => {
    /* a small figure (60 x 120) right of the object, where the nearest spot would be */
    const self: Obstacle = { box: box(800, 300, 300, 300), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 3 };
    const figure: Obstacle = { box: box(1106, 290, 60, 120), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 3 };
    const spot = planLabel(self, [figure], 200, 60, space);
    expect(spot).not.toBeNull();
    if (!spot) return;
    const r: [number, number, number, number] = [
      800 + spot.fx * 300 - 4,
      300 + spot.fy * 300 - 4,
      800 + spot.fx * 300 + 204,
      300 + spot.fy * 300 + 64,
    ];

    expect(coverage(figure, r)).toBe(0);
  });

  it('gives up rather than place a label where it cannot be read', () => {
    const self: Obstacle = { box: box(0, 0, 1440, 900), occ: { grid: full(), bb: [0, 0, 1, 1] }, weight: 3 };

    expect(planLabel(self, [], 200, 60, { ...space, words: { left: 0, top: 0, right: 1440, bottom: 900 } })).toBeNull();
  });
});

describe('reduced motion: each stop is a still composition', () => {
  /** the middle of a painting: where its subject is (pieces have air around them in their boxes) */
  const core = (b: Box): [number, number, number, number] => [
    b.left + b.w * 0.25,
    b.top + b.h * 0.3,
    b.left + b.w * 0.75,
    b.top + b.h * 0.9,
  ];
  const overlap = (a: number[], b: number[]): number =>
    Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

  it('shows a place object only beside, never on top of, the other near pieces at its stop', () => {
    for (const v of [DESKTOP, PHONE])
      for (let i = 0; i <= LAST; i++) {
        const shown = CUTS.filter((c) => !c.far && levelOf(presence(c, i), true) === LV);
        for (const c of shown.filter((x) => x.slug)) {
          const a = boxAt(c, i, v);
          if (!a) continue;
          const ca = core(a),
            area = (ca[2] - ca[0]) * (ca[3] - ca[1]);
          for (const o of shown) {
            if (o === c) continue;
            const b = boxAt(o, i, v);
            if (b)
              expect.soft(overlap(ca, core(b)) / area, `${c.k} and ${o.k} at stop ${i}, ${v.W}px`).toBeLessThan(0.2);
          }
        }
      }
  });

  it('shows exactly one place label per place stop', () => {
    for (let i = 1; i <= 7; i++) {
      const speaking = PROJECTS.filter((p) => labelAlpha(labelSpan(p.slug), i) > 0.5);
      expect(speaking.map((p) => p.slug)).toEqual([STOPS[i].slug]);
    }
  });
});
