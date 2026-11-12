import { readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_PARTICLES } from '../../src/ambient/spec';
import { WORLDS } from '../../src/content/places';
import { renderFirstFrame } from '../../src/content/render';
import { NARROW_QUERY, TALL_QUERY } from '../../src/lib/queries';
import { coverFit, placeX, placeY, tallCropX, tallU, TALL_SIZE, WIDE_SIZE } from '../../src/worlds/cover';
import { LOOKS, lookOf, photoUrl } from '../../src/worlds/looks';
import placeholders from '../../src/worlds/placeholders.json';
import { CUT_MS, SLAT_COUNT, SLAT_MS, slatPlan } from '../../src/worlds/slats';
import { SOURCES, tallCrop } from '../../scripts/make-worlds';

const IDS = WORLDS.map((w) => w.id);

describe('how each world looks', () => {
  it('has a look for every world and none left over', () => {
    expect(Object.keys(LOOKS).sort()).toEqual([...IDS].sort());
    expect(() => lookOf('nowhere')).toThrow(/No look/);
  });

  it('keeps every text anchor, photo position and subject inside its range', () => {
    for (const id of IDS) {
      const look = lookOf(id);

      expect(['tl', 'bl'], id).toContain(look.at);
      expect(['top', 'bottom'], id).toContain(look.atTall);
      expect(look.x, id).toBeGreaterThanOrEqual(0);
      expect(look.x, id).toBeLessThanOrEqual(100);
      expect(look.focus, id).toBeGreaterThan(0);
      expect(look.focus, id).toBeLessThan(1);
      expect(look.width, id).toBeGreaterThanOrEqual(20);
    }
  });

  it('gives every world but the road one living detail, never more than sixty moving things', () => {
    for (const id of IDS) {
      const spec = lookOf(id).ambient;
      if (id === 'about') expect(spec).toBeNull();
      else expect(spec, id).not.toBeNull();
      if (spec && 'count' in spec) expect(spec.count, id).toBeLessThanOrEqual(MAX_PARTICLES);
    }
  });

  it('builds photo addresses under the base the site is served from', () => {
    expect(photoUrl('hello', false, '/portfolio/')).toBe('/portfolio/worlds/hello.webp');
    expect(photoUrl('kana-notebook', true, '/')).toBe('/worlds/kana-notebook-m.webp');
  });
});

describe('the photographs in public/worlds', () => {
  /* what keeps the first screen light: a landscape photo and an upright crop per world, each capped */
  const MAX_WIDE = 380 * 1024;
  const MAX_TALL = 220 * 1024;

  it('has a landscape photo and an upright crop for every world, and nothing else', () => {
    const expected = IDS.flatMap((id) => [`${id}-m.webp`, `${id}.webp`]).sort();

    expect(readdirSync('public/worlds').sort()).toEqual(expected);
  });

  it('keeps every photo small enough to load quickly (npm run worlds -- <folder> makes ones that fit)', () => {
    for (const id of IDS) {
      expect(statSync(`public/worlds/${id}.webp`).size, `${id}.webp`).toBeLessThanOrEqual(MAX_WIDE);
      expect(statSync(`public/worlds/${id}-m.webp`).size, `${id}-m.webp`).toBeLessThanOrEqual(MAX_TALL);
    }
  });

  it('has a tiny blurred stand-in for both crops of every world', () => {
    const standIns: Record<string, { wide: string; tall: string }> = placeholders;

    expect(Object.keys(standIns).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      for (const uri of [standIns[id].wide, standIns[id].tall]) {
        expect(uri, id).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
        expect(uri.length, id).toBeLessThan(700);
      }
    }
    expect(readFileSync('src/worlds/placeholders.json').length).toBeLessThan(8 * 1024);
  });

  it('knows which source picture makes which world, and cuts the upright crop around the subject', () => {
    expect(Object.keys(SOURCES).sort()).toEqual([...IDS].sort());
    expect(tallCrop(0.5)).toBe('scale=1536:1024:flags=lanczos,crop=683:1024:427:0');
    expect(tallCrop(0.99)).toBe('scale=1536:1024:flags=lanczos,crop=683:1024:853:0');
  });
});

describe('where a photo lands when it covers the stage', () => {
  const wide = WIDE_SIZE.w / WIDE_SIZE.h;

  it('fills the box exactly, cropping the longer side', () => {
    const narrowBox = coverFit(1120, 900, wide, 0.5);
    const wideBox = coverFit(1800, 900, wide, 0.5);

    expect(narrowBox.height).toBe(900);
    expect(narrowBox.width).toBeCloseTo(1350, 6);
    expect(narrowBox.left).toBeCloseTo(-115, 6);
    expect(wideBox.width).toBe(1800);
    expect(wideBox.top).toBeCloseTo(-150, 6);
  });

  it('follows object-position: 0 keeps the left edge, 1 the right', () => {
    expect(coverFit(1120, 900, wide, 0).left).toBeCloseTo(0, 9);
    expect(coverFit(1120, 900, wide, 1).left).toBeCloseTo(1120 - 1350, 6);
  });

  it('places a photo point on screen', () => {
    const fit = coverFit(1120, 900, wide, 1);

    expect(placeX(fit, 1)).toBeCloseTo(1120, 6);
    expect(placeY(fit, 0.5)).toBeCloseTo(450, 6);
  });

  it('maps a point of the landscape photo into its upright crop', () => {
    const focus = 0.63;
    const x0 = tallCropX(focus);

    expect(x0).toBe(Math.round(0.63 * 1536 - 683 / 2));
    expect(tallU(focus, focus)).toBeCloseTo(0.5, 2);
    expect(tallU(x0 / WIDE_SIZE.w, focus)).toBeCloseTo(0, 9);
    expect(tallU((x0 + TALL_SIZE.w) / WIDE_SIZE.w, focus)).toBeCloseTo(1, 9);
  });

  it('never starts the upright crop outside the photo', () => {
    expect(tallCropX(0)).toBe(0);
    expect(tallCropX(1)).toBe(WIDE_SIZE.w - TALL_SIZE.w);
  });
});

describe('the cut', () => {
  it('tiles the frame with slats: no gap, no overlap, whole pixels', () => {
    for (const width of [1120, 1046, 390, 320, 1601]) {
      const slats = slatPlan(width);

      expect(slats).toHaveLength(SLAT_COUNT);
      expect(slats[0].x).toBe(0);
      slats.forEach((s, i) => {
        expect(Number.isInteger(s.x) && Number.isInteger(s.w)).toBe(true);
        expect(s.w).toBeGreaterThan(0);
        if (i > 0) expect(s.x).toBe(slats[i - 1].x + slats[i - 1].w);
      });
      expect(slats[SLAT_COUNT - 1].x + slats[SLAT_COUNT - 1].w).toBe(width);
    }
  });

  it('makes the slats uneven, so it does not read as blinds', () => {
    const widths = slatPlan(1120).map((s) => s.w);

    expect(new Set(widths).size).toBe(SLAT_COUNT);
    expect(Math.max(...widths) / Math.min(...widths)).toBeGreaterThan(2);
  });

  it('starts at the board edge and is over within 320 ms', () => {
    const slats = slatPlan(1120);

    expect(slats[0].delay).toBe(0);
    for (let i = 1; i < slats.length; i++) expect(slats[i].delay).toBeGreaterThan(slats[i - 1].delay);
    expect(Math.max(...slats.map((s) => s.delay)) + SLAT_MS).toBeLessThanOrEqual(CUT_MS);
    expect(CUT_MS).toBeLessThanOrEqual(320);
  });

  it('sweeps from the other side when asked, and varies the pattern from cut to cut', () => {
    const back = slatPlan(390, 0, true);

    expect(back[back.length - 1].delay).toBe(0);
    expect(back[0].delay).toBeGreaterThan(back[1].delay);
    expect(slatPlan(1120, 1).map((s) => s.w)).not.toEqual(slatPlan(1120, 0).map((s) => s.w));
  });
});

describe('the layout queries', () => {
  it('are the same in the stylesheets, the page shell and the code', () => {
    const css = readFileSync('src/styles/narrow.css', 'utf8');

    expect(css).toContain(`@media ${NARROW_QUERY} {`);
    expect(css).toContain(`@media ${TALL_QUERY} {`);
    expect(readFileSync('index.html', 'utf8')).toContain(`media="${TALL_QUERY}"`);
    expect(renderFirstFrame()).toContain(`<source media="${TALL_QUERY}"`);
  });
});
