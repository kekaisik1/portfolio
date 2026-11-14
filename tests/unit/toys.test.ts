import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { renderWorlds } from '../../src/content/render';
import { TOY_LABELS, TOY_SAYS, toyLabel } from '../../src/content/toys';
import { lookOf } from '../../src/worlds/looks';
import { MAX_BURST } from '../../src/worlds/reactions';
import {
  numberFor,
  outcomeOf,
  pictureRect,
  pieceUrl,
  rollOf,
  roundOf,
  swapFrames,
  TOYS,
  toysOf,
  type Piece,
} from '../../src/worlds/toys';

/** a piece is a small part of a painting: it must stay light */
/* the critical hit repaints most of the picture and is only fetched on a 20: it may be the heaviest */
const MAX_PIECE_BYTES = 300 * 1024;

const piecesOf = (id: string): Piece[] =>
  toysOf(id).flatMap((t) => [t.swap?.piece, t.throw?.ledge].filter((p): p is Piece => p !== undefined));

describe('the paintings that are toys', () => {
  it('are worlds with a look, and every toy has a name for a screen reader and something it does', () => {
    for (const [id, toys] of Object.entries(TOYS)) {
      expect(
        WORLDS.some((w) => w.id === id),
        id,
      ).toBe(true);
      expect(() => lookOf(id), id).not.toThrow();
      expect(new Set(toys.map((t) => t.id)).size, id).toBe(toys.length);
      /* a name for every thing that can be pressed; the ones only the die sets off have none */
      expect(Object.keys(TOY_LABELS[id]).sort(), id).toEqual(
        toys
          .filter((t) => !t.unseen)
          .map((t) => t.id)
          .sort(),
      );
      for (const t of toys) {
        if (!t.unseen) expect(toyLabel(id, t.id)).toMatch(/\S/);
        expect(t.swap ?? t.bursts ?? t.streak ?? t.throw, `${id}/${t.id}`).toBeDefined();
        for (const n of [t.u, t.v]) {
          expect(n).toBeGreaterThan(0);
          expect(n).toBeLessThan(1);
        }
        for (const b of t.bursts ?? []) expect(b.count).toBeLessThanOrEqual(MAX_BURST);
        /* a toy only sets off a toy of the same painting */
        for (const other of [t.then?.toy, ...(t.throw?.outcomes.flatMap((o) => o.toys) ?? [])])
          if (other)
            expect(
              toys.some((x) => x.id === other),
              `${id}/${t.id} -> ${other}`,
            ).toBe(true);
      }
    }
    expect(toysOf('hello')).toEqual([]);
    expect(() => toyLabel('emberquill', 'nothing')).toThrow(/src\/content\/toys\.ts/);
  });

  it("is every project's place, and nothing else", () => {
    expect(Object.keys(TOYS).sort()).toEqual(
      WORLDS.filter((w) => w.kind === 'project')
        .map((w) => w.id)
        .sort(),
    );
  });

  it('keeps every piece calm: a slow fade in and out, and only the dragon throws anything into the air', () => {
    for (const [id, toys] of Object.entries(TOYS))
      for (const t of toys) {
        const s = t.swap;
        if (s) {
          expect(s.rise, `${id}/${t.id}`).toBeGreaterThanOrEqual(450);
          expect(s.fall, `${id}/${t.id}`).toBeGreaterThanOrEqual(450);
        }
        /* a press plays no spray of particles on top of a piece */
        if (t.bursts) expect(s, `${id}/${t.id}`).toBeUndefined();
        for (const b of t.bursts ?? []) expect(b.count, `${id}/${t.id}`).toBeLessThanOrEqual(14);
      }
  });

  it('has every piece of the second state on disk, small, and lying inside the painting', () => {
    for (const id of Object.keys(TOYS))
      for (const p of piecesOf(id)) {
        const file = `public/states/${id}/${p.file}`;
        expect(existsSync(file), file).toBe(true);
        expect(statSync(file).size, file).toBeLessThanOrEqual(MAX_PIECE_BYTES);
        expect(p.u).toBeGreaterThanOrEqual(0);
        expect(p.v).toBeGreaterThanOrEqual(0);
        expect(p.u + p.w).toBeLessThanOrEqual(1.0001);
        expect(p.v + p.h).toBeLessThanOrEqual(1.0001);
      }
    expect(pieceUrl('emberquill', 'fire.webp', '/')).toBe('/states/emberquill/fire.webp');
  });

  it("lays a piece on the painting's own pixels: 1440x900 shows the painting 1440x960, cut 30 px top and bottom", () => {
    const look = lookOf('emberquill');
    const whole = pictureRect({ u: 0, v: 0, w: 1, h: 1 }, look, { width: 1440, height: 900 }, false);
    expect(whole).toEqual({ left: 0, top: -30, right: 1440, bottom: 930 });

    const half = pictureRect({ u: 0.5, v: 0.5, w: 0.25, h: 0.25 }, look, { width: 1440, height: 900 }, false);
    expect(half).toEqual({ left: 720, top: 450, right: 1080, bottom: 690 });
  });

  it('follows the upright crop on a phone, where the painting is cut around its subject', () => {
    const look = lookOf('emberquill');
    const phone = { width: 390, height: 844 };
    const whole = pictureRect({ u: 0, v: 0, w: 1, h: 1 }, look, phone, true);

    /* the whole landscape is 3:2 at the phone's height, far wider than the phone */
    expect(whole.bottom - whole.top).toBeCloseTo(844, 0);
    expect(whole.right - whole.left).toBeCloseTo(844 * 1.5, 0);
    expect(whole.left).toBeLessThan(0);
    expect(whole.right).toBeGreaterThan(phone.width);
  });

  it('throws a fair die: every side from 1 to 20, never 0 or 21', () => {
    expect(rollOf(0, 20)).toBe(1);
    expect(rollOf(0.049, 20)).toBe(1);
    expect(rollOf(0.05, 20)).toBe(2);
    expect(rollOf(0.9999, 20)).toBe(20);
    expect(rollOf(1, 20)).toBe(20);
    expect(TOY_SAYS.rolled(7, 20)).toBe('You rolled 7.');
    expect(TOY_SAYS.rolled(20, 20)).toBe('A natural 20.');
  });

  it('sets off a different thing for a 1, a throw under 10, a throw of 10 and over, and a 20', () => {
    const die = TOYS.emberquill.find((t) => t.id === 'die')?.throw;
    if (!die) throw new Error('the dragon has no die');

    expect(outcomeOf(die, 1)).toEqual(['burn']);
    for (const n of [2, 5, 9]) expect(outcomeOf(die, n)).toEqual(['miss']);
    for (const n of [10, 15, 19]) expect(outcomeOf(die, n)).toEqual(['hit']);
    expect(outcomeOf(die, 20)).toEqual(['crit']);
    /* each is a painting of its own, not one of the things you can press */
    for (const o of die.outcomes)
      for (const id of o.toys) expect(TOYS.emberquill.find((t) => t.id === id)?.unseen, id).toBe(true);
    /* every number a d20 can show sets something off */
    for (let n = 1; n <= die.sides; n++) expect(outcomeOf(die, n).length, String(n)).toBeGreaterThan(0);
    expect(die.outcomes.map((o) => o.upTo)).toEqual([...die.outcomes.map((o) => o.upTo)].sort((a, b) => a - b));
  });

  it('shows every outcome once before any comes again, and never the same twice running', () => {
    const die = TOYS.emberquill.find((t) => t.id === 'die')?.throw;
    if (!die) throw new Error('the dragon has no die');
    let seed = 7;
    const random = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    let last: number | null = null;
    for (let round = 0; round < 50; round++) {
      const order = roundOf(die.outcomes.length, random, last);
      expect([...order].sort()).toEqual([0, 1, 2, 3]);
      expect(order[0]).not.toBe(last);
      last = order[order.length - 1];
    }
    /* the number shown is one its outcome can show: 1, 2..9, 10..19, 20 */
    expect(numberFor(die, 0, 0.7)).toBe(1);
    expect(numberFor(die, 1, 0)).toBe(2);
    expect(numberFor(die, 1, 0.999)).toBe(9);
    expect(numberFor(die, 2, 0)).toBe(10);
    expect(numberFor(die, 2, 1)).toBe(19);
    expect(numberFor(die, 3, 0.3)).toBe(20);
    for (let k = 0; k < 4; k++)
      for (const r of [0, 0.5, 0.999]) expect(outcomeOf(die, numberFor(die, k, r))).toEqual(die.outcomes[k].toys);
  });

  it('fades a piece in, holds it (wavering, if it is fire) and fades it out, in order', () => {
    const plain = swapFrames({ piece: piecesOf('emberquill')[0], rise: 100, hold: 800, fall: 100 });
    expect(plain.ms).toBe(1000);
    expect(plain.frames).toEqual([
      { opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.9 },
      { opacity: 0, offset: 1 },
    ]);

    const fire = swapFrames({ piece: piecesOf('emberquill')[0], rise: 100, hold: 800, fall: 100, wavers: true });
    const offsets = fire.frames.map((f) => f.offset);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(Math.min(...fire.frames.slice(1, -1).map((f) => f.opacity))).toBeGreaterThan(0.7);
  });

  it('renders each toy as a real button with its name, hidden until it is placed, and nothing labelled', () => {
    const html = renderWorlds();

    expect(html).toContain(
      '<button class="react toy" type="button" data-toy="dragon" aria-label="Wake the dragon" hidden></button>',
    );
    expect(html).not.toContain('data-toy="burn"');
    expect(html).toContain('<span class="sr-only toy-say" role="status"></span>');
    expect(html).toContain('aria-label="Open the booth"');
    expect(html).toContain('aria-label="Shake the blossom"');
    expect(html.match(/class="react toy"/g)).toHaveLength(
      Object.values(TOYS)
        .flat()
        .filter((t) => !t.unseen).length,
    );
    /* no labelled dots and no panels: the picture is the thing to try */
    expect(html).not.toContain('class="spot');
    expect(html).not.toContain('data-try');
  });
});
