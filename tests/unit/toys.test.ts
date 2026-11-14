import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLDS } from '../../src/content/places';
import { renderWorlds } from '../../src/content/render';
import { TOY_LABELS, TOY_SAYS, toyLabel } from '../../src/content/toys';
import { lookOf } from '../../src/worlds/looks';
import { MAX_BURST } from '../../src/worlds/reactions';
import { outcomeOf, pictureRect, pieceUrl, rollOf, swapFrames, TOYS, toysOf, type Piece } from '../../src/worlds/toys';

/** a piece is a small part of a painting: it must stay light */
const MAX_PIECE_BYTES = 200 * 1024;

const piecesOf = (id: string): Piece[] =>
  toysOf(id).flatMap((t) => [t.swap?.piece, t.throw?.die, t.throw?.ledge].filter((p): p is Piece => p !== undefined));

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
        expect(t.swap ?? t.flare ?? t.bursts ?? t.streak ?? t.throw, `${id}/${t.id}`).toBeDefined();
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

    expect(outcomeOf(die, 1)).toEqual(['snort']);
    for (const n of [2, 5, 9]) expect(outcomeOf(die, n)).toEqual(['staff']);
    for (const n of [10, 15, 19]) expect(outcomeOf(die, n)).toEqual(['arrow', 'loot']);
    expect(outcomeOf(die, 20)).toEqual(['dragon']);
    /* every number a d20 can show sets something off */
    for (let n = 1; n <= die.sides; n++) expect(outcomeOf(die, n).length, String(n)).toBeGreaterThan(0);
    expect(die.outcomes.map((o) => o.upTo)).toEqual([...die.outcomes.map((o) => o.upTo)].sort((a, b) => a - b));
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

  it('renders each toy as a real button with its name, hidden until it is placed, and no Try it in the words', () => {
    const html = renderWorlds();

    expect(html).toContain(
      '<button class="react toy" type="button" data-toy="dragon" aria-label="Wake the dragon" hidden></button>',
    );
    expect(html.match(/class="react toy"/g)).toHaveLength(TOYS.emberquill.filter((t) => !t.unseen).length);
    expect(html).not.toContain('data-toy="snort"');
    expect(html).toContain('<span class="sr-only toy-say" role="status"></span>');
    expect(html).not.toContain('data-try="emberquill"');
  });
});
